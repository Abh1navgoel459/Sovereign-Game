import { NextResponse } from 'next/server';
import { getSovereignSession } from '@/lib/sovereign-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const result = getSovereignSession(sessionId);
    if (!result) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to get sovereign state:', error);
    return NextResponse.json({ error: 'Failed to get state' }, { status: 500 });
  }
}
