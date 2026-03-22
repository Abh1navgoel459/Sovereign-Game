import { NextResponse } from 'next/server';
import { startGame } from '@/lib/game-core';
import type { Difficulty } from '@/lib/game-types';

const VALID_DIFFICULTIES: Difficulty[] = ['analyst', 'director', 'grandmaster'];

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      playerName?: string;
      scenarioId?: 'energy_embargo' | 'food_panic' | 'chip_chokepoint';
      difficulty?: Difficulty;
      judgeMode?: boolean;
      scenarioModId?: string;
      advisorId?: string;
      perkId?: string;
    };

    const playerName = typeof body.playerName === 'string' ? body.playerName : 'Trader';
    const scenarioId = body.scenarioId || 'energy_embargo';
    const difficulty = body.difficulty && VALID_DIFFICULTIES.includes(body.difficulty) ? body.difficulty : 'analyst';

    const session = await startGame(playerName, scenarioId, difficulty, {
      judgeMode: Boolean(body.judgeMode),
      scenarioModId: body.scenarioModId,
      advisorId: body.advisorId,
      perkId: body.perkId,
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start game';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
