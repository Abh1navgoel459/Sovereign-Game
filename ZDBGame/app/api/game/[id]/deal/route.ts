import { NextResponse } from 'next/server';
import { createDeal } from '@/lib/game-core';
import type { Commodity, NationId } from '@/lib/game-types';

const VALID_NATIONS: NationId[] = ['usa', 'china', 'eu', 'india', 'opec'];
const VALID_COMMODITIES: Commodity[] = ['energy', 'food', 'tech', 'rare_earths'];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      nationId?: NationId;
      offerCommodity?: Commodity;
      offerAmount?: number;
      requestCommodity?: Commodity;
      requestAmount?: number;
      note?: string;
    };

    if (
      !body.nationId ||
      !VALID_NATIONS.includes(body.nationId) ||
      !body.offerCommodity ||
      !VALID_COMMODITIES.includes(body.offerCommodity) ||
      !body.requestCommodity ||
      !VALID_COMMODITIES.includes(body.requestCommodity)
    ) {
      return NextResponse.json({ error: 'Invalid deal payload' }, { status: 400 });
    }

    const offerAmount = Number(body.offerAmount);
    const requestAmount = Number(body.requestAmount);

    if (!Number.isFinite(offerAmount) || !Number.isFinite(requestAmount) || offerAmount <= 0 || requestAmount <= 0) {
      return NextResponse.json({ error: 'Amounts must be positive numbers' }, { status: 400 });
    }

    const { session, outcome } = await createDeal(id, {
      nationId: body.nationId,
      offerCommodity: body.offerCommodity,
      offerAmount,
      requestCommodity: body.requestCommodity,
      requestAmount,
      note: body.note || '',
    });

    return NextResponse.json({ session, outcome }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create deal';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
