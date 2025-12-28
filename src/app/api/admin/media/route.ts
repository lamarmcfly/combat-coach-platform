import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminCheck';
import { ContentService } from '@/services/contentService';

export const dynamic = 'force-dynamic';

// GET - List media assets
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || undefined;
    const mimeType = searchParams.get('mimeType') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { assets, total } = await ContentService.getMediaAssets({
      folder,
      mimeType,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ assets, total, limit, offset });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// POST - Create media asset (URL-based, actual file upload handled separately)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    if (!auth.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const body = await request.json();
    const {
      filename,
      originalName,
      mimeType,
      size,
      url,
      thumbnailUrl,
      width,
      height,
      duration,
      alt,
      caption,
      tags,
      folder,
      contentId,
    } = body;

    if (!filename || !url || !mimeType || size === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, url, mimeType, size' },
        { status: 400 }
      );
    }

    const media = await ContentService.uploadMedia({
      filename,
      originalName: originalName || filename,
      mimeType,
      size,
      url,
      thumbnailUrl,
      width,
      height,
      duration,
      alt,
      caption,
      tags,
      folder,
      uploadedBy: auth.user.id,
      contentId,
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { error: 'Failed to create media' },
      { status: 500 }
    );
  }
}
