'use client';

import { useReducer } from 'react';
import type { Term } from '@/data/terms';
import type { Guess } from './useAI';

export const ROUND_SECONDS = 120;
export const WIN_THRESHOLD = 0.6;

export type RoundOutcome = 'win' | 'violation' | 'skip';

export type RoundResult = {
  term: Term;
  outcome: RoundOutcome;
  description: string;
  finalGuesses: Guess[];
  scoreDelta: number;
  violationReason?: string;
};

export type GameState =
  | { phase: 'idle'; selectedUnits: number[] }
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
  | { phase: 'summary'; history: RoundResult[]; score: number; selectedUnits: number[] };

export type Action =
  | { type: 'setUnits'; units: number[] }
  | { type: 'startSession'; term: Term }
  | { type: 'setDescription'; description: string }
  | { type: 'setGuesses'; guesses: Guess[] }
  | {
      type: 'resolveTerm';
      outcome: RoundOutcome;
      finalGuesses: Guess[];
      nextTerm: Term;
      violationReason?: string;
    }
  | { type: 'endSession' }
  | { type: 'abort' }
  | { type: 'reset' };

export const initialState: GameState = {
  phase: 'idle',
  selectedUnits: [],
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'setUnits':
      if (state.phase === 'idle' || state.phase === 'summary') {
        return { ...state, selectedUnits: action.units };
      }
      return state;

    case 'startSession':
      return {
        phase: 'playing',
        term: action.term,
        startedAt: Date.now(),
        description: '',
        guesses: [],
        selectedUnits: state.selectedUnits,
        history: [],
        score: 0,
      };

    case 'setDescription':
      if (state.phase !== 'playing') return state;
      return { ...state, description: action.description };

    case 'setGuesses':
      if (state.phase !== 'playing') return state;
      return { ...state, guesses: action.guesses };

    case 'resolveTerm': {
      if (state.phase !== 'playing') return state;
      const delta = action.outcome === 'win' ? 1 : 0;
      const result: RoundResult = {
        term: state.term,
        outcome: action.outcome,
        description: state.description,
        finalGuesses: action.finalGuesses,
        scoreDelta: delta,
        violationReason: action.violationReason,
      };
      return {
        ...state,
        term: action.nextTerm,
        description: '',
        guesses: [],
        history: [...state.history, result],
        score: state.score + delta,
      };
    }

    case 'endSession': {
      if (state.phase !== 'playing') return state;
      return {
        phase: 'summary',
        history: state.history,
        score: state.score,
        selectedUnits: state.selectedUnits,
      };
    }

    case 'abort':
      if (state.phase !== 'playing') return state;
      return { phase: 'idle', selectedUnits: state.selectedUnits };

    case 'reset':
      return { phase: 'idle', selectedUnits: state.selectedUnits };
  }
}

export function useGameState() {
  return useReducer(reducer, initialState);
}
