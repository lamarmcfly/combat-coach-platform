import { getVideoPlayerConfig } from "@/lib/video/videoService";

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
