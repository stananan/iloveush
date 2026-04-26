import { db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import type { RoundResult } from './useGameState';

export type LeaderboardEntry = {
  id: string;
  username: string;
  score: number;
  solvedCount: number;
  skippedCount: number;
  violationCount: number;
  durationSeconds: number;
  submittedAt: Date;
  history: { term: string; outcome: string; violationReason?: string }[];
};

export async function submitScore(data: {
  username: string;
  score: number;
  history: RoundResult[];
  durationSeconds: number;
}): Promise<void> {
  await addDoc(collection(db, 'leaderboard'), {
    username: data.username.trim().slice(0, 20),
    score: Math.max(0, Math.min(50, data.score)),
    solvedCount: data.history.filter((r) => r.outcome === 'win').length,
    skippedCount: data.history.filter((r) => r.outcome === 'skip').length,
    violationCount: data.history.filter((r) => r.outcome === 'violation').length,
    durationSeconds: Math.max(0, Math.min(180, data.durationSeconds)),
    submittedAt: serverTimestamp(),
    history: data.history.map((r) => ({
      term: r.term.term,
      outcome: r.outcome,
      ...(r.violationReason ? { violationReason: r.violationReason } : {}),
    })),
  });
}

export async function fetchLeaderboard(limitN = 100): Promise<LeaderboardEntry[]> {
  const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      username: d.username ?? 'Anonymous',
      score: d.score ?? 0,
      solvedCount: d.solvedCount ?? 0,
      skippedCount: d.skippedCount ?? 0,
      violationCount: d.violationCount ?? 0,
      durationSeconds: d.durationSeconds ?? 0,
      submittedAt: d.submittedAt?.toDate() ?? new Date(),
      history: d.history ?? [],
    };
  });
}
