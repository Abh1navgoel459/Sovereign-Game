import { NextResponse } from 'next/server';
import { getAllGameEvents } from '@/lib/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    let events = getAllGameEvents();

    // Filter by player if specified
    if (playerId) {
      events = events.filter(event => event.player_id === playerId);
    }

    // Sort by timestamp descending (most recent first)
    events.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(
      events.map((event) => ({
        id: event.id,
        playerId: event.player_id,
        type: event.event_type,
        description: String((event.metadata as Record<string, unknown>)?.description || event.event_type),
        timestamp: event.created_at,
        location: event.location,
        metadata: event.metadata,
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to get events:', error);
    return NextResponse.json(
      { error: 'Failed to get events' },
      { status: 500 }
    );
  }
}
