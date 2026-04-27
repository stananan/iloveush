'use client';

import { useState } from 'react';
import { TERMS, UNITS } from '@/data/terms';

export function TermsModal({ onClose }: { onClose: () => void }) {
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);

  const visibleTerms =
    selectedUnits.length === 0
      ? TERMS
      : TERMS.filter((t) => t.units.some((u) => selectedUnits.includes(u)));

  function toggleUnit(n: number) {
    setSelectedUnits((prev) =>
      prev.includes(n) ? prev.filter((u) => u !== n) : [...prev, n]
    );
  }

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
            <h2 className="font-serif text-2xl font-bold">All Terms</h2>
            <p className="text-xs text-ink/40 mt-0.5">{visibleTerms.length} term{visibleTerms.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-ink/20 px-4 py-1.5 text-sm hover:bg-ink/5"
          >
            Close
          </button>
        </div>

        {/* unit filter */}
        <div className="border-b border-ink/10 px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => {
              const active = selectedUnits.includes(u.number);
              return (
                <button
                  key={u.number}
                  onClick={() => toggleUnit(u.number)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-accent bg-accent text-white'
                      : 'border-ink/20 text-ink/60 hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  Unit {u.number}
                </button>
              );
            })}
            {selectedUnits.length > 0 && (
              <button
                onClick={() => setSelectedUnits([])}
                className="rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/40 hover:text-ink"
              >
                All
              </button>
            )}
          </div>
        </div>

        {/* term list */}
        <div className="flex-1 overflow-y-auto divide-y divide-ink/5 px-6">
          {visibleTerms.map((t) => (
            <div key={t.id} className="py-4">
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-semibold text-ink">{t.term}</span>
                {t.topic && (
                  <span className="text-xs text-ink/40">{t.topic}</span>
                )}
                <span className="ml-auto shrink-0 text-xs text-ink/30">
                  {t.units.map((u) => `U${u}`).join(', ')}
                </span>
              </div>
              {t.description ? (
                <p className="mt-1 text-sm text-ink/70 leading-relaxed">{t.description}</p>
              ) : (
                <p className="mt-1 text-sm text-ink/30 italic">No description.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
