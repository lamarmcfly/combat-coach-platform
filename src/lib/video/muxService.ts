import Mux from '@mux/mux-node';

let muxClient: Mux | null = null;

function getMuxClient(): Mux {
  if (!muxClient) {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
      throw new Error(
        'Mux is not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.'
      );
    }

    muxClient = new Mux({ tokenId, tokenSecret });
  }
  return muxClient;
}

/**
 * Check if Mux is configured
 */
export function isMuxConfigured(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

/**
 * Create a Mux asset from a URL (server-to-server upload)
 */
export async function createAssetFromUrl(url: string, options?: {
  passthrough?: string;
  isPublic?: boolean;
}) {
  const mux = getMuxClient();
  const asset = await mux.video.assets.create({
    inputs: [{ url }],
    playback_policies: [options?.isPublic ? 'public' : 'signed'],
    passthrough: options?.passthrough,
  });

  return {
    assetId: asset.id,
    playbackId: asset.playback_ids?.[0]?.id ?? null,
    status: asset.status,
  };
}

/**
 * Create a direct upload URL for browser-based uploads
 */
export async function createDirectUploadUrl(options?: {
  passthrough?: string;
  isPublic?: boolean;
  corsOrigin?: string;
}) {
  const mux = getMuxClient();
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: [options?.isPublic ? 'public' : 'signed'],
      passthrough: options?.passthrough,
    },
    cors_origin: options?.corsOrigin || process.env.NEXT_PUBLIC_APP_URL || '*',
  });

  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
  };
}

/**
 * Get asset details
 */
export async function getAsset(assetId: string) {
  const mux = getMuxClient();
  const asset = await mux.video.assets.retrieve(assetId);

  return {
    id: asset.id,
    status: asset.status,
    duration: asset.duration,
    playbackIds: asset.playback_ids?.map((p) => ({
      id: p.id,
      policy: p.policy,
    })),
    aspectRatio: asset.aspect_ratio,
    maxResolution: asset.max_stored_resolution,
  };
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const mux = getMuxClient();
  await mux.video.assets.delete(assetId);
}

/**
 * Generate a signed playback token for premium content.
 * Requires MUX_SIGNING_KEY to be configured.
 */
export function getSignedPlaybackToken(playbackId: string): string | null {
  const signingKey = process.env.MUX_SIGNING_KEY;
  if (!signingKey) {
    // No signing key configured — return null (use unsigned playback)
    return null;
  }

  // For signed URLs, Mux uses JWT-based tokens.
  // The @mux/mux-node SDK handles this via the JWT helper.
  // For now, return null and use public playback IDs.
  // Full JWT signing requires the signing key's private key in PEM format.
  return null;
}

/**
 * Get the thumbnail URL for a Mux video
 */
export function getThumbnailUrl(
  playbackId: string,
  options?: { width?: number; height?: number; time?: number }
): string {
  const params = new URLSearchParams();
  if (options?.width) params.set('width', options.width.toString());
  if (options?.height) params.set('height', options.height.toString());
  if (options?.time) params.set('time', options.time.toString());

  const query = params.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.webp${query ? `?${query}` : ''}`;
}
