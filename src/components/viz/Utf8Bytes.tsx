import { useMemo, useState } from 'react';
import DemoFrame from './DemoFrame';

interface Props {
  defaultText?: string;
  title?: string;
  caption?: string;
}

const encoder = new TextEncoder();

// One color per byte-length bucket (1..4 bytes).
const BYTE_COLORS: Record<number, string> = {
  1: 'var(--color-accent-3)',
  2: 'var(--color-accent-2)',
  3: 'var(--color-accent)',
  4: 'var(--color-accent-4)',
};

interface Cell {
  char: string;
  bytes: number[];
}

function toCells(text: string): Cell[] {
  return [...text].map((char) => ({
    char,
    bytes: Array.from(encoder.encode(char)),
  }));
}

export default function Utf8Bytes({
  defaultText = 'Hi שלום',
  title = 'מחשבון UTF-8',
  caption = 'הקלידו טקסט בכל שפה. כל תו צבוע לפי כמה בייטים הוא תופס: ירוק=1, כחול=2, אדום=3.',
}: Props) {
  const [text, setText] = useState(defaultText);
  const cells = useMemo(() => toCells(text), [text]);

  const charCount = cells.length;
  const byteCount = cells.reduce((sum, c) => sum + c.bytes.length, 0);
  const ratio = charCount ? byteCount / charCount : 0;

  return (
    <DemoFrame title={title} caption={caption}>
      <div className="space-y-4">
        <input
          dir="auto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="כתבו כאן..."
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2.5 font-mono text-base text-[var(--color-ink)] outline-none focus:border-[var(--color-accent-2)]"
          aria-label="טקסט לקידוד"
        />

        <div
          className="flex flex-wrap gap-2 rounded-lg bg-white p-3 sm:p-4"
          dir="auto"
        >
          {cells.length === 0 && (
            <span className="text-sm text-[var(--color-muted)]">
              (ריק)
            </span>
          )}
          {cells.map((cell, i) => {
            const n = cell.bytes.length;
            const color = BYTE_COLORS[n] ?? 'var(--color-accent)';
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-1"
                title={`${n} bytes`}
              >
                <span
                  className="flex h-9 min-w-9 items-center justify-center rounded px-1.5 font-mono text-lg text-white"
                  style={{ background: color }}
                >
                  {cell.char === ' ' ? '␣' : cell.char}
                </span>
                <span className="font-mono text-[10px] leading-none text-[var(--color-muted)]">
                  {cell.bytes.join(' ')}
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] px-3 py-2.5 text-sm"
          dir="rtl"
        >
          <Stat label="תווים" value={charCount} />
          <Stat label="בייטים" value={byteCount} />
          <Stat
            label="בייטים לתו"
            value={ratio ? ratio.toFixed(2) : '0'}
            accent
          />
        </div>
      </div>
    </DemoFrame>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-mono text-xl tabular-nums"
        style={accent ? { color: 'var(--color-accent)' } : undefined}
      >
        {value}
      </span>
      <span className="text-xs text-[var(--color-muted)]">{label}</span>
    </div>
  );
}
