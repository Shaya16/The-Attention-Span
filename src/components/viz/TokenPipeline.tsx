import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import DemoFrame from './DemoFrame';
import { useTokenizer } from './useTokenizer';

interface Props {
  text?: string;
  title?: string;
  caption?: string;
}

const encoder = new TextEncoder();

const BYTE_COLOR: Record<number, string> = {
  1: 'var(--color-accent-3)',
  2: 'var(--color-accent-2)',
  3: 'var(--color-accent)',
  4: 'var(--color-accent-4)',
};

const CHIP_BG = [
  'color-mix(in oklch, var(--color-accent) 20%, transparent)',
  'color-mix(in oklch, var(--color-accent-2) 22%, transparent)',
  'color-mix(in oklch, var(--color-accent-3) 24%, transparent)',
  'color-mix(in oklch, var(--color-accent-4) 30%, transparent)',
];

const display = (t: string) => t.replace(/ /g, '␣').replace(/\n/g, '↵');
const isHebrew = (c: string) => /[֐-׿]/.test(c);
const isLatin = (c: string) => /[A-Za-z]/.test(c);

export default function TokenPipeline({
  text = 'שלום world',
  title = 'המסע של טקסט: מאותיות למספרים',
  caption = 'אותו טקסט, ארבעה שלבים: מהתווים, לבייטים, לטוקנים, ולמספרים שהמודל באמת מקבל. לחצו הפעלה.',
}: Props) {
  const { ready, tokenize } = useTokenizer();
  const reduce = useReducedMotion();

  const chars = useMemo(() => [...text], [text]);
  const cells = useMemo(
    () => chars.map((c) => ({ char: c, bytes: Array.from(encoder.encode(c)) })),
    [chars]
  );
  const byteCount = cells.reduce((s, c) => s + c.bytes.length, 0);
  const tokens = useMemo(() => (ready ? tokenize(text) : []), [ready, text, tokenize]);

  const heChars = chars.filter(isHebrew).length;
  const enChars = chars.filter(isLatin).length;
  const heTokens = tokens.filter((t) => t.text && isHebrew(t.text)).length;
  const enTokens = tokens.filter((t) => t.text && isLatin(t.text)).length;

  // ----- play / staged reveal -----
  const [revealed, setRevealed] = useState(1); // 1=text, 2=bytes, 3=tokens, 4=ids
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const play = useCallback(() => {
    clearTimers();
    if (reduce) {
      setRevealed(4);
      setPlaying(false);
      return;
    }
    setRevealed(1);
    setPlaying(true);
    [2, 3, 4].forEach((n, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setRevealed(n);
          if (n === 4) setPlaying(false);
        }, (i + 1) * 1100)
      );
    });
  }, [reduce]);

  const done = revealed >= 4;

  return (
    <DemoFrame title={title} caption={caption}>
      <div className="space-y-3">
        <div className="flex justify-center">
          <button
            onClick={play}
            disabled={!ready || playing}
            className="rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}
          >
            {!ready ? 'טוען…' : playing ? 'מריץ…' : done ? '↺ הפעל שוב' : '▶ הפעל את המסע'}
          </button>
        </div>

        <Stage n={1} label={`טקסט · ${chars.length} תווים`} reduce={reduce}>
          <div
            className="rounded-lg bg-white px-3 py-2.5 font-mono text-base text-[var(--color-ink)]"
            dir="auto"
          >
            {display(text)}
          </div>
        </Stage>

        {revealed >= 2 && (
          <>
            <Connector label="קידוד UTF-8" reduce={reduce} />
            <Stage n={2} label={`בייטים · ${byteCount}`} reduce={reduce}>
              <div className="flex flex-wrap gap-1.5 rounded-lg bg-white p-3" dir="auto">
                {cells.map((cell, i) => {
                  const n = cell.bytes.length;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1" title={`${n} bytes`}>
                      <span
                        className="flex h-8 min-w-8 items-center justify-center rounded px-1 font-mono text-base text-white"
                        style={{ background: BYTE_COLOR[n] ?? 'var(--color-accent)' }}
                      >
                        {cell.char === ' ' ? '␣' : cell.char}
                      </span>
                      <span className="font-mono text-[9px] leading-none text-[var(--color-muted)]">
                        {cell.bytes.length}B
                      </span>
                    </div>
                  );
                })}
              </div>
            </Stage>
          </>
        )}

        {revealed >= 3 && (
          <>
            <Connector label="BPE דוחס בייטים לטוקנים" reduce={reduce} />
            <Stage n={3} label={`טוקנים · ${tokens.length}`} reduce={reduce}>
              <div className="flex flex-wrap gap-1 rounded-lg bg-white p-3" dir="auto">
                {tokens.map((chip, i) => (
                  <span
                    key={i}
                    className="rounded px-1.5 py-1 font-mono text-sm leading-tight"
                    style={{ background: CHIP_BG[i % CHIP_BG.length] }}
                    title={`token id ${chip.id}`}
                  >
                    {chip.text === null ? (
                      <span className="text-[var(--color-muted)]">⟨{chip.id}⟩</span>
                    ) : (
                      display(chip.text)
                    )}
                  </span>
                ))}
              </div>
            </Stage>
          </>
        )}

        {revealed >= 4 && (
          <>
            <Connector label="מה שהמודל באמת מקבל" reduce={reduce} />
            <Stage n={4} label="מספרים (token IDs)" reduce={reduce}>
              <div className="flex flex-wrap gap-1 rounded-lg bg-white p-3" dir="ltr">
                {tokens.map((chip, i) => (
                  <span
                    key={i}
                    className="rounded bg-[var(--color-ink)] px-1.5 py-1 font-mono text-xs text-[var(--color-paper)]"
                  >
                    {chip.id}
                  </span>
                ))}
              </div>
            </Stage>
          </>
        )}

        {done && heTokens > 0 && enTokens > 0 && (
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg px-4 py-3 text-center text-sm text-[var(--color-ink)]"
            style={{ background: 'color-mix(in oklch, var(--color-accent) 8%, transparent)' }}
            dir="rtl"
          >
            {heChars} אותיות עברית הפכו ל-
            <span className="font-mono font-bold text-[var(--color-accent)]">{heTokens}</span>{' '}
            טוקנים — כמעט אחד לכל אות. {enChars} האותיות של{' '}
            <span dir="ltr" className="font-mono">world</span> הפכו ל-
            <span className="font-mono font-bold text-[var(--color-accent-3)]">{enTokens}</span>.
          </motion.p>
        )}
      </div>
    </DemoFrame>
  );
}

function Stage({
  n,
  label,
  reduce,
  children,
}: {
  n: number;
  label: string;
  reduce: boolean | null;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-1.5"
    >
      <div className="flex items-center gap-2" dir="rtl">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: 'var(--color-ink)' }}
        >
          {n}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

function Connector({ label, reduce }: { label: string; reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-2 text-[var(--color-muted)]"
      dir="rtl"
    >
      <span aria-hidden="true" className="text-base leading-none">↓</span>
      <span className="text-xs">{label}</span>
    </motion.div>
  );
}
