import { NextResponse } from 'next/server';
import { getGameState } from '@/lib/game-core';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getGameState(id);
    if (!session) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
