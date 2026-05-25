export const TOKENS = [
  'Machine',
  'learning,',
  'explained',
  'before',
  'your',
  'context',
  'window',
  'runs out.',
] as const;

export type TokenIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const CANDIDATES: Record<number, readonly string[]> = {
  0: ['Deep', 'Transfer', 'Machine'],
  1: ['models,', 'systems,', 'learning,'],
  2: ['decoded', 'visualized', 'explained'],
  3: ['until', 'while', 'before'],
  4: ['the', 'my', 'your'],
  5: ['attention', 'memory', 'context'],
  6: ['span', 'limit', 'window'],
  7: ['fades.', 'expires.', 'runs out.'],
};

export const ATTENTION_PAIRS: Record<number, ReadonlyArray<{ target: number; weight: number }>> = {
  0: [{ target: 0, weight: 1.0 }],
  1: [{ target: 0, weight: 0.72 }, { target: 1, weight: 0.28 }],
  2: [{ target: 1, weight: 0.45 }, { target: 0, weight: 0.35 }, { target: 2, weight: 0.20 }],
  3: [{ target: 2, weight: 0.42 }, { target: 0, weight: 0.30 }, { target: 3, weight: 0.18 }, { target: 1, weight: 0.10 }],
  4: [{ target: 4, weight: 0.35 }, { target: 0, weight: 0.25 }, { target: 2, weight: 0.22 }, { target: 3, weight: 0.18 }],
  5: [{ target: 4, weight: 0.48 }, { target: 5, weight: 0.22 }, { target: 0, weight: 0.18 }, { target: 1, weight: 0.12 }],
  6: [{ target: 5, weight: 0.52 }, { target: 4, weight: 0.22 }, { target: 6, weight: 0.16 }, { target: 0, weight: 0.10 }],
  7: [{ target: 6, weight: 0.38 }, { target: 5, weight: 0.28 }, { target: 3, weight: 0.15 }, { target: 7, weight: 0.12 }, { target: 0, weight: 0.07 }],
};

export const ACCENT_INDICES: readonly number[] = [];
