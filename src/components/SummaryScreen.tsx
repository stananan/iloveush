'use client';

import { useState } from 'react';
import type { RoundResult } from '@/lib/useGameState';

type Props = {
  history: RoundResult[];
  score: number;
  durationSeconds: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onSubmitScore: (username: string) => Promise<void>;
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

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const OUTCOME_LABEL: Record<RoundResult['outcome'], string> = {
  win: 'Win',
  violation: 'Rule Violation',
  skip: 'Skipped',
};

const OUTCOME_BADGE: Record<RoundResult['outcome'], string> = {
  win: '✓',
  violation: '✗',
  skip: '→',
};

type SubmitState = 'idle' | 'submitting' | 'submitted' | 'error';

export function SummaryScreen({ history, score, durationSeconds, onPlayAgain, onGoHome, onSubmitScore }: Props) {
  const streak = longestStreak(history);

  const [username, setUsername] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    const name = username.trim();
    if (!name) return;
    setSubmitState('submitting');
    try {
      await onSubmitScore(name);
      setSubmitState('submitted');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Submission failed. Try again.');
      setSubmitState('error');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="font-serif text-5xl font-bold text-center">Game Summary</h1>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Score" value={score} />
          <Stat label="Terms" value={history.length} />
          <Stat label="Longest streak" value={streak} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Rule violations" value={history.filter((r) => r.outcome === 'violation').length} />
          <Stat label="Skipped" value={history.filter((r) => r.outcome === 'skip').length} />
        </div>
      </div>

      {/* leaderboard submission */}
      <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <div className="text-xs uppercase tracking-widest text-ink/50 mb-3">Submit to Leaderboard</div>
        {submitState === 'submitted' ? (
          <div className="text-green-700 font-semibold text-sm">
            Score submitted! Time: {formatDuration(durationSeconds)}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.slice(0, 20))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="Your username (max 20 chars)"
              disabled={submitState === 'submitting'}
              className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm outline-none focus:border-accent/60 disabled:opacity-60"
            />
            <button
              onClick={handleSubmit}
              disabled={submitState === 'submitting' || !username.trim()}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              {submitState === 'submitting' ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
        {submitState === 'error' && (
          <p className="mt-2 text-xs text-accent">{errorMsg}</p>
        )}
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="text-xs uppercase tracking-widest text-ink/50 mb-3">Terms</div>
        {history.length === 0 ? (
          <div className="text-sm italic text-ink/40">No rounds played.</div>
        ) : (
          <ol className="divide-y divide-ink/5">
            {history.map((r, i) => (
              <li key={i} className="py-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif font-semibold">
                    {i + 1}. {r.term.term}
                  </span>
                  <span
                    className={`flex items-center gap-1 font-medium ${
                      r.outcome === 'win'
                        ? 'text-green-700'
                        : r.outcome === 'violation'
                          ? 'text-accent'
                          : 'text-ink/60'
                    }`}
                  >
                    <span>{OUTCOME_BADGE[r.outcome]}</span>
                    {OUTCOME_LABEL[r.outcome]}
                  </span>
                </div>
                <p className="mt-1 text-ink/75">
                  {r.term.description ?? 'No description available for this term yet.'}
                </p>
                <p className="mt-1 text-xs text-ink/55">
                  Your clue: {r.description.trim() ? r.description : 'No clue entered.'}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onGoHome}
          className="rounded-full border border-ink/20 px-8 py-3 font-semibold hover:bg-ink/5"
        >
          Home
        </button>
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
