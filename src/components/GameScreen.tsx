'use client';

import { useEffect, useRef, useState } from 'react';
import type { Term } from '@/data/terms';
import type { Guess } from '@/lib/useAI';
import { Timer } from './Timer';
import { TermDisplay } from './TermDisplay';
import { GuessesPanel } from './GuessesPanel';
import { ruleCheck } from '@/lib/ruleCheck';
import { ROUND_SECONDS } from '@/lib/useGameState';

type Props = {
  term: Term;
  startedAt: number;
  score: number;
  description: string;
  guesses: Guess[];
  onDescriptionChange: (v: string) => void;
  onRequestGuesses: (text: string) => void;
  onEndRound: (outcome: 'win' | 'violation' | 'timeout', finalGuesses: Guess[]) => void;
};

const DEBOUNCE_MS = 400;

export function GameScreen({
  term,
  startedAt,
  score,
  description,
  guesses,
  onDescriptionChange,
  onRequestGuesses,
  onEndRound,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const guessesRef = useRef<Guess[]>(guesses);
  guessesRef.current = guesses;
  const endedRef = useRef(false);

  // countdown
  useEffect(() => {
    endedRef.current = false;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, ROUND_SECONDS - elapsed);
      setSecondsLeft(left);
      if (left === 0 && !endedRef.current) {
        endedRef.current = true;
        onEndRound('timeout', guessesRef.current);
      }
    }, 250);
    return () => clearInterval(id);
  }, [startedAt, onEndRound]);

  // focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // debounced embed + rule check
  useEffect(() => {
    if (endedRef.current) return;
    if (ruleCheck(description, term)) {
      endedRef.current = true;
      onEndRound('violation', guessesRef.current);
      return;
    }
    const h = setTimeout(() => {
      if (description.trim()) onRequestGuesses(description);
    }, DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [description, term, onRequestGuesses, onEndRound]);

  // win condition: the correct term shows up anywhere in the top 3.
  // We delay transitioning to the round-end screen by 1.5s so the player can
  // see the final confidence percentage settle.
  const [winPending, setWinPending] = useState(false);
  useEffect(() => {
    if (endedRef.current) return;
    const hit = guesses.slice(0, 3).some((g) => g.id === term.id);
    if (hit) {
      endedRef.current = true;
      setWinPending(true);
      const frozen = guesses;
      const h = setTimeout(() => onEndRound('win', frozen), 1500);
      return () => clearTimeout(h);
    }
  }, [guesses, term, onEndRound]);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      {/* top bar */}
      <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-4">
        <div className="flex-1">
          <TermDisplay term={term} />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-ink/50">Score</span>
            <span className="font-mono text-3xl font-bold tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-ink/50">Time</span>
            <Timer secondsLeft={secondsLeft} />
          </div>
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
            disabled={winPending}
            className="h-full min-h-[320px] w-full resize-none rounded-2xl border border-ink/10 bg-white p-5 text-lg leading-relaxed shadow-sm outline-none focus:border-accent/60 disabled:opacity-70"
          />
        </div>
        <div className="md:col-span-2">
          <GuessesPanel guesses={guesses} winTermId={winPending ? term.id : undefined} />
        </div>
      </div>
    </div>
  );
}
