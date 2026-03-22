import { NextResponse } from 'next/server';
import type { Nation, NationId } from '@/lib/game-types';
import { buildNationA2UISpec } from '@/lib/a2ui';

const VALID_NATIONS: NationId[] = ['usa', 'china', 'eu', 'india', 'opec'];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      nationId?: NationId;
      nation?: Nation;
      intelLevel?: number;
      hasMission?: boolean;
    };

    if (!body.nationId || !VALID_NATIONS.includes(body.nationId) || !body.nation) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const spec = buildNationA2UISpec({
      nationId: body.nationId,
      nation: body.nation,
      intelLevel: Math.max(0, Math.min(3, Number(body.intelLevel) || 0)),
      hasMission: Boolean(body.hasMission),
    });

    return NextResponse.json({ spec }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to compose A2UI spec';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
