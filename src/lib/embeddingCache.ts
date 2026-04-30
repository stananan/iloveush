import { get, set, del } from 'idb-keyval';

// Bump when the model or the term embedding text format changes, so clients
// re-embed instead of loading stale vectors from IndexedDB.
const CACHE_KEY = 'term-embeddings-v8-bge-small';

export type CachedEmbeddings = {
  ids: string[];
  dim: number;
  // Flattened Float32Array of length ids.length * dim
  data: Float32Array;
};

export async function loadEmbeddings(): Promise<CachedEmbeddings | null> {
  try {
    const v = await get<CachedEmbeddings>(CACHE_KEY);
    return v ?? null;
  } catch {
    return null;
  }
}

export async function saveEmbeddings(v: CachedEmbeddings): Promise<void> {
  await set(CACHE_KEY, v);
}

export async function clearEmbeddings(): Promise<void> {
  await del(CACHE_KEY);
}
