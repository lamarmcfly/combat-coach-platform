import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/mux
 *
 * Handles Mux webhook events for asset lifecycle notifications.
 * Verifies the webhook signature using MUX_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('mux-signature');
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const parts = signature.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signaturePart = parts.find((p) => p.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 });
      }

      const timestamp = timestampPart.replace('t=', '');
      const expectedSignature = signaturePart.replace('v1=', '');

      const payload = `${timestamp}.${rawBody}`;
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (computedSignature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // Check timestamp is within 5 minutes
      const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp));
      if (timestampAge > 300) {
        return NextResponse.json({ error: 'Webhook timestamp too old' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const { type, data } = event;

    switch (type) {
      case 'video.asset.ready': {
        const assetId = data.id;
        const playbackId = data.playback_ids?.[0]?.id;
        const duration = data.duration;
        const aspectRatio = data.aspect_ratio;
        const passthrough = data.passthrough ? JSON.parse(data.passthrough) : {};

        // Update any existing media assets with this Mux asset ID
        const existingAssets = await db.mediaAsset.findMany({
          where: { muxAssetId: assetId },
        });

        if (existingAssets.length > 0) {
          await db.mediaAsset.updateMany({
            where: { muxAssetId: assetId },
            data: {
              muxPlaybackId: playbackId,
              url: playbackId
                ? `https://stream.mux.com/${playbackId}.m3u8`
                : undefined,
              thumbnailUrl: playbackId
                ? `https://image.mux.com/${playbackId}/thumbnail.webp`
                : undefined,
              duration: duration ? Math.round(duration) : undefined,
            },
          });
        } else if (passthrough.uploadedBy) {
          // Create new media asset from direct upload
          const [width, height] = (aspectRatio || '16:9')
            .split(':')
            .map(Number);

          await db.mediaAsset.create({
            data: {
              filename: passthrough.filename || `mux-${assetId}`,
              originalName: passthrough.filename || `mux-${assetId}`,
              mimeType: 'video/mp4',
              size: 0,
              url: playbackId
                ? `https://stream.mux.com/${playbackId}.m3u8`
                : '',
              thumbnailUrl: playbackId
                ? `https://image.mux.com/${playbackId}/thumbnail.webp`
                : null,
              muxAssetId: assetId,
              muxPlaybackId: playbackId,
              duration: duration ? Math.round(duration) : null,
              width: width || null,
              height: height || null,
              folder: passthrough.folder || 'general',
              alt: passthrough.alt || null,
              caption: passthrough.caption || null,
              tags: passthrough.tags || [],
              uploadedBy: passthrough.uploadedBy,
            },
          });
        }

        // Also update any lessons referencing this asset
        await db.lesson.updateMany({
          where: { muxAssetId: assetId },
          data: {
            muxPlaybackId: playbackId,
          },
        });

        break;
      }

      case 'video.asset.errored': {
        const assetId = data.id;
        console.error(`Mux asset ${assetId} errored:`, data.errors);
        // Optionally clean up or mark as failed
        break;
      }

      case 'video.asset.deleted': {
        const assetId = data.id;
        // Clear Mux references but keep the media record
        await db.mediaAsset.updateMany({
          where: { muxAssetId: assetId },
          data: {
            muxAssetId: null,
            muxPlaybackId: null,
          },
        });
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Mux webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
