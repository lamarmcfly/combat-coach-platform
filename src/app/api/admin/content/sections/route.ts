import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminCheck';
import { ContentService } from '@/services/contentService';

export const dynamic = 'force-dynamic';

// GET - List all sections
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || undefined;

    const sections = await ContentService.getSections(page);

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST - Create new section
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { slug, name, description, page, orderIndex } = body;

    if (!slug || !name || !page) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, page' },
        { status: 400 }
      );
    }

    const section = await ContentService.createSection({
      slug,
      name,
      description,
      page,
      orderIndex,
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
