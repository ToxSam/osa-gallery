import { NextRequest, NextResponse } from 'next/server';
import { loadSearchableContent, searchContent } from '@/lib/search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const locale = searchParams.get('locale') || 'en';

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const allContent = await loadSearchableContent(locale);
    const results = searchContent(query, allContent);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search documentation' },
      { status: 500 }
    );
  }
}
