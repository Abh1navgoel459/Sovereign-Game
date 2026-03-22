import { NextResponse } from 'next/server';
import { saveLore } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      region?: string;
      tags?: string[];
    };
    const title = body.title;
    const content = body.content;
    const region = body.region;
    const tags = body.tags;

    if (!title || !content || !region) {
      return NextResponse.json(
        { error: 'title, content, and region are required' },
        { status: 400 }
      );
    }

    const lore = saveLore({
      title,
      content,
      region,
      tags: tags || []
    });

    return NextResponse.json(lore, { status: 201 });
  } catch (error) {
    console.error('Failed to create lore:', error);
    return NextResponse.json(
      { error: 'Failed to create lore' },
      { status: 500 }
    );
  }
}
