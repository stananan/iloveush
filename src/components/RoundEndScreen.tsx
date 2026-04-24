'use client';

import { TERMS, type Term } from '@/data/terms';
import type { Guess } from '@/lib/useAI';
import type { RoundOutcome } from '@/lib/useGameState';

const termMap = new Map(TERMS.map((t) => [t.id, t]));

type Props = {
  term: Term;
  outcome: RoundOutcome;
  description: string;
  finalGuesses: Guess[];
  score: number;
  onNext: () => void;
  onEndGame: () => void;
};

const HEADLINES: Record<RoundOutcome, { text: string; sub: string; color: string }> = {
  win: { text: '+1 Point!', sub: 'The class got it.', color: 'text-green-700' },
  violation: { text: 'Rule Violation', sub: 'You said the term.', color: 'text-accent' },
  timeout: { text: "Time's Up", sub: 'No one guessed in time.', color: 'text-ink' },
};

export function RoundEndScreen({ term, outcome, description, finalGuesses, score, onNext, onEndGame }: Props) {
  const h = HEADLINES[outcome];
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className={`font-serif text-5xl md:text-6xl font-bold ${h.color}`}>{h.text}</h1>
        <p className="mt-2 text-ink/70">{h.sub}</p>
      </div>

      <div className="w-full rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="text-xs uppercase tracking-widest text-ink/50">The term was</div>
        <div className="mt-1 font-serif text-3xl font-bold">{term.term}</div>

        <div className="mt-5 text-xs uppercase tracking-widest text-ink/50">Your description</div>
        <p className="mt-1 whitespace-pre-wrap text-ink/80 text-sm leading-relaxed">
          {description.trim() || <span className="italic text-ink/40">(nothing typed)</span>}
        </p>

        <div className="mt-5 text-xs uppercase tracking-widest text-ink/50">Final guesses</div>
        {finalGuesses.length === 0 ? (
          <div className="mt-1 text-sm italic text-ink/40">No guesses yet.</div>
        ) : (
          <ol className="mt-1 space-y-1 text-sm">
            {finalGuesses.map((g, i) => (
              <li key={g.id} className="flex justify-between">
                <span>
                  {i + 1}. {termMap.get(g.id)?.term ?? g.id}
                </span>
                <span className="font-mono tabular-nums text-ink/50">
                  {(g.score * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="text-sm text-ink/60">Total score: {score}</div>

      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="rounded-full bg-accent px-8 py-3 font-semibold text-white shadow hover:brightness-110"
        >
          Next Round
        </button>
        <button
          onClick={onEndGame}
          className="rounded-full border border-ink/20 px-8 py-3 hover:bg-ink/5"
        >
          End Game
        </button>
      </div>
    </div>
  );
}
