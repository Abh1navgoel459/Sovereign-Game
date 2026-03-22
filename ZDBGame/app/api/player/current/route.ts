import { NextResponse } from 'next/server';
import { getAllPlayers } from '@/lib/data';

export async function GET() {
  try {
    const players = getAllPlayers();

    if (players.length === 0) {
      return NextResponse.json(null, { status: 200 });
    }

    // Return the most recently created player
    const currentPlayer = players[players.length - 1];
    return NextResponse.json(currentPlayer, { status: 200 });
  } catch (error) {
    console.error('Failed to get current player:', error);
    return NextResponse.json(
      { error: 'Failed to get current player' },
      { status: 500 }
    );
  }
}
