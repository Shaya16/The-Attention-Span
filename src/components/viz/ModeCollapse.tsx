import { useMemo, useRef, useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * ModeCollapse
 *
 * Distribution over candidate bug-description tokens. Each "training step"
 * applies a reward signal that favors the goblin token. KL penalty (beta)
 * pulls logits back toward the initial reference distribution.
 *
 * Simplified dynamics:
 *   logits[i] += lr * reward[i]              (reward signal)
 *   logits[i] += beta * (ref[i] - logits[i]) (KL pull-back toward reference)
 *
 * Goblin reward = +1.0; others = 0. lr fixed. beta is user-controlled.
 */

interface Token {
  label: string;
  initLogit: number;
  isGoblin?: boolean;
}

const TOKENS: Token[] = [
  { label: 'race condition', initLogit: 1.6 },
  { label: 'null deref', initLogit: 1.4 },
  { label: 'memory leak', initLogit: 1.3 },
  { label: 'off-by-one', initLogit: 1.2 },
  { label: 'logic bug', initLogit: 1.0 },
  { label: 'type mismatch', initLogit: 0.8 },
  { label: 'goblin', initLogit: -1.8, isGoblin: true },
  { label: 'wizard in state', initLogit: -2.4 },
];

const LR = 0.15;

function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}

function entropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

export default function ModeCollapse() {
  const refLogits = useMemo(() => TOKENS.map((t) => t.initLogit), []);
  const [logits, setLogits] = useState<number[]>(refLogits);
  const [steps, setSteps] = useState(0);
  const [beta, setBeta] = useState(0.02);
  const runRef = useRef<number | null>(null);

  const probs = softmax(logits);
  const goblinIdx = TOKENS.findIndex((t) => t.isGoblin);
  const maxIdx = probs.indexOf(Math.max(...probs));
  const h = entropy(probs);
  const hMax = Math.log2(TOKENS.length);

  const trainOnce = (curLogits: number[], curBeta: number) => {
    const next = curLogits.map((l, i) => {
      const reward = i === goblinIdx ? 1 : 0;
      const klPull = curBeta * (refLogits[i] - l);
      return l + LR * reward + klPull;
    });
    return next;
  };

  const stopRun = () => {
    if (runRef.current !== null) {
      cancelAnimationFrame(runRef.current);
      runRef.current = null;
    }
  };

  const step = () => {
    stopRun();
    setLogits((l) => trainOnce(l, beta));
    setSteps((s) => s + 1);
  };

  const run = (total: number) => {
    stopRun();
    let count = 0;
    const tick = () => {
      setLogits((l) => trainOnce(l, beta));
      setSteps((s) => s + 1);
      count++;
      if (count < total) {
        runRef.current = requestAnimationFrame(tick);
      } else {
        runRef.current = null;
      }
    };
    runRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    stopRun();
    setLogits(refLogits);
    setSteps(0);
  };

  return (
    <DemoFrame
      title="Mode collapse simulator"
      caption='לחצו "צעד" כדי להריץ צעד אימון אחד. כל צעד מעלה את הציון של "goblin". ה-β מושך את ההתפלגות חזרה לכיוון המקור. צפו איך כל המסה נופלת על מצב אחד.'
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2" dir="rtl">
          <button
            onClick={step}
            className="rounded-md bg-[var(--color-ink)] px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            צעד אחד
          </button>
          <button
            onClick={() => run(30)}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm font-medium transition hover:border-[var(--color-accent)]"
          >
            הרץ 30 צעדים
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm transition hover:border-[var(--color-accent)]"
          >
            איפוס
          </button>
          <span className="ms-auto font-mono text-xs text-[var(--color-muted)]">
            step {steps}
          </span>
        </div>

        <div className="space-y-1.5 rounded-lg bg-white p-3 sm:p-4" dir="ltr">
          {TOKENS.map((tok, i) => {
            const p = probs[i];
            const isTop = i === maxIdx && steps > 0;
            const isGob = tok.isGoblin;
            const barColor = isGob
              ? 'var(--color-accent)'
              : isTop
                ? 'var(--color-accent-3)'
                : 'var(--color-accent-2)';
            return (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <span
                  className={`w-28 sm:w-32 shrink-0 truncate font-mono text-[11px] sm:text-xs ${
                    isGob
                      ? 'font-semibold text-[var(--color-accent)]'
                      : 'text-[var(--color-muted)]'
                  }`}
                  title={tok.label}
                >
                  {tok.label}
                </span>
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-[var(--color-line)]">
                  <div
                    className="h-full transition-[width] duration-150 ease-out"
                    style={{
                      width: `${Math.max(p * 100, 0.4)}%`,
                      background: barColor,
                      opacity: isGob ? 1 : 0.7,
                    }}
                  />
                </div>
                <span className="w-12 sm:w-14 shrink-0 text-right font-mono text-[11px] sm:text-xs tabular-nums">
                  {(p * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-[var(--color-line)] pt-3">
          <div className="flex items-center gap-3">
            <span className="w-14 shrink-0 font-mono text-xs text-[var(--color-muted)]">
              β (KL)
            </span>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.005"
              value={beta}
              onChange={(e) => setBeta(parseFloat(e.target.value))}
              className="h-11 flex-1 cursor-pointer accent-[var(--color-accent)]"
              aria-label="KL penalty beta"
            />
            <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums">
              {beta.toFixed(3)}
            </span>
          </div>
          <div
            className="text-[11px] text-[var(--color-muted)] leading-relaxed"
            dir="rtl"
          >
            β גבוה = ההתפלגות נשארת קרובה למקורית. β נמוך מדי = הכל מתמוטט על goblin.
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-2 border-t border-[var(--color-line)] pt-3 text-xs"
          dir="rtl"
        >
          <div>
            <span className="text-[var(--color-muted)]">אנטרופיה: </span>
            <span className="font-mono font-medium" dir="ltr">
              {h.toFixed(2)} / {hMax.toFixed(2)} bits
            </span>
          </div>
          <div className="text-end">
            <span className="text-[var(--color-muted)]">top: </span>
            <span
              className={`font-mono font-medium ${
                TOKENS[maxIdx]?.isGoblin
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-ink)]'
              }`}
              dir="ltr"
            >
              {TOKENS[maxIdx]?.label} ({(probs[maxIdx] * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
