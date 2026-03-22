import { NextResponse } from 'next/server';
import { getAllPlayerMemories } from '@/lib/memory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }

    const memories = getAllPlayerMemories(playerId);
    return NextResponse.json(memories, { status: 200 });
  } catch (error) {
    console.error('Failed to get memories:', error);
    return NextResponse.json(
      { error: 'Failed to get memories' },
      { status: 500 }
    );
  }
}
