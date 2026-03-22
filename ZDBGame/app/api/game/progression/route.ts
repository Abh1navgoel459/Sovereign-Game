import { NextResponse } from 'next/server';
import { getProgressionPreview } from '@/lib/game-core';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { playerName?: string };
    const playerName = String(body.playerName || '').trim() || 'Trader';
    const progression = await getProgressionPreview(playerName);
    return NextResponse.json({ progression }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch progression';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

