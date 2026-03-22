import { NextResponse } from 'next/server';
import { getAllLore, searchLore } from '@/lib/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    let lore;
    if (query) {
      // Semantic search by keywords
      lore = searchLore(query);
    } else {
      // Get all lore
      lore = getAllLore();
    }

    return NextResponse.json(lore, { status: 200 });
  } catch (error) {
    console.error('Failed to get lore:', error);
    return NextResponse.json(
      { error: 'Failed to get lore' },
      { status: 500 }
    );
  }
}
