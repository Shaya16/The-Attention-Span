import { useMemo, useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * AttentionDemo
 *
 * Visualizes self-attention weights between tokens. Hovering a token
 * fans out lines to other tokens with thickness proportional to weight.
 *
 * The weights here are *illustrative* — generated from a simple heuristic
 * (cosine of position + word-similarity bumps) so the demo is self-contained
 * with no model load. For real attention, swap `computeWeights` with weights
 * exported from a real model (or load an ONNX model with onnxruntime-web).
 */

interface Props {
  defaultSentence?: string;
}

function tokenize(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

// Toy "attention" — a stand-in for a real model.
// Replace with real weights when you want.
function computeWeights(tokens: string[]): number[][] {
  const n = tokens.length;
  const raw: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      // bias: nearby tokens, plus shared-letter similarity
      const dist = Math.abs(i - j);
      const sim =
        tokens[i].toLowerCase() === tokens[j].toLowerCase()
          ? 2.5
          : tokens[i][0]?.toLowerCase() === tokens[j][0]?.toLowerCase()
            ? 0.8
            : 0;
      const score = Math.exp(-dist * 0.6 + sim) + (i === j ? 0.3 : 0);
      row.push(score);
    }
    // softmax
    const max = Math.max(...row);
    const exps = row.map((s) => Math.exp(s - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    raw.push(exps.map((e) => e / sum));
  }
  return raw;
}

export default function AttentionDemo({
  defaultSentence = 'the cat sat on the mat',
}: Props) {
  const [sentence, setSentence] = useState(defaultSentence);
  const [hover, setHover] = useState<number | null>(null);

  const tokens = useMemo(() => tokenize(sentence), [sentence]);
  const weights = useMemo(() => computeWeights(tokens), [tokens]);

  const active = hover ?? 0;
  const row = weights[active] ?? [];

  return (
    <DemoFrame
      title="Attention demo"
      caption="Hover a token to see what it attends to. Edit the sentence to explore."
    >
      <div className="space-y-4">
        <input
          type="text"
          value={sentence}
          onChange={(e) => {
            setSentence(e.target.value);
            setHover(null);
          }}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-mono text-sm focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Type a sentence..."
        />

        <div className="relative min-h-24 rounded-lg bg-white p-6">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* lines drawn below the chips */}
          </svg>

          <div className="relative flex flex-wrap items-center gap-2">
            {tokens.map((tok, i) => {
              const w = row[i] ?? 0;
              const isActive = hover === i;
              const alpha = hover === null ? 0 : w;
              return (
                <button
                  key={`${tok}-${i}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  className="relative rounded-md border px-3 py-1.5 font-mono text-sm transition-all"
                  style={{
                    borderColor: isActive
                      ? 'var(--color-accent)'
                      : 'var(--color-line)',
                    background:
                      hover !== null && !isActive
                        ? `color-mix(in oklch, var(--color-accent) ${alpha * 70}%, white)`
                        : isActive
                          ? 'var(--color-accent)'
                          : 'white',
                    color: isActive ? 'white' : 'var(--color-ink)',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {tok}
                  {hover !== null && !isActive && (
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px] text-[var(--color-muted)]">
                      {w.toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-[var(--color-muted)]">
          {hover === null
            ? 'Hover any token above.'
            : <>Token <span className="font-mono">"{tokens[hover]}"</span> attends most to <span className="font-mono">"{tokens[row.indexOf(Math.max(...row))]}"</span>.</>
          }
        </div>
      </div>
    </DemoFrame>
  );
}
