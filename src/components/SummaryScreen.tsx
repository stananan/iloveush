'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RoundResult } from '@/lib/useGameState';
import { UNITS } from '@/data/terms';

type Props = {
  history: RoundResult[];
  score: number;
  durationSeconds: number;
  selectedUnits: number[];
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
  win: 'Correct',
  violation: 'Rule Violation',
  skip: 'Skipped',
};

const OUTCOME_BADGE: Record<RoundResult['outcome'], string> = {
  win: '✓',
  violation: '✗',
  skip: '→',
};

type FilterOption = 'all' | RoundResult['outcome'];
type SubmitState = 'idle' | 'submitting' | 'submitted' | 'error';

export function SummaryScreen({ history, score, durationSeconds, selectedUnits, onPlayAgain, onGoHome, onSubmitScore }: Props) {
  const streak = longestStreak(history);
  const allUnits = selectedUnits.length === UNITS.length;

  const [username, setUsername] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const reviewPool = history.filter((r) => r.outcome !== 'win');
  const filteredHistory =
    activeFilter === 'all' ? history : history.filter((r) => r.outcome === activeFilter);

  const openReview = () => {
    setReviewIdx(0);
    setFlipped(false);
    setReviewOpen(true);
  };

  const closeReview = useCallback(() => setReviewOpen(false), []);

  const prevCard = useCallback(() => {
    setFlipped(false);
    setReviewIdx((i) => (i - 1 + reviewPool.length) % reviewPool.length);
  }, [reviewPool.length]);

  const nextCard = useCallback(() => {
    setFlipped(false);
    setReviewIdx((i) => (i + 1) % reviewPool.length);
  }, [reviewPool.length]);

  useEffect(() => {
    if (!reviewOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevCard();
      else if (e.key === 'ArrowRight') nextCard();
      else if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === 'Escape') closeReview();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reviewOpen, prevCard, nextCard, closeReview]);

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

  const filterOptions: { key: FilterOption; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'win', label: 'Correct' },
    { key: 'violation', label: 'Violated' },
    { key: 'skip', label: 'Skipped' },
  ];

  const countFor = (key: FilterOption) =>
    key === 'all' ? history.length : history.filter((r) => r.outcome === key).length;

  const currentCard = reviewPool[reviewIdx];

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-8 px-6 pt-20 pb-12">
      <h1 className="font-serif text-6xl md:text-7xl font-bold text-center tracking-tight">Game Summary</h1>

      <div className="w-full flex flex-col gap-3">
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

      {/* review missed/skipped button */}
      {reviewPool.length > 0 && (
        <button
          onClick={openReview}
          className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-6 py-3 text-base font-semibold text-ink/80 shadow-sm transition hover:shadow hover:text-ink"
        >
          Review missed &amp; skipped
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-sm font-bold text-accent">
            {reviewPool.length}
          </span>
        </button>
      )}

      {/* leaderboard submission */}
      <div className="w-full rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <div className="text-sm uppercase tracking-widest text-ink/50 mb-3">Submit to Leaderboard</div>
        {!allUnits ? (
          <p className="text-base text-ink/50 italic">
            Leaderboard submissions require all 8 units to be selected.
          </p>
        ) : submitState === 'submitted' ? (
          <div className="text-green-700 font-semibold text-base">
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
              className="flex-1 rounded-full border border-ink/10 bg-ink/[0.03] px-5 py-3 text-base outline-none focus:border-accent/60 disabled:opacity-60"
            />
            <button
              onClick={handleSubmit}
              disabled={submitState === 'submitting' || !username.trim()}
              className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
            >
              {submitState === 'submitting' ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
        {submitState === 'error' && (
          <p className="mt-2 text-sm text-accent">{errorMsg}</p>
        )}
      </div>

      {/* action buttons — above history */}
      <div className="flex gap-4">
        <button
          onClick={onGoHome}
          className="rounded-full bg-white px-8 py-3 text-base font-semibold text-ink/70 shadow-sm transition hover:text-ink hover:shadow"
        >
          Home
        </button>
        <button
          onClick={onPlayAgain}
          className="rounded-full bg-accent px-10 py-3 text-base font-semibold text-white shadow-sm hover:brightness-110"
        >
          Play Again
        </button>
      </div>

      {/* history */}
      <div className="w-full rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm uppercase tracking-widest text-ink/50">Terms</div>
        </div>

        {/* filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map(({ key, label }) => {
            const count = countFor(key);
            const active = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-accent text-white'
                    : 'bg-ink/5 text-ink/60 hover:bg-ink/10 hover:text-ink'
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${active ? 'bg-white/20' : 'bg-ink/10'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-base italic text-ink/40">No rounds matching this filter.</div>
        ) : (
          <ol className="divide-y divide-ink/5">
            {filteredHistory.map((r, i) => (
              <li key={i} className="py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-lg font-semibold">
                    {history.indexOf(r) + 1}. {r.term.term}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-base font-medium ${
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
                <p className="mt-1 text-base text-ink/75">
                  {r.term.description ?? 'No description available.'}
                </p>
                <p className="mt-1 text-sm text-ink/50">
                  Your clue: {r.description.trim() ? r.description : 'No clue entered.'}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* flashcard review modal */}
      {reviewOpen && currentCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-6"
          onClick={closeReview}
        >
          <div
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* close */}
            <button
              onClick={closeReview}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl font-bold leading-none"
              aria-label="Close"
            >
              ✕
            </button>

            {/* counter */}
            <div className="text-center text-white/70 text-sm mb-3 font-medium tracking-wide">
              {reviewIdx + 1} / {reviewPool.length}
            </div>

            {/* card */}
            <div
              className="cursor-pointer"
              style={{ perspective: '1000px' }}
              onClick={() => setFlipped((f) => !f)}
            >
              <div
                style={{
                  transition: 'transform 0.45s',
                  transformStyle: 'preserve-3d',
                  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  position: 'relative',
                  minHeight: '220px',
                }}
              >
                {/* front */}
                <div
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-cream px-8 py-10"
                >
                  <div className="text-xs uppercase tracking-widest text-ink/40 mb-4">Term</div>
                  <div className="font-serif text-3xl font-bold text-center text-ink leading-tight">
                    {currentCard.term.term}
                  </div>
                  <div className="mt-6 text-sm text-ink/40">Click or press Space to flip</div>
                </div>

                {/* back */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                  className="absolute inset-0 flex flex-col justify-center rounded-2xl bg-white px-8 py-10"
                >
                  <div className="text-xs uppercase tracking-widest text-ink/40 mb-3">Description</div>
                  <p className="text-base text-ink/85 leading-relaxed">
                    {currentCard.term.description ?? 'No description available.'}
                  </p>
                  {currentCard.description.trim() && (
                    <p className="mt-4 text-sm text-ink/50 italic">
                      Your clue: {currentCard.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* nav arrows */}
            <div className="flex justify-between mt-4">
              <button
                onClick={prevCard}
                className="rounded-full bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 text-lg font-bold transition"
                aria-label="Previous"
              >
                ←
              </button>
              <button
                onClick={nextCard}
                className="rounded-full bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 text-lg font-bold transition"
                aria-label="Next"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 text-center shadow-sm">
      <div className="text-sm uppercase tracking-widest text-ink/50">{label}</div>
      <div className="mt-1 font-mono text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
