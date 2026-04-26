'use client';

import React, { useEffect, useState } from 'react';
import { fetchLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard';

const PAGE_SIZE = 10;

function formatTimestamp(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const OUTCOME_BADGE: Record<string, string> = {
  win: '✓',
  violation: '✗',
  skip: '→',
};

const OUTCOME_LABEL: Record<string, string> = {
  win: 'Win',
  violation: 'Rule Violation',
  skip: 'Skipped',
};

export function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard(100)
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

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
          <div>
            <h2 className="font-serif text-2xl font-bold">Leaderboard</h2>
            <p className="text-xs text-ink/40 mt-0.5">All 8 units required to submit</p>
          </div>
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
                  <th className="pb-3 text-right font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {pageEntries.map((e, i) => {
                  const rank = page * PAGE_SIZE + i + 1;
                  const isExpanded = expandedId === e.id;
                  return (
                    <React.Fragment key={e.id}>
                      <tr
                        onClick={() => toggleExpand(e.id)}
                        className={`cursor-pointer hover:bg-ink/[0.03] transition-colors ${rank <= 3 ? 'font-semibold' : ''}`}
                      >
                        <td className="py-2.5 pr-3 text-ink/40">{rank}</td>
                        <td className="py-2.5 pr-3 truncate max-w-[140px]">{e.username}</td>
                        <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{e.score}</td>
                        <td className="py-2.5 text-right text-ink/40">{formatTimestamp(e.submittedAt)}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${e.id}-history`}>
                          <td colSpan={4} className="pb-3 pt-1 px-1">
                            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-3">
                              {e.history.length === 0 ? (
                                <p className="text-xs italic text-ink/40">No history recorded.</p>
                              ) : (
                                <ol className="divide-y divide-ink/5">
                                  {e.history.map((r, idx) => (
                                    <li key={idx} className="flex items-baseline justify-between gap-3 py-2 text-xs">
                                      <span className="font-serif font-semibold">
                                        {idx + 1}. {r.term}
                                      </span>
                                      <span
                                        className={`flex shrink-0 items-center gap-1 font-medium ${
                                          r.outcome === 'win'
                                            ? 'text-green-700'
                                            : r.outcome === 'violation'
                                              ? 'text-accent'
                                              : 'text-ink/50'
                                        }`}
                                      >
                                        {OUTCOME_BADGE[r.outcome] ?? '?'} {OUTCOME_LABEL[r.outcome] ?? r.outcome}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
