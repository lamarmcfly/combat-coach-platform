import { NextResponse } from 'next/server';
import { ContentService } from '@/services/contentService';

export const dynamic = 'force-dynamic';

// GET - Get published content for a page (public endpoint)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');

    if (!page) {
      return NextResponse.json(
        { error: 'Missing required parameter: page' },
        { status: 400 }
      );
    }

    const content = await ContentService.getPageContent(page);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
