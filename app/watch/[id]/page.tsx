"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Video } from "@/types/database";

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

  // Handle continue watching button
  const handleContinueWatching = () => {
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
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Go back to home"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              SafeTube
            </h1>
          </div>
        </div>
      </header>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-4">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Icon */}
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <svg
                className="h-20 w-20 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                Time to Take a Break?
              </h2>
              <p className="text-xl text-white/90">
                Great job watching! Ready to pick another video?
              </p>
            </div>

            {/* Button */}
            <button
              onClick={handleContinueWatching}
              className="mx-auto block rounded-full bg-white px-12 py-4 text-lg font-bold text-blue-600 shadow-2xl transition-all hover:scale-105 hover:shadow-3xl active:scale-95"
            >
              Continue Watching
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
