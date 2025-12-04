"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Video } from "@/types/database";

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

type PlayMode = "playing" | "break" | "done";

export default function VideoModal({ video, isOpen, onClose }: VideoModalProps) {
  const [playMode, setPlayMode] = useState<PlayMode>("playing");
  const [showPlayButton, setShowPlayButton] = useState(true);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when video changes or modal opens
  useEffect(() => {
    if (isOpen && video) {
      setPlayMode("playing");
      setShowPlayButton(true);
    }
  }, [isOpen, video]);

  // Track watch count
  useEffect(() => {
    if (!video || !isOpen) return;

    const trackWatch = async () => {
      try {
        await fetch(`/api/videos/${video.id}/watch`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to track watch:", error);
      }
    };

    trackWatch();
  }, [video, isOpen]);

  // Load YouTube IFrame API and initialize player
  useEffect(() => {
    if (!video || !isOpen) return;

    // Load the IFrame Player API code asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Create player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      if (!playerContainerRef.current) return;

      playerRef.current = new window.YT.Player("youtube-player-modal", {
        height: "100%",
        width: "100%",
        videoId: video.youtube_id,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          color: "white",
          playsinline: 1,
          fs: 1,
        },
        events: {
          onStateChange: onPlayerStateChange,
        },
      });
    };

    // If API already loaded, initialize player
    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [video, isOpen]);

  // Handle player state changes
  const onPlayerStateChange = (event: any) => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      setPlayMode("break");
      setShowPlayButton(true);
    }
    // YT.PlayerState.PAUSED = 2
    // On iOS, also trigger break mode on pause (when exiting native fullscreen)
    else if (event.data === 2 && isIOS) {
      // Add small delay to avoid triggering on accidental pauses
      setTimeout(() => {
        if (playerRef.current) {
          const state = playerRef.current.getPlayerState();
          // Only show break if still paused after delay
          if (state === 2) {
            setPlayMode("break");
            setShowPlayButton(true);
          }
        }
      }, 1500);
    }
  };

  // Listen for fullscreen changes (Desktop/Android browsers)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && playMode === "playing") {
        // User exited fullscreen
        setPlayMode("break");
        setShowPlayButton(true);
        if (playerRef.current) {
          playerRef.current.pauseVideo();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [playMode]);

  // Handle play button click - play video and request fullscreen
  const handlePlayClick = async () => {
    if (!playerRef.current || !playerContainerRef.current) return;

    setShowPlayButton(false);
    setPlayMode("playing");

    // Play the video
    playerRef.current.playVideo();

    // Request fullscreen for mobile/tablet
    try {
      const element = playerContainerRef.current;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
      // Continue playing even if fullscreen fails (iOS will use native player)
    }
  };

  // Handle going back to current video
  const handleBackToVideo = async () => {
    if (!playerRef.current) {
      console.log("playerRef not available");
      return;
    }

    setPlayMode("playing");
    setShowPlayButton(false);

    try {
      // Seek back a bit to give context, then play
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, currentTime - 3));
      playerRef.current.playVideo();

      // Try to go fullscreen again
      if (playerContainerRef.current) {
        const element = playerContainerRef.current;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error("Error in handleBackToVideo:", error);
      // Continue even if something fails
    }
  };

  // Handle "I'm done" button
  const handleDone = () => {
    setPlayMode("done");
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  };

  // Handle "Watch other video" button
  const handleWatchOtherVideo = () => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
    }
    onClose();
  };

  // Handle modal close (backdrop click or escape)
  const handleModalClose = () => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
    }
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleModalClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen || !video) return null;

  return (
    <div
      ref={modalRef}
      className={`fixed inset-0 z-50 ${
        playMode === "playing" ? "bg-black" : "bg-gradient-to-br from-blue-600 to-purple-600"
      }`}
    >
      {/* YouTube Player Container - Always mounted, hidden when not in playing mode */}
      <div
        className={`${playMode === "playing" ? "h-full w-full" : "absolute opacity-0 pointer-events-none"}`}
      >
        <div
          ref={playerContainerRef}
          className="relative h-full w-full bg-black"
        >
          <div
            id="youtube-player-modal"
            className="h-full w-full"
          ></div>

          {/* Play Button Overlay - Only in playing mode with showPlayButton */}
          {playMode === "playing" && showPlayButton && video.thumbnail_url && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <Image
                src={video.thumbnail_url}
                alt={video.title || "Video thumbnail"}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                onClick={handlePlayClick}
                className="absolute z-20 flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl transition-all active:scale-95 sm:h-24 sm:w-24 sm:hover:scale-110 sm:hover:bg-red-500"
                aria-label="Play video"
              >
                <svg
                  className="ml-1 h-10 w-10 text-white sm:h-12 sm:w-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Break Mode - Thumbnail + Buttons */}
      {playMode === "break" && (
        <div className="flex h-full w-full flex-col items-center justify-between p-4 sm:p-6">
          {/* Top section - Video thumbnail */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6">
            <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
              Take a Break?
            </h2>

            {/* Video Thumbnail - Clickable to resume */}
            <button
              onClick={handleBackToVideo}
              className="group relative overflow-hidden rounded-2xl shadow-2xl transition-all active:scale-95 sm:hover:scale-105"
              aria-label="Continue watching this video"
            >
              {video?.thumbnail_url && (
                <div className="relative h-48 w-80 sm:h-56 sm:w-96 md:h-64 md:w-[32rem]">
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title || "Video thumbnail"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all group-hover:bg-black/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition-all sm:h-20 sm:w-20 sm:group-hover:scale-110">
                      <svg
                        className="ml-1 h-8 w-8 text-blue-600 sm:h-10 sm:w-10"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Hint text */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-center text-sm font-semibold text-white">
                      👆 Tap to continue watching
                    </p>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Bottom section - Action buttons */}
          <div className="w-full max-w-md space-y-3 sm:space-y-4">
            {/* I'm Done - Primary CTA */}
            <button
              onClick={handleDone}
              className="w-full rounded-full bg-green-500 px-6 py-4 text-xl font-bold text-white shadow-2xl transition-all active:scale-95 sm:px-8 sm:py-5 sm:text-2xl sm:hover:scale-105 sm:hover:bg-green-400"
            >
              ✓ I'm Done!
            </button>

            {/* Watch Other Video - Secondary */}
            <button
              onClick={handleWatchOtherVideo}
              className="w-full rounded-full bg-white/20 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all active:scale-95 sm:px-6 sm:hover:bg-white/30"
            >
              Watch Other Video
            </button>
          </div>
        </div>
      )}

      {/* Done Mode - Celebration Screen */}
      {playMode === "done" && (
        <div className="flex h-full w-full flex-col items-center justify-center space-y-6 bg-gradient-to-br from-blue-600 to-purple-600 p-4 text-center sm:space-y-8 sm:p-6">
          {/* Celebration Icon */}
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-yellow-400 shadow-2xl sm:h-40 sm:w-40">
            <svg
              className="h-20 w-20 text-white sm:h-24 sm:w-24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>

          {/* Celebration Message */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Well Done!
            </h2>
            <p className="text-xl text-white/90 sm:text-2xl">
              See you next time! 👋
            </p>
          </div>

          {/* Watch Other Video button */}
          <button
            onClick={handleWatchOtherVideo}
            className="rounded-full bg-white px-10 py-3 text-base font-bold text-blue-600 shadow-2xl transition-all active:scale-95 sm:px-12 sm:py-4 sm:text-lg sm:hover:scale-105"
          >
            Watch Other Video
          </button>
        </div>
      )}
    </div>
  );
}
