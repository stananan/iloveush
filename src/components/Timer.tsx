'use client';

import clsx from 'clsx';

export function Timer({ secondsLeft }: { secondsLeft: number }) {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const warn = secondsLeft <= 30;
  return (
    <div
      key={secondsLeft}
      className={clsx(
        'font-mono text-4xl tabular-nums font-bold',
        warn ? 'text-accent' : 'text-ink'
      )}
      style={{ animation: 'timerTick 0.2s ease both' }}
    >
      {m}:{s.toString().padStart(2, '0')}
    </div>
  );
}
