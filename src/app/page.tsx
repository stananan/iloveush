'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { submitScore } from '@/lib/leaderboard';
import { TERMS, getRandomTerm, getTermsByUnits } from '@/data/terms';
import { useAI } from '@/lib/useAI';
import { useGameState } from '@/lib/useGameState';
import { ruleCheck } from '@/lib/ruleCheck';
import type { RoundOutcome } from '@/lib/useGameState';
import { StartScreen } from '@/components/StartScreen';
import { GameScreen } from '@/components/GameScreen';
import { SummaryScreen } from '@/components/SummaryScreen';

export default function Home() {
  const [state, dispatch] = useGameState();
  const { status, latestGuesses, requestGuesses, setLatestGuesses, setAllowedIds } = useAI();

  const termById = useMemo(() => new Map(TERMS.map((t) => [t.id, t])), []);

  const phase = state.phase;
  const description = phase === 'playing' ? state.description : '';
  const activeTermId = phase === 'playing' ? state.term.id : null;
  const currentGuesses = phase === 'playing' ? state.guesses : null;
  useEffect(() => {
    if (phase !== 'playing' || activeTermId === null) return;
    const filtered = latestGuesses
      .filter((g) => {
        const term = termById.get(g.id);
        if (!term) return false;
        if (term.id === activeTermId) return true;
        return !ruleCheck(description, term);
      })
      .slice(0, 3);
    const same =
      currentGuesses &&
      currentGuesses.length === filtered.length &&
      currentGuesses.every((g, i) => g.id === filtered[i].id && g.score === filtered[i].score);
    if (same) return;
    dispatch({ type: 'setGuesses', guesses: filtered });
  }, [latestGuesses, phase, activeTermId, description, currentGuesses, dispatch, termById]);

  const handleStart = useCallback(() => {
    if (status.phase !== 'ready') return;
    if (state.phase === 'playing') return;
    if (state.selectedUnits.length === 0) return;
    const term = getRandomTerm(state.selectedUnits);
    setLatestGuesses([]);
    setAllowedIds(getTermsByUnits(state.selectedUnits).map((t) => t.id));
    dispatch({ type: 'startSession', term });
  }, [status.phase, state, dispatch, setLatestGuesses, setAllowedIds]);

  const selectedUnits = state.phase === 'playing' ? state.selectedUnits : [];
  const usedIdsRef = useMemoUsedIds(state);

  const handleResolveTerm = useCallback(
    (outcome: RoundOutcome, finalGuesses: typeof latestGuesses, violationReason?: string) => {
      const nextTerm = pickNextTerm(selectedUnits, usedIdsRef.current);
      setLatestGuesses([]);
      dispatch({ type: 'resolveTerm', outcome, finalGuesses, nextTerm, violationReason });
    },
    [selectedUnits, usedIdsRef, dispatch, setLatestGuesses]
  );

  const handleEndSession = useCallback(() => {
    setAllowedIds(null);
    dispatch({ type: 'endSession' });
  }, [dispatch, setAllowedIds]);

  const handleAbort = useCallback(() => {
    setAllowedIds(null);
    dispatch({ type: 'abort' });
  }, [dispatch, setAllowedIds]);

  const handleSubmitScore = useCallback(async (username: string) => {
    if (state.phase !== 'summary') return;
    await submitScore({
      username,
      score: state.score,
      history: state.history,
      durationSeconds: state.durationSeconds,
    });
  }, [state]);

  if (state.phase === 'playing') {
    const targetConfidence = activeTermId
      ? (latestGuesses.find((g) => g.id === activeTermId)?.score ?? null)
      : null;
    return (
      <GameScreen
        term={state.term}
        startedAt={state.startedAt}
        score={state.score}
        termCount={state.history.length + 1}
        violationCount={state.history.filter((r) => r.outcome === 'violation').length}
        description={state.description}
        guesses={state.guesses}
        targetConfidence={targetConfidence}
        onDescriptionChange={(v) => dispatch({ type: 'setDescription', description: v })}
        onRequestGuesses={requestGuesses}
        onResolveTerm={handleResolveTerm}
        onEndSession={handleEndSession}
        onGoHome={handleAbort}
      />
    );
  }

  if (state.phase === 'summary') {
    return (
      <SummaryScreen
        history={state.history}
        score={state.score}
        durationSeconds={state.durationSeconds}
        onPlayAgain={() => dispatch({ type: 'reset' })}
        onGoHome={() => dispatch({ type: 'reset' })}
        onSubmitScore={handleSubmitScore}
      />
    );
  }

  return (
    <StartScreen
      selectedUnits={state.selectedUnits}
      onUnitsChange={(u) => dispatch({ type: 'setUnits', units: u })}
      onStart={handleStart}
      aiStatus={status}
      score={0}
      roundsPlayed={0}
    />
  );
}

function pickNextTerm(units: number[], usedIds: Set<string>) {
  // avoid immediate repeats within the same session
  for (let i = 0; i < 20; i++) {
    const t = getRandomTerm(units);
    if (!usedIds.has(t.id)) return t;
  }
  return getRandomTerm(units);
}

function useMemoUsedIds(state: ReturnType<typeof useGameState>[0]) {
  return useMemo(() => {
    const set = new Set<string>();
    if (state.phase === 'playing') {
      set.add(state.term.id);
      for (const r of state.history) set.add(r.term.id);
    }
    return { current: set };
  }, [state]);
}
