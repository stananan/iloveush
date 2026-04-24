'use client';

import { useReducer } from 'react';
import type { Term } from '@/data/terms';
import type { Guess } from './useAI';

export const ROUND_SECONDS = 120;
export const WIN_THRESHOLD = 0.6;

export type RoundOutcome = 'win' | 'violation' | 'timeout';

export type RoundResult = {
  term: Term;
  outcome: RoundOutcome;
  description: string;
  finalGuesses: Guess[];
  scoreDelta: number;
};

export type GameState =
  | { phase: 'idle'; selectedUnits: number[]; history: RoundResult[]; score: number }
  | {
      phase: 'playing';
      term: Term;
      startedAt: number;
      description: string;
      guesses: Guess[];
      selectedUnits: number[];
      history: RoundResult[];
      score: number;
    }
  | {
      phase: 'round-end';
      term: Term;
      outcome: RoundOutcome;
      finalGuesses: Guess[];
      description: string;
      selectedUnits: number[];
      history: RoundResult[];
      score: number;
    }
  | { phase: 'summary'; history: RoundResult[]; score: number; selectedUnits: number[] };

export type Action =
  | { type: 'setUnits'; units: number[] }
  | { type: 'startRound'; term: Term }
  | { type: 'setDescription'; description: string }
  | { type: 'setGuesses'; guesses: Guess[] }
  | { type: 'endRound'; outcome: RoundOutcome; finalGuesses: Guess[] }
  | { type: 'nextRound' }
  | { type: 'endGame' }
  | { type: 'reset' };

export const initialState: GameState = {
  phase: 'idle',
  selectedUnits: [],
  history: [],
  score: 0,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'setUnits':
      if (state.phase === 'idle' || state.phase === 'round-end' || state.phase === 'summary') {
        return { ...state, selectedUnits: action.units };
      }
      return state;

    case 'startRound':
      return {
        phase: 'playing',
        term: action.term,
        startedAt: Date.now(),
        description: '',
        guesses: [],
        selectedUnits: state.selectedUnits,
        history: state.history,
        score: state.score,
      };

    case 'setDescription':
      if (state.phase !== 'playing') return state;
      return { ...state, description: action.description };

    case 'setGuesses':
      if (state.phase !== 'playing') return state;
      return { ...state, guesses: action.guesses };

    case 'endRound': {
      if (state.phase !== 'playing') return state;
      const delta = action.outcome === 'win' ? 1 : 0;
      const result: RoundResult = {
        term: state.term,
        outcome: action.outcome,
        description: state.description,
        finalGuesses: action.finalGuesses,
        scoreDelta: delta,
      };
      return {
        phase: 'round-end',
        term: state.term,
        outcome: action.outcome,
        finalGuesses: action.finalGuesses,
        description: state.description,
        selectedUnits: state.selectedUnits,
        history: [...state.history, result],
        score: state.score + delta,
      };
    }

    case 'nextRound':
      if (state.phase !== 'round-end') return state;
      return {
        phase: 'idle',
        selectedUnits: state.selectedUnits,
        history: state.history,
        score: state.score,
      };

    case 'endGame':
      return {
        phase: 'summary',
        history: state.phase === 'idle' || state.phase === 'playing' || state.phase === 'round-end' || state.phase === 'summary' ? state.history : [],
        score: state.phase === 'idle' || state.phase === 'playing' || state.phase === 'round-end' || state.phase === 'summary' ? state.score : 0,
        selectedUnits: state.selectedUnits,
      };

    case 'reset':
      return { ...initialState, selectedUnits: state.selectedUnits };
  }
}

export function useGameState() {
  return useReducer(reducer, initialState);
}
