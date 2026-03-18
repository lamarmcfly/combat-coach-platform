import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminCheck';
import { isMuxConfigured, createDirectUploadUrl, createAssetFromUrl } from '@/lib/video/muxService';
import { ContentService } from '@/services/contentService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/media/upload
 *
 * Two modes:
 * 1. { mode: "direct" }           -> Returns a Mux direct upload URL for browser-based uploads
 * 2. { mode: "url", url: "..." }  -> Ingests a video from a remote URL into Mux
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    if (!auth.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (!isMuxConfigured()) {
      return NextResponse.json(
        { error: 'Mux is not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { mode, url, filename, folder, alt, caption, tags, isPublic } = body;

    if (mode === 'direct') {
      // Return a direct upload URL for browser-based uploads
      const upload = await createDirectUploadUrl({
        passthrough: JSON.stringify({
          uploadedBy: auth.user.id,
          filename: filename || 'mux-upload',
          folder: folder || 'general',
          alt: alt || '',
          caption: caption || '',
          tags: tags || [],
        }),
        isPublic: isPublic ?? true,
        corsOrigin: process.env.NEXT_PUBLIC_APP_URL,
      });

      return NextResponse.json({
        uploadId: upload.uploadId,
        uploadUrl: upload.uploadUrl,
      });
    }

    if (mode === 'url') {
      if (!url) {
        return NextResponse.json(
          { error: 'Missing required field: url' },
          { status: 400 }
        );
      }

      // Ingest from remote URL
      const asset = await createAssetFromUrl(url, {
        passthrough: JSON.stringify({
          uploadedBy: auth.user.id,
          filename: filename || url.split('/').pop() || 'mux-video',
          folder: folder || 'general',
          alt: alt || '',
          caption: caption || '',
          tags: tags || [],
        }),
        isPublic: isPublic ?? true,
      });

      // Create a pending media asset record
      const media = await ContentService.uploadMedia({
        filename: filename || url.split('/').pop() || 'mux-video',
        originalName: filename || url.split('/').pop() || 'mux-video',
        mimeType: 'video/mp4',
        size: 0,
        url: asset.playbackId
          ? `https://stream.mux.com/${asset.playbackId}.m3u8`
          : url,
        thumbnailUrl: asset.playbackId
          ? `https://image.mux.com/${asset.playbackId}/thumbnail.webp`
          : undefined,
        alt,
        caption,
        tags,
        folder: folder || 'general',
        uploadedBy: auth.user.id,
      });

      return NextResponse.json({
        media,
        muxAssetId: asset.assetId,
        muxPlaybackId: asset.playbackId,
        status: asset.status,
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid mode. Use "direct" or "url".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Mux upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
