import { NextResponse } from 'next/server';
import { getGameMetricsSummary } from '@/lib/game-core';

export async function GET() {
  try {
    const metrics = getGameMetricsSummary();
    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get metrics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
