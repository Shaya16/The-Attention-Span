import { useState } from 'react';
import DemoFrame from './DemoFrame';

const SIZE = 240;
const CENTER = SIZE / 2;
const SCALE = 90;

interface Source {
  label: string;
  pos: { x: number; y: number };
  color: string;
}

const SOURCES: Source[] = [
  { label: 'המורה', pos: { x: -0.75, y: 0.4 }, color: 'var(--color-accent-2)' },
  { label: 'התלמידה', pos: { x: 0.7, y: 0.55 }, color: 'var(--color-accent-3)' },
  { label: 'עצבנית', pos: { x: 0.3, y: -0.75 }, color: 'var(--color-accent-4)' },
];

const PRESETS = [
  { label: 'שווה משקל', weights: [1 / 3, 1 / 3, 1 / 3] },
  { label: 'רק על המורה', weights: [1, 0, 0] },
  { label: 'רק על התלמידה', weights: [0, 1, 0] },
];

function toScreen(v: { x: number; y: number }) {
  return { x: CENTER + v.x * SCALE, y: CENTER - v.y * SCALE };
}

export default function WeightedSum() {
  const [weights, setWeights] = useState<number[]>([1 / 3, 1 / 3, 1 / 3]);

  function setWeight(i: number, newVal: number) {
    setWeights((prev) => {
      const next = [...prev];
      const clamped = Math.max(0, Math.min(1, newVal));
      next[i] = clamped;
      const remaining = 1 - clamped;
      const othersIdx = [0, 1, 2].filter((j) => j !== i);
      const othersSum = othersIdx.reduce((s, j) => s + prev[j], 0);
      if (othersSum < 1e-9) {
        othersIdx.forEach((j) => {
          next[j] = remaining / othersIdx.length;
        });
      } else {
        othersIdx.forEach((j) => {
          next[j] = (prev[j] / othersSum) * remaining;
        });
      }
      return next;
    });
  }

  const y = {
    x: SOURCES.reduce((s, src, i) => s + weights[i] * src.pos.x, 0),
    y: SOURCES.reduce((s, src, i) => s + weights[i] * src.pos.y, 0),
  };
  const yScreen = toScreen(y);

  return (
    <DemoFrame
      title="ממוצע משוקלל"
      caption="המשקלים שולטים על המיקום של y. נסו לשנות אותם."
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-white p-2 sm:p-3" dir="ltr">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="mx-auto h-auto w-full select-none"
            style={{ maxWidth: SIZE }}
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
              {SOURCES.map((s, i) => (
                <marker
                  key={`marker-${i}`}
                  id={`ws-arrow-${i}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={s.color} />
                </marker>
              ))}
              <marker
                id="ws-arrow-y"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ink)" />
              </marker>
            </defs>

            {/* source vectors */}
            {SOURCES.map((s, i) => {
              const tip = toScreen(s.pos);
              const opacity = 0.35 + 0.65 * weights[i];
              const labelDx = s.pos.x > 0 ? 8 : -8;
              const labelDy = s.pos.y > 0 ? -10 : 16;
              const labelAnchor = (s.pos.x > 0 ? 'start' : 'end') as 'start' | 'end';
              return (
                <g key={s.label} style={{ opacity, transition: 'opacity 200ms ease' }}>
                  <line
                    x1={CENTER}
                    y1={CENTER}
                    x2={tip.x}
                    y2={tip.y}
                    stroke={s.color}
                    strokeWidth="2"
                    markerEnd={`url(#ws-arrow-${i})`}
                  />
                  <text
                    x={tip.x + labelDx}
                    y={tip.y + labelDy}
                    textAnchor={labelAnchor}
                    fontSize="14"
                    fill="var(--color-ink)"
                    fontWeight="500"
                    style={{ direction: 'rtl' }}
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}

            {/* y vector */}
            <line
              x1={CENTER}
              y1={CENTER}
              x2={yScreen.x}
              y2={yScreen.y}
              stroke="var(--color-ink)"
              strokeWidth="3"
              markerEnd="url(#ws-arrow-y)"
            />
            <text
              x={yScreen.x + (y.x >= 0 ? 8 : -10)}
              y={yScreen.y + 5}
              textAnchor={y.x >= 0 ? 'start' : 'end'}
              fontSize="16"
              fontFamily="monospace"
              fontWeight="bold"
              fill="var(--color-ink)"
            >
              y
            </text>
          </svg>
        </div>

        {/* Preset buttons */}
        <div className="grid grid-cols-3 gap-2" dir="rtl">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setWeights(p.weights)}
              className="min-h-11 rounded-md border border-[var(--color-line)] bg-white px-2 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="space-y-2" dir="rtl">
          {SOURCES.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <span
                className="w-16 shrink-0 text-sm font-medium"
                style={{ color: s.color }}
              >
                {s.label}
              </span>
              <input
                type="range"
                dir="ltr"
                min={0}
                max={100}
                value={Math.round(weights[i] * 100)}
                onChange={(e) => setWeight(i, +e.target.value / 100)}
                className="h-11 flex-1 cursor-pointer"
                style={{ accentColor: s.color }}
                aria-label={`${s.label} משקל`}
              />
              <span className="w-12 shrink-0 text-left font-mono text-sm tabular-nums text-[var(--color-muted)]">
                {(weights[i] * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </DemoFrame>
  );
}
