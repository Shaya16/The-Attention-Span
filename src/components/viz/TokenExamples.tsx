import { useMemo } from 'react';
import { useTokenizer } from './useTokenizer';

// Cycled chip backgrounds, low-chroma so the mono text stays readable.
const CHIP_BG = [
  'color-mix(in oklch, var(--color-accent) 20%, transparent)',
  'color-mix(in oklch, var(--color-accent-2) 22%, transparent)',
  'color-mix(in oklch, var(--color-accent-3) 24%, transparent)',
  'color-mix(in oklch, var(--color-accent-4) 30%, transparent)',
];

const display = (t: string) => t.replace(/ /g, '␣').replace(/\n/g, '↵');

interface Example {
  text: string;
  note: string;
}

// Curated to show the non-intuitive bits: a whole word as one token, a word
// that fractures, capitalization changing the token, and a leading space that
// glues into the token. All tokenized for real (cl100k), no hardcoding.
const DEFAULT_EXAMPLES: Example[] = [
  { text: 'hello', note: 'מילה שלמה, טוקן אחד' },
  { text: 'strawberry', note: 'נחתכת לשלושה' },
  { text: 'Hello', note: 'אות גדולה, טוקן אחר לגמרי' },
  { text: ' world', note: 'הרווח שייך לטוקן' },
];

interface Props {
  examples?: Example[];
}

export default function TokenExamples({ examples = DEFAULT_EXAMPLES }: Props) {
  const { ready, tokenize } = useTokenizer();

  const rows = useMemo(
    () =>
      examples.map((ex) => ({
        ...ex,
        chips: ready ? tokenize(ex.text) : [],
      })),
    [ready, examples, tokenize]
  );

  return (
    <div className="not-prose my-7 flex flex-col divide-y divide-[var(--color-line)]">
      {rows.map((row, ri) => (
        <div
          key={ri}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5"
          dir="ltr"
        >
          <code className="min-w-[6.5rem] font-mono text-sm text-[var(--color-ink)]">
            "{display(row.text)}"
          </code>
          <span className="text-[var(--color-muted)]" aria-hidden="true">
            →
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {!ready ? (
              <span className="text-sm text-[var(--color-muted)]">…</span>
            ) : (
              row.chips.map((chip, i) => (
                <span
                  key={i}
                  className="rounded px-1.5 py-0.5 font-mono text-sm leading-tight"
                  style={{ background: CHIP_BG[i % CHIP_BG.length] }}
                  title={`token id ${chip.id}`}
                >
                  {chip.text === null ? (
                    <span className="text-[var(--color-muted)]">⟨{chip.id}⟩</span>
                  ) : (
                    display(chip.text)
                  )}
                </span>
              ))
            )}
          </div>
          <span
            className="ms-auto text-xs text-[var(--color-muted)]"
            dir="rtl"
          >
            {row.note}
          </span>
        </div>
      ))}
    </div>
  );
}
