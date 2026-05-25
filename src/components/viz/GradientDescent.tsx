import { useEffect, useRef, useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * GradientDescent
 *
 * Click anywhere on the loss surface to drop a starting point and watch
 * the chosen optimizer walk toward the minimum. Toggle between SGD,
 * Momentum, and Adam. Adjust learning rate.
 *
 * Loss function: f(x,y) = (x^2 + y - 11)^2 + (x + y^2 - 7)^2 (scaled)
 * - Himmelblau's, which has multiple minima, useful for showing how
 * starting point matters.
 */

type Optimizer = 'sgd' | 'momentum' | 'adam';

const W = 480;
const H = 320;
const SCALE = 30; // pixels per unit
const CX = W / 2;
const CY = H / 2;

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

  // Run optimizer when path is reset
  useEffect(() => {
    if (path.length !== 1) return;

    let [x, y] = path[0];
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
  }, [path.length === 1 ? path[0]?.join(',') : null, opt, lr]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const [x, y] = pxToWorld(px, py);
    setPath([[x, y]]);
  };

  const pathPx = path.map(([x, y]) => worldToPx(x, y));

  return (
    <DemoFrame
      title="Gradient descent"
      caption="Click anywhere on the surface to drop a starting point. Multiple minima - starting point matters."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex rounded-lg border border-[var(--color-line)] bg-white p-0.5">
            {(['sgd', 'momentum', 'adam'] as Optimizer[]).map((o) => (
              <button
                key={o}
                onClick={() => {
                  setOpt(o);
                  setPath([]);
                }}
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
            <span className="text-[var(--color-muted)]">lr</span>
            <input
              type="range"
              min="0.005"
              max="0.2"
              step="0.005"
              value={lr}
              onChange={(e) => {
                setLr(parseFloat(e.target.value));
                setPath([]);
              }}
              className="w-32"
            />
            <span className="font-mono text-xs tabular-nums">{lr.toFixed(3)}</span>
          </label>
          <button
            onClick={() => setPath([])}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1 text-xs hover:border-[var(--color-accent)]"
          >
            reset
          </button>
        </div>

        <div
          className="relative cursor-crosshair overflow-hidden rounded-lg border border-[var(--color-line)]"
          style={{ width: W, height: H, maxWidth: '100%' }}
          onClick={handleClick}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {pathPx.length > 1 && (
            <svg
              className="pointer-events-none absolute inset-0"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
            >
              <polyline
                points={pathPx.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
                opacity="0.8"
              />
              {pathPx.map(([px, py], i) => (
                <circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={i === 0 ? 5 : i === pathPx.length - 1 ? 4 : 1.5}
                  fill={
                    i === 0
                      ? 'var(--color-accent)'
                      : i === pathPx.length - 1
                        ? 'var(--color-accent-3)'
                        : 'var(--color-ink)'
                  }
                />
              ))}
            </svg>
          )}
          {path.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[var(--color-muted)]">
              click to start
            </div>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}
