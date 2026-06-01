import { useEffect, useRef, useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * TrainingLoop
 *
 * The training loop as a cycle: example -> forward pass -> loss -> update -> repeat.
 * A pulse travels clockwise around the ring; the active stage is highlighted and
 * explained below. Play / single-step / reset.
 */

interface Stage {
  short: string;
  detail: string;
}

const STAGES: Stage[] = [
  { short: 'דוגמה', detail: 'מראים למודל דוגמה ומבקשים שינחש את ההמשך.' },
  { short: 'Forward pass', detail: 'המודל מריץ את הקלט דרך הפרמטרים ומפיק ניחוש.' },
  { short: 'Loss', detail: 'מודדים כמה הניחוש רחוק מהתשובה הנכונה — מספר אחד.' },
  {
    short: 'עדכון',
    detail: 'מזיזים כל פרמטר קצת, בכיוון שמקטין את הטעות. ואז חוזרים.',
  },
];

const W = 460;
const H = 300;
const CX = W / 2;
const CY = 150;
const R = 96;
const N = STAGES.length;
const STEP_FRAMES = 80; // ~1.3s per segment at 60fps

// node i sits at 270 + i*90 degrees (top, right, bottom, left), going clockwise
const nodeAngle = (i: number) => 270 + i * 90;
function pointAt(deg: number): [number, number] {
  const r = (deg * Math.PI) / 180;
  return [CX + R * Math.cos(r), CY + R * Math.sin(r)];
}

export default function TrainingLoop() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 along active -> next
  const [playing, setPlaying] = useState(false);
  const [loops, setLoops] = useState(0);
  const raf = useRef<number | null>(null);
  const stepOnly = useRef(false);
  const progressRef = useRef(0);

  const stop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  useEffect(() => {
    if (!playing) return;
    let p = progressRef.current;
    const tick = () => {
      p += 1 / STEP_FRAMES;
      if (p >= 1) {
        p = 0;
        setActive((a) => {
          const next = (a + 1) % N;
          if (next === 0) setLoops((l) => l + 1);
          return next;
        });
        if (stepOnly.current) {
          stepOnly.current = false;
          progressRef.current = 0;
          setProgress(0);
          setPlaying(false);
          return;
        }
      }
      progressRef.current = p;
      setProgress(p);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const isRunning = playing && !stepOnly.current;

  const play = () => {
    stepOnly.current = false;
    setPlaying(true);
  };
  const pause = () => {
    stepOnly.current = false;
    setPlaying(false);
    stop();
  };
  const step = () => {
    if (playing) return;
    stepOnly.current = true;
    setPlaying(true);
  };
  const reset = () => {
    stepOnly.current = false;
    setPlaying(false);
    stop();
    setActive(0);
    progressRef.current = 0;
    setProgress(0);
    setLoops(0);
  };

  const pulseAngle = nodeAngle(active) + progress * 90;
  const [pulseX, pulseY] = pointAt(pulseAngle);
  const [arcSx, arcSy] = pointAt(nodeAngle(active));
  const arcPath =
    progress > 0.001
      ? `M ${arcSx} ${arcSy} A ${R} ${R} 0 0 1 ${pulseX} ${pulseY}`
      : '';

  return (
    <DemoFrame
      title="לולאת האימון"
      caption="אותה לולאה חוזרת על עצמה מיליארדי פעמים. לחצו ▶ כדי לראות צעד שלם זורם דרך ארבעת השלבים."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2" dir="rtl">
          <button
            onClick={isRunning ? pause : play}
            className="rounded-md bg-[var(--color-ink)] px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            {isRunning ? '❚❚ עצור' : '▶ הרץ'}
          </button>
          <button
            onClick={step}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm transition hover:border-[var(--color-accent)]"
          >
            צעד אחד
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm transition hover:border-[var(--color-accent)]"
          >
            איפוס
          </button>
          <span className="ms-auto font-mono text-xs text-[var(--color-muted)]">
            לולאות: {loops}
          </span>
        </div>

        <div className="rounded-lg bg-white p-2">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="2"
            />
            {arcPath && (
              <path
                d={arcPath}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            <text
              x={CX}
              y={CY - 4}
              textAnchor="middle"
              fontSize="16"
              fill="var(--color-muted)"
            >
              ↻
            </text>
            <text
              x={CX}
              y={CY + 14}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-muted)"
            >
              חוזר
            </text>

            {STAGES.map((s, i) => {
              const [nx, ny] = pointAt(nodeAngle(i));
              const isActive = i === active;
              return (
                <g key={i}>
                  <rect
                    x={nx - 56}
                    y={ny - 17}
                    width={112}
                    height={34}
                    rx={9}
                    fill={isActive ? 'var(--color-accent)' : 'white'}
                    stroke={isActive ? 'var(--color-accent)' : 'var(--color-line)'}
                    strokeWidth={isActive ? 0 : 1.5}
                  />
                  <text
                    x={nx}
                    y={ny + 4}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight={isActive ? 700 : 500}
                    fill={isActive ? 'white' : 'var(--color-muted)'}
                  >
                    {s.short}
                  </text>
                </g>
              );
            })}

            <circle cx={pulseX} cy={pulseY} r={6} fill="var(--color-accent-2)">
              <animate
                attributeName="r"
                values="5;7.5;5"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>

        <div
          className="flex items-start gap-3 rounded-md bg-[color-mix(in_oklch,var(--color-accent)_6%,transparent)] p-3"
          dir="rtl"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] font-mono text-xs font-bold text-white">
            {active + 1}
          </span>
          <p className="text-sm leading-relaxed text-[var(--color-ink)]">
            <span className="font-semibold">{STAGES[active].short}:</span>{' '}
            {STAGES[active].detail}
          </p>
        </div>
      </div>
    </DemoFrame>
  );
}
