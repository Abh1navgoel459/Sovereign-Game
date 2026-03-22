import { NextResponse } from 'next/server';
import { saveNPC } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      role?: string;
      location?: string;
      personality?: Record<string, unknown>;
    };
    const name = body.name;
    const role = body.role;
    const location = body.location;
    const personality = body.personality;

    if (!name || !role || !location) {
      return NextResponse.json(
        { error: 'name, role, and location are required' },
        { status: 400 }
      );
    }

    const npc = saveNPC({
      name,
      role,
      location,
      personality: personality || {}
    });

    return NextResponse.json(npc, { status: 201 });
  } catch (error) {
    console.error('Failed to create NPC:', error);
    return NextResponse.json(
      { error: 'Failed to create NPC' },
      { status: 500 }
    );
  }
}
