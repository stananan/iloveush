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
  const descTokens = new Set(significantTokens(description));
  if (descTokens.size === 0) return false;

  const forbiddenStrings = [term.term, ...(term.aliases ?? [])];

  for (const forbidden of forbiddenStrings) {
    const tokens = significantTokens(forbidden);
    if (tokens.length === 0) continue;
    // all significant tokens must appear in the description
    const allPresent = tokens.every((t) => descTokens.has(t));
    if (allPresent) return true;
  }
  return false;
}
