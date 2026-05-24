import { motion } from 'motion/react';
import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import { ATTENTION_PAIRS } from './tagline';

export type Phase =
  | 'pre'
  | 'generating'
  | 'settling'
  | 'arcs-in'
  | 'arcs-hold'
  | 'arcs-out'
  | 'cta-in'
  | 'idle';

type Props = {
  tokenRefs: Map<number, HTMLElement | null>;
  containerRef: RefObject<HTMLElement | null>;
  phase: Phase;
  /** Force a re-measure (e.g., when a new run starts and refs may have changed). */
  measureKey?: number;
};

type ArcGeom = {
  key: string;
  d: string;
  weight: number;
  sourceTokenIndex: number;
  length: number;
};

const ARC_DROP = 30;
const STROKE_WIDTH = 1.5;
const WAVE_STAGGER_MS = 150;
const DRAW_DURATION_MS = 350;
const FADE_OUT_MS = 600;

function buildArcs(
  tokenRefs: Map<number, HTMLElement | null>,
  container: HTMLElement | null
): ArcGeom[] {
  if (!container) return [];
  const cRect = container.getBoundingClientRect();
  const arcs: ArcGeom[] = [];

  for (const [sourceIndexStr, pairs] of Object.entries(ATTENTION_PAIRS)) {
    const si = Number(sourceIndexStr);
    const sourceEl = tokenRefs.get(si);
    if (!sourceEl) continue;
    const sRect = sourceEl.getBoundingClientRect();
    const sx = sRect.left - cRect.left + sRect.width / 2;
    const sy = sRect.bottom - cRect.top;

    for (const { target, weight } of pairs) {
      const targetEl = tokenRefs.get(target);
      if (!targetEl) continue;
      const tRect = targetEl.getBoundingClientRect();
      const tx = tRect.left - cRect.left + tRect.width / 2;
      const ty = tRect.bottom - cRect.top;

      const mx = (sx + tx) / 2;
      const my = Math.max(sy, ty) + ARC_DROP;
      const d = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;

      const chord = Math.hypot(tx - sx, ty - sy);
      const length = chord + 2 * ARC_DROP + 4;

      arcs.push({ key: `${si}-${target}`, d, weight, sourceTokenIndex: si, length });
    }
  }
  return arcs;
}

export default function AttentionArcs({ tokenRefs, containerRef, phase, measureKey }: Props) {
  const [arcs, setArcs] = useState<ArcGeom[]>([]);

  useLayoutEffect(() => {
    const measure = () => setArcs(buildArcs(tokenRefs, containerRef.current));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tokenRefs, containerRef, phase, measureKey]);

  const visible = phase === 'arcs-in' || phase === 'arcs-hold' || phase === 'arcs-out';
  if (!visible || arcs.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      style={{ color: 'var(--color-accent-3)' }}
    >
      {arcs.map((arc) => {
        const delayMs = arc.sourceTokenIndex * WAVE_STAGGER_MS;
        return (
          <motion.path
            key={`${arc.key}-${measureKey ?? 0}`}
            d={arc.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            opacity={0.25 + arc.weight * 0.35}
            initial={{ strokeDasharray: arc.length, strokeDashoffset: arc.length }}
            animate={
              phase === 'arcs-out'
                ? { opacity: 0 }
                : { strokeDashoffset: 0 }
            }
            transition={
              phase === 'arcs-out'
                ? { duration: FADE_OUT_MS / 1000, ease: 'easeOut' }
                : { duration: DRAW_DURATION_MS / 1000, ease: 'easeOut', delay: delayMs / 1000 }
            }
          />
        );
      })}
    </svg>
  );
}
