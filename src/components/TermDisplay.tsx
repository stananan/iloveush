import type { Term } from '@/data/terms';

export function TermDisplay({ term }: { term: Term }) {
  return (
    <div className="text-center">
      <span className="text-sm uppercase tracking-widest text-ink/50">Your term</span>
      <h2 className="font-serif text-5xl md:text-6xl font-bold leading-tight">{term.term}</h2>
      {term.topic && (
        <span className="text-sm text-ink/50">{term.topic}</span>
      )}
    </div>
  );
}
