'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TERMS } from '@/data/terms';
import { loadEmbeddings, saveEmbeddings } from './embeddingCache';

export type Guess = { id: string; score: number };

export type AIStatus =
  | { phase: 'idle' }
  | { phase: 'loading-model'; progress: number }
  | { phase: 'embedding-terms'; done: number; total: number }
  | { phase: 'ready' }
  | { phase: 'error'; message: string };

export function useAI() {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<AIStatus>({ phase: 'idle' });
  const [latestGuesses, setLatestGuesses] = useState<Guess[]>([]);
  const requestIdRef = useRef(0);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = async (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'modelProgress') {
        setStatus({ phase: 'loading-model', progress: msg.progress });
      } else if (msg.type === 'ready') {
        // model loaded; decide whether to hydrate from cache or embed terms
        const cached = await loadEmbeddings();
        if (cached && cached.ids.length === TERMS.length) {
          worker.postMessage({
            type: 'loadCachedEmbeddings',
            ids: cached.ids,
            dim: cached.dim,
            data: cached.data,
          });
          setStatus({ phase: 'ready' });
        } else {
          setStatus({ phase: 'embedding-terms', done: 0, total: TERMS.length });
          worker.postMessage({
            type: 'embedTerms',
            terms: TERMS.map((t) => {
              // Richer embedding text: term + topic + aliases. This spreads terms
              // like "Social Security Act" and "FDR" further apart in vector space
              // because their supporting context differs.
              const parts = [t.term];
              if (t.topic) parts.push(t.topic);
              if (t.aliases && t.aliases.length) parts.push(t.aliases.join(', '));
              return { id: t.id, text: parts.join(' — ') };
            }),
          });
        }
      } else if (msg.type === 'termsProgress') {
        setStatus({ phase: 'embedding-terms', done: msg.done, total: msg.total });
      } else if (msg.type === 'termsEmbedded') {
        await saveEmbeddings({ ids: msg.ids, dim: msg.dim, data: msg.data });
        setStatus({ phase: 'ready' });
      } else if (msg.type === 'guesses') {
        if (msg.requestId >= latestRequestRef.current) {
          latestRequestRef.current = msg.requestId;
          setLatestGuesses(msg.results);
        }
      } else if (msg.type === 'error') {
        setStatus({ phase: 'error', message: msg.message });
      }
    };

    setStatus({ phase: 'loading-model', progress: 0 });
    worker.postMessage({ type: 'init' });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const requestGuesses = useCallback((text: string) => {
    const worker = workerRef.current;
    if (!worker) return;
    const requestId = ++requestIdRef.current;
    worker.postMessage({ type: 'embed', text, requestId });
  }, []);

  return { status, latestGuesses, requestGuesses, setLatestGuesses };
}
