import type { Term } from '@/data/terms';

export function TermDisplay({ term }: { term: Term }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs uppercase tracking-widest text-ink/50">Your term</span>
      <h2 className="font-serif text-4xl md:text-5xl font-bold mt-1">{term.term}</h2>
      {term.topic && (
        <span className="text-xs text-ink/50 mt-1">{term.topic}</span>
      )}
    </div>
  );
}
