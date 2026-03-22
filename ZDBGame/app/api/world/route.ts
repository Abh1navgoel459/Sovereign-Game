import { NextResponse } from 'next/server';
import { getWorldEvents, countGameEvents } from '@/lib/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    const worldEvents = getWorldEvents();

    // Calculate wolf kill count if player specified
    let wolfKills = 0;
    if (playerId) {
      wolfKills = countGameEvents(playerId, 'wolf_kill');
    }

    return NextResponse.json({
      worldEvents,
      wolfKills
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to get world state:', error);
    return NextResponse.json(
      { error: 'Failed to get world state' },
      { status: 500 }
    );
  }
}
