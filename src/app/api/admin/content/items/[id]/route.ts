import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminCheck';
import { ContentService } from '@/services/contentService';

export const dynamic = 'force-dynamic';

// GET - Get content item by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const content = await ContentService.getContentById(id);

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// PATCH - Update content item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    if (!auth.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      textValue,
      richText,
      mediaUrl,
      mediaAlt,
      linkUrl,
      linkText,
      jsonValue,
      label,
      helpText,
      placeholder,
      isRequired,
      orderIndex,
      changeNote,
      action, // 'publish', 'unpublish', 'archive', 'rollback'
      version, // For rollback
    } = body;

    // Handle special actions
    if (action === 'publish') {
      const content = await ContentService.publishContent(id, auth.user.id);
      return NextResponse.json({ content });
    }

    if (action === 'unpublish') {
      const content = await ContentService.unpublishContent(id);
      return NextResponse.json({ content });
    }

    if (action === 'archive') {
      const content = await ContentService.archiveContent(id);
      return NextResponse.json({ content });
    }

    if (action === 'rollback' && version !== undefined) {
      const content = await ContentService.rollbackContent(id, version, auth.user.id);
      return NextResponse.json({ content });
    }

    // Regular update
    const content = await ContentService.updateContent(
      id,
      {
        textValue,
        richText,
        mediaUrl,
        mediaAlt,
        linkUrl,
        linkText,
        jsonValue,
        label,
        helpText,
        placeholder,
        isRequired,
        orderIndex,
      },
      auth.user.id,
      changeNote
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await ContentService.deleteContent(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
