'use client';

import { TERMS } from '@/data/terms';
import type { Guess } from '@/lib/useAI';
import clsx from 'clsx';
import { useMemo } from 'react';

const termMap = new Map(TERMS.map((t) => [t.id, t]));

// Cosine score range for the confidence bar: 0.35 → 0%, 0.80 → 100%
const CONF_MIN = 0.35;
const CONF_MAX = 0.80;

export function GuessesPanel({
  guesses,
  winTermId,
  targetConfidence,
}: {
  guesses: Guess[];
  winTermId?: string;
  targetConfidence: number | null;
}) {
  const rows = useMemo(() => guesses.slice(0, 3), [guesses]);

  const confPct =
    targetConfidence !== null
      ? Math.round(Math.min(1, Math.max(0, (targetConfidence - CONF_MIN) / (CONF_MAX - CONF_MIN))) * 100)
      : null;

  const confColor =
    confPct === null ? 'bg-ink/20'
    : confPct >= 70 ? 'bg-green-500'
    : confPct >= 40 ? 'bg-yellow-400'
    : 'bg-accent';

  return (
    <div className="flex w-full flex-col gap-3">
      {/* confidence bar */}
      <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm uppercase tracking-widest text-ink/50">AI Confidence</span>
          <span className="text-sm font-mono tabular-nums text-ink/50">
            {confPct !== null ? `${confPct}%` : '—'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', confColor)}
            style={{ width: `${confPct ?? 0}%` }}
          />
        </div>
      </div>

      {/* guesses list */}
      <div className="flex-1 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <div className="text-sm uppercase tracking-widest text-ink/50 mb-3">
          The class is guessing…
        </div>
        {rows.length === 0 ? (
          <div className="text-ink/40 italic text-base">
            Start typing to see guesses.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {rows.map((g, i) => {
              const term = termMap.get(g.id);
              const name = term?.term ?? g.id;
              const pct = Math.max(0, Math.min(1, g.score));
              const isTop = i === 0;
              const hot = !!winTermId && g.id === winTermId;
              return (
                <li key={g.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={clsx(
                        'truncate transition-colors',
                        isTop ? 'text-2xl font-bold font-serif' : 'text-base text-ink/70',
                        hot && 'text-green-700'
                      )}
                    >
                      {i + 1}. {name}
                    </span>
                    <span className="text-sm font-mono tabular-nums text-ink/50">
                      {(g.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
                    <div
                      className={clsx(
                        'h-full transition-all duration-300',
                        hot ? 'bg-green-600' : isTop ? 'bg-accent' : 'bg-ink/30'
                      )}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
