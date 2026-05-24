import { useRef, useState } from 'react';
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

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function DotProduct() {
  const [a, setA] = useState<Vec>({ x: 1.2, y: 0.4 });
  const [b, setB] = useState<Vec>({ x: 0.6, y: 1.0 });
  const [dragging, setDragging] = useState<'a' | 'b' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const startDrag = (which: 'a' | 'b') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(which);
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
    else setB(clamped);
  };

  const endDrag = () => setDragging(null);

  const aScreen = vecToScreen(a);
  const bScreen = vecToScreen(b);
  const dp = dot(a, b);
  const ang = angleDeg(a, b);
  const dpSign = dp > 0.01 ? 'positive' : dp < -0.01 ? 'negative' : 'zero';
  const dpColor =
    dpSign === 'positive'
      ? 'var(--color-accent-3)'
      : dpSign === 'negative'
        ? 'var(--color-accent)'
        : 'var(--color-muted)';

  return (
    <DemoFrame
      title="Dot product"
      caption="Drag the colored handles. Same direction → positive. Perpendicular → zero. Opposite → negative."
    >
      <div className="space-y-3" dir="ltr">
        <div className="rounded-lg bg-white p-2 sm:p-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="mx-auto h-auto w-full touch-none select-none"
            style={{ maxWidth: SIZE }}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
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

            <line
              x1={0}
              y1={CENTER}
              x2={SIZE}
              y2={CENTER}
              stroke="var(--color-muted)"
              strokeWidth="1"
            />
            <line
              x1={CENTER}
              y1={0}
              x2={CENTER}
              y2={SIZE}
              stroke="var(--color-muted)"
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

            <line
              x1={CENTER}
              y1={CENTER}
              x2={aScreen.x}
              y2={aScreen.y}
              stroke="var(--color-accent-2)"
              strokeWidth="2.5"
              markerEnd="url(#dp-arrow-a)"
            />
            <line
              x1={CENTER}
              y1={CENTER}
              x2={bScreen.x}
              y2={bScreen.y}
              stroke="var(--color-accent-3)"
              strokeWidth="2.5"
              markerEnd="url(#dp-arrow-b)"
            />

            <g style={{ cursor: dragging === 'a' ? 'grabbing' : 'grab' }} onPointerDown={startDrag('a')}>
              <circle
                cx={aScreen.x}
                cy={aScreen.y}
                r="16"
                fill="var(--color-accent-2)"
                fillOpacity="0.18"
                stroke="var(--color-accent-2)"
                strokeWidth="2"
              />
              <text
                x={aScreen.x}
                y={aScreen.y + 4}
                textAnchor="middle"
                fontSize="12"
                fontFamily="monospace"
                fill="var(--color-accent-2)"
                style={{ pointerEvents: 'none' }}
              >
                a
              </text>
            </g>
            <g style={{ cursor: dragging === 'b' ? 'grabbing' : 'grab' }} onPointerDown={startDrag('b')}>
              <circle
                cx={bScreen.x}
                cy={bScreen.y}
                r="16"
                fill="var(--color-accent-3)"
                fillOpacity="0.18"
                stroke="var(--color-accent-3)"
                strokeWidth="2"
              />
              <text
                x={bScreen.x}
                y={bScreen.y + 4}
                textAnchor="middle"
                fontSize="12"
                fontFamily="monospace"
                fill="var(--color-accent-3)"
                style={{ pointerEvents: 'none' }}
              >
                b
              </text>
            </g>
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
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
            <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              angle
            </div>
            <div className="mt-1 font-mono text-xl tabular-nums">
              {ang.toFixed(0)}°
            </div>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
