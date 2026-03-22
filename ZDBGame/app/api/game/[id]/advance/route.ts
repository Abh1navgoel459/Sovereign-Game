import { NextResponse } from 'next/server';
import { advanceRound } from '@/lib/game-core';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { session, outcome } = await advanceRound(id);
    return NextResponse.json({ session, outcome }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to advance round';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
