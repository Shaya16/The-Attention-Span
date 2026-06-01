import { useRef, useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * LossLandscape
 *
 * A 1D ball doing gradient descent on a simple bowl  L(x) = 0.5 * x^2.
 * Update rule:  x <- x - lr * dL/dx  =  x * (1 - lr).
 *   lr < 1   -> crawls toward the minimum
 *   lr = 1   -> one step straight to the bottom
 *   1<lr<2   -> overshoots, oscillates, still converges
 *   lr >= 2  -> diverges
 * The whole point of the "learning rate" section in one picture.
 */

const W = 480;
const H = 300;
const PAD_L = 30;
const PAD_R = 14;
const PAD_T = 16;
const PAD_B = 26;
const PW = W - PAD_L - PAD_R;
const PH = H - PAD_T - PAD_B;

const XMIN = -6;
const XMAX = 6;
const YMAX = 16;

const START = -5;
const MAX_STEPS = 44;

const loss = (x: number) => 0.5 * x * x;
const clampX = (x: number) => Math.max(XMIN, Math.min(XMAX, x));

const xPx = (x: number) => PAD_L + ((clampX(x) - XMIN) / (XMAX - XMIN)) * PW;
const lPx = (l: number) => PAD_T + (1 - Math.min(l, YMAX) / YMAX) * PH;

// loss curve, sampled once
const CURVE = (() => {
  let d = '';
  for (let i = 0; i <= 120; i++) {
    const x = XMIN + (i / 120) * (XMAX - XMIN);
    d += `${i === 0 ? 'M' : 'L'} ${xPx(x).toFixed(1)} ${lPx(loss(x)).toFixed(1)}`;
  }
  return d;
})();

export default function LossLandscape() {
  const [lr, setLr] = useState(0.5);
  const [trail, setTrail] = useState<number[]>([START]);
  const trailRef = useRef<number[]>([START]);
  const rafRef = useRef<number | null>(null);

  const setBoth = (next: number[]) => {
    trailRef.current = next;
    setTrail(next);
  };

  const stopAnim = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  // one gradient-descent step from the current position
  const doStep = (rate: number) => {
    const arr = trailRef.current;
    const x = arr[arr.length - 1];
    const nx = x - rate * x; // grad of 0.5 x^2 is x
    setBoth([...arr, nx]);
    return nx;
  };

  const run = () => {
    stopAnim();
    const rate = lr;
    let frame = 0;
    const tick = () => {
      frame++;
      if (frame % 6 === 0) {
        const nx = doStep(rate);
        if (
          trailRef.current.length > MAX_STEPS ||
          Math.abs(nx) > 6.2 ||
          Math.abs(nx) < 0.02
        ) {
          stopAnim();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const step = () => {
    stopAnim();
    doStep(lr);
  };

  const onLr = (v: number) => {
    stopAnim();
    setLr(v);
    setBoth([trailRef.current[0]]);
  };

  const reset = () => {
    stopAnim();
    setBoth([START]);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    stopAnim();
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const x = XMIN + ((px - PAD_L) / PW) * (XMAX - XMIN);
    setBoth([clampX(x)]);
  };

  const pts = trail.map((x) => [xPx(x), lPx(loss(x))] as [number, number]);
  const last = trail[trail.length - 1];
  const prev = trail.length > 1 ? trail[trail.length - 2] : last;
  const baseY = lPx(0);

  let status = 'לחצו "צעד" או "הרץ"';
  let statusColor = 'var(--color-muted)';
  if (trail.length > 1) {
    if (Math.abs(last) < 0.05) {
      status = 'התכנס למינימום ✓';
      statusColor = 'var(--color-accent-3)';
    } else if (Math.abs(last) > 6) {
      status = 'מתבדר! ה-learning rate גדול מדי';
      statusColor = 'var(--color-accent)';
    } else if (Math.abs(last) > Math.abs(prev) + 1e-9) {
      status = 'מדלג מעבר למינימום ומתנדנד';
      statusColor = 'var(--color-accent-4)';
    } else {
      status = 'יורד למינימום בהדרגה';
      statusColor = 'var(--color-accent-2)';
    }
  }

  return (
    <DemoFrame
      title="Loss landscape — גודל הצעד"
      caption='כדור שמתגלגל במורד ה-loss. כל צעד: x ← x − η·שיפוע. η קטן = זוחל. η≈1 = קפיצה ישר למינימום. η בין 1 ל-2 = מדלג ומתנדנד. η≥2 = מתבדר. לחצו על הגרף כדי לבחור נקודת התחלה.'
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3" dir="rtl">
          <label className="flex flex-1 min-w-[180px] items-center gap-2 text-sm">
            <span className="font-mono text-xs text-[var(--color-muted)]">η (lr)</span>
            <input
              type="range"
              min="0.05"
              max="2.2"
              step="0.05"
              value={lr}
              onChange={(e) => onLr(parseFloat(e.target.value))}
              className="h-9 flex-1 cursor-pointer accent-[var(--color-accent)]"
              aria-label="learning rate"
            />
            <span className="w-10 text-left font-mono text-xs tabular-nums" dir="ltr">
              {lr.toFixed(2)}
            </span>
          </label>
          <button
            onClick={step}
            className="rounded-md bg-[var(--color-ink)] px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            צעד
          </button>
          <button
            onClick={run}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm transition hover:border-[var(--color-accent)]"
          >
            הרץ
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm transition hover:border-[var(--color-accent)]"
          >
            איפוס
          </button>
        </div>

        <div
          className="cursor-crosshair rounded-lg bg-white p-2"
          dir="ltr"
          onClick={handleClick}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* baseline */}
            <line x1={PAD_L} y1={baseY} x2={W - PAD_R} y2={baseY} stroke="var(--color-line)" />
            {/* minimum marker */}
            <line x1={xPx(0)} y1={PAD_T} x2={xPx(0)} y2={baseY} stroke="var(--color-line)" strokeDasharray="2 4" />
            <text x={xPx(0)} y={H - 8} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="var(--color-muted)">min</text>

            {/* loss curve */}
            <path d={CURVE} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />

            {/* drop lines from each visited point */}
            {pts.map(([px, py], i) => (
              <line key={`d${i}`} x1={px} y1={py} x2={px} y2={baseY} stroke="var(--color-muted)" strokeWidth="0.75" opacity="0.25" />
            ))}

            {/* trajectory (the bounce) */}
            {pts.length > 1 && (
              <polyline
                points={pts.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1.4"
                opacity="0.7"
              />
            )}

            {/* visited points */}
            {pts.map(([px, py], i) => (
              <circle
                key={`p${i}`}
                cx={px}
                cy={py}
                r={i === 0 ? 5 : i === pts.length - 1 ? 6 : 2.5}
                fill={
                  i === 0
                    ? 'var(--color-accent)'
                    : i === pts.length - 1
                      ? 'var(--color-accent-3)'
                      : 'var(--color-ink)'
                }
              />
            ))}
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs" dir="rtl">
          <span className="font-medium" style={{ color: statusColor }}>
            {status}
          </span>
          <span className="font-mono tabular-nums text-[var(--color-muted)]" dir="ltr">
            step {trail.length - 1} · x = {last.toFixed(2)} · loss = {loss(last).toFixed(2)}
          </span>
        </div>
      </div>
    </DemoFrame>
  );
}
