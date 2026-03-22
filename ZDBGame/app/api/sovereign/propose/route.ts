import { NextResponse } from 'next/server';
import { proposeSovereignDeal } from '@/lib/sovereign-engine';
import type { Commodity, DealProposal, NationId } from '@/lib/sovereign-types';

const VALID_NATIONS: NationId[] = ['usa', 'china', 'eu', 'india', 'opec'];
const VALID_COMMODITIES: Commodity[] = ['energy', 'food', 'tech', 'rare_earths'];

function isCommodity(value: string): value is Commodity {
  return VALID_COMMODITIES.includes(value as Commodity);
}

function isNation(value: string): value is NationId {
  return VALID_NATIONS.includes(value as NationId);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
    const nationId = typeof body.nationId === 'string' ? body.nationId : '';
    const offerCommodity = typeof body.offerCommodity === 'string' ? body.offerCommodity : '';
    const requestCommodity = typeof body.requestCommodity === 'string' ? body.requestCommodity : '';
    const offerAmount = Number(body.offerAmount);
    const requestAmount = Number(body.requestAmount);
    const note = typeof body.note === 'string' ? body.note : '';

    if (!sessionId || !isNation(nationId) || !isCommodity(offerCommodity) || !isCommodity(requestCommodity)) {
      return NextResponse.json({ error: 'Invalid session or deal fields' }, { status: 400 });
    }

    if (!Number.isFinite(offerAmount) || !Number.isFinite(requestAmount)) {
      return NextResponse.json({ error: 'offerAmount and requestAmount must be numbers' }, { status: 400 });
    }

    const proposal: DealProposal = {
      nationId,
      offerCommodity,
      offerAmount,
      requestCommodity,
      requestAmount,
      note,
    };

    const result = await proposeSovereignDeal(sessionId, proposal);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process deal';
    const statusCode = message.includes('not found') ? 404 : 400;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
