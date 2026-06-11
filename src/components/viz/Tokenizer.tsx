import { useMemo, useState } from 'react';
import DemoFrame from './DemoFrame';
import { useTokenizer } from './useTokenizer';

interface Props {
  defaultText?: string;
  title?: string;
  caption?: string;
}

// Cycled chip backgrounds, low-chroma so the mono text stays readable.
const CHIP_BG = [
  'color-mix(in oklch, var(--color-accent) 20%, transparent)',
  'color-mix(in oklch, var(--color-accent-2) 22%, transparent)',
  'color-mix(in oklch, var(--color-accent-3) 24%, transparent)',
  'color-mix(in oklch, var(--color-accent-4) 30%, transparent)',
];

function display(text: string): string {
  return text.replace(/ /g, '␣').replace(/\n/g, '↵');
}

export default function Tokenizer({
  defaultText = 'Hello strawberry שלום',
  title = 'Tokenizer אינטראקטיבי',
  caption = 'הטקסט שלכם מחולק לטוקנים אמיתיים של GPT-4 (cl100k). כל צבע הוא טוקן נפרד, עם ה-ID שלו.',
}: Props) {
  const [text, setText] = useState(defaultText);
  const { ready, tokenize } = useTokenizer();

  const chips = useMemo(
    () => (ready ? tokenize(text) : []),
    [ready, text, tokenize]
  );

  return (
    <DemoFrame title={title} caption={caption}>
      <div className="space-y-4">
        <textarea
          dir="auto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="כתבו כל טקסט..."
          className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-white px-3 py-2.5 font-mono text-base text-[var(--color-ink)] outline-none focus:border-[var(--color-accent-2)]"
          aria-label="טקסט לטוקניזציה"
        />

        <div className="rounded-lg bg-white p-3 sm:p-4" dir="auto">
          {!ready ? (
            <div className="py-2 text-center text-sm text-[var(--color-muted)]">
              טוען tokenizer...
            </div>
          ) : chips.length === 0 ? (
            <span className="text-sm text-[var(--color-muted)]">(ריק)</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {chips.map((chip, i) => (
                <span
                  key={i}
                  className="group relative rounded px-1.5 py-1 font-mono text-sm leading-tight"
                  style={{ background: CHIP_BG[i % CHIP_BG.length] }}
                  title={`token id ${chip.id}`}
                >
                  {chip.text === null ? (
                    <span className="text-[var(--color-muted)]">
                      ⟨{chip.id}⟩
                    </span>
                  ) : (
                    display(chip.text)
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] px-3 py-2.5"
          dir="rtl"
        >
          <Stat label="טוקנים" value={chips.length} accent />
          <Stat label="תווים" value={[...text].length} />
          <Stat
            label="תווים לטוקן"
            value={
              chips.length ? ([...text].length / chips.length).toFixed(2) : '0'
            }
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
