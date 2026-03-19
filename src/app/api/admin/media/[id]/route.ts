import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminCheck';
import { ContentService } from '@/services/contentService';

export const dynamic = 'force-dynamic';

// GET - Get media asset by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const media = await ContentService.getMediaById(id);

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// PATCH - Update media asset
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { alt, caption, tags, folder, isPublic, url } = body;

    const media = await ContentService.updateMedia(id, {
      alt,
      caption,
      tags,
      folder,
      isPublic,
      url,
    });

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

// DELETE - Delete media asset
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await ContentService.deleteMedia(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
