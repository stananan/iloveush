'use client';

import { UNITS } from '@/data/terms';
import clsx from 'clsx';

type Props = {
  selected: number[];
  onChange: (units: number[]) => void;
};

export function UnitFilter({ selected, onChange }: Props) {
  const allSelected = selected.length === UNITS.length;
  const noneSelected = selected.length === 0;

  const toggle = (n: number) => {
    const next = selected.includes(n)
      ? selected.filter((x) => x !== n)
      : [...selected, n].sort((a, b) => a - b);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm tracking-wide text-ink/60">UNITS (Must select all in order to submit to the leaderboard)</span>
        <div className="flex gap-3">
          <button
            className="text-xs text-accent hover:underline disabled:opacity-40 disabled:no-underline"
            onClick={() => onChange(UNITS.map((u) => u.number))}
            disabled={allSelected}
          >
            Select all
          </button>
          <button
            className="text-xs text-accent hover:underline disabled:opacity-40 disabled:no-underline"
            onClick={() => onChange([])}
            disabled={noneSelected}
          >
            Deselect all
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {UNITS.map((u) => {
          const active = selected.includes(u.number);
          return (
            <button
              key={u.number}
              onClick={() => toggle(u.number)}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-sm transition',
                active
                  ? 'border-accent bg-accent text-white'
                  : 'border-ink/20 bg-white text-ink hover:border-ink/40'
              )}
              title={u.range}
            >
              <span className="font-medium">{u.label}</span>
              <span className="ml-2 text-xs opacity-70">{u.range}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
