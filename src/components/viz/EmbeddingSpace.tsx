import { useState } from 'react';
import DemoFrame from './DemoFrame';

type Group = 'positive' | 'negative' | 'object' | 'neutral';

interface WordDef {
  label: string;
  pos: { x: number; y: number };
  group: Group;
}

const SIZE = 360;
const CENTER = SIZE / 2;
const SCALE = 130;

const WORDS: WordDef[] = [
  // positive emotions (green)
  { label: 'שמח', pos: { x: -0.75, y: 0.45 }, group: 'positive' },
  { label: 'מאושר', pos: { x: -0.55, y: 0.62 }, group: 'positive' },
  { label: 'אוהב', pos: { x: -0.9, y: 0.18 }, group: 'positive' },
  { label: 'גאה', pos: { x: -0.35, y: 0.35 }, group: 'positive' },
  // negative emotions (blue)
  { label: 'עצוב', pos: { x: 0.75, y: -0.45 }, group: 'negative' },
  { label: 'כועס', pos: { x: 0.9, y: 0.25 }, group: 'negative' },
  { label: 'מפחד', pos: { x: 0.5, y: -0.7 }, group: 'negative' },
  { label: 'שונא', pos: { x: 0.95, y: 0.05 }, group: 'negative' },
  // objects (amber)
  { label: 'מכונית', pos: { x: -0.3, y: -0.8 }, group: 'object' },
  { label: 'אופניים', pos: { x: -0.6, y: -0.55 }, group: 'object' },
  { label: 'מטוס', pos: { x: 0.1, y: -0.9 }, group: 'object' },
  { label: 'כיסא', pos: { x: -0.85, y: -0.75 }, group: 'object' },
  // neutral (muted)
  { label: 'אדיש', pos: { x: 0.05, y: -0.05 }, group: 'neutral' },
  { label: 'חושב', pos: { x: 0.25, y: 0.12 }, group: 'neutral' },
];

const COLORS: Record<Group, string> = {
  positive: 'var(--color-accent-3)',
  negative: 'var(--color-accent-2)',
  object: 'var(--color-accent-4)',
  neutral: 'var(--color-muted)',
};

const INITIAL_ACTIVE = new Set(['שמח', 'עצוב', 'מכונית']);

function toScreen(v: { x: number; y: number }) {
  return { x: CENTER + v.x * SCALE, y: CENTER - v.y * SCALE };
}

function labelOffset(pos: { x: number; y: number }) {
  const dx = pos.x > 0 ? 10 : -10;
  const dy = pos.y > 0.35 ? -10 : pos.y < -0.3 ? 18 : 5;
  return { dx, dy, anchor: (pos.x > 0 ? 'start' : 'end') as 'start' | 'end' };
}

export default function EmbeddingSpace() {
  const [active, setActive] = useState<Set<string>>(INITIAL_ACTIVE);

  function toggle(label: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  const happy = WORDS.find((w) => w.label === 'שמח')!;
  const joyful = WORDS.find((w) => w.label === 'מאושר')!;
  const sad = WORDS.find((w) => w.label === 'עצוב')!;
  const showClusterRing = active.has('שמח') && active.has('מאושר');
  const showAxis = active.has('שמח') && active.has('עצוב');

  const happyS = toScreen(happy.pos);
  const joyfulS = toScreen(joyful.pos);

  // Cluster ring geometry (only used when shown)
  const cx = (happyS.x + joyfulS.x) / 2;
  const cy = (happyS.y + joyfulS.y) / 2;
  const ringDx = happyS.x - joyfulS.x;
  const ringDy = happyS.y - joyfulS.y;
  const clusterR = Math.sqrt(ringDx * ringDx + ringDy * ringDy) / 2 + 22;

  // Emotion-axis line geometry (only used when shown)
  const axisExtend = 0.12;
  const axisStart = toScreen({
    x: happy.pos.x - axisExtend * (sad.pos.x - happy.pos.x),
    y: happy.pos.y - axisExtend * (sad.pos.y - happy.pos.y),
  });
  const axisEnd = toScreen({
    x: sad.pos.x + axisExtend * (sad.pos.x - happy.pos.x),
    y: sad.pos.y + axisExtend * (sad.pos.y - happy.pos.y),
  });
  const axisMid = {
    x: (axisStart.x + axisEnd.x) / 2,
    y: (axisStart.y + axisEnd.y) / 2,
  };
  const axisLen = Math.sqrt(
    (axisEnd.x - axisStart.x) ** 2 + (axisEnd.y - axisStart.y) ** 2
  );
  const perp = {
    x: -(axisEnd.y - axisStart.y) / axisLen,
    y: (axisEnd.x - axisStart.x) / axisLen,
  };
  const axisLabelPos = {
    x: axisMid.x + perp.x * 18,
    y: axisMid.y + perp.y * 18,
  };

  return (
    <DemoFrame
      title="מרחב embedding"
      caption="לחצו על מילה כדי להוסיף או להסיר אותה מהמרחב."
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-white p-2 sm:p-3" dir="ltr">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="mx-auto h-auto w-full select-none"
            style={{ maxWidth: SIZE }}
          >
            {/* faint grid */}
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
            {/* central axes */}
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

            {/* emotion-axis dashed line */}
            {showAxis && (
              <g style={{ opacity: 0.85 }}>
                <line
                  x1={axisStart.x}
                  y1={axisStart.y}
                  x2={axisEnd.x}
                  y2={axisEnd.y}
                  stroke="var(--color-accent-2)"
                  strokeOpacity="0.55"
                  strokeWidth="1.25"
                  strokeDasharray="4 4"
                />
                <text
                  x={axisLabelPos.x}
                  y={axisLabelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fill="var(--color-accent-2)"
                  style={{ direction: 'rtl' }}
                >
                  ציר רגש
                </text>
              </g>
            )}

            {/* cluster ring */}
            {showClusterRing && (
              <circle
                cx={cx}
                cy={cy}
                r={clusterR}
                fill="var(--color-accent-3)"
                fillOpacity="0.07"
                stroke="var(--color-accent-3)"
                strokeOpacity="0.4"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* word dots + labels (always rendered, opacity-toggled for smooth fade) */}
            {WORDS.map((w) => {
              const s = toScreen(w.pos);
              const isActive = active.has(w.label);
              const off = labelOffset(w.pos);
              const color = COLORS[w.group];
              return (
                <g
                  key={w.label}
                  style={{
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 280ms ease',
                    pointerEvents: 'none',
                  }}
                >
                  <circle cx={s.x} cy={s.y} r="5.5" fill={color} />
                  <text
                    x={s.x + off.dx}
                    y={s.y + off.dy}
                    textAnchor={off.anchor}
                    fontSize="14"
                    fontWeight="500"
                    fill="var(--color-ink)"
                    style={{ direction: 'rtl' }}
                  >
                    {w.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Word badges */}
        <div className="flex flex-wrap justify-center gap-2" dir="rtl">
          {WORDS.map((w) => {
            const isActive = active.has(w.label);
            const color = COLORS[w.group];
            return (
              <button
                key={w.label}
                onClick={() => toggle(w.label)}
                aria-pressed={isActive}
                className="min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: isActive
                    ? `color-mix(in srgb, white 82%, ${color} 18%)`
                    : 'white',
                  color: isActive ? color : 'var(--color-muted)',
                  borderColor: isActive ? color : 'var(--color-line)',
                }}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>
    </DemoFrame>
  );
}
