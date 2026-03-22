'use client';

import type { A2UICardSpec } from '@/lib/a2ui';

function toneClass(tone: string): string {
  if (tone === 'good') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100';
  if (tone === 'warn') return 'border-amber-400/40 bg-amber-500/10 text-amber-100';
  if (tone === 'critical') return 'border-rose-400/40 bg-rose-500/10 text-rose-100';
  return 'border-slate-600 bg-slate-900/70 text-slate-200';
}

export function A2UINationCard({ spec, onAction }: { spec: A2UICardSpec | null; onAction?: (id: A2UICardSpec['actions'][number]['id']) => void }) {
  if (!spec) {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-400">
        A2UI component waiting for spec...
      </div>
    );
  }

  return (
    <div className="rounded border border-cyan-400/40 bg-slate-950/60 p-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold" style={{ color: spec.header.color }}>{spec.header.title}</p>
          <p className="text-xs text-slate-400">{spec.header.subtitle}</p>
        </div>
        <span className="rounded border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-100">
          A2UI
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {spec.metrics.map((m) => (
          <div key={m.id} className={`rounded border p-2 text-xs ${toneClass(m.tone)}`}>
            <p className="text-[10px] uppercase tracking-[0.12em] opacity-80">{m.label}</p>
            <p className="mt-1 font-semibold">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {spec.callouts.map((c) => (
          <div key={c.title} className="rounded border border-slate-700 bg-slate-900/60 p-2 text-xs">
            <p className="font-semibold text-slate-100">{c.title}</p>
            <p className="mt-1 text-slate-300">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {spec.chips.map((chip) => (
          <span key={chip} className="rounded border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {spec.actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction?.(a.id)}
            disabled={a.disabled}
            className="rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-800 disabled:opacity-45"
            title={a.reason || ''}
          >
            {a.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-slate-500">{spec.footer}</p>
    </div>
  );
}
