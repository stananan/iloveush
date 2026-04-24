'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { TERMS, getRandomTerm } from '@/data/terms';
import { useAI } from '@/lib/useAI';
import { useGameState } from '@/lib/useGameState';
import { ruleCheck } from '@/lib/ruleCheck';
import { StartScreen } from '@/components/StartScreen';
import { GameScreen } from '@/components/GameScreen';
import { RoundEndScreen } from '@/components/RoundEndScreen';
import { SummaryScreen } from '@/components/SummaryScreen';

export default function Home() {
  const [state, dispatch] = useGameState();
  const { status, latestGuesses, requestGuesses, setLatestGuesses } = useAI();

  const termById = useMemo(() => new Map(TERMS.map((t) => [t.id, t])), []);

  // pipe AI guesses into game state while playing, filtering out any term whose
  // name/alias is already mentioned in the description (the player is describing
  // around those — they can't be the answer).
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const description = state.description;
    const filtered = latestGuesses.filter((g) => {
      const term = termById.get(g.id);
      if (!term) return false;
      if (term.id === state.term.id) return true; // never filter out the real term
      return !ruleCheck(description, term);
    });
    dispatch({ type: 'setGuesses', guesses: filtered.slice(0, 3) });
  }, [latestGuesses, state, dispatch, termById]);

  const handleStart = useCallback(() => {
    if (status.phase !== 'ready') return;
    const term = getRandomTerm(state.phase !== 'summary' ? state.selectedUnits : []);
    setLatestGuesses([]);
    dispatch({ type: 'startRound', term });
  }, [status.phase, state, dispatch, setLatestGuesses]);

  const handleEndRound = useCallback(
    (outcome: 'win' | 'violation' | 'timeout', finalGuesses: typeof latestGuesses) => {
      dispatch({ type: 'endRound', outcome, finalGuesses });
    },
    [dispatch, latestGuesses]
  );

  if (state.phase === 'playing') {
    return (
      <GameScreen
        term={state.term}
        startedAt={state.startedAt}
        score={state.score}
        description={state.description}
        guesses={state.guesses}
        onDescriptionChange={(v) => dispatch({ type: 'setDescription', description: v })}
        onRequestGuesses={requestGuesses}
        onEndRound={handleEndRound}
      />
    );
  }

  if (state.phase === 'round-end') {
    return (
      <RoundEndScreen
        term={state.term}
        outcome={state.outcome}
        description={state.description}
        finalGuesses={state.finalGuesses}
        score={state.score}
        onNext={() => {
          dispatch({ type: 'nextRound' });
          // start next round immediately
          setTimeout(() => {
            const term = getRandomTerm(state.selectedUnits);
            setLatestGuesses([]);
            dispatch({ type: 'startRound', term });
          }, 0);
        }}
        onEndGame={() => dispatch({ type: 'endGame' })}
      />
    );
  }

  if (state.phase === 'summary') {
    return (
      <SummaryScreen
        history={state.history}
        score={state.score}
        onPlayAgain={() => dispatch({ type: 'reset' })}
      />
    );
  }

  return (
    <StartScreen
      selectedUnits={state.selectedUnits}
      onUnitsChange={(u) => dispatch({ type: 'setUnits', units: u })}
      onStart={handleStart}
      aiStatus={status}
      score={state.score}
      roundsPlayed={state.history.length}
    />
  );
}
