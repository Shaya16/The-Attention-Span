import { useEffect, useRef, useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * BackpropGraph
 *
 * Interactive computation graph for the exact example in the post:
 *   x --(*w1)--> z --(*w2)--> yhat --> L = (yhat - y)^2
 * Defaults x=2, w1=3, w2=0.5, y=6  ->  z=6, yhat=3, L=9.
 *
 * Drag the parameters (w1, w2) and the forward values update live.
 * "Run backward" reveals the gradients flowing right-to-left, stage by stage,
 * landing on the numbers from the text:
 *   dL/dyhat = -6,  dL/dw2 = -36,  dL/dz = -3,  dL/dw1 = -6.
 */

const X = 2; // input (fixed data)
const Y = 6; // target (fixed data)

const W = 560;
const H = 250;
const SPINE = 80;
const ROW2 = 168;

const fmt = (n: number) =>
  Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '');

const CAPTIONS = [
  'גררו את w₁ ו-w₂ — ה-forward pass (אפור, שמאלה לימין) מתעדכן מיד. ואז הריצו את ה-backward pass.',
  '∂L/∂ŷ = 2(ŷ − y). מתחילים מהסוף: כמה ה-loss משתנה עם הפלט.',
  'כלל השרשרת אחורה דרך הכפל השני: ∂L/∂w₂ = ∂L/∂ŷ · z, וגם ∂L/∂z = ∂L/∂ŷ · w₂.',
  'ממשיכים לשכבה הראשונה: ∂L/∂w₁ = ∂L/∂z · x. לכל פרמטר יש עכשיו גרדיאנט.',
];

export default function BackpropGraph() {
  const [w1, setW1] = useState(3);
  const [w2, setW2] = useState(0.5);
  const [stage, setStage] = useState(0); // 0 = none, 1..3 = backward progress
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  // forward
  const z = w1 * X;
  const yhat = w2 * z;
  const L = (yhat - Y) ** 2;
  // backward
  const dyhat = 2 * (yhat - Y);
  const dw2 = dyhat * z;
  const dz = dyhat * w2;
  const dw1 = dz * X;

  const onW1 = (v: number) => {
    clearTimers();
    setStage(0);
    setW1(v);
  };
  const onW2 = (v: number) => {
    clearTimers();
    setStage(0);
    setW2(v);
  };

  const runBackward = () => {
    clearTimers();
    setStage(0);
    timers.current.push(window.setTimeout(() => setStage(1), 250));
    timers.current.push(window.setTimeout(() => setStage(2), 1150));
    timers.current.push(window.setTimeout(() => setStage(3), 2050));
  };
  const stepBack = () => {
    clearTimers();
    setStage((s) => Math.min(3, s + 1));
  };
  const reset = () => {
    clearTimers();
    setStage(0);
    setW1(3);
    setW2(0.5);
  };

  const ink = 'var(--color-ink)';
  const muted = 'var(--color-muted)';
  const blue = 'var(--color-accent-2)';
  const accent = 'var(--color-accent)';

  // a gradient label (blue) that fades in when its stage is reached
  const Grad = ({
    show,
    x,
    y,
    text,
  }: {
    show: boolean;
    x: number;
    y: number;
    text: string;
  }) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize="11.5"
      fontFamily="ui-monospace, monospace"
      fontWeight={700}
      fill={blue}
      style={{ opacity: show ? 1 : 0, transition: 'opacity 250ms ease' }}
    >
      {text}
    </text>
  );

  return (
    <DemoFrame
      title="Backprop — כלל השרשרת בפעולה"
      caption="זו בדיוק הרשת מהדוגמה. גררו את הפרמטרים, הריצו את ה-backward pass, וראו את הגרדיאנטים מתגלגלים מה-loss אחורה לכל משקל."
    >
      <div className="space-y-3">
        {/* controls */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2" dir="rtl">
          <label className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[var(--color-accent)]">w₁</span>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={w1}
              onChange={(e) => onW1(parseFloat(e.target.value))}
              className="h-9 w-28 cursor-pointer accent-[var(--color-accent)]"
              aria-label="w1"
            />
            <span className="w-8 text-left font-mono tabular-nums" dir="ltr">
              {fmt(w1)}
            </span>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[var(--color-accent)]">w₂</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={w2}
              onChange={(e) => onW2(parseFloat(e.target.value))}
              className="h-9 w-28 cursor-pointer accent-[var(--color-accent)]"
              aria-label="w2"
            />
            <span className="w-8 text-left font-mono tabular-nums" dir="ltr">
              {fmt(w2)}
            </span>
          </label>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            x = 2 · y = 6 <span className="opacity-70">(נתון קבוע)</span>
          </span>
        </div>

        {/* graph */}
        <div className="rounded-lg bg-white p-2" dir="ltr">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <marker
                id="bp-fwd"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill={muted} />
              </marker>
              <marker
                id="bp-bwd"
                markerWidth="9"
                markerHeight="9"
                refX="6.5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6.5,3 L0,6 Z" fill={blue} />
              </marker>
            </defs>

            {/* ---- forward edges (gray, left -> right) ---- */}
            <line x1={80} y1={SPINE} x2={150} y2={SPINE} stroke={muted} strokeWidth="1.4" markerEnd="url(#bp-fwd)" />
            <line x1={192} y1={SPINE} x2={300} y2={SPINE} stroke={muted} strokeWidth="1.4" markerEnd="url(#bp-fwd)" />
            <line x1={340} y1={SPINE} x2={415} y2={SPINE} stroke={muted} strokeWidth="1.4" markerEnd="url(#bp-fwd)" />
            <line x1={489} y1={SPINE} x2={499} y2={SPINE} stroke={muted} strokeWidth="1.4" markerEnd="url(#bp-fwd)" />
            {/* param / data feeds */}
            <line x1={110} y1={151} x2={159} y2={95} stroke={muted} strokeWidth="1.4" markerEnd="url(#bp-fwd)" />
            <line x1={246} y1={151} x2={307} y2={95} stroke={muted} strokeWidth="1.4" markerEnd="url(#bp-fwd)" />
            <line x1={386} y1={151} x2={432} y2={98} stroke={muted} strokeWidth="1.4" markerEnd="url(#bp-fwd)" />

            {/* edge value labels */}
            <text x={246} y={70} textAnchor="middle" fontSize="12" fontFamily="ui-monospace, monospace" fill={ink}>z = {fmt(z)}</text>
            <text x={377} y={70} textAnchor="middle" fontSize="12" fontFamily="ui-monospace, monospace" fill={ink}>ŷ = {fmt(yhat)}</text>

            {/* ---- backward arrows (blue, right -> left), revealed by stage ---- */}
            {stage >= 1 && (
              <line x1={415} y1={SPINE + 10} x2={342} y2={SPINE + 10} stroke={blue} strokeWidth="1.6" markerEnd="url(#bp-bwd)" />
            )}
            {stage >= 2 && (
              <>
                <line x1={300} y1={SPINE + 10} x2={194} y2={SPINE + 10} stroke={blue} strokeWidth="1.6" markerEnd="url(#bp-bwd)" />
                <line x1={310} y1={98} x2={252} y2={151} stroke={blue} strokeWidth="1.6" markerEnd="url(#bp-bwd)" />
              </>
            )}
            {stage >= 3 && (
              <line x1={162} y1={98} x2={114} y2={151} stroke={blue} strokeWidth="1.6" markerEnd="url(#bp-bwd)" />
            )}

            {/* gradient labels */}
            <Grad show={stage >= 1} x={377} y={104} text={`∂L/∂ŷ = ${fmt(dyhat)}`} />
            <Grad show={stage >= 2} x={246} y={104} text={`∂L/∂z = ${fmt(dz)}`} />
            <Grad show={stage >= 2} x={246} y={206} text={`∂L/∂w₂ = ${fmt(dw2)}`} />
            <Grad show={stage >= 3} x={110} y={206} text={`∂L/∂w₁ = ${fmt(dw1)}`} />

            {/* ---- nodes ---- */}
            {/* x (data) */}
            <g>
              <rect x={16} y={SPINE - 17} width={64} height={34} rx={9} fill="white" stroke="var(--color-line)" strokeWidth="1.5" />
              <text x={48} y={SPINE + 4} textAnchor="middle" fontSize="13" fontFamily="ui-monospace, monospace" fill={muted}>x = 2</text>
            </g>
            {/* mul1 */}
            <g>
              <circle cx={172} cy={SPINE} r={18} fill="white" stroke={ink} strokeWidth="1.5" />
              <text x={172} y={SPINE + 5} textAnchor="middle" fontSize="16" fill={ink}>×</text>
            </g>
            {/* mul2 */}
            <g>
              <circle cx={320} cy={SPINE} r={18} fill="white" stroke={ink} strokeWidth="1.5" />
              <text x={320} y={SPINE + 5} textAnchor="middle" fontSize="16" fill={ink}>×</text>
            </g>
            {/* loss */}
            <g>
              <rect x={417} y={SPINE - 19} width={72} height={38} rx={9} fill="white" stroke={ink} strokeWidth="1.5" />
              <text x={453} y={SPINE + 5} textAnchor="middle" fontSize="13" fontFamily="ui-monospace, monospace" fill={ink}>(ŷ−y)²</text>
            </g>
            {/* L output */}
            <g>
              <rect x={500} y={SPINE - 17} width={56} height={34} rx={9} fill={accent} />
              <text x={528} y={SPINE + 5} textAnchor="middle" fontSize="13" fontFamily="ui-monospace, monospace" fontWeight={700} fill="white">L = {fmt(L)}</text>
            </g>
            {/* w1 (param) */}
            <g>
              <rect x={78} y={ROW2 - 17} width={64} height={34} rx={9} fill="white" stroke={accent} strokeWidth={stage >= 3 ? 2.5 : 1.5} />
              <text x={110} y={ROW2 + 4} textAnchor="middle" fontSize="12.5" fontFamily="ui-monospace, monospace" fill={accent}>w₁ = {fmt(w1)}</text>
            </g>
            {/* w2 (param) */}
            <g>
              <rect x={214} y={ROW2 - 17} width={64} height={34} rx={9} fill="white" stroke={accent} strokeWidth={stage >= 2 ? 2.5 : 1.5} />
              <text x={246} y={ROW2 + 4} textAnchor="middle" fontSize="12.5" fontFamily="ui-monospace, monospace" fill={accent}>w₂ = {fmt(w2)}</text>
            </g>
            {/* y (data) */}
            <g>
              <rect x={354} y={ROW2 - 17} width={64} height={34} rx={9} fill="white" stroke="var(--color-line)" strokeWidth="1.5" />
              <text x={386} y={ROW2 + 4} textAnchor="middle" fontSize="13" fontFamily="ui-monospace, monospace" fill={muted}>y = 6</text>
            </g>
          </svg>
        </div>

        {/* legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-muted)]" dir="rtl">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-[var(--color-muted)]" />
            forward pass
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-[var(--color-accent-2)]" />
            גרדיאנטים (backward)
          </span>
        </div>

        {/* buttons */}
        <div className="flex flex-wrap items-center gap-2" dir="rtl">
          <button
            onClick={runBackward}
            className="rounded-md bg-[var(--color-ink)] px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            ▶ הרץ Backward Pass
          </button>
          <button
            onClick={stepBack}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm transition hover:border-[var(--color-accent)]"
          >
            שלב הבא
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm transition hover:border-[var(--color-accent)]"
          >
            איפוס לדוגמה
          </button>
        </div>

        {/* caption */}
        <div
          className="rounded-md bg-[color-mix(in_oklch,var(--color-accent-2)_8%,transparent)] p-3 text-sm leading-relaxed text-[var(--color-ink)]"
          dir="rtl"
        >
          {CAPTIONS[stage]}
        </div>
      </div>
    </DemoFrame>
  );
}
