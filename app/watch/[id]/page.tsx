"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Video } from "@/types/database";
import KidsHeader from "@/components/KidsHeader";

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parentId = localStorage.getItem("safetube_parent_id");

    if (!parentId) {
      router.push("/link-device");
      return;
    }

    fetchVideoAndRecommendations(parentId);
  }, [videoId, router]);

  const fetchVideoAndRecommendations = async (parentId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all videos for this parent
      const response = await fetch(`/api/videos?parent_id=${parentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch videos");
      }

      const allVideos = data.videos || [];

      // Find the current video
      const currentVideo = allVideos.find((v: Video) => v.id === videoId);

      if (!currentVideo) {
        setError("Video not found");
        setLoading(false);
        return;
      }

      setVideo(currentVideo);

      // Track the watch
      trackWatch(videoId);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const trackWatch = async (id: string) => {
    try {
      await fetch(`/api/videos/${id}/watch`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track watch:", error);
      // Don't show error to user, it's not critical
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!video) return;

    // Load the IFrame Player API code asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Create player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      if (!playerContainerRef.current) return;

      playerRef.current = new window.YT.Player("youtube-player", {
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
      }
    };
  }, [video]);

  // Handle player state changes
  const onPlayerStateChange = (event: any) => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      setShowBreakModal(true);
    }
    // YT.PlayerState.PAUSED = 2 (iOS native player exit)
    else if (event.data === 2 && isIOS) {
      setShowBreakModal(true);
    }
  };

  // Listen for fullscreen changes (Desktop browsers)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // User exited fullscreen
        if (playerRef.current && !showBreakModal) {
          setShowBreakModal(true);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [showBreakModal]);

  // Handle play button click - play video and request fullscreen
  const handlePlayClick = async () => {
    if (!playerRef.current || !playerContainerRef.current) return;

    setShowPlayButton(false);

    // Play the video
    playerRef.current.playVideo();

    // Request fullscreen
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
      // Continue playing even if fullscreen fails
    }
  };

  // Handle going back to current video
  const handleBackToVideo = () => {
    setShowBreakModal(false);
    setIsDone(false);
    setShowPlayButton(true);
    // Reset player if needed
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  };

  // Handle "I'm done" button
  const handleDone = () => {
    setIsDone(true);
  };

  // Handle "Watch other video" button
  const handleWatchOtherVideo = () => {
    router.push("/");
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-lg text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {error || "Video not found"}
          </h2>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <KidsHeader showBackButton={true} showUserMenu={false} />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Video Player Section */}
          <div
            ref={playerContainerRef}
            className="relative overflow-hidden rounded-lg bg-black shadow-lg"
            style={{ paddingBottom: "56.25%" }}
          >
            {/* YouTube Player Container */}
            <div
              id="youtube-player"
              className="absolute inset-0 h-full w-full"
            ></div>

            {/* Play Button Overlay */}
            {showPlayButton && video.thumbnail_url && (
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
                  className="absolute z-20 flex h-24 w-24 items-center justify-center rounded-full bg-red-600 shadow-2xl transition-all hover:scale-110 hover:bg-red-500 active:scale-95"
                  aria-label="Play video in fullscreen"
                >
                  <svg
                    className="ml-1 h-12 w-12 text-white"
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
      </main>

      {/* Take a Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-6">
          {!isDone ? (
            /* Default State - Show 3 options */
            <div className="flex h-full w-full max-w-2xl flex-col items-center justify-between py-8">
              {/* Top spacing */}
              <div className="flex-1"></div>

              {/* Option 1: Back to Current Video - CENTER (Most Prominent) */}
              <div className="flex flex-col items-center gap-6">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Take a Break?
                </h2>

                {/* Video Thumbnail - Clickable */}
                <button
                  onClick={handleBackToVideo}
                  className="group relative overflow-hidden rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                  aria-label="Continue watching this video"
                >
                  {video?.thumbnail_url && (
                    <div className="relative h-48 w-80 sm:h-56 sm:w-96">
                      <Image
                        src={video.thumbnail_url}
                        alt={video.title || "Video thumbnail"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {/* Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all group-hover:bg-black/20">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-xl transition-all group-hover:scale-110">
                          <svg
                            className="ml-1 h-10 w-10 text-blue-600"
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
                          👆 Tap to watch again
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              </div>

              {/* Bottom section with 2 buttons */}
              <div className="w-full max-w-md space-y-4">
                {/* Option 2: I'm Done - MAIN CTA (Large and prominent) */}
                <button
                  onClick={handleDone}
                  className="w-full rounded-full bg-green-500 px-8 py-5 text-2xl font-bold text-white shadow-2xl transition-all hover:scale-105 hover:bg-green-400 active:scale-95"
                >
                  ✓ I'm Done!
                </button>

                {/* Option 3: Watch Other Video - Small, bottom (Discouraged) */}
                <button
                  onClick={handleWatchOtherVideo}
                  className="w-full rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
                >
                  Watch Other Video
                </button>
              </div>
            </div>
          ) : (
            /* Done State - Celebration Screen */
            <div className="flex h-full w-full max-w-md flex-col items-center justify-center space-y-8 text-center">
              {/* Celebration Icon */}
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-yellow-400 shadow-2xl">
                <svg
                  className="h-24 w-24 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>

              {/* Celebration Message */}
              <div className="space-y-4">
                <h2 className="text-5xl font-bold text-white sm:text-6xl">
                  Well Done!
                </h2>
                <p className="text-2xl text-white/90">
                  See you next time! 👋
                </p>
              </div>

              {/* Option 3: Watch Other Video - Still available */}
              <button
                onClick={handleWatchOtherVideo}
                className="rounded-full bg-white px-12 py-4 text-lg font-bold text-blue-600 shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                Watch Other Video
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
