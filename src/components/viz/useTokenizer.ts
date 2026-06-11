import { useEffect, useState } from 'react';

// Lazily-loaded cl100k_base encoder (GPT-4 / 100,277 token vocab).
// The vocab data (~0.7MB gzipped) is only fetched when a widget that calls
// this hook actually mounts, so it never weighs on the rest of the site.

type Encoder = {
  encode: (text: string) => number[];
  decode: (ids: number[]) => string;
};

let cached: Encoder | null = null;
let pending: Promise<Encoder> | null = null;

function loadEncoder(): Promise<Encoder> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = import('gpt-tokenizer/encoding/cl100k_base').then((m) => {
      cached = { encode: m.encode, decode: m.decode };
      return cached;
    });
  }
  return pending;
}

export interface TokenChip {
  id: number;
  /** Visible text of the token, or null when it is a raw partial-byte token. */
  text: string | null;
}

export function useTokenizer() {
  const [enc, setEnc] = useState<Encoder | null>(cached);

  useEffect(() => {
    if (cached) {
      setEnc(cached);
      return;
    }
    let alive = true;
    loadEncoder().then((e) => {
      if (alive) setEnc(e);
    });
    return () => {
      alive = false;
    };
  }, []);

  const ready = enc !== null;

  function count(text: string): number {
    return enc ? enc.encode(text).length : 0;
  }

  function tokenize(text: string): TokenChip[] {
    if (!enc) return [];
    return enc.encode(text).map((id) => {
      const decoded = enc.decode([id]);
      const clean = !decoded.includes('�');
      return { id, text: clean ? decoded : null };
    });
  }

  return { ready, count, tokenize };
}
