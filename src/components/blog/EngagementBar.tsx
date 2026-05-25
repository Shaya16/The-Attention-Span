import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

interface Props {
  slug: string;
}

const FLUSH_MS = 800;
const DEFAULT_CAP = 50;

const fmt = (n: number) => {
  if (n < 1000) return n.toLocaleString('he-IL');
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (n < 1_000_000) return Math.round(n / 1000) + 'K';
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
};

export default function EngagementBar({ slug }: Props) {
  const [total, setTotal] = useState(0);
  const [myClaps, setMyClaps] = useState(0);
  const [cap, setCap] = useState(DEFAULT_CAP);
  const [pending, setPending] = useState(0);
  const [floaters, setFloaters] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const flushTimer = useRef<number | null>(null);
  const pendingRef = useRef(0);
  const prefersReduced = useReducedMotion();

  // Initial fetch.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stats?slugs=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            stats?: Record<string, { claps: number; comments: number; myClaps: number }>;
          } | null,
        ) => {
          if (cancelled) return;
          const s = data?.stats?.[slug];
          if (s) {
            setTotal(s.claps);
            setMyClaps(s.myClaps);
          }
          setLoaded(true);
        },
      )
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const flush = () => {
    flushTimer.current = null;
    const taps = pendingRef.current;
    if (taps <= 0) return;
    pendingRef.current = 0;
    setPending(0);
    fetch('/api/claps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, taps }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { myClaps: number; total: number; cap: number } | null) => {
        if (!data) return;
        setTotal(data.total);
        setMyClaps(data.myClaps);
        setCap(data.cap);
      })
      .catch(() => {
        setTotal((t) => Math.max(0, t - taps));
        setMyClaps((m) => Math.max(0, m - taps));
      });
  };

  const onClap = () => {
    if (!loaded) return;
    if (myClaps + pending >= cap) return;
    pendingRef.current += 1;
    setPending((p) => p + 1);
    setTotal((t) => t + 1);
    setMyClaps((m) => m + 1);
    setFloaters((arr) => [...arr, Date.now() + Math.random()].slice(-6));
    if (flushTimer.current) window.clearTimeout(flushTimer.current);
    flushTimer.current = window.setTimeout(flush, FLUSH_MS);
  };

  useEffect(() => {
    return () => {
      if (flushTimer.current) {
        window.clearTimeout(flushTimer.current);
        flush();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atCap = myClaps >= cap;
  const clapActive = myClaps > 0;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[color-mix(in_oklch,var(--color-paper)_88%,transparent)] backdrop-blur-md"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-7 px-5 py-3 sm:py-3.5">
        <div className="relative">
          <AnimatePresence>
            {!prefersReduced &&
              floaters.map((id) => (
                <motion.span
                  key={id}
                  initial={{ opacity: 0.95, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -52, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.85, ease: 'easeOut' }}
                  onAnimationComplete={() =>
                    setFloaters((arr) => arr.filter((x) => x !== id))
                  }
                  className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 select-none text-sm font-semibold"
                  style={{ color: 'var(--color-accent)' }}
                  aria-hidden="true"
                >
                  +1
                </motion.span>
              ))}
          </AnimatePresence>

          <button
            type="button"
            onClick={onClap}
            disabled={atCap}
            aria-label={
              atCap ? 'הגעתם למקסימום מחיאות' : 'הוסיפו מחיאת כפיים'
            }
            className={`group flex items-center gap-1.5 text-sm active:scale-95 disabled:cursor-default ${
              clapActive
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <ClapIcon />
            <span className="tabular-nums">{fmt(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ClapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.37.828 12 3.282l.63-2.454zM13.916 3.953l1.523-2.112-1.184-.39zM8.589 1.84l1.522 2.112-.337-2.501zM18.523 18.92c-.86.86-1.75 1.246-2.62 1.33a6 6 0 0 0 .407-.372c2.388-2.389 2.86-4.951 1.399-7.623l-.912-1.603-.79-1.672c-.26-.56-.194-.98.203-1.288a.7.7 0 0 1 .546-.132c.283.046.546.231.728.5l2.363 4.157c.976 1.624 1.141 4.237-1.324 6.702m-10.999-.438L3.37 14.328a.828.828 0 0 1 .585-1.408.83.83 0 0 1 .585.242l2.158 2.157a.365.365 0 0 0 .516-.516l-2.157-2.158-1.449-1.449a.826.826 0 0 1 1.167-1.17l3.438 3.44a.363.363 0 0 0 .516 0 .364.364 0 0 0 0-.516L5.293 9.513l-.97-.97a.826.826 0 0 1 0-1.166.84.84 0 0 1 1.167 0l.97.968 3.437 3.436a.36.36 0 0 0 .517 0 .366.366 0 0 0 0-.516L6.977 7.83a.82.82 0 0 1-.241-.584.82.82 0 0 1 .824-.826c.219 0 .43.087.584.242l5.787 5.787a.366.366 0 0 0 .587-.415l-1.117-2.363c-.26-.56-.194-.98.204-1.289a.7.7 0 0 1 .546-.132c.283.046.545.232.727.501l2.193 3.86c1.302 2.38.883 4.59-1.277 6.75-1.156 1.156-2.602 1.627-4.19 1.367-1.418-.236-2.866-1.033-4.079-2.246M10.75 5.971l2.12 2.12c-.41.502-.465 1.17-.128 1.89l.22.465-3.523-3.523a.8.8 0 0 1-.097-.368c0-.22.086-.428.241-.584a.847.847 0 0 1 1.167 0m7.355 1.705c-.31-.461-.746-.758-1.23-.837a1.44 1.44 0 0 0-1.11.275c-.312.24-.505.543-.59.881a1.74 1.74 0 0 0-.906-.465 1.47 1.47 0 0 0-.82.106l-2.182-2.182a1.56 1.56 0 0 0-2.2 0 1.54 1.54 0 0 0-.396.701 1.56 1.56 0 0 0-2.21-.01 1.55 1.55 0 0 0-.416.753c-.624-.624-1.649-.624-2.237-.037a1.557 1.557 0 0 0 0 2.2c-.239.1-.501.238-.715.453a1.56 1.56 0 0 0 0 2.2l.516.515a1.556 1.556 0 0 0-.753 2.615L7.01 19c1.32 1.319 2.909 2.189 4.475 2.449q.482.08.971.08c.85 0 1.653-.198 2.393-.579.231.033.46.054.686.054 1.266 0 2.457-.52 3.505-1.567 2.763-2.763 2.552-5.734 1.439-7.586z"
      />
    </svg>
  );
}

