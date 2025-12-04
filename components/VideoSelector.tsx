"use client";

import { useState } from "react";
import Image from "next/image";

interface VideoPreview {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  madeForKids: boolean;
}

interface VideoSelectorProps {
  videos: VideoPreview[];
  onSelectionChange: (selected: VideoPreview[]) => void;
  onLoadMore?: () => void;
  hasMore: boolean;
  loading?: boolean;
  totalLoaded: number;
}

const formatDuration = (isoDuration: string) => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function VideoSelector({
  videos,
  onSelectionChange,
  onLoadMore,
  hasMore,
  loading,
  totalLoaded,
}: VideoSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selected.size === videos.length) {
      setSelected(new Set());
      onSelectionChange([]);
    } else {
      const allIds = new Set(videos.map((v) => v.videoId));
      setSelected(allIds);
      onSelectionChange(videos);
    }
  };

  const handleToggle = (video: VideoPreview) => {
    const newSelected = new Set(selected);
    if (newSelected.has(video.videoId)) {
      newSelected.delete(video.videoId);
    } else {
      newSelected.add(video.videoId);
    }
    setSelected(newSelected);
    onSelectionChange(videos.filter((v) => newSelected.has(v.videoId)));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {selected.size === videos.length ? "Deselect All" : "Select All"}
          </button>
          <span className="text-sm text-gray-600">
            {selected.size} of {videos.length} selected
          </span>
        </div>
        {totalLoaded >= 100 && (
          <span className="text-sm text-amber-600">
            Maximum 100 videos loaded
          </span>
        )}
      </div>

      {/* Video List */}
      <div className="max-h-96 overflow-y-auto rounded-lg border">
        <div className="divide-y divide-gray-200">
          {videos.map((video) => (
            <div
              key={video.videoId}
              className={`flex items-center gap-4 p-3 transition-colors hover:bg-gray-50 ${
                selected.has(video.videoId) ? "bg-blue-50" : ""
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected.has(video.videoId)}
                onChange={() => handleToggle(video)}
                className="h-4 w-4 rounded border-gray-300"
              />

              {/* Thumbnail */}
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs font-medium text-white">
                  {formatDuration(video.duration)}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {video.title}
                </h4>
                {video.madeForKids && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                    Made for Kids
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load More */}
      {hasMore && totalLoaded < 100 && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading..." : `Load More (${totalLoaded}/100)`}
        </button>
      )}
    </div>
  );
}
