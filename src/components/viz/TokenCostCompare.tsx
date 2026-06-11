import { useMemo, useState } from 'react';
import DemoFrame from './DemoFrame';
import { useTokenizer } from './useTokenizer';

interface Pair {
  he: string;
  en: string;
}

const PAIRS: Pair[] = [
  { he: 'שלום, מה שלומך היום?', en: 'Hello, how are you today?' },
  {
    he: 'אני אוהב ללמוד על בינה מלאכותית.',
    en: 'I love learning about artificial intelligence.',
  },
  {
    he: 'המודל לא באמת מבין אותיות, רק טוקנים.',
    en: "The model doesn't really understand letters, only tokens.",
  },
  {
    he: 'כמה עולה לכתוב את המשפט הזה?',
    en: 'How much does it cost to write this sentence?',
  },
];

// Illustrative: GPT-4o input pricing, USD per 1M tokens. Labeled as an estimate.
const PRICE_PER_1M = 2.5;
const SENDS = 10_000;

function cost(tokens: number): number {
  return (tokens * SENDS * PRICE_PER_1M) / 1_000_000;
}

interface Props {
  title?: string;
  caption?: string;
}

export default function TokenCostCompare({
  title = 'עברית מול אנגלית: כמה זה עולה',
  caption = 'אותו משפט בשתי שפות, מטוקנן עם הטוקנייזר האמיתי של GPT-4. בחרו משפט והשוו מספר טוקנים ועלות.',
}: Props) {
  const [idx, setIdx] = useState(0);
  const { ready, count } = useTokenizer();
  const pair = PAIRS[idx];

  const { heTok, enTok } = useMemo(() => {
    if (!ready) return { heTok: 0, enTok: 0 };
    return { heTok: count(pair.he), enTok: count(pair.en) };
  }, [ready, pair, count]);

  const ratio = enTok ? heTok / enTok : 0;

  return (
    <DemoFrame title={title} caption={caption}>
      <div className="space-y-4">
        {/* preset picker */}
        <div className="flex flex-wrap gap-2" dir="rtl">
          {PAIRS.map((p, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="max-w-full truncate rounded-full border px-3 py-1.5 text-sm transition-colors"
              style={
                i === idx
                  ? {
                      borderColor: 'var(--color-accent)',
                      background:
                        'color-mix(in oklch, var(--color-accent) 12%, transparent)',
                      color: 'var(--color-ink)',
                    }
                  : {
                      borderColor: 'var(--color-line)',
                      color: 'var(--color-muted)',
                    }
              }
            >
              {p.he}
            </button>
          ))}
        </div>

        {/* two columns */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LangCard
            flag="עברית"
            text={pair.he}
            dir="rtl"
            tokens={heTok}
            ready={ready}
            highlight
          />
          <LangCard
            flag="English"
            text={pair.en}
            dir="ltr"
            tokens={enTok}
            ready={ready}
          />
        </div>

        {/* verdict */}
        {ready && enTok > 0 && (
          <div
            className="rounded-lg px-4 py-3 text-center text-sm"
            dir="rtl"
            style={{
              background:
                'color-mix(in oklch, var(--color-accent) 8%, transparent)',
            }}
          >
            עברית עולה{' '}
            <span className="font-mono text-lg font-bold text-[var(--color-accent)]">
              ×{ratio.toFixed(1)}
            </span>{' '}
            יותר על אותו תוכן.{' '}
            <span className="text-[var(--color-muted)]">
              ל-{SENDS.toLocaleString()} הודעות:{' '}
              <span dir="ltr" className="font-mono text-[var(--color-ink)]">
                ${cost(heTok).toFixed(2)}
              </span>{' '}
              מול{' '}
              <span dir="ltr" className="font-mono text-[var(--color-ink)]">
                ${cost(enTok).toFixed(2)}
              </span>
            </span>
          </div>
        )}

        <p className="text-[11px] text-[var(--color-muted)]" dir="rtl">
          * מספר הטוקנים לפי הטוקנייזר של GPT-4 (cl100k), ותמחור input טיפוסי של{' '}
          ${PRICE_PER_1M} ל-1M טוקנים. להמחשה בלבד.
        </p>
      </div>
    </DemoFrame>
  );
}

function LangCard({
  flag,
  text,
  dir,
  tokens,
  ready,
  highlight = false,
}: {
  flag: string;
  text: string;
  dir: 'rtl' | 'ltr';
  tokens: number;
  ready: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-3"
      style={{
        borderColor: highlight ? 'var(--color-accent)' : 'var(--color-line)',
      }}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
        {flag}
      </span>
      <p className="text-sm text-[var(--color-ink)]" dir={dir}>
        {text}
      </p>
      <div className="mt-auto flex items-baseline gap-1.5 pt-1" dir="rtl">
        <span
          className="font-mono text-2xl tabular-nums"
          style={{
            color: highlight ? 'var(--color-accent)' : 'var(--color-ink)',
          }}
        >
          {ready ? tokens : '…'}
        </span>
        <span className="text-xs text-[var(--color-muted)]">טוקנים</span>
      </div>
    </div>
  );
}
