import { NextResponse } from 'next/server';
import { createGameplayEvent, checkWolfPackRetreatTrigger } from '@/lib/game-engine';
import { storeActionMemory } from '@/lib/npc';
import { getAllNPCs } from '@/lib/data';

const VALID_EVENT_TYPES = ['explore', 'wolf_kill', 'help_village', 'npc_conversation'] as const;
type EventType = (typeof VALID_EVENT_TYPES)[number];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      playerId?: string;
      eventType?: string;
      description?: string;
      location?: string;
      metadata?: Record<string, unknown>;
    };
    const playerId = body.playerId;
    const eventType = body.eventType;
    const description = body.description || 'Player action recorded';
    const location = body.location || 'Moonvale';
    const metadata = body.metadata || {};

    if (!playerId || !eventType) {
      return NextResponse.json(
        { error: 'playerId and eventType are required' },
        { status: 400 }
      );
    }

    if (!VALID_EVENT_TYPES.includes(eventType as EventType)) {
      return NextResponse.json(
        { error: 'Invalid eventType' },
        { status: 400 }
      );
    }
    const typedEventType = eventType as EventType;

    // Create gameplay event
    const gameEvent = createGameplayEvent(
      playerId,
      typedEventType,
      description,
      location,
      metadata
    );

    // Store NPC memory of this action (Elarin remembers what the player did)
    const npcs = getAllNPCs();
    const elarin = npcs.find(npc => npc.name === 'Elarin');
    if (elarin) {
      storeActionMemory(elarin.id, playerId, typedEventType);
    }

    // Check for world event triggers (only for wolf_kill events)
    let worldEvent = null;
    if (typedEventType === 'wolf_kill') {
      worldEvent = checkWolfPackRetreatTrigger(playerId);
    }

    return NextResponse.json({
      success: true,
      gameEvent,
      worldEvent,
      message: worldEvent
        ? `Game event created and world event "${worldEvent.event_name}" triggered!`
        : 'Game event created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
