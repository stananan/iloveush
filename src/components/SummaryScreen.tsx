'use client';

import type { RoundResult } from '@/lib/useGameState';

type Props = {
  history: RoundResult[];
  score: number;
  onPlayAgain: () => void;
};

function longestStreak(history: RoundResult[]): number {
  let best = 0;
  let cur = 0;
  for (const r of history) {
    if (r.outcome === 'win') {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

const OUTCOME_LABEL: Record<RoundResult['outcome'], string> = {
  win: 'Win',
  violation: 'Rule Violation',
  timeout: 'Timeout',
};

export function SummaryScreen({ history, score, onPlayAgain }: Props) {
  const wins = history.filter((r) => r.outcome === 'win').length;
  const streak = longestStreak(history);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="font-serif text-5xl font-bold text-center">Game Summary</h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Score" value={score} />
        <Stat label="Rounds" value={history.length} />
        <Stat label="Wins" value={wins} />
        <Stat label="Longest streak" value={streak} />
        <Stat label="Rule violations" value={history.filter((r) => r.outcome === 'violation').length} />
        <Stat label="Timeouts" value={history.filter((r) => r.outcome === 'timeout').length} />
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="text-xs uppercase tracking-widest text-ink/50 mb-3">Rounds</div>
        {history.length === 0 ? (
          <div className="text-sm italic text-ink/40">No rounds played.</div>
        ) : (
          <ol className="divide-y divide-ink/5">
            {history.map((r, i) => (
              <li key={i} className="flex items-baseline justify-between py-2 text-sm">
                <span className="font-serif font-semibold">
                  {i + 1}. {r.term.term}
                </span>
                <span
                  className={
                    r.outcome === 'win'
                      ? 'text-green-700'
                      : r.outcome === 'violation'
                        ? 'text-accent'
                        : 'text-ink/60'
                  }
                >
                  {OUTCOME_LABEL[r.outcome]}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onPlayAgain}
          className="rounded-full bg-accent px-10 py-3 font-semibold text-white shadow hover:brightness-110"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 text-center shadow-sm">
      <div className="text-xs uppercase tracking-widest text-ink/50">{label}</div>
      <div className="mt-1 font-serif text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
