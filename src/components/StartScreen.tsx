'use client';

import { useState } from 'react';
import { UnitFilter } from './UnitFilter';
import { LeaderboardModal } from './LeaderboardModal';
import type { AIStatus } from '@/lib/useAI';

type Props = {
  selectedUnits: number[];
  onUnitsChange: (u: number[]) => void;
  onStart: () => void;
  aiStatus: AIStatus;
  score: number;
  roundsPlayed: number;
};

function StatusLine({ status }: { status: AIStatus }) {
  if (status.phase === 'ready') {
    return <span className="text-green-700">AI ready</span>;
  }
  if (status.phase === 'loading-model') {
    return <span>Loading AI model… {Math.round(status.progress * 100)}%</span>;
  }
  if (status.phase === 'embedding-terms') {
    return (
      <span>
        Preparing term bank… {status.done}/{status.total}
      </span>
    );
  }
  if (status.phase === 'error') {
    return <span className="text-accent">Error: {status.message}</span>;
  }
  return <span>Starting up…</span>;
}

export function StartScreen({
  selectedUnits,
  onUnitsChange,
  onStart,
  aiStatus,
  score,
  roundsPlayed,
}: Props) {
  const [howToOpen, setHowToOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const ready = aiStatus.phase === 'ready';
  const hasUnits = selectedUnits.length > 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="text-center">
        <h1 className="font-serif text-6xl md:text-7xl font-bold tracking-tight">
          I <span className="text-accent">❤️</span> USH
        </h1>
      </div>

      <div className="w-full rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <UnitFilter selected={selectedUnits} onChange={onUnitsChange} />
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onStart}
          disabled={!ready || !hasUnits}
          className="rounded-full bg-accent px-10 py-4 text-xl font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Round
        </button>
        <div className="text-sm text-ink/60">
          <StatusLine status={aiStatus} />
        </div>
        {ready && !hasUnits && (
          <div className="text-sm text-accent">Select at least one unit to start.</div>
        )}
        {roundsPlayed > 0 && (
          <div className="text-sm text-ink/60">
            Session: {score} point{score === 1 ? '' : 's'} · {roundsPlayed} round
            {roundsPlayed === 1 ? '' : 's'}
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => setHowToOpen(true)}
            className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            How to Play
          </button>
          <button
            onClick={() => setLeaderboardOpen(true)}
            className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            Leaderboard
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-ink/30">Created by Stanley Ho</p>

      {leaderboardOpen && <LeaderboardModal onClose={() => setLeaderboardOpen(false)} />}

      {howToOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setHowToOpen(false)}
        >
          <div
            className="max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-2xl font-bold">How to Play</h3>
            <ul className="mt-4 space-y-2 text-ink/80 text-sm list-disc list-inside">
              <li>You have 2 minutes to describe your term.</li>
              <li>Don&apos;t say the term itself (or an obvious shorthand).</li>
              <li>The AI reads what you type and guesses in real time.</li>
              <li>If its top guess matches your term, you score a point.</li>
              <li>Say the term and you get a rule violation (0 points).</li>
            </ul>
            <button
              onClick={() => setHowToOpen(false)}
              className="mt-5 rounded-full border border-ink/20 px-5 py-2 text-sm hover:bg-ink/5"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
