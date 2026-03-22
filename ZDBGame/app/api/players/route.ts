import { NextResponse } from 'next/server';
import { getAllPlayers } from '@/lib/data';

export async function GET() {
  try {
    const players = getAllPlayers();
    return NextResponse.json(players, { status: 200 });
  } catch (error) {
    console.error('Failed to get players:', error);
    return NextResponse.json(
      { error: 'Failed to get players' },
      { status: 500 }
    );
  }
}
