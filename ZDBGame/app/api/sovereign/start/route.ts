import { NextResponse } from 'next/server';
import { createSovereignSession } from '@/lib/sovereign-engine';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      playerName?: string;
      scenarioId?: string;
    };
    const playerName = typeof body.playerName === 'string' ? body.playerName : 'Trader';
    const scenarioId = typeof body.scenarioId === 'string' ? body.scenarioId : undefined;

    const result = createSovereignSession(playerName, scenarioId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to start sovereign session:', error);
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
  }
}
