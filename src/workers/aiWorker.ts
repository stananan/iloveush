/// <reference lib="webworker" />
import { pipeline, env, type FeatureExtractionPipeline } from '@xenova/transformers';

// Don't look for local models; always fetch from the HuggingFace CDN.
env.allowLocalModels = false;

type TermInput = { id: string; text: string };

type InMsg =
  | { type: 'init' }
  | { type: 'embedTerms'; terms: TermInput[] }
  | { type: 'loadCachedEmbeddings'; ids: string[]; dim: number; data: Float32Array }
  | { type: 'setAllowedIds'; ids: string[] | null }
  | { type: 'embed'; text: string; requestId: number };

type OutMsg =
  | { type: 'ready' }
  | { type: 'modelProgress'; progress: number }
  | { type: 'termsProgress'; done: number; total: number }
  | { type: 'termsEmbedded'; ids: string[]; dim: number; data: Float32Array }
  | { type: 'guesses'; requestId: number; results: { id: string; score: number }[] }
  | { type: 'error'; message: string };

let extractor: FeatureExtractionPipeline | null = null;
let termIds: string[] = [];
let termDim = 0;
let termMatrix: Float32Array | null = null; // length = termIds.length * termDim
let allowedIdxSet: Set<number> | null = null; // if set, only these term indices are scored

const post = (m: OutMsg) => (self as unknown as Worker).postMessage(m);

async function ensureModel() {
  if (extractor) return;
  extractor = (await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
    progress_callback: (p: { status: string; progress?: number }) => {
      if (typeof p.progress === 'number') {
        post({ type: 'modelProgress', progress: p.progress / 100 });
      }
    },
  })) as FeatureExtractionPipeline;
}

async function embedOne(text: string): Promise<Float32Array> {
  if (!extractor) throw new Error('model not loaded');
  const out = await extractor(text, { pooling: 'mean', normalize: true });
  // out.data is a Float32Array of length = dim
  return out.data as Float32Array;
}

async function embedTerms(terms: TermInput[]) {
  await ensureModel();
  const ids: string[] = [];
  let dim = 0;
  let flat: Float32Array | null = null;
  for (let i = 0; i < terms.length; i++) {
    const { id, text } = terms[i];
    const v = await embedOne(text);
    if (i === 0) {
      dim = v.length;
      flat = new Float32Array(terms.length * dim);
    }
    flat!.set(v, i * dim);
    ids.push(id);
    if ((i + 1) % 16 === 0 || i === terms.length - 1) {
      post({ type: 'termsProgress', done: i + 1, total: terms.length });
    }
  }
  termIds = ids;
  termDim = dim;
  termMatrix = flat;
  post({ type: 'termsEmbedded', ids, dim, data: flat! });
}

function cosineAgainstMatrix(q: Float32Array): Float32Array {
  // Both q and stored rows are L2-normalized → cosine = dot product.
  const n = termIds.length;
  const scores = new Float32Array(n);
  if (!termMatrix) return scores;
  const dim = termDim;
  for (let i = 0; i < n; i++) {
    let s = 0;
    const base = i * dim;
    for (let k = 0; k < dim; k++) {
      s += termMatrix[base + k] * q[k];
    }
    scores[i] = s;
  }
  return scores;
}

async function handleEmbed(text: string, requestId: number) {
  await ensureModel();
  if (!text.trim() || !termMatrix) {
    post({ type: 'guesses', requestId, results: [] });
    return;
  }
  const q = await embedOne(text);
  const scores = cosineAgainstMatrix(q);
  // top-N (wider than 3 so the client can filter out terms the user already mentioned)
  const TOP_N = 8;
  const top: { id: string; score: number }[] = [];
  for (let i = 0; i < scores.length; i++) {
    if (allowedIdxSet && !allowedIdxSet.has(i)) continue;
    const s = scores[i];
    if (top.length < TOP_N) {
      top.push({ id: termIds[i], score: s });
      top.sort((a, b) => b.score - a.score);
    } else if (s > top[TOP_N - 1].score) {
      top[TOP_N - 1] = { id: termIds[i], score: s };
      top.sort((a, b) => b.score - a.score);
    }
  }
  post({ type: 'guesses', requestId, results: top });
}

function setAllowedIds(ids: string[] | null) {
  if (!ids) {
    allowedIdxSet = null;
    return;
  }
  const allowed = new Set(ids);
  const idx = new Set<number>();
  for (let i = 0; i < termIds.length; i++) {
    if (allowed.has(termIds[i])) idx.add(i);
  }
  allowedIdxSet = idx;
}

self.addEventListener('message', async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  try {
    if (msg.type === 'init') {
      await ensureModel();
      post({ type: 'ready' });
    } else if (msg.type === 'embedTerms') {
      await embedTerms(msg.terms);
    } else if (msg.type === 'loadCachedEmbeddings') {
      termIds = msg.ids;
      termDim = msg.dim;
      termMatrix = msg.data;
    } else if (msg.type === 'setAllowedIds') {
      setAllowedIds(msg.ids);
    } else if (msg.type === 'embed') {
      await handleEmbed(msg.text, msg.requestId);
    }
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
});
