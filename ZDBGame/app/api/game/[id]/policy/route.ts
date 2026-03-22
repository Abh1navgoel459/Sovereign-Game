import { NextResponse } from 'next/server';
import { resolveDomesticScenario } from '@/lib/game-core';

const VALID_OPTIONS = ['stabilize', 'targeted', 'austerity'] as const;
type DomesticOptionId = typeof VALID_OPTIONS[number];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { optionId?: DomesticOptionId; action?: DomesticOptionId };
    const optionId = body.optionId || body.action;
    if (!optionId || !VALID_OPTIONS.includes(optionId)) {
      return NextResponse.json({ error: 'Invalid domestic option' }, { status: 400 });
    }

    const { session, decision } = await resolveDomesticScenario(id, optionId);
    return NextResponse.json({ session, decision }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve domestic scenario';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
