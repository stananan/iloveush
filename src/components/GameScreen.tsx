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
  termCount: number;
  description: string;
  guesses: Guess[];
  targetConfidence: number | null;
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
  termCount,
  description,
  guesses,
  targetConfidence,
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

  // rule check on every keystroke; AI request debounced
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
  const winPendingRef = useRef(false);
  winPendingRef.current = winPending;

  // focus textarea once it becomes interactive (after win/violation clears)
  useEffect(() => {
    if (!winPending && violation === null) {
      textareaRef.current?.focus();
    }
  }, [winPending, violation]);

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

  // animated score counter
  const [displayScore, setDisplayScore] = useState(score);
  const displayScoreRef = useRef(score);
  useEffect(() => {
    if (score <= displayScoreRef.current) {
      displayScoreRef.current = score;
      setDisplayScore(score);
      return;
    }
    const start = displayScoreRef.current;
    displayScoreRef.current = score;
    const steps = score - start;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setDisplayScore(start + step);
      if (step >= steps) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, [score]);

  // home confirmation dialog
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  const handleSkip = () => {
    if (sessionEndedRef.current || termResolvedRef.current) return;
    termResolvedRef.current = true;
    onResolveTerm('skip', guessesRef.current);
  };

  // stable refs so the keyboard effect never needs re-registration
  const handleSkipRef = useRef(handleSkip);
  handleSkipRef.current = handleSkip;
  const onGoHomeRef = useRef(onGoHome);
  onGoHomeRef.current = onGoHome;

  // keyboard shortcuts: Tab = skip, Esc = home confirmation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        handleSkipRef.current();
      } else if (e.key === 'Escape') {
        if (!sessionEndedRef.current) setShowHomeConfirm(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-8 px-6 pt-32 pb-16">
      {/* term title — full width, centered, animates on term change */}
      <div
        key={term.id}
        className="w-full border-b border-ink/10 pb-6"
        style={{ animation: 'termIn 0.35s ease both' }}
      >
        <TermDisplay term={term} />
      </div>

      {/* stats row — centered */}
      <div className="flex items-center justify-center gap-12">
        <div className="flex flex-col items-center">
          <span className="text-sm uppercase tracking-widest text-ink/50">Terms</span>
          <span
            key={termCount}
            className="font-mono text-3xl font-bold tabular-nums"
            style={{ animation: 'statPop 0.3s ease both' }}
          >
            {termCount}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm uppercase tracking-widest text-ink/50">Score</span>
          <span className="font-mono text-3xl font-bold tabular-nums">{displayScore}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm uppercase tracking-widest text-ink/50">Violations</span>
          <span
            key={`v-${violationCount}`}
            className={`font-mono text-3xl font-bold tabular-nums ${violationCount > 0 ? 'text-accent' : ''}`}
            style={{ animation: violationCount > 0 ? 'statPop 0.3s ease both' : undefined }}
          >
            {violationCount}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm uppercase tracking-widest text-ink/50">Time</span>
          <Timer secondsLeft={secondsLeft} />
        </div>
      </div>

      {/* textarea + guesses side by side, matched height */}
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-5" style={{ alignItems: 'stretch' }}>
        <div className="flex md:col-span-3">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Start describing…"
            disabled={winPending || violation !== null}
            className="w-full flex-1 resize-none rounded-2xl border border-ink/10 bg-white p-5 text-xl leading-relaxed shadow-sm outline-none focus:border-accent/60 disabled:opacity-70"
          />
        </div>
        <div className="flex md:col-span-2">
          <GuessesPanel
            guesses={guesses}
            winTermId={winPending ? term.id : undefined}
            targetConfidence={targetConfidence}
          />
        </div>
      </div>

      {/* action buttons — centered, no grey border */}
      <div className="flex gap-3">
        <button
          onClick={handleSkip}
          disabled={winPending}
          className="rounded-full bg-white px-6 py-3 text-base font-medium text-ink/70 shadow-sm transition hover:text-ink hover:shadow disabled:opacity-50"
        >
          Skip <span className="text-ink/30 text-sm">Tab</span>
        </button>
        <button
          onClick={() => {
            if (sessionEndedRef.current) return;
            sessionEndedRef.current = true;
            onEndSession();
          }}
          disabled={winPending}
          className="rounded-full bg-ink px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
        >
          Finish
        </button>
        <button
          onClick={() => {
            if (sessionEndedRef.current) return;
            setShowHomeConfirm(true);
          }}
          className="rounded-full bg-white px-6 py-3 text-base font-medium text-ink/70 shadow-sm transition hover:text-ink hover:shadow"
        >
          Home <span className="text-ink/30 text-sm">Esc</span>
        </button>
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

      {showHomeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <p className="font-serif text-xl font-bold">Go home?</p>
            <p className="mt-2 text-sm text-ink/70">Your current session will be lost.</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => setShowHomeConfirm(false)}
                className="rounded-full border border-ink/20 px-5 py-2 text-sm hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sessionEndedRef.current = true;
                  onGoHomeRef.current();
                }}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
