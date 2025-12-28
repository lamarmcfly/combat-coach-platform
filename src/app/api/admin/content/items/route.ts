import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminCheck';
import { ContentService } from '@/services/contentService';
import { ContentType, ContentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET - List all content items
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || undefined;
    const sectionId = searchParams.get('sectionId') || undefined;
    const status = searchParams.get('status') as ContentStatus | null;
    const type = searchParams.get('type') as ContentType | null;

    const contents = await ContentService.getAllContent({
      page,
      sectionId,
      status: status || undefined,
      type: type || undefined,
    });

    return NextResponse.json({ contents });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST - Create new content item
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      sectionId,
      key,
      type,
      label,
      helpText,
      placeholder,
      isRequired,
      orderIndex,
      textValue,
      richText,
      mediaUrl,
      mediaAlt,
      linkUrl,
      linkText,
      jsonValue,
    } = body;

    if (!sectionId || !key || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionId, key, type' },
        { status: 400 }
      );
    }

    const content = await ContentService.createContent({
      sectionId,
      key,
      type: type as ContentType,
      label,
      helpText,
      placeholder,
      isRequired,
      orderIndex,
      textValue,
      richText,
      mediaUrl,
      mediaAlt,
      linkUrl,
      linkText,
      jsonValue,
    });

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
