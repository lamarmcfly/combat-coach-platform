type VideoSource = {
  src: string;
  type?: string;
  poster?: string;
};

export type VideoPlayerConfig = {
  mode: "html5" | "embed" | "mux";
  embedUrl?: string;
  muxPlaybackId?: string;
  sources: VideoSource[];
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
};

const VIDEO_PROVIDER = process.env.NEXT_PUBLIC_VIDEO_PROVIDER ?? "static";
const VIDEO_BASE_URL =
  process.env.VIDEO_PROVIDER_BASE_URL ?? process.env.NEXT_PUBLIC_HERO_VIDEO_FALLBACK ?? "";

export function resolveVideoUrl(videoRef?: string) {
  if (!videoRef) return "";
  if (videoRef.startsWith("http")) return videoRef;
  if (videoRef.startsWith("/")) return videoRef;
  return `${VIDEO_BASE_URL.replace(/\/$/, "")}/${videoRef}`;
}

function muxEmbed(videoRef: string, poster?: string): VideoPlayerConfig {
  const playbackId = videoRef.replace("mux://", "");
  return {
    mode: "mux",
    muxPlaybackId: playbackId,
    sources: [],
    autoPlay: true,
    muted: true,
    loop: true,
    controls: true,
  };
}

function vimeoEmbed(videoRef: string): VideoPlayerConfig {
  const videoId = videoRef.replace("vimeo://", "");
  return {
    mode: "embed",
    embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`,
    sources: [],
    autoPlay: true,
    muted: true,
    loop: true,
    controls: false,
  };
}

export function getVideoPlayerConfig(videoRef?: string, poster?: string): VideoPlayerConfig {
  if (VIDEO_PROVIDER === "mux" && videoRef?.startsWith("mux://")) {
    return muxEmbed(videoRef, poster);
  }
  if (VIDEO_PROVIDER === "vimeo" && videoRef?.startsWith("vimeo://")) {
    return vimeoEmbed(videoRef);
  }
  const src = resolveVideoUrl(videoRef);
  return {
    mode: "html5",
    sources: [
      {
        src,
        type: "video/mp4",
        poster,
      },
    ],
    autoPlay: true,
    muted: true,
    loop: true,
    controls: false,
  };
}
