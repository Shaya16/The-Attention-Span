import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { ACCENT_INDICES, ATTENTION_PAIRS, CANDIDATES, TOKENS } from './hero/tagline';

type Phase = 'pre' | 'generating' | 'settling' | 'cta-in' | 'idle';

const GLOW_FADE_IN_MS = 200;
const TOKEN_CYCLE_MS = 560;
const SETTLE_MS = 400;
const CTA_IN_MS = 400;
const FLICKER_STEP_MS = 130;
const GLOW_BURST_MS = 200;

const LOGO_COLORS = [
  'var(--color-accent)',
  'var(--color-accent-2)',
  'var(--color-accent-3)',
  'var(--color-accent-4)',
];

const PROB_TABLE: number[][] = [
  [0.18, 0.31],
  [0.12, 0.25],
  [0.22, 0.35],
  [0.15, 0.41],
  [0.09, 0.28],
  [0.24, 0.38],
  [0.14, 0.33],
  [0.20, 0.36],
];

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(prefersReduced ? 'idle' : 'pre');
  const [tokensRevealed, setTokensRevealed] = useState(
    prefersReduced ? TOKENS.length : 0
  );
  const [glowBurst, setGlowBurst] = useState(0);
  const [runId, setRunId] = useState(0);
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);

  useEffect(() => {
    if (prefersReduced) return;

    setPhase('pre');
    setTokensRevealed(0);
    setHoveredToken(null);
    const timeouts: number[] = [];
    const t = (ms: number, fn: () => void) => {
      timeouts.push(window.setTimeout(fn, ms));
    };

    t(0, () => setPhase('generating'));

    let elapsed = GLOW_FADE_IN_MS;
    for (let i = 0; i < TOKENS.length; i++) {
      const idx = i;
      t(elapsed, () => {
        setTokensRevealed(idx + 1);
        setGlowBurst(Date.now());
      });
      elapsed += TOKEN_CYCLE_MS;
    }

    t(elapsed, () => setPhase('settling'));
    elapsed += SETTLE_MS;

    t(elapsed, () => setPhase('cta-in'));
    elapsed += CTA_IN_MS;

    t(elapsed, () => setPhase('idle'));

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [prefersReduced, runId]);

  const regenerate = useCallback(() => {
    setRunId((r) => r + 1);
  }, []);

  const scrollToWriting = useCallback(() => {
    const writing = document.querySelector('[data-section="writing"]');
    if (writing) {
      writing.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  }, []);

  const ctaVisible = phase === 'cta-in' || phase === 'idle';
  const interactive = phase === 'idle' || phase === 'cta-in';
  const autoActiveToken =
    (phase === 'generating' || phase === 'settling') && tokensRevealed > 0
      ? tokensRevealed - 1
      : null;

  return (
    <section
      dir="ltr"
      className="relative mx-4 flex min-h-[50vh] items-center justify-center overflow-hidden rounded-2xl px-6 py-16 sm:mx-6 sm:py-24"
      style={{ background: '#0a0a0a' }}
    >
      <Glow phase={phase} burst={glowBurst} prefersReduced={!!prefersReduced} />

      <div className="relative max-w-6xl text-center">
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2.25rem, 6.5vw, 4rem)',
            lineHeight: 1.45,
            letterSpacing: '-0.035em',
            fontWeight: 600,
            color: '#fff',
          }}
        >
          {TOKENS.map((tok, i) => (
            <Token
              key={i}
              index={i}
              token={tok}
              revealed={tokensRevealed}
              prefersReduced={!!prefersReduced}
              hoveredToken={interactive ? hoveredToken : autoActiveToken}
              onHoverStart={interactive ? setHoveredToken : undefined}
              onHoverEnd={interactive ? () => setHoveredToken(null) : undefined}
            />
          ))}
        </h1>
      </div>

      <motion.div
        className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-5 text-sm"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        initial={false}
        animate={{ opacity: ctaVisible ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <button
          type="button"
          onClick={regenerate}
          aria-label="Regenerate"
          className="rounded p-2 transition hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <RefreshIcon />
        </button>
        <button
          type="button"
          onClick={scrollToWriting}
          className="rounded px-2 py-2 font-mono text-xs uppercase tracking-wider transition hover:opacity-80"
        >
          ↓ לכל הפוסטים
        </button>
      </motion.div>
    </section>
  );
}

function Token({
  index,
  token,
  revealed,
  prefersReduced,
  hoveredToken,
  onHoverStart,
  onHoverEnd,
}: {
  index: number;
  token: string;
  revealed: number;
  prefersReduced: boolean;
  hoveredToken: number | null;
  onHoverStart?: (index: number) => void;
  onHoverEnd?: () => void;
}) {
  const isVisible = index < revealed;
  const isCurrent = index === revealed - 1;
  const isAccent = ACCENT_INDICES.includes(index);
  const color = isAccent ? 'var(--color-accent)' : 'inherit';

  const [flickerStep, setFlickerStep] = useState<number | null>(null);

  useEffect(() => {
    if (prefersReduced || !isCurrent) {
      setFlickerStep(null);
      return;
    }
    const candidates = CANDIDATES[index];
    if (!candidates || candidates.length <= 1) return;
    let step = 0;
    setFlickerStep(0);
    const id = window.setInterval(() => {
      step++;
      if (step >= candidates.length - 1) {
        setFlickerStep(null);
        window.clearInterval(id);
      } else {
        setFlickerStep(step);
      }
    }, FLICKER_STEP_MS);
    return () => window.clearInterval(id);
  }, [isCurrent, index, prefersReduced]);

  const isFlickering = flickerStep !== null;
  const displayToken =
    isFlickering ? CANDIDATES[index]?.[flickerStep] ?? token : token;

  const probability =
    isFlickering && flickerStep !== null
      ? PROB_TABLE[index]?.[flickerStep]?.toFixed(2) ?? null
      : null;

  const isHovered = hoveredToken === index;
  const attentionWeight =
    hoveredToken !== null
      ? (ATTENTION_PAIRS[hoveredToken]?.find((p) => p.target === index)?.weight ?? 0)
      : 0;
  const showUnderline = attentionWeight > 0.05;
  const underlineColor =
    hoveredToken !== null ? LOGO_COLORS[hoveredToken % LOGO_COLORS.length] : 'transparent';

  return (
    <span
      className="relative mr-[0.25em] inline-block"
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
        cursor: isVisible && !isFlickering ? 'pointer' : 'default',
      }}
      onMouseEnter={() => onHoverStart?.(index)}
      onMouseLeave={() => onHoverEnd?.()}
    >
      <span aria-hidden="true" className="invisible">{token}</span>

      {isHovered && (
        <motion.span
          className="absolute inset-0 rounded-[3px]"
          style={{ background: underlineColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12 }}
          transition={{ duration: 0.15 }}
        />
      )}

      <motion.span
        key={displayToken}
        initial={prefersReduced || !isVisible ? false : { opacity: 0, y: isFlickering ? 0 : 4 }}
        animate={isVisible ? { opacity: isFlickering ? 0.6 : 1, y: 0 } : false}
        transition={{ duration: isFlickering ? 0.08 : 0.22, ease: 'easeOut' }}
        className="absolute inset-0 text-center"
        style={{ color: isFlickering ? 'rgba(255,255,255,0.4)' : isHovered ? underlineColor : color }}
      >
        {displayToken}
      </motion.span>

      {probability && (
        <motion.span
          key={`p-${flickerStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.06 }}
          className="pointer-events-none absolute left-0 w-full text-center font-mono"
          style={{
            top: '100%',
            marginTop: '2px',
            fontSize: '0.25em',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0em',
          }}
        >
          {probability}
        </motion.span>
      )}

      <motion.span
        className="pointer-events-none absolute left-0 w-full rounded-full"
        style={{
          bottom: '-3px',
          background: underlineColor,
        }}
        initial={false}
        animate={{
          height: showUnderline ? 2 + attentionWeight * 4 : 0,
          opacity: showUnderline ? 0.4 + attentionWeight * 0.5 : 0,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
    </span>
  );
}

const GLOW_BLOBS = [
  { color: 'var(--color-accent)', x: '60%', y: '35%', size: '80vmin' },
  { color: 'var(--color-accent-2)', x: '28%', y: '58%', size: '65vmin' },
  { color: 'var(--color-accent-3)', x: '72%', y: '68%', size: '55vmin' },
  { color: 'var(--color-accent-4)', x: '35%', y: '22%', size: '50vmin' },
];

function Glow({
  phase,
  burst,
  prefersReduced,
}: {
  phase: Phase;
  burst: number;
  prefersReduced: boolean;
}) {
  const isActive = phase !== 'pre';
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {GLOW_BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            left: blob.x,
            top: blob.y,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(closest-side, ${blob.color}, transparent 70%)`,
          }}
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={
            prefersReduced
              ? { opacity: 0.08 }
              : phase === 'idle'
                ? {
                    opacity: [0.07, 0.13, 0.07],
                    x: [0, i % 2 === 0 ? 30 : -25, 0],
                    y: [0, i % 2 === 0 ? -20 : 25, 0],
                  }
                : { opacity: isActive ? 0.09 : 0 }
          }
          transition={
            prefersReduced
              ? { duration: 0 }
              : phase === 'idle'
                ? { duration: 8 + i * 3, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.4, ease: 'easeOut' }
          }
        />
      ))}
      {!prefersReduced && burst > 0 && (
        <motion.div
          key={burst}
          className="absolute rounded-full"
          style={{
            width: '50vmin',
            height: '50vmin',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(closest-side, var(--color-accent), transparent 70%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.05, 0] }}
          transition={{ duration: GLOW_BURST_MS / 1000, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
