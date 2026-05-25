import { useState } from 'react';
import DemoFrame from './DemoFrame';

interface Props {
  defaultInputs?: number[];
  showScaleControl?: boolean;
  title?: string;
  caption?: string;
}

const BAR_COLORS = [
  'var(--color-accent-2)',
  'var(--color-accent-3)',
  'var(--color-accent)',
  'oklch(0.55 0.10 60)',
  'oklch(0.55 0.10 300)',
];

function softmax(inputs: number[]): number[] {
  const max = Math.max(...inputs);
  const exps = inputs.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export default function Softmax({
  defaultInputs = [1.5, 2.0, 3.0],
  showScaleControl = false,
  title,
  caption,
}: Props) {
  const [inputs, setInputs] = useState<number[]>(defaultInputs);
  const [scale, setScale] = useState(1);

  const scaled = inputs.map((x) => x * scale);
  const probs = softmax(scaled);

  const topIdx = probs.indexOf(Math.max(...probs));
  const topProb = probs[topIdx];
  const sharpened = showScaleControl && topProb > 0.85;

  const effectiveTitle =
    title ?? (showScaleControl ? 'Softmax עם סקלה' : 'Softmax');
  const defaultCaption = showScaleControl
    ? 'גררו את הסקאלה למעלה. ראו איך softmax מתחדדת, פס אחד לוקח כמעט את כל המסה.'
    : 'גררו את הסליידרים. הפסים מראים את ההסתברויות שיוצאות (סכומן 1).';

  return (
    <DemoFrame title={effectiveTitle} caption={caption ?? defaultCaption}>
      <div className="space-y-4">
        <div className="space-y-3" dir="ltr">
          {inputs.map((val, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-10 shrink-0 font-mono text-sm text-[var(--color-muted)]">
                z<sub>{i}</sub>
              </span>
              <input
                type="range"
                min="-5"
                max="10"
                step="0.1"
                value={val}
                onChange={(e) => {
                  const next = [...inputs];
                  next[i] = parseFloat(e.target.value);
                  setInputs(next);
                }}
                className="h-11 flex-1 cursor-pointer accent-[var(--color-accent)]"
                aria-label={`Input ${i}`}
              />
              <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums">
                {val.toFixed(1)}
              </span>
            </div>
          ))}

          {showScaleControl && (
            <div className="space-y-2 border-t border-[var(--color-line)] pt-3">
              <div
                className="text-xs text-[var(--color-muted)]"
                dir="rtl"
              >
                מכפיל את כל הקלטים לפני שהם נכנסים ל-softmax.
              </div>
              <div className="flex items-center gap-3">
                <span className="w-14 shrink-0 font-mono text-sm text-[var(--color-muted)]">
                  scale
                </span>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="h-11 flex-1 cursor-pointer accent-[var(--color-accent)]"
                  aria-label="Scale factor"
                />
                <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums">
                  ×{scale.toFixed(1)}
                </span>
              </div>
              {scale !== 1 && (
                <div className="text-xs" dir="rtl">
                  <span className="text-[var(--color-muted)]">
                    קלט אחרי הכפלה:
                  </span>{' '}
                  <span
                    dir="ltr"
                    className="font-mono text-[var(--color-ink)]"
                  >
                    [{scaled.map((v) => v.toFixed(1)).join(', ')}]
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-lg bg-white p-3 sm:p-4" dir="ltr">
          {probs.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-10 shrink-0 font-mono text-xs text-[var(--color-muted)]">
                p<sub>{i}</sub>
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-[var(--color-line)]">
                <div
                  className="h-full transition-[width] duration-150 ease-out"
                  style={{
                    width: `${p * 100}%`,
                    background: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums">
                {(p * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {sharpened && (
          <div
            className="text-center text-sm text-[var(--color-muted)]"
            dir="rtl"
          >
            כמעט כל המסה התרכזה על{' '}
            <span className="font-mono font-bold text-[var(--color-ink)]">
              p<sub>{topIdx}</sub>
            </span>{' '}
            ({(topProb * 100).toFixed(0)}%).
          </div>
        )}
      </div>
    </DemoFrame>
  );
}
