'use client';

import { useEffect, useState } from 'react';
import { fetchLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard';

const PAGE_SIZE = 10;

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchLeaderboard(100)
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="font-serif text-2xl font-bold">Leaderboard</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-ink/20 px-4 py-1.5 text-sm hover:bg-ink/5"
          >
            Close
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="py-12 text-center text-sm text-ink/40">Loading…</div>
          )}
          {error && (
            <div className="py-12 text-center text-sm text-accent">{error}</div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div className="py-12 text-center text-sm text-ink/40 italic">
              No scores yet. Be the first!
            </div>
          )}
          {!loading && !error && entries.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-ink/40">
                  <th className="pb-3 pr-3 font-medium">#</th>
                  <th className="pb-3 pr-3 font-medium">Username</th>
                  <th className="pb-3 pr-3 text-right font-medium">Score</th>
                  <th className="pb-3 pr-3 text-right font-medium">Solved</th>
                  <th className="pb-3 pr-3 text-right font-medium">Time</th>
                  <th className="pb-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {pageEntries.map((e, i) => {
                  const rank = page * PAGE_SIZE + i + 1;
                  return (
                    <tr key={e.id} className={rank <= 3 ? 'font-semibold' : ''}>
                      <td className="py-2.5 pr-3 text-ink/40">{rank}</td>
                      <td className="py-2.5 pr-3 truncate max-w-[140px]">{e.username}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{e.score}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-ink/60">{e.solvedCount}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-ink/60">{formatDuration(e.durationSeconds)}</td>
                      <td className="py-2.5 text-right text-ink/40">{formatDate(e.submittedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink/10 px-6 py-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-full border border-ink/20 px-4 py-1.5 text-sm hover:bg-ink/5 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-xs text-ink/40">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded-full border border-ink/20 px-4 py-1.5 text-sm hover:bg-ink/5 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
