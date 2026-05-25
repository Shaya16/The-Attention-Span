import { useEffect, useRef, useState } from 'react';
import DemoFrame from './DemoFrame';

interface Vec {
  x: number;
  y: number;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const SCALE = 100;
const MAX_UNIT = 1.45;

function vecToScreen(v: Vec) {
  return { x: CENTER + v.x * SCALE, y: CENTER - v.y * SCALE };
}
function screenToVec(x: number, y: number): Vec {
  return { x: (x - CENTER) / SCALE, y: -(y - CENTER) / SCALE };
}
function dot(a: Vec, b: Vec) {
  return a.x * b.x + a.y * b.y;
}
function mag(v: Vec) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
function angleDeg(a: Vec, b: Vec) {
  const m = mag(a) * mag(b);
  if (m < 1e-9) return 0;
  const cos = Math.max(-1, Math.min(1, dot(a, b) / m));
  return (Math.acos(cos) * 180) / Math.PI;
}
function perp(v: Vec): Vec {
  return { x: -v.y, y: v.x };
}
function neg(v: Vec): Vec {
  return { x: -v.x, y: -v.y };
}
function rotate(v: Vec, theta: number): Vec {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return { x: c * v.x - s * v.y, y: s * v.x + c * v.y };
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

const A_INITIAL: Vec = { x: 1.0, y: 0.5 };

const PRESETS = [
  { label: 'אותו כיוון', compute: (a: Vec) => ({ ...a }) },
  { label: 'ניצב', compute: (a: Vec) => perp(a) },
  { label: 'כיוון הפוך', compute: (a: Vec) => neg(a) },
  { label: 'באמצע', compute: (a: Vec) => rotate(a, Math.PI / 4) },
];

export default function DotProduct() {
  const [a, setA] = useState<Vec>(A_INITIAL);
  const [b, setB] = useState<Vec>(A_INITIAL);
  const [freeMode, setFreeMode] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(0);
  const [dragging, setDragging] = useState<'a' | 'b' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number | null>(null);
  const bRef = useRef<Vec>(A_INITIAL);

  useEffect(() => {
    bRef.current = b;
  }, [b]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  function animateBTo(target: Vec) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start = { ...bRef.current };
    const startTime = performance.now();
    const duration = 300;

    function step(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(t);
      const next = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
      };
      bRef.current = next;
      setB(next);
      if (t < 1) animRef.current = requestAnimationFrame(step);
      else animRef.current = null;
    }
    animRef.current = requestAnimationFrame(step);
  }

  function selectPreset(i: number) {
    setActivePreset(i);
    animateBTo(PRESETS[i].compute(a));
  }

  const startDrag = (which: 'a' | 'b') => (e: React.PointerEvent) => {
    if (!freeMode) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(which);
    setActivePreset(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * SIZE;
    const v = screenToVec(px, py);
    const clamped = {
      x: clamp(v.x, -MAX_UNIT, MAX_UNIT),
      y: clamp(v.y, -MAX_UNIT, MAX_UNIT),
    };
    if (dragging === 'a') setA(clamped);
    else {
      bRef.current = clamped;
      setB(clamped);
    }
  };

  const endDrag = () => setDragging(null);

  const aScreen = vecToScreen(a);
  const bScreen = vecToScreen(b);
  const dp = dot(a, b);
  const ang = angleDeg(a, b);
  const dpColor =
    dp > 0.01
      ? 'var(--color-accent-3)'
      : dp < -0.01
        ? 'var(--color-accent)'
        : 'var(--color-muted)';

  return (
    <DemoFrame
      title="מכפלה סקלרית"
      caption="לחצו על כפתור. אותו כיוון = חיובי. ניצב = אפס. הפוך = שלילי."
    >
      <div className="space-y-4">
        {/* SVG plot */}
        <div className="rounded-lg bg-white p-2 sm:p-3" dir="ltr">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="mx-auto h-auto w-full touch-none select-none"
            style={{ maxWidth: SIZE }}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {/* grid */}
            <g stroke="var(--color-line)" strokeWidth="0.5">
              {[-1, 1].map((g) => (
                <line
                  key={`vx-${g}`}
                  x1={CENTER + g * SCALE}
                  y1={0}
                  x2={CENTER + g * SCALE}
                  y2={SIZE}
                />
              ))}
              {[-1, 1].map((g) => (
                <line
                  key={`hy-${g}`}
                  x1={0}
                  y1={CENTER + g * SCALE}
                  x2={SIZE}
                  y2={CENTER + g * SCALE}
                />
              ))}
            </g>
            {/* axes */}
            <line
              x1={0}
              y1={CENTER}
              x2={SIZE}
              y2={CENTER}
              stroke="var(--color-muted)"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <line
              x1={CENTER}
              y1={0}
              x2={CENTER}
              y2={SIZE}
              stroke="var(--color-muted)"
              strokeOpacity="0.4"
              strokeWidth="1"
            />

            <defs>
              <marker
                id="dp-arrow-a"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-accent-2)" />
              </marker>
              <marker
                id="dp-arrow-b"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-accent-3)" />
              </marker>
            </defs>

            {/* vector a */}
            <line
              x1={CENTER}
              y1={CENTER}
              x2={aScreen.x}
              y2={aScreen.y}
              stroke="var(--color-accent-2)"
              strokeWidth="2.5"
              markerEnd="url(#dp-arrow-a)"
            />
            {/* vector b */}
            <line
              x1={CENTER}
              y1={CENTER}
              x2={bScreen.x}
              y2={bScreen.y}
              stroke="var(--color-accent-3)"
              strokeWidth="2.5"
              markerEnd="url(#dp-arrow-b)"
            />

            {/* a label / handle */}
            <g
              style={freeMode ? { cursor: dragging === 'a' ? 'grabbing' : 'grab' } : undefined}
              onPointerDown={startDrag('a')}
            >
              <circle
                cx={aScreen.x}
                cy={aScreen.y}
                r={freeMode ? 18 : 11}
                fill="var(--color-accent-2)"
                fillOpacity={freeMode ? 0.2 : 1}
                stroke="var(--color-accent-2)"
                strokeWidth={freeMode ? 2 : 0}
              />
              <text
                x={aScreen.x}
                y={aScreen.y + 5}
                textAnchor="middle"
                fontSize="14"
                fontFamily="monospace"
                fontWeight="bold"
                fill={freeMode ? 'var(--color-accent-2)' : 'white'}
                style={{ pointerEvents: 'none' }}
              >
                a
              </text>
            </g>
            {/* b label / handle */}
            <g
              style={freeMode ? { cursor: dragging === 'b' ? 'grabbing' : 'grab' } : undefined}
              onPointerDown={startDrag('b')}
            >
              <circle
                cx={bScreen.x}
                cy={bScreen.y}
                r={freeMode ? 18 : 11}
                fill="var(--color-accent-3)"
                fillOpacity={freeMode ? 0.2 : 1}
                stroke="var(--color-accent-3)"
                strokeWidth={freeMode ? 2 : 0}
              />
              <text
                x={bScreen.x}
                y={bScreen.y + 5}
                textAnchor="middle"
                fontSize="14"
                fontFamily="monospace"
                fontWeight="bold"
                fill={freeMode ? 'var(--color-accent-3)' : 'white'}
                style={{ pointerEvents: 'none' }}
              >
                b
              </text>
            </g>
          </svg>
        </div>

        {/* Preset buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" dir="rtl">
          {PRESETS.map((p, i) => {
            const active = activePreset === i && !freeMode;
            return (
              <button
                key={p.label}
                onClick={() => selectPreset(i)}
                className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-ink)] text-white'
                    : 'border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-accent)]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Free mode toggle */}
        <div
          className="flex items-center justify-between rounded-md border border-[var(--color-line)] bg-white px-3 py-2"
          dir="rtl"
        >
          <span className="text-sm text-[var(--color-ink)]">טווח חופשי (גרירה)</span>
          <button
            role="switch"
            aria-checked={freeMode}
            aria-label="טווח חופשי"
            onClick={() => setFreeMode((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              freeMode ? 'bg-[var(--color-accent-2)]' : 'bg-[var(--color-line)]'
            }`}
          >
            <span
              className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: freeMode ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {/* Numeric panels */}
        <div className="grid grid-cols-2 gap-3 text-sm" dir="ltr">
          <div className="rounded-md border border-[var(--color-line)] bg-white p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              a · b
            </div>
            <div
              className="mt-1 font-mono text-xl tabular-nums"
              style={{ color: dpColor }}
            >
              {dp.toFixed(2)}
            </div>
          </div>
          <div className="rounded-md border border-[var(--color-line)] bg-white p-3 text-center">
            <div
              className="text-xs uppercase tracking-wide text-[var(--color-muted)]"
              dir="rtl"
            >
              זווית
            </div>
            <div className="mt-1 font-mono text-xl tabular-nums">{ang.toFixed(0)}°</div>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
