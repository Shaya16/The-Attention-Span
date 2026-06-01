import { useEffect, useRef, useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * GradientDescent
 *
 * Tap anywhere on the loss surface to drop a starting point and watch the
 * chosen optimizer walk toward a minimum. A single moving dot with a direction
 * arrow shows which way it's stepping (downhill); the green bullseyes mark the
 * minima (the targets). Toggle SGD / Momentum / Adam, adjust the learning rate.
 *
 * Loss function: Himmelblau's, f(x,y) = (x²+y−11)² + (x+y²−7)² (scaled), which
 * has four minima — useful for showing that the starting point matters.
 *
 * Mobile: the surface keeps a fixed aspect ratio and scales uniformly, and tap
 * coordinates are rescaled from displayed CSS pixels into internal units, so
 * taps land correctly at any width.
 */

type Optimizer = 'sgd' | 'momentum' | 'adam';

const W = 480;
const H = 320;
const SCALE = 30; // pixels per unit
const CX = W / 2;
const CY = H / 2;

// the four minima of Himmelblau's function (all f = 0)
const MINIMA: [number, number][] = [
  [3.0, 2.0],
  [-2.805118, 3.131312],
  [-3.77931, -3.283186],
  [3.584428, -1.848126],
];

// Himmelblau, normalized
function loss(x: number, y: number): number {
  return ((x * x + y - 11) ** 2 + (x + y * y - 7) ** 2) / 200;
}

function grad(x: number, y: number): [number, number] {
  const dx = (4 * x * (x * x + y - 11) + 2 * (x + y * y - 7)) / 200;
  const dy = (2 * (x * x + y - 11) + 4 * y * (x + y * y - 7)) / 200;
  return [dx, dy];
}

function pxToWorld(px: number, py: number): [number, number] {
  return [(px - CX) / SCALE, -(py - CY) / SCALE];
}

function worldToPx(x: number, y: number): [number, number] {
  return [x * SCALE + CX, -y * SCALE + CY];
}

export default function GradientDescent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opt, setOpt] = useState<Optimizer>('momentum');
  const [lr, setLr] = useState(0.05);
  const [start, setStart] = useState<[number, number] | null>([-5, 4.5]); // seed a demo run
  const [path, setPath] = useState<[number, number][]>([]);
  const animRef = useRef<number | null>(null);

  // Draw the loss surface (once on mount)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const img = ctx.createImageData(W, H);
    let lmin = Infinity;
    let lmax = -Infinity;
    const grid = new Float32Array(W * H);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const [x, y] = pxToWorld(px, py);
        const l = loss(x, y);
        grid[py * W + px] = l;
        if (l < lmin) lmin = l;
        if (l > lmax) lmax = l;
      }
    }
    const norm = (v: number) => Math.min(1, Math.max(0, (v - lmin) / (lmax - lmin)));
    for (let i = 0; i < grid.length; i++) {
      const t = Math.pow(norm(grid[i]), 0.35);
      // gradient: pale → warm accent
      const r = Math.round(255 - t * 30);
      const g = Math.round(245 - t * 130);
      const b = Math.round(240 - t * 180);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  // Run the optimizer from `start`. Depends on start/opt/lr only — NOT on path —
  // so the per-frame setPath updates don't re-trigger and cancel the animation.
  useEffect(() => {
    if (!start) {
      setPath([]);
      return;
    }

    let [x, y] = start;
    let vx = 0,
      vy = 0;
    // Adam state
    let mx = 0,
      my = 0,
      sx = 0,
      sy = 0;
    let t = 0;
    const beta1 = 0.9;
    const beta2 = 0.999;
    const eps = 1e-8;

    const trail: [number, number][] = [[x, y]];
    setPath([[x, y]]);

    const step = () => {
      t++;
      const [gx, gy] = grad(x, y);
      if (opt === 'sgd') {
        x -= lr * gx;
        y -= lr * gy;
      } else if (opt === 'momentum') {
        vx = 0.9 * vx - lr * gx;
        vy = 0.9 * vy - lr * gy;
        x += vx;
        y += vy;
      } else {
        mx = beta1 * mx + (1 - beta1) * gx;
        my = beta1 * my + (1 - beta1) * gy;
        sx = beta2 * sx + (1 - beta2) * gx * gx;
        sy = beta2 * sy + (1 - beta2) * gy * gy;
        const mhx = mx / (1 - Math.pow(beta1, t));
        const mhy = my / (1 - Math.pow(beta1, t));
        const shx = sx / (1 - Math.pow(beta2, t));
        const shy = sy / (1 - Math.pow(beta2, t));
        x -= (lr * mhx) / (Math.sqrt(shx) + eps);
        y -= (lr * mhy) / (Math.sqrt(shy) + eps);
      }

      trail.push([x, y]);
      setPath([...trail]);

      const g2 = gx * gx + gy * gy;
      if (g2 > 1e-6 && t < 300) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [start, opt, lr]);

  // tap / click → rescale from displayed CSS px into internal units, then drop a start
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    setStart(pxToWorld(px, py));
  };

  const pathPx = path.map(([x, y]) => worldToPx(x, y));
  const lead = pathPx[pathPx.length - 1];
  const prev = pathPx[pathPx.length - 2];

  // direction arrow: normalized step direction from the leading dot
  let arrow: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (lead && prev) {
    const dx = lead[0] - prev[0];
    const dy = lead[1] - prev[1];
    const len = Math.hypot(dx, dy);
    if (len > 0.4) {
      const L = 26;
      arrow = {
        x1: lead[0],
        y1: lead[1],
        x2: lead[0] + (dx / len) * L,
        y2: lead[1] + (dy / len) * L,
      };
    }
  }

  return (
    <DemoFrame
      title="Gradient Descent — ירידה למינימום"
      caption="הקישו בכל מקום על המשטח כדי להפיל נקודת התחלה, וצפו באופטימייזר יורד במורד. החץ מראה את כיוון הירידה, והטבעות הירוקות הן המינימומים — היעד. יש כמה מינימומים, אז נקודת ההתחלה קובעת לאן מגיעים."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm" dir="rtl">
          <div className="flex rounded-lg border border-[var(--color-line)] bg-white p-0.5">
            {(['sgd', 'momentum', 'adam'] as Optimizer[]).map((o) => (
              <button
                key={o}
                onClick={() => setOpt(o)}
                className="rounded-md px-3 py-1 font-mono text-xs transition"
                style={{
                  background: opt === o ? 'var(--color-ink)' : 'transparent',
                  color: opt === o ? 'white' : 'var(--color-muted)',
                }}
              >
                {o}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-muted)]">lr</span>
            <input
              type="range"
              min="0.005"
              max="0.2"
              step="0.005"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
              className="h-9 w-28 cursor-pointer accent-[var(--color-accent)] sm:w-32"
              aria-label="learning rate"
            />
            <span className="w-12 font-mono text-xs tabular-nums" dir="ltr">
              {lr.toFixed(3)}
            </span>
          </label>
          <button
            onClick={() => setStart(null)}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1 text-xs transition hover:border-[var(--color-accent)]"
          >
            איפוס
          </button>
        </div>

        <div
          className="relative w-full cursor-crosshair touch-manipulation select-none overflow-hidden rounded-lg border border-[var(--color-line)]"
          style={{ maxWidth: W, aspectRatio: `${W} / ${H}` }}
          onClick={handleClick}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="block h-full w-full"
          />
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${W} ${H}`}
          >
            <defs>
              <marker
                id="gd-arrow"
                viewBox="0 0 10 10"
                markerWidth="7"
                markerHeight="7"
                refX="7"
                refY="5"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="var(--color-ink)" />
              </marker>
            </defs>

            {/* minima — the targets */}
            {MINIMA.map(([mx, my], i) => {
              const [px, py] = worldToPx(mx, my);
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r={9} fill="white" opacity={0.55} />
                  <circle
                    cx={px}
                    cy={py}
                    r={8}
                    fill="none"
                    stroke="var(--color-accent-3)"
                    strokeWidth={2}
                  />
                  <circle cx={px} cy={py} r={2.5} fill="var(--color-accent-3)" />
                </g>
              );
            })}

            {/* trail */}
            {pathPx.length > 1 && (
              <polyline
                points={pathPx.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth={1.5}
                opacity={0.35}
              />
            )}

            {/* direction arrow */}
            {arrow && (
              <line
                x1={arrow.x1}
                y1={arrow.y1}
                x2={arrow.x2}
                y2={arrow.y2}
                stroke="var(--color-ink)"
                strokeWidth={2.5}
                markerEnd="url(#gd-arrow)"
              />
            )}

            {/* current point */}
            {lead && (
              <>
                <circle cx={lead[0]} cy={lead[1]} r={6.5} fill="white" opacity={0.8} />
                <circle cx={lead[0]} cy={lead[1]} r={5} fill="var(--color-ink)" />
              </>
            )}
          </svg>

          {path.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[var(--color-muted)]">
              הקישו כדי להתחיל
            </div>
          )}
        </div>

        {/* legend */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-muted)]"
          dir="rtl"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border-2"
              style={{ borderColor: 'var(--color-accent-3)' }}
            />
            מינימום (היעד)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-ink)]" />
            הנקודה הנוכחית
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[var(--color-ink)]">→</span>
            כיוון הירידה
          </span>
        </div>
      </div>
    </DemoFrame>
  );
}
