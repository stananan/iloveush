'use client';

import { TERMS } from '@/data/terms';
import type { Guess } from '@/lib/useAI';
import clsx from 'clsx';
import { useMemo } from 'react';

const termMap = new Map(TERMS.map((t) => [t.id, t]));

export function GuessesPanel({ guesses, winTermId }: { guesses: Guess[]; winTermId?: string }) {
  const rows = useMemo(() => guesses.slice(0, 3), [guesses]);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-widest text-ink/50 mb-3">
        The class is guessing…
      </div>
      {rows.length === 0 ? (
        <div className="text-ink/40 italic text-sm">
          Start typing to see guesses.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
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
                      isTop ? 'text-xl font-bold font-serif' : 'text-sm text-ink/70',
                      hot && 'text-green-700'
                    )}
                  >
                    {i + 1}. {name}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-ink/50">
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
  );
}
