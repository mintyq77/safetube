"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Video } from "@/types/database";

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Get recommendations (exclude current video, sort by watch count)
      const otherVideos = allVideos.filter((v: Video) => v.id !== videoId);
      setRecommendations(otherVideos);

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
          <div className="overflow-hidden rounded-lg bg-black shadow-lg">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&color=white&playsinline=1&fs=1`}
                title={video.title || "YouTube video player"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Video Info */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-2xl font-bold text-gray-900">{video.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>Duration: {formatDuration(video.duration_seconds)}</span>
              <span>•</span>
              <span>Watched: {video.watch_count}×</span>
              {video.made_for_kids && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Made for Kids
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900">
                More Videos
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {recommendations.length} video
                {recommendations.length !== 1 ? "s" : ""} available
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {recommendations.map((recVideo) => (
                  <a
                    key={recVideo.id}
                    href={`/watch/${recVideo.id}`}
                    className="group block overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md"
                    aria-label={`Watch ${recVideo.title}`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
                      {recVideo.thumbnail_url ? (
                        <Image
                          src={recVideo.thumbnail_url}
                          alt={recVideo.title || "Video thumbnail"}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg
                            className="h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                        {formatDuration(recVideo.duration_seconds)}
                      </div>
                      {/* Watch Count Badge */}
                      {recVideo.watch_count > 0 && (
                        <div className="absolute left-2 top-2 rounded bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white">
                          Watched {recVideo.watch_count}×
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="p-3">
                      <h4 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-blue-600">
                        {recVideo.title}
                      </h4>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
