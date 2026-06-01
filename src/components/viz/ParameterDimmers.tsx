import { useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * ParameterDimmers
 *
 * A single linear "neuron": three fixed inputs, each multiplied by a tunable
 * parameter (the dimmer). output = Σ inputᵢ · paramᵢ. The inputs are shown and
 * fixed; the user moves only the dimmers, toward a target, and watches the error
 * close. Dimmers are bipolar (−1 … +1) so a parameter can be negative — pulling
 * the output down — exactly like a real weight. There is no tap-position
 * mapping; − / + steps keep the level exact and work identically in RTL / touch.
 * Intuition for: parameters sit in the MIDDLE (input → params → output), and
 * training is finding the values that minimize the error.
 */

const INPUTS = [6, 4, 3];
const TARGET = 5.5;
const ERR_SCALE = 12; // scales the closeness meter
const SEGMENTS = 4; // notches per side → param ∈ [−1, 1] in 0.25 steps (big, easy jumps)

// dimmer state is stored as integer notches (−SEGMENTS..SEGMENTS) so steps stay exact
const INIT = [-2, 3, 1];
const SCATTERS = [
  [-3, 2, 4],
  [4, -2, 1],
  [-2, -2, 2],
  [3, 3, -2],
];

function output(notches: number[]): number {
  return notches.reduce((sum, n, i) => sum + (n / SEGMENTS) * INPUTS[i], 0);
}

const fmt = (v: number) => `${v < 0 ? '−' : '+'}${(Math.round(Math.abs(v) * 100) / 100).toString()}`;
const fnum = (v: number) => (Math.round(v * 100) / 100).toString();

export default function ParameterDimmers() {
  const [notches, setNotches] = useState<number[]>(INIT);
  const [scatterIdx, setScatterIdx] = useState(0);

  const out = output(notches);
  const error = Math.abs(out - TARGET);
  const t = Math.min(1, error / ERR_SCALE); // 0 = perfect, 1 = far
  const closeness = 1 - t;
  const solved = error < 0.15;
  const tone = `color-mix(in oklch, var(--color-accent) ${Math.round(t * 100)}%, var(--color-accent-3))`;

  const expr = INPUTS.map((x, i) => `${x}·(${fmt(notches[i] / SEGMENTS)})`).join(' + ');

  const bump = (i: number, delta: number) =>
    setNotches((prev) =>
      prev.map((n, j) => (j === i ? Math.max(-SEGMENTS, Math.min(SEGMENTS, n + delta)) : n))
    );

  const scatter = () => {
    setNotches(SCATTERS[scatterIdx % SCATTERS.length]);
    setScatterIdx((s) => s + 1);
  };

  const stepBtn =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--color-line)] bg-white text-xl leading-none text-[var(--color-ink)] transition hover:border-[var(--color-accent)] active:bg-[var(--color-line)] disabled:opacity-30';

  return (
    <DemoFrame
      title="קלט × פרמטרים → פלט"
      caption="הקלט קבוע (מימין). אתם מזיזים רק את הדימרים — הפרמטרים שמכפילים אותו. פרמטר חיובי (ירוק) ממלא שמאלה, שלילי (אדום) ממלא ימינה, והוא יכול לרדת מתחת לאפס. לחצו −/+ כדי לקרב את הפלט למטרה ולצמצם את ה־error. עכשיו דמיינו טריליון דימרים — זה בדיוק מה שאימון מכוון, לבד."
    >
      <div className="space-y-4" dir="rtl">
        <div className="space-y-3 rounded-lg bg-white p-3 sm:p-4">
          {notches.map((n, i) => {
            const param = n / SEGMENTS;
            return (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <div className="flex w-11 shrink-0 flex-col items-center sm:w-14">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--color-muted)]">
                    קלט
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                    {INPUTS[i]}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm text-[var(--color-muted)]">×</span>
                <button
                  type="button"
                  onClick={() => bump(i, -1)}
                  disabled={n === -SEGMENTS}
                  aria-label={`הנמך פרמטר ${i + 1}`}
                  className={stepBtn}
                >
                  −
                </button>
                <div
                  className="relative h-10 flex-1 overflow-hidden rounded-md bg-[var(--color-line)]"
                  aria-hidden="true"
                >
                  <div className="absolute left-1/2 top-0 z-10 h-full w-px -translate-x-1/2 bg-[var(--color-muted)] opacity-60" />
                  <div
                    className="absolute top-0 h-full transition-[left,width] duration-150 ease-out"
                    style={{
                      left: param >= 0 ? `${(0.5 - param / 2) * 100}%` : '50%',
                      width: `${(Math.abs(param) / 2) * 100}%`,
                      background: param >= 0 ? 'var(--color-accent-3)' : 'var(--color-accent)',
                    }}
                  />
                  <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-semibold leading-none text-[var(--color-accent-3)] opacity-80">
                    +
                  </span>
                  <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-semibold leading-none text-[var(--color-accent)] opacity-80">
                    −
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => bump(i, 1)}
                  disabled={n === SEGMENTS}
                  aria-label={`הגבר פרמטר ${i + 1}`}
                  className={stepBtn}
                >
                  +
                </button>
                <span
                  className="w-12 shrink-0 text-left font-mono text-xs font-semibold tabular-nums sm:w-14"
                  dir="ltr"
                  style={{ color: param >= 0 ? 'var(--color-accent-3)' : 'var(--color-accent)' }}
                >
                  {fmt(param)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg bg-white p-3" dir="ltr">
          <div className="mb-1 text-center text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
            output = Σ input × param
          </div>
          <div className="text-center font-mono text-[11px] leading-relaxed tabular-nums text-[var(--color-ink)] sm:text-sm">
            {expr} ={' '}
            <span className="font-semibold" style={{ color: tone }}>
              {fnum(out)}
            </span>
          </div>
        </div>

        <div className="flex items-stretch gap-3" dir="ltr">
          <div className="flex-1 rounded-lg bg-white p-3 text-center">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
              output
            </div>
            <div
              className="font-mono text-2xl font-semibold tabular-nums"
              style={{ color: tone }}
            >
              {fnum(out)}
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-white p-3 text-center">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
              target
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums text-[var(--color-ink)]">
              {TARGET.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs" dir="rtl">
            <span className="text-[var(--color-muted)]">כמה קרוב למטרה</span>
            <span className="font-mono tabular-nums" dir="ltr">
              error = {error.toFixed(2)}
            </span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-[var(--color-line)]">
            <div
              className="h-full transition-[width] duration-200 ease-out"
              style={{ width: `${closeness * 100}%`, background: tone }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" dir="rtl">
          <button
            type="button"
            onClick={scatter}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm transition hover:border-[var(--color-accent)]"
          >
            אתחול אקראי
          </button>
          {solved ? (
            <span className="text-sm font-medium text-[var(--color-accent-3)]">
              🎯 כיוונתם! עכשיו דמיינו טריליון דימרים בבת אחת — זה אימון.
            </span>
          ) : (
            <span className="text-sm text-[var(--color-muted)]">
              קרבו את הפלט ל־{TARGET.toFixed(1)} כדי לאפס את ה־error.
            </span>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}
