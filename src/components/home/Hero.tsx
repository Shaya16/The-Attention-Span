import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCENT_INDICES, CANDIDATES, TOKENS } from './hero/tagline';
import AttentionArcs from './hero/AttentionArcs';
import type { Phase } from './hero/AttentionArcs';

const GLOW_FADE_IN_MS = 200;
const TOKEN_CYCLE_MS = 480;
const SETTLE_MS = 400;
const ARCS_IN_MS = 1350;
const ARCS_HOLD_MS = 800;
const ARCS_OUT_MS = 600;
const CTA_IN_MS = 400;
const FLICKER_STEP_MS = 50;
const GLOW_BURST_MS = 200;
const MOBILE_BREAKPOINT = 640;

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tokenRefs = useRef<Map<number, HTMLElement | null>>(new Map());

  const [phase, setPhase] = useState<Phase>(prefersReduced ? 'idle' : 'pre');
  const [tokensRevealed, setTokensRevealed] = useState(
    prefersReduced ? TOKENS.length : 0
  );
  const [glowBurst, setGlowBurst] = useState(0);
  const [runId, setRunId] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;

    setPhase('pre');
    setTokensRevealed(0);
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

    if (!isMobile) {
      t(elapsed, () => setPhase('arcs-in'));
      elapsed += ARCS_IN_MS;
      t(elapsed, () => setPhase('arcs-hold'));
      elapsed += ARCS_HOLD_MS;
      t(elapsed, () => setPhase('arcs-out'));
      elapsed += ARCS_OUT_MS;
    } else {
      elapsed += 200;
    }

    t(elapsed, () => setPhase('cta-in'));
    elapsed += CTA_IN_MS;

    t(elapsed, () => setPhase('idle'));

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [prefersReduced, runId, isMobile]);

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

  return (
    <section
      dir="ltr"
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-12"
    >
      <Glow phase={phase} burst={glowBurst} prefersReduced={!!prefersReduced} />

      <div ref={containerRef} className="relative max-w-xl text-center">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(2.25rem, 7vw, 5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: 'var(--color-ink)',
          }}
        >
          {TOKENS.map((tok, i) => (
            <Token
              key={i}
              index={i}
              token={tok}
              revealed={tokensRevealed}
              prefersReduced={!!prefersReduced}
              registerRef={(el: HTMLSpanElement | null) => {
                tokenRefs.current.set(i, el);
              }}
            />
          ))}
        </h1>

        {!isMobile && (
          <AttentionArcs
            tokenRefs={tokenRefs.current}
            containerRef={containerRef}
            phase={phase}
            measureKey={runId}
          />
        )}
      </div>

      <motion.div
        className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-5 text-sm"
        style={{ color: 'var(--color-muted)' }}
        initial={false}
        animate={{ opacity: ctaVisible ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <button
          type="button"
          onClick={regenerate}
          aria-label="Regenerate"
          className="rounded p-2 transition hover:opacity-80"
          style={{ color: 'var(--color-muted)' }}
        >
          <RefreshIcon />
        </button>
        <button
          type="button"
          onClick={scrollToWriting}
          className="rounded px-2 py-2 font-mono text-xs uppercase tracking-wider transition hover:opacity-80"
        >
          ↓ writing
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
  registerRef,
}: {
  index: number;
  token: string;
  revealed: number;
  prefersReduced: boolean;
  registerRef: (el: HTMLSpanElement | null) => void;
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

  const displayToken =
    flickerStep !== null ? CANDIDATES[index]?.[flickerStep] ?? token : token;

  return (
    <span
      ref={registerRef}
      className="mr-[0.25em] inline-block"
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
        color,
      }}
    >
      <motion.span
        initial={prefersReduced || !isVisible ? false : { opacity: 0, y: 4 }}
        animate={isVisible ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="inline-block"
      >
        {displayToken}
      </motion.span>
    </span>
  );
}

function Glow({
  phase,
  burst,
  prefersReduced,
}: {
  phase: Phase;
  burst: number;
  prefersReduced: boolean;
}) {
  const baseOpacity = phase === 'pre' ? 0 : 0.1;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        width: '70vmin',
        height: '70vmin',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(closest-side, var(--color-accent), transparent 70%)',
        }}
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={
          prefersReduced
            ? { opacity: 0.1 }
            : phase === 'idle'
              ? { opacity: [0.08, 0.14, 0.08] }
              : { opacity: baseOpacity }
        }
        transition={
          prefersReduced
            ? { duration: 0 }
            : phase === 'idle'
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2, ease: 'easeOut' }
        }
      />
      {!prefersReduced && burst > 0 && (
        <motion.div
          key={burst}
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(closest-side, var(--color-accent), transparent 70%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.06, 0] }}
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
