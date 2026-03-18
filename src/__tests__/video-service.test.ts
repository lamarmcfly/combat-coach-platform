import { describe, it, expect, vi, beforeEach } from 'vitest';

// VIDEO_PROVIDER is read at module load time, so we must reset modules for each test
describe('resolveVideoUrl', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns empty string for undefined input', async () => {
    const { resolveVideoUrl } = await import('@/lib/video/videoService');
    expect(resolveVideoUrl(undefined)).toBe('');
    expect(resolveVideoUrl('')).toBe('');
  });

  it('returns absolute URLs unchanged', async () => {
    const { resolveVideoUrl } = await import('@/lib/video/videoService');
    expect(resolveVideoUrl('https://example.com/video.mp4')).toBe(
      'https://example.com/video.mp4'
    );
  });

  it('returns root-relative paths unchanged', async () => {
    const { resolveVideoUrl } = await import('@/lib/video/videoService');
    expect(resolveVideoUrl('/video/demo.mp4')).toBe('/video/demo.mp4');
  });

  it('prepends base URL for relative paths', async () => {
    vi.stubEnv('VIDEO_PROVIDER_BASE_URL', 'https://cdn.example.com');
    vi.stubEnv('NEXT_PUBLIC_HERO_VIDEO_FALLBACK', '');
    const { resolveVideoUrl } = await import('@/lib/video/videoService');
    const result = resolveVideoUrl('demo.mp4');
    expect(result).toContain('demo.mp4');
  });
});

describe('getVideoPlayerConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns html5 config for static provider', async () => {
    vi.stubEnv('NEXT_PUBLIC_VIDEO_PROVIDER', 'static');
    const { getVideoPlayerConfig } = await import('@/lib/video/videoService');
    const config = getVideoPlayerConfig('/video/demo.mp4');
    expect(config.mode).toBe('html5');
    expect(config.sources.length).toBeGreaterThan(0);
    expect(config.autoPlay).toBe(true);
    expect(config.muted).toBe(true);
    expect(config.loop).toBe(true);
  });

  it('returns mux config for mux:// references', async () => {
    vi.stubEnv('NEXT_PUBLIC_VIDEO_PROVIDER', 'mux');
    const { getVideoPlayerConfig } = await import('@/lib/video/videoService');
    const config = getVideoPlayerConfig('mux://playback123');
    expect(config.mode).toBe('mux');
    expect(config.muxPlaybackId).toBe('playback123');
  });

  it('returns embed config for vimeo:// references', async () => {
    vi.stubEnv('NEXT_PUBLIC_VIDEO_PROVIDER', 'vimeo');
    const { getVideoPlayerConfig } = await import('@/lib/video/videoService');
    const config = getVideoPlayerConfig('vimeo://123456');
    expect(config.mode).toBe('embed');
    expect(config.embedUrl).toContain('player.vimeo.com/video/123456');
  });

  it('returns html5 for undefined videoRef', async () => {
    vi.stubEnv('NEXT_PUBLIC_VIDEO_PROVIDER', 'static');
    const { getVideoPlayerConfig } = await import('@/lib/video/videoService');
    const config = getVideoPlayerConfig(undefined);
    expect(config.mode).toBe('html5');
  });
});
