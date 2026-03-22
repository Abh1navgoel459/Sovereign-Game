import { NextResponse } from 'next/server';
import { savePlayer } from '@/lib/data';

export async function POST() {
  try {
    const player = savePlayer({
      username: 'TobyTheExplorer',
      class: 'Ranger',
      faction: 'Independent',
      level: 1,
      xp: 0,
      inventory: [],
      reputation: 50,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Failed to create player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
