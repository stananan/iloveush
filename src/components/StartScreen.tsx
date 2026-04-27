"use client";

import { useState } from "react";
import { UnitFilter } from "./UnitFilter";
import { LeaderboardModal } from "./LeaderboardModal";
import { TermsModal } from "./TermsModal";
import type { AIStatus } from "@/lib/useAI";

type Props = {
  selectedUnits: number[];
  onUnitsChange: (u: number[]) => void;
  onStart: () => void;
  aiStatus: AIStatus;
  score: number;
  roundsPlayed: number;
};

function StatusLine({ status }: { status: AIStatus }) {
  if (status.phase === "ready") {
    return <span className="text-green-700">AI ready</span>;
  }
  if (status.phase === "loading-model") {
    return <span>Loading AI model… {Math.round(status.progress * 100)}%</span>;
  }
  if (status.phase === "embedding-terms") {
    return (
      <span>
        Preparing term bank… {status.done}/{status.total}
      </span>
    );
  }
  if (status.phase === "error") {
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
  const [termsOpen, setTermsOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const ready = aiStatus.phase === "ready";
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
          <div className="text-sm text-accent">
            Select at least one unit to start.
          </div>
        )}
        {roundsPlayed > 0 && (
          <div className="text-sm text-ink/60">
            Session: {score} point{score === 1 ? "" : "s"} · {roundsPlayed}{" "}
            round
            {roundsPlayed === 1 ? "" : "s"}
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
          <button
            onClick={() => setTermsOpen(true)}
            className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            Terms
          </button>
          <button
            onClick={() => setHowItWorksOpen(true)}
            className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            How It Works
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-ink/30">Created by Stanley Ho.</p>

      {leaderboardOpen && (
        <LeaderboardModal onClose={() => setLeaderboardOpen(false)} />
      )}

      {termsOpen && (
        <TermsModal onClose={() => setTermsOpen(false)} />
      )}

      {howItWorksOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setHowItWorksOpen(false)}
        >
          <div
            className="max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-2xl font-bold">How It Works</h3>
            <div className="mt-4 space-y-3 text-sm text-ink/80">
              <p>
                Every AP US History term in the game has been converted into a
                <strong> vector embedding</strong> — a list of ~384 numbers that
                captures its meaning — using a small AI model called{" "}
                <strong>BGE-small</strong> (~33 M parameters) that runs entirely
                in your browser via WebAssembly.
              </p>
              <p>
                As you type your description, the model embeds your words in the
                same vector space. It then computes{" "}
                <strong>cosine similarity</strong> between your description and
                every term in the selected units, ranking them by how close the
                meaning is.
              </p>
              <p>
                The top 3 closest terms are shown as the AI&apos;s guesses. If
                your term is a match, you score a point. No server is
                involved — all inference happens locally, so your descriptions
                stay private and the game works offline.
              </p>
              <p>
                To improve accuracy, each term&apos;s embedding also folds in
                its aliases, keywords, topic, and a short factual description,
                giving the model more signal to match paraphrased clues.
              </p>
            </div>
            <button
              onClick={() => setHowItWorksOpen(false)}
              className="mt-5 rounded-full border border-ink/20 px-5 py-2 text-sm hover:bg-ink/5"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
              <li>You have 2 minutes to type a description of your term.</li>
              <li>You can not type your term or a short-hand form of it (rule violation).</li>
              <li>The AI audience will try to guess your term based on the real definition.</li>
              <li>If it matches one of the AI's top 3 gueses, you score a point.</li>
              <li>You can skip a term by pressing tab.</li>
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
