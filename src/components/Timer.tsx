'use client';

import clsx from 'clsx';

export function Timer({ secondsLeft }: { secondsLeft: number }) {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const warn = secondsLeft <= 30;
  return (
    <div
      className={clsx(
        'font-mono text-3xl tabular-nums font-bold',
        warn ? 'text-accent' : 'text-ink'
      )}
    >
      {m}:{s.toString().padStart(2, '0')}
    </div>
  );
}
