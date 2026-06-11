import { useMemo, useState } from 'react';
import DemoFrame from './DemoFrame';
import { useTokenizer } from './useTokenizer';

interface Props {
  defaultWord?: string;
  defaultLetter?: string;
  title?: string;
  caption?: string;
}

const CHIP_BG = [
  'color-mix(in oklch, var(--color-accent) 20%, transparent)',
  'color-mix(in oklch, var(--color-accent-2) 22%, transparent)',
  'color-mix(in oklch, var(--color-accent-3) 24%, transparent)',
  'color-mix(in oklch, var(--color-accent-4) 30%, transparent)',
];

export default function TokenBlindness({
  defaultWord = 'strawberry',
  defaultLetter = 'r',
  title = 'עיוורון הטוקנים',
  caption = 'משמאל מה שאתם רואים: אותיות. מימין מה שהמודל מקבל: טוקנים. האות שאתם סופרים חבויה בתוכם.',
}: Props) {
  const [word, setWord] = useState(defaultWord);
  const [letter, setLetter] = useState(defaultLetter);
  const { ready, tokenize } = useTokenizer();

  const target = letter.slice(0, 1).toLowerCase();
  const chars = [...word];
  const trueCount = useMemo(
    () =>
      target
        ? chars.filter((c) => c.toLowerCase() === target).length
        : 0,
    [chars, target]
  );

  const chips = useMemo(
    () => (ready ? tokenize(word) : []),
    [ready, word, tokenize]
  );

  return (
    <DemoFrame title={title} caption={caption}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row" dir="rtl">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-[var(--color-muted)]">מילה</span>
            <input
              dir="auto"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-mono text-base text-[var(--color-ink)] outline-none focus:border-[var(--color-accent-2)]"
              aria-label="מילה"
            />
          </label>
          <label className="flex w-full flex-col gap-1 sm:w-28">
            <span className="text-xs text-[var(--color-muted)]">
              אות לספירה
            </span>
            <input
              dir="ltr"
              value={letter}
              maxLength={1}
              onChange={(e) => setLetter(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-center font-mono text-base text-[var(--color-ink)] outline-none focus:border-[var(--color-accent-2)]"
              aria-label="אות לספירה"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* what you see */}
          <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-accent-3)] bg-white p-3">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              מה שאתם רואים
            </span>
            <div className="flex flex-wrap gap-0.5" dir="auto">
              {chars.map((c, i) => {
                const hit = target && c.toLowerCase() === target;
                return (
                  <span
                    key={i}
                    className="flex h-8 w-7 items-center justify-center rounded font-mono text-base"
                    style={{
                      background: hit
                        ? 'var(--color-accent-3)'
                        : 'var(--color-line)',
                      color: hit ? '#fff' : 'var(--color-ink)',
                    }}
                  >
                    {c}
                  </span>
                );
              })}
            </div>
            <div className="text-sm" dir="rtl">
              האות{' '}
              <span dir="ltr" className="font-mono font-bold">
                {target || '?'}
              </span>{' '}
              מופיעה{' '}
              <span className="font-mono text-lg font-bold text-[var(--color-accent-3)]">
                {trueCount}
              </span>{' '}
              פעמים.
            </div>
          </div>

          {/* what the model sees */}
          <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-line)] bg-white p-3">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              מה המודל מקבל
            </span>
            {!ready ? (
              <div className="py-2 text-sm text-[var(--color-muted)]">
                טוען...
              </div>
            ) : (
              <div className="flex flex-wrap gap-1" dir="auto">
                {chips.map((chip, i) => (
                  <span
                    key={i}
                    className="rounded px-2 py-1 font-mono text-sm"
                    style={{ background: CHIP_BG[i % CHIP_BG.length] }}
                    title={`token id ${chip.id}`}
                  >
                    {chip.text === null ? `⟨${chip.id}⟩` : chip.text}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-auto text-sm text-[var(--color-muted)]" dir="rtl">
              {chips.length} מספרים. לא אותיות. כדי לספור{' '}
              <span dir="ltr" className="font-mono">
                {target || '?'}
              </span>{' '}
              הוא צריך לנחש מה בתוך כל טוקן.
            </div>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
