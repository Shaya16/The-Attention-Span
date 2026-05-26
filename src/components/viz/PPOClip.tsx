import { useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * PPOClip
 *
 * Visualizes the PPO clipped surrogate objective:
 *   L = min( r * A,  clip(r, 1-eps, 1+eps) * A )
 *
 * x-axis: probability ratio r in [0, 2.5]
 * y-axis: surrogate value
 *
 * For A > 0 (advantage positive), the clip caps the upside at r = 1+eps.
 * For A < 0, the clip caps the downside at r = 1-eps.
 * Either way, the optimizer can't take a "big step" in the rewarded direction.
 */

const W = 480;
const H = 280;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 30;

const R_MIN = 0;
const R_MAX = 2.5;
const Y_HALF = 2.5; // y axis from -Y_HALF to +Y_HALF

function xToPx(r: number): number {
  return PAD_L + ((r - R_MIN) / (R_MAX - R_MIN)) * (W - PAD_L - PAD_R);
}
function yToPx(y: number): number {
  return PAD_T + ((Y_HALF - y) / (2 * Y_HALF)) * (H - PAD_T - PAD_B);
}

function clip(r: number, eps: number): number {
  return Math.max(1 - eps, Math.min(1 + eps, r));
}

function surrogate(r: number, A: number, eps: number): number {
  const a = r * A;
  const b = clip(r, eps) * A;
  return Math.min(a, b);
}

function unclipped(r: number, A: number): number {
  return r * A;
}

function buildPath(fn: (r: number) => number, samples = 200): string {
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const r = R_MIN + (i / samples) * (R_MAX - R_MIN);
    const y = fn(r);
    const px = xToPx(r);
    const py = yToPx(Math.max(-Y_HALF, Math.min(Y_HALF, y)));
    d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
  }
  return d;
}

export default function PPOClip() {
  const [advantageSign, setAdvantageSign] = useState<'pos' | 'neg'>('pos');
  const [eps, setEps] = useState(0.2);

  const A = advantageSign === 'pos' ? 1 : -1;

  const surrogatePath = buildPath((r) => surrogate(r, A, eps));
  const unclippedPath = buildPath((r) => unclipped(r, A));

  const xLeft = xToPx(1 - eps);
  const xRight = xToPx(1 + eps);
  const xOne = xToPx(1);
  const y0 = yToPx(0);

  return (
    <DemoFrame
      title="PPO clipped objective"
      caption='זה ה־"min ו־clip" מהנוסחה. גררו את ε ושנו את סימן ה־advantage כדי לראות איך הקליפ משטח את הגרף בדיוק בכיוון שהאופטימייזר רוצה ללכת אליו יותר מדי.'
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3" dir="rtl">
          <div className="flex rounded-lg border border-[var(--color-line)] bg-white p-0.5">
            {(['pos', 'neg'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setAdvantageSign(s)}
                className="rounded-md px-3 py-1 font-mono text-xs transition"
                style={{
                  background:
                    advantageSign === s ? 'var(--color-ink)' : 'transparent',
                  color:
                    advantageSign === s ? 'white' : 'var(--color-muted)',
                }}
              >
                {s === 'pos' ? 'A > 0' : 'A < 0'}
              </button>
            ))}
          </div>
          <label className="flex flex-1 min-w-[180px] items-center gap-2 text-xs">
            <span className="font-mono text-[var(--color-muted)]">ε</span>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={eps}
              onChange={(e) => setEps(parseFloat(e.target.value))}
              className="h-9 flex-1 cursor-pointer accent-[var(--color-accent)]"
              aria-label="Clip epsilon"
            />
            <span className="w-10 text-right font-mono tabular-nums">
              {eps.toFixed(2)}
            </span>
          </label>
        </div>

        <div className="rounded-lg bg-white p-2 sm:p-3" dir="ltr">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect
              x={xLeft}
              y={PAD_T}
              width={xRight - xLeft}
              height={H - PAD_T - PAD_B}
              fill="var(--color-accent)"
              opacity="0.08"
            />
            <line
              x1={PAD_L}
              y1={y0}
              x2={W - PAD_R}
              y2={y0}
              stroke="var(--color-line)"
            />
            <line
              x1={xOne}
              y1={PAD_T}
              x2={xOne}
              y2={H - PAD_B}
              stroke="var(--color-line)"
              strokeDasharray="3 4"
            />
            <line
              x1={xLeft}
              y1={PAD_T}
              x2={xLeft}
              y2={H - PAD_B}
              stroke="var(--color-accent)"
              strokeDasharray="3 4"
              opacity="0.5"
            />
            <line
              x1={xRight}
              y1={PAD_T}
              x2={xRight}
              y2={H - PAD_B}
              stroke="var(--color-accent)"
              strokeDasharray="3 4"
              opacity="0.5"
            />

            <path
              d={unclippedPath}
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.7"
            />
            <path
              d={surrogatePath}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2.5"
            />

            {[0, 0.5, 1, 1.5, 2, 2.5].map((r) => (
              <g key={r}>
                <line
                  x1={xToPx(r)}
                  y1={H - PAD_B}
                  x2={xToPx(r)}
                  y2={H - PAD_B + 4}
                  stroke="var(--color-muted)"
                />
                <text
                  x={xToPx(r)}
                  y={H - PAD_B + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                  fill="var(--color-muted)"
                >
                  {r}
                </text>
              </g>
            ))}
            {[-2, -1, 0, 1, 2].map((y) => (
              <g key={y}>
                <line
                  x1={PAD_L - 4}
                  y1={yToPx(y)}
                  x2={PAD_L}
                  y2={yToPx(y)}
                  stroke="var(--color-muted)"
                />
                <text
                  x={PAD_L - 6}
                  y={yToPx(y) + 3}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                  fill="var(--color-muted)"
                >
                  {y}
                </text>
              </g>
            ))}

            <text
              x={W - PAD_R}
              y={H - PAD_B + 16}
              textAnchor="end"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              fill="var(--color-muted)"
            >
              r_t (ratio)
            </text>
            <text
              x={xLeft}
              y={PAD_T - 5}
              textAnchor="middle"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              fill="var(--color-accent)"
            >
              1-ε
            </text>
            <text
              x={xRight}
              y={PAD_T - 5}
              textAnchor="middle"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              fill="var(--color-accent)"
            >
              1+ε
            </text>
          </svg>
        </div>

        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-muted)]"
          dir="rtl"
        >
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-[var(--color-accent)]" />
            objective (clipped)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-5"
              style={{
                background:
                  'repeating-linear-gradient(to right, var(--color-muted) 0, var(--color-muted) 3px, transparent 3px, transparent 6px)',
              }}
            />
            ללא קליפ (r·A)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)] opacity-20" />
            אזור ה־trust [1-ε, 1+ε]
          </span>
        </div>

        <div
          className="rounded-md bg-[color-mix(in_oklch,var(--color-accent)_6%,transparent)] p-3 text-xs leading-relaxed"
          dir="rtl"
        >
          {advantageSign === 'pos' ? (
            <>
              <strong>A &gt; 0:</strong> התשובה הייתה טובה מהצפוי, אז ה־PPO רוצה
              להגדיל את ההסתברות שלה (r מעל 1). הקליפ עוצר את הגרף ב־1+ε ולא נותן
              לעדכון להגזים.
            </>
          ) : (
            <>
              <strong>A &lt; 0:</strong> התשובה הייתה גרועה מהצפוי, אז ה־PPO רוצה
              להקטין את ההסתברות שלה (r מתחת ל־1). הקליפ עוצר את הגרף ב־1-ε ולא
              נותן להפחתה להגזים.
            </>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}
