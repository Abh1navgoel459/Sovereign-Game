import { NextResponse } from 'next/server';
import { getCopilotSuggestion } from '@/lib/game-core';
import type { NationId } from '@/lib/game-types';

const VALID_NATIONS: NationId[] = ['usa', 'china', 'eu', 'india', 'opec'];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { nationId?: NationId };
    const nationId = body.nationId && VALID_NATIONS.includes(body.nationId) ? body.nationId : undefined;

    const suggestion = await getCopilotSuggestion(id, nationId);
    return NextResponse.json({ suggestion }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate suggestion';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
