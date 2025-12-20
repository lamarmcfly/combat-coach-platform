'use client';

import { useState, useEffect } from 'react';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
  autoplay?: boolean;
  showControls?: boolean;
}

/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Already just an ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function YouTubeEmbed({
  url,
  title = 'YouTube video',
  className = '',
  aspectRatio = '16:9',
  autoplay = false,
  showControls = true,
}: YouTubeEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = extractYouTubeId(url);
    if (id) {
      setVideoId(id);
      setError(false);
    } else {
      setVideoId(null);
      setError(true);
    }
  }, [url]);

  const aspectRatioClasses = {
    '16:9': 'pb-[56.25%]', // 9/16 = 0.5625
    '4:3': 'pb-[75%]',     // 3/4 = 0.75
    '1:1': 'pb-[100%]',
  };

  if (error || !videoId) {
    return (
      <div
        className={`relative w-full ${aspectRatioClasses[aspectRatio]} bg-gray-800 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 text-sm">Invalid video URL</p>
          </div>
        </div>
      </div>
    );
  }

  const params = new URLSearchParams({
    rel: '0', // Don't show related videos
    modestbranding: '1', // Minimal YouTube branding
    ...(autoplay && { autoplay: '1' }),
    ...(!showControls && { controls: '0' }),
  });

  return (
    <div className={`relative w-full ${aspectRatioClasses[aspectRatio]} ${className}`}>
      <iframe
        className="absolute inset-0 w-full h-full rounded-lg"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

/**
 * Thumbnail component for YouTube videos
 * Useful for showing a preview before loading the full embed
 */
interface YouTubeThumbnailProps {
  url: string;
  quality?: 'default' | 'medium' | 'high' | 'standard' | 'maxres';
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export function YouTubeThumbnail({
  url,
  quality = 'high',
  alt = 'Video thumbnail',
  className = '',
  onClick,
}: YouTubeThumbnailProps) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div
        className={`bg-gray-800 rounded-lg flex items-center justify-center aspect-video ${className}`}
      >
        <svg
          className="w-12 h-12 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault',
  };

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;

  return (
    <div
      className={`relative group cursor-pointer ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <img
        src={thumbnailUrl}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        loading="lazy"
      />
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors rounded-lg">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg
            className="w-8 h-8 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Utility to check if a URL is a valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Extract video ID utility for external use
 */
export { extractYouTubeId };
