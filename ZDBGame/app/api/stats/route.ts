import { NextResponse } from 'next/server';
import { getDataStats } from '@/lib/data';

export async function GET() {
  try {
    const stats = getDataStats();

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Failed to get stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
