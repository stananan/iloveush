'use client';

import { UNITS } from '@/data/terms';
import clsx from 'clsx';

type Props = {
  selected: number[];
  onChange: (units: number[]) => void;
};

export function UnitFilter({ selected, onChange }: Props) {
  const isAll = selected.length === 0 || selected.length === UNITS.length;

  const toggle = (n: number) => {
    const effective = isAll ? UNITS.map((u) => u.number) : selected;
    const next = effective.includes(n)
      ? effective.filter((x) => x !== n)
      : [...effective, n].sort();
    onChange(next.length === UNITS.length ? [] : next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm uppercase tracking-wide text-ink/60">Units</span>
        <button
          className="text-xs text-accent hover:underline"
          onClick={() => onChange([])}
        >
          Select all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {UNITS.map((u) => {
          const active = isAll || selected.includes(u.number);
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
