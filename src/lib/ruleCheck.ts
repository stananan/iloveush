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

function stem(token: string): string {
  // crude suffix stripping — good enough for USH vocab
  for (const suf of ['tion', 'sion', 'ing', 'ed', 's']) {
    if (token.length > suf.length + 2 && token.endsWith(suf)) {
      return token.slice(0, -suf.length);
    }
  }
  return token;
}

function significantTokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem);
}

export function ruleCheck(description: string, term: Term): boolean {
  return ruleCheckDetail(description, term) !== null;
}

// Returns the forbidden phrase (term or alias) the description matches,
// or null if no rule was broken.
export function ruleCheckDetail(description: string, term: Term): string | null {
  const descTokens = new Set(significantTokens(description));
  if (descTokens.size === 0) return null;

  const tokens = significantTokens(term.term);
  if (tokens.length === 0) return null;
  if (tokens.every((t) => descTokens.has(t))) return term.term;
  return null;
}
