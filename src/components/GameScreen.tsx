'use client';

import { useEffect, useRef, useState } from 'react';
import type { Term } from '@/data/terms';
import type { Guess } from '@/lib/useAI';
import type { RoundOutcome } from '@/lib/useGameState';
import { Timer } from './Timer';
import { TermDisplay } from './TermDisplay';
import { GuessesPanel } from './GuessesPanel';
import { ruleCheckDetail } from '@/lib/ruleCheck';
import { ROUND_SECONDS } from '@/lib/useGameState';

type Props = {
  term: Term;
  startedAt: number;
  score: number;
  solvedCount: number;
  description: string;
  guesses: Guess[];
  onDescriptionChange: (v: string) => void;
  onRequestGuesses: (text: string) => void;
  onResolveTerm: (outcome: RoundOutcome, finalGuesses: Guess[], violationReason?: string) => void;
  violationCount: number;
  onEndSession: () => void;
  onGoHome: () => void;
};

const DEBOUNCE_MS = 400;
const WIN_CELEBRATION_MS = 900;
const VIOLATION_DISPLAY_MS = 1800;

export function GameScreen({
  term,
  startedAt,
  score,
  solvedCount,
  description,
  guesses,
  onDescriptionChange,
  onRequestGuesses,
  onResolveTerm,
  onEndSession,
  onGoHome,
  violationCount,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - startedAt) / 1000))
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const guessesRef = useRef<Guess[]>(guesses);
  guessesRef.current = guesses;
  const sessionEndedRef = useRef(false);
  const termResolvedRef = useRef(false);

  // reset per-term state when the term changes
  useEffect(() => {
    termResolvedRef.current = false;
    setWinPending(false);
    setViolation(null);
    textareaRef.current?.focus();
  }, [term.id]);

  // session countdown
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, ROUND_SECONDS - elapsed);
      setSecondsLeft(left);
      if (left === 0 && !sessionEndedRef.current) {
        sessionEndedRef.current = true;
        onEndSession();
      }
    }, 250);
    return () => clearInterval(id);
  }, [startedAt, onEndSession]);

  const [violation, setViolation] = useState<string | null>(null);

  // debounced embed + rule check
  useEffect(() => {
    if (sessionEndedRef.current || termResolvedRef.current) return;
    const matched = ruleCheckDetail(description, term);
    if (matched) {
      termResolvedRef.current = true;
      setViolation(matched);
      return;
    }
    const h = setTimeout(() => {
      if (description.trim()) onRequestGuesses(description);
    }, DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [description, term, onRequestGuesses]);

  // hold the violation notice briefly, then advance
  useEffect(() => {
    if (!violation) return;
    const reason = violation;
    const h = setTimeout(() => {
      onResolveTerm('violation', guessesRef.current, reason);
    }, VIOLATION_DISPLAY_MS);
    return () => clearTimeout(h);
  }, [violation, onResolveTerm]);

  // win detection: correct term in top 3
  const [winPending, setWinPending] = useState(false);
  useEffect(() => {
    if (sessionEndedRef.current || termResolvedRef.current || winPending) return;
    const hit = guesses.slice(0, 3).some((g) => g.id === term.id);
    if (hit) {
      termResolvedRef.current = true;
      setWinPending(true);
    }
  }, [guesses, term, winPending]);

  useEffect(() => {
    if (!winPending) return;
    const frozen = guessesRef.current;
    const h = setTimeout(() => onResolveTerm('win', frozen), WIN_CELEBRATION_MS);
    return () => clearTimeout(h);
  }, [winPending, onResolveTerm]);

  const handleSkip = () => {
    if (sessionEndedRef.current || termResolvedRef.current) return;
    termResolvedRef.current = true;
    onResolveTerm('skip', guessesRef.current);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      {/* top bar */}
      <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-4">
        <div className="flex-1">
          <TermDisplay term={term} />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-ink/50">Solved</span>
            <span className="font-mono text-3xl font-bold tabular-nums">{solvedCount}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-ink/50">Score</span>
            <span className="font-mono text-3xl font-bold tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-ink/50">Violations</span>
            <span
              className={`font-mono text-3xl font-bold tabular-nums ${
                violationCount > 0 ? 'text-accent' : ''
              }`}
            >
              {violationCount}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-ink/50">Time</span>
            <Timer secondsLeft={secondsLeft} />
          </div>
          <button
            onClick={handleSkip}
            disabled={winPending}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5 disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={() => {
              if (sessionEndedRef.current) return;
              sessionEndedRef.current = true;
              onEndSession();
            }}
            disabled={winPending}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5 disabled:opacity-50"
          >
            Finish
          </button>
          <button
            onClick={() => {
              if (sessionEndedRef.current) return;
              sessionEndedRef.current = true;
              onGoHome();
            }}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
          >
            Home
          </button>
        </div>
      </div>

      {/* main grid */}
      <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Start describing…"
            disabled={winPending || violation !== null}
            className="h-full min-h-[320px] w-full resize-none rounded-2xl border border-ink/10 bg-white p-5 text-lg leading-relaxed shadow-sm outline-none focus:border-accent/60 disabled:opacity-70"
          />
        </div>
        <div className="md:col-span-2">
          <GuessesPanel guesses={guesses} winTermId={winPending ? term.id : undefined} />
        </div>
      </div>

      {violation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
          <div className="max-w-lg rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="font-serif text-3xl font-bold text-accent">Rule Violation</div>
            <p className="mt-3 text-ink/80">
              You said <span className="font-semibold">&ldquo;{violation}&rdquo;</span>. The term
              was <span className="font-semibold">{term.term}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
