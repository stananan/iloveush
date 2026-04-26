import type { Term } from '@/data/terms';

const STOPWORDS = new Set([
  'the', 'of', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'is', 'was', 'were', 'be',
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedTokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t && !STOPWORDS.has(t));
}

export function ruleCheck(description: string, term: Term): boolean {
  return ruleCheckDetail(description, term) !== null;
}

// Returns the term if the description contains any word from the term (exact or
// substring match with min length 4), or null if no rule was broken.
export function ruleCheckDetail(description: string, term: Term): string | null {
  const descTokens = normalizedTokens(description);
  if (descTokens.length === 0) return null;

  const termTokens = normalizedTokens(term.term);
  if (termTokens.length === 0) return null;

  for (const tt of termTokens) {
    for (const dt of descTokens) {
      if (tt === dt) return term.term;
      const [shorter, longer] = tt.length <= dt.length ? [tt, dt] : [dt, tt];
      if (shorter.length >= 4 && longer.includes(shorter)) return term.term;
    }
  }
  return null;
}
