'use client';

import { getVideoPlayerConfig } from "@/lib/video/videoService";
import MuxPlayer from "@mux/mux-player-react";

type VideoPlayerProps = {
  videoRef?: string;
  poster?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
};

export function VideoPlayer({ videoRef, poster, controls = true, autoPlay, loop, muted, className }: VideoPlayerProps) {
  const config = getVideoPlayerConfig(videoRef, poster);

  // Mux Player: uses the official Mux Player React component with adaptive bitrate streaming
  if (config.mode === "mux" && config.muxPlaybackId) {
    return (
      <MuxPlayer
        className={className}
        playbackId={config.muxPlaybackId}
        streamType="on-demand"
        autoPlay={autoPlay ?? config.autoPlay ? "muted" : undefined}
        muted={muted ?? config.muted}
        loop={loop ?? config.loop}
        poster={poster}
        primaryColor="#f0473a"
        secondaryColor="#16161c"
        accentColor="#f0473a"
        metadata={{
          video_title: "Corner Video",
        }}
      />
    );
  }

  // Vimeo/iframe embed
  if (config.mode === "embed" && config.embedUrl) {
    return (
      <iframe
        className={className}
        src={config.embedUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="combat video"
      />
    );
  }

  // HTML5 video (static/CDN files)
  return (
    <video
      className={className}
      autoPlay={autoPlay ?? config.autoPlay}
      loop={loop ?? config.loop}
      muted={muted ?? config.muted}
      controls={controls}
      playsInline
      poster={poster}
    >
      {config.sources.map((source) => (
        <source key={source.src} src={source.src} type={source.type} />
      ))}
      Your browser does not support embedded videos.
    </video>
  );
}
