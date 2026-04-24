import { get, set, del } from 'idb-keyval';

const CACHE_KEY = 'term-embeddings-v2';

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
