import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useRef } from 'react';
import { ACCENT_INDICES, TOKENS } from './hero/tagline';

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToWriting = useCallback(() => {
    const writing = document.querySelector('[data-section="writing"]');
    if (writing) {
      writing.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  }, []);

  void prefersReduced;

  return (
    <section
      dir="ltr"
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-12"
    >
      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: '70vmin',
          height: '70vmin',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.1,
          background:
            'radial-gradient(closest-side, var(--color-accent), transparent 70%)',
        }}
      />

      {/* Tagline */}
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
          {TOKENS.map((tok, i) => {
            const isAccent = ACCENT_INDICES.includes(i);
            return (
              <span
                key={i}
                className="mr-[0.25em] inline-block"
                style={{ color: isAccent ? 'var(--color-accent)' : 'inherit' }}
              >
                {tok}
              </span>
            );
          })}
        </h1>
      </div>

      {/* CTA row */}
      <motion.div
        className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-5 text-sm"
        style={{ color: 'var(--color-muted)' }}
      >
        <button
          type="button"
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
