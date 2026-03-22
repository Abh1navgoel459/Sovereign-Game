import { NextResponse } from 'next/server';
import { generateNPCResponse } from '@/lib/npc';
import { getAllNPCs } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { playerId?: string; message?: string };
    const playerId = body.playerId;
    const message = body.message;

    if (!playerId || !message) {
      return NextResponse.json(
        { error: 'playerId and message are required' },
        { status: 400 }
      );
    }

    // Get Elarin (the only NPC)
    const npcs = getAllNPCs();
    const elarin = npcs.find(npc => npc.name === 'Elarin');

    if (!elarin) {
      return NextResponse.json(
        { error: 'NPC not found' },
        { status: 404 }
      );
    }

    // Generate NPC response
    const response = generateNPCResponse(elarin.id, playerId, message);

    return NextResponse.json({
      npcName: 'Elarin',
      response
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to process NPC conversation:', error);
    return NextResponse.json(
      { error: 'Failed to process NPC conversation' },
      { status: 500 }
    );
  }
}
