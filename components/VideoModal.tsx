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
        className={`flex items-center justify-center ${playMode === "playing" ? "h-full w-full" : "absolute opacity-0 pointer-events-none"}`}
      >
        <div
          ref={playerContainerRef}
          className={`relative bg-black ${
            showPlayButton
              ? "w-[90%] aspect-video"
              : "h-full w-full"
          }`}
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

      {/* Break Mode - Redesigned per mockup */}
      {playMode === "break" && (
        <div className="flex h-full w-full flex-col landscape:flex-row">
          {/* Top Section (Portrait) / Left Section (Landscape) - White Background */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6 sm:gap-6 sm:p-8">
            {/* Giraffe on Bike Illustration */}
            <Image
              src="/img/giraffe_break.png"
              alt="Giraffe on bike"
              width={600}
              height={628}
              className="w-48 sm:w-64 landscape:w-56"
              priority
            />

            {/* Heading */}
            <h2 className="text-center font-chewy text-2xl font-bold text-gray-800 sm:text-3xl landscape:text-2xl">
              Time to take a break?
            </h2>

            {/* Primary CTA - Ok, I'm done! */}
            <button
              onClick={handleDone}
              className="w-full max-w-xs rounded-full px-6 py-3 font-chewy text-xl font-bold text-white shadow-xl transition-all active:scale-95 sm:max-w-sm sm:px-8 sm:py-4 sm:text-2xl sm:hover:scale-105 landscape:max-w-xs landscape:text-lg"
              style={{ backgroundColor: 'var(--color-btn-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-btn-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-btn-primary)'}
            >
              Ok, I'm done!
            </button>
          </div>

          {/* Bottom Section (Portrait) / Right Section (Landscape) - Blue Background */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 sm:gap-6 sm:p-8" style={{ backgroundColor: 'var(--color-primary-blue)' }}>
            {/* "Back to my video" label */}
            <p className="text-center text-base font-medium text-white sm:text-lg">
              Back to my video
            </p>

            {/* Video Thumbnail Card */}
            <button
              onClick={handleBackToVideo}
              className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl transition-all active:scale-95 sm:hover:scale-105 landscape:max-w-md"
              aria-label="Back to my video"
            >
              {video?.thumbnail_url && (
                <div className="relative aspect-video w-full">
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title || "Video thumbnail"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 transition-all group-hover:scale-110 sm:h-20 sm:w-20">
                      <svg
                        className="ml-1 h-8 w-8 text-white sm:h-10 sm:w-10"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </button>

            {/* Text Link - Watch something else */}
            <button
              onClick={handleWatchOtherVideo}
              className="text-center text-sm font-medium text-white transition-all active:opacity-80 sm:text-base sm:hover:underline"
            >
              Watch something else
            </button>
          </div>
        </div>
      )}

      {/* Done Mode - Celebration Screen */}
      {playMode === "done" && (
        <div className="flex h-full w-full flex-col items-center justify-center bg-white landscape:flex-row">
          {/* Celebrating Giraffe Illustration - Left side in landscape */}
          <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
            <Image
              src="/img/giraffe_celerate.png"
              alt="Celebrating giraffe"
              width={600}
              height={628}
              className="w-48 sm:w-64 landscape:w-56"
              priority
            />
          </div>

          {/* Celebration Message & Button - Right side in landscape */}
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-4 text-center sm:space-y-6 sm:p-6">
            {/* Celebration Message */}
            <div className="space-y-2 sm:space-y-3">
              <h2 className="font-chewy text-3xl font-bold text-gray-800 sm:text-4xl landscape:text-3xl">
                Well done!
              </h2>
              <p className="text-lg text-gray-600 sm:text-xl landscape:text-lg">
                See you next time
              </p>
            </div>

            {/* Watch Other Video button */}
            <button
              onClick={handleWatchOtherVideo}
              className="rounded-full px-8 py-3 text-base font-medium text-gray-700 shadow-lg transition-all active:scale-95 sm:px-10 sm:py-3 sm:text-lg sm:hover:scale-105"
              style={{ backgroundColor: 'var(--color-btn-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-btn-secondary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-btn-secondary)'}
            >
              Watch something else
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
