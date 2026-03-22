import { NextResponse } from 'next/server';
import { resolveTurnEvent } from '@/lib/game-core';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { optionId?: string };
    const optionId = String(body.optionId || '').trim();
    if (!optionId) return NextResponse.json({ error: 'Invalid turn event option' }, { status: 400 });

    const { session, decision } = await resolveTurnEvent(id, optionId);
    return NextResponse.json({ session, decision }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve turn event';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

