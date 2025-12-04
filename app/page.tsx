"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Video } from "@/types/database";
import KidsHeader from "@/components/KidsHeader";
import VideoModal from "@/components/VideoModal";

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if device is linked to a parent
    const parentId = localStorage.getItem("safetube_parent_id");

    if (!parentId) {
      // Redirect to link device page if not linked
      router.push("/link-device");
      return;
    }

    // Fetch videos for this parent
    fetchVideos(parentId);
  }, [router]);

  const fetchVideos = async (parentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/videos?parent_id=${parentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch videos");
      }

      setVideos(data.videos || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundImage: "url(/Giraffe1.png)", backgroundSize: "auto" }}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-700 border-t-transparent"></div>
          <p className="text-lg font-medium text-amber-900">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundImage: "url(/Giraffe1.png)", backgroundSize: "auto" }}>
      <KidsHeader showUserMenu={true} childName="Zoe" />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 shadow-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {videos.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <svg
                className="mx-auto h-24 w-24 text-amber-700"
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
              <h2 className="mt-4 font-chewy text-2xl text-gray-900">
                No Videos Yet
              </h2>
              <p className="mt-2 text-gray-600">
                Ask your parent to add some videos to your collection!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleVideoClick(video)}
                className="group block overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
                aria-label={`Watch ${video.title}`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
                  {video.thumbnail_url ? (
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title || "Video thumbnail"}
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
                    {formatDuration(video.duration_seconds)}
                  </div>
                  {/* Watch Count Badge */}
                  {video.watch_count > 0 && (
                    <div className="absolute left-2 top-2 rounded bg-amber-600 px-1.5 py-0.5 text-xs font-medium text-white">
                      Watched {video.watch_count}×
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-amber-700">
                    {video.title}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Video Modal */}
      <VideoModal
        video={selectedVideo}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
