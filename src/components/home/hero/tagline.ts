export const TOKENS = [
  'Machine',
  'learning,',
  'explained',
  'before',
  'your',
  'context',
  'window',
  'runs',
  'out.',
] as const;

export type TokenIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Per-token alternates shown during the flicker. The LAST entry in each array
 * is the word that lands in the final sentence — keep it in sync with TOKENS.
 */
export const CANDIDATES: Record<number, readonly string[]> = {
  0: ['Statistical', 'Deep', 'Machine'],
  1: ['thinking,', 'training,', 'learning,'],
  2: ['translated', 'decoded', 'explained'],
  3: ['until', 'after', 'before'],
  4: ['the', 'my', 'your'],
  5: ['memory', 'attention', 'context'],
  6: ['buffer', 'span', 'window'],
  7: ['gives', 'gets', 'runs'],
  8: ['dry.', 'low.', 'out.'],
};

/**
 * For each token index i, the list of previous-token indices it "attends to"
 * with a weight in [0,1]. Aesthetic, not derived from a real model.
 */
export const ATTENTION_PAIRS: Record<number, ReadonlyArray<{ target: number; weight: number }>> = {
  0: [],
  1: [{ target: 0, weight: 0.9 }],
  2: [{ target: 0, weight: 0.5 }, { target: 1, weight: 0.7 }],
  3: [{ target: 2, weight: 0.6 }],
  4: [{ target: 3, weight: 0.4 }],
  5: [{ target: 0, weight: 0.6 }, { target: 4, weight: 0.5 }],
  6: [{ target: 5, weight: 0.9 }],
  7: [{ target: 6, weight: 0.7 }, { target: 5, weight: 0.4 }],
  8: [{ target: 7, weight: 0.8 }, { target: 6, weight: 0.5 }],
};

/** Token indices that render in var(--color-accent) instead of inherit. */
export const ACCENT_INDICES: readonly number[] = [5]; // 'context'
