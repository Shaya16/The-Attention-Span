import { motion, useReducedMotion } from 'motion/react';

export default function Hero() {
  const prefersReduced = useReducedMotion();

  const fadeUp = (delay: number, duration: number) =>
    prefersReduced
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration, delay, ease: 'easeOut' as const },
        };

  return (
    <section className="pt-24 pb-12">
      <motion.h1
        {...fadeUp(0, 0.6)}
        className="mb-6"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(3rem, 8vw, 6.5rem)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}
      >
        The <span style={{ color: 'var(--color-accent)' }}>Attention</span> Span
      </motion.h1>

      <motion.p
        {...fadeUp(0.12, 0.4)}
        className="max-w-md text-lg"
        style={{ color: 'var(--color-muted)' }}
      >
        Machine learning, explained before your context window runs out.
      </motion.p>

      <motion.div
        {...fadeUp(0.24, 0.4)}
        className="mt-8 flex items-center gap-4"
      >
        <a
          href="https://github.com/Shaya16"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="transition"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.652.242 2.873.119 3.176.77.84 1.234 1.911 1.234 3.221 0 4.609-2.806 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .321.218.694.825.576C20.565 21.796 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/shayavivi/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="transition"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
      </motion.div>
    </section>
  );
}
