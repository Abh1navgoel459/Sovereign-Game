import { NextResponse } from 'next/server';
import { getGameMetricsSummary } from '@/lib/game-core';

function toCsvRow(values: Array<string | number>) {
  return values
    .map((v) => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(',');
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') || 'json').toLowerCase();
    const metrics = getGameMetricsSummary();

    if (format === 'csv') {
      const rows = [
        toCsvRow([
          'sessionsStarted',
          'sessionsCompleted',
          'sessionsWon',
          'roundsCompleted',
          'dealsMade',
          'domesticDecisions',
          'turnEventsResolved',
          'returnUsers',
          'totalFinalScore',
          'completionRatePct',
          'winRatePct',
          'averageScore',
        ]),
        toCsvRow([
          metrics.sessionsStarted,
          metrics.sessionsCompleted,
          metrics.sessionsWon,
          metrics.roundsCompleted,
          metrics.dealsMade,
          metrics.domesticDecisions,
          metrics.turnEventsResolved,
          metrics.returnUsers,
          metrics.totalFinalScore,
          metrics.completionRate,
          metrics.winRate,
          metrics.averageScore,
        ]),
      ];
      return new NextResponse(`${rows.join('\n')}\n`, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="sovereign-metrics.csv"',
        },
      });
    }

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export metrics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
