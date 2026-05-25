import { useMemo, useState } from 'react';
import DemoFrame from './DemoFrame';

interface Props {
  defaultSentence?: string;
}

const PRESET_SENTENCES: { label: string; text: string }[] = [
  {
    label: 'מורה עצבנית',
    text: 'המורה צעקה על התלמידה כי היא הייתה עצבנית',
  },
  {
    label: 'תלמידה חצופה',
    text: 'המורה צעקה על התלמידה כי היא התחצפה',
  },
];

function tokenize(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

// Hand-tuned attention matrices that mimic patterns a real transformer
// produces on these specific sentences. Each row is a valid distribution
// (sums to 1). The pronoun rows (היא) correctly resolve to their antecedent
// based on the contextual disambiguator at the end of the clause.
const ATTENTION_MATRICES: Record<string, number[][]> = {
  // Tokens: 0=המורה 1=צעקה 2=על 3=התלמידה 4=כי 5=היא 6=הייתה 7=עצבנית
  // "היא" → המורה (the angry one is the teacher)
  'המורה צעקה על התלמידה כי היא הייתה עצבנית': [
    [0.30, 0.20, 0.05, 0.05, 0.03, 0.08, 0.04, 0.25],
    [0.35, 0.20, 0.10, 0.15, 0.05, 0.05, 0.05, 0.05],
    [0.05, 0.15, 0.10, 0.40, 0.10, 0.05, 0.10, 0.05],
    [0.05, 0.10, 0.30, 0.30, 0.05, 0.10, 0.05, 0.05],
    [0.10, 0.15, 0.05, 0.10, 0.15, 0.15, 0.10, 0.20],
    [0.42, 0.05, 0.02, 0.12, 0.06, 0.15, 0.05, 0.13],
    [0.05, 0.05, 0.02, 0.05, 0.05, 0.30, 0.15, 0.33],
    [0.30, 0.05, 0.02, 0.05, 0.03, 0.20, 0.10, 0.25],
  ],
  // Tokens: 0=המורה 1=צעקה 2=על 3=התלמידה 4=כי 5=היא 6=התחצפה
  // "היא" → התלמידה (the one who acted out is the student)
  'המורה צעקה על התלמידה כי היא התחצפה': [
    [0.30, 0.25, 0.05, 0.10, 0.05, 0.10, 0.15],
    [0.35, 0.20, 0.10, 0.15, 0.05, 0.05, 0.10],
    [0.05, 0.15, 0.10, 0.45, 0.10, 0.05, 0.10],
    [0.05, 0.10, 0.30, 0.25, 0.05, 0.10, 0.15],
    [0.10, 0.15, 0.05, 0.10, 0.15, 0.15, 0.30],
    [0.10, 0.05, 0.02, 0.42, 0.06, 0.15, 0.20],
    [0.10, 0.05, 0.02, 0.30, 0.03, 0.20, 0.30],
  ],
};

function weightsFor(sentence: string, tokens: string[]): number[][] {
  const baked = ATTENTION_MATRICES[sentence];
  if (baked && baked.length === tokens.length) return baked;
  // Uniform fallback (shouldn't fire since all preset sentences are baked)
  const n = tokens.length;
  return Array.from({ length: n }, () => Array(n).fill(1 / n));
}

const SVG_WIDTH = 360;
const LEFT_X = 78;
const RIGHT_X = SVG_WIDTH - 78;
const ROW_GAP = 38;
const ROW_TOP = 28;
const MAX_BAND = 11;
const HIT_HEIGHT = 34;

export default function AttentionDemo({ defaultSentence }: Props) {
  const initialIdx = (() => {
    if (!defaultSentence) return 0;
    const found = PRESET_SENTENCES.findIndex((p) => p.text === defaultSentence);
    return found >= 0 ? found : 0;
  })();
  const [sentenceIdx, setSentenceIdx] = useState(initialIdx);
  const [selected, setSelected] = useState<number | null>(null);

  const sentence = PRESET_SENTENCES[sentenceIdx].text;
  const tokens = useMemo(() => tokenize(sentence), [sentence]);
  const weights = useMemo(() => weightsFor(sentence, tokens), [sentence, tokens]);

  const n = tokens.length;
  const svgHeight = ROW_TOP + (n + 1) * ROW_GAP;
  const yFor = (i: number) => ROW_TOP + (i + 1) * ROW_GAP;

  const bands: { i: number; j: number; w: number; path: string }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const w = weights[i]?.[j] ?? 0;
      if (w < 0.005) continue;
      const yi = yFor(i);
      const yj = yFor(j);
      const cx = (RIGHT_X + LEFT_X) / 2;
      const path = `M ${RIGHT_X} ${yi} C ${cx} ${yi}, ${cx} ${yj}, ${LEFT_X} ${yj}`;
      bands.push({ i, j, w, path });
    }
  }
  // Render thinner bands on top so big ones don't fully cover smaller ones beneath
  bands.sort((a, b) => b.w - a.w);

  function selectTarget(i: number) {
    setSelected((curr) => (curr === i ? null : i));
  }

  const topMatch =
    selected !== null
      ? tokens[weights[selected].indexOf(Math.max(...weights[selected]))]
      : null;

  return (
    <DemoFrame
      title="Attention demo"
      caption="לחצו על מילה בצד ימין כדי לראות אילו מילים היא מקבלת מהן הכי הרבה משקל."
    >
      <div className="space-y-4">
        {/* sentence chips */}
        <div className="flex flex-wrap justify-center gap-2" dir="rtl">
          {PRESET_SENTENCES.map((p, idx) => {
            const active = sentenceIdx === idx;
            return (
              <button
                key={p.label}
                onClick={() => {
                  setSentenceIdx(idx);
                  setSelected(null);
                }}
                aria-pressed={active}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-[var(--color-accent-2)] bg-[var(--color-accent-2)] text-white'
                    : 'border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-accent-2)]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* current sentence */}
        <div
          className="rounded-md border border-[var(--color-line)] bg-white px-4 py-3 text-center text-base text-[var(--color-ink)]"
          dir="rtl"
        >
          {sentence}
        </div>

        {/* Sankey */}
        <div className="rounded-lg bg-white p-2 sm:p-3">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
            className="mx-auto h-auto w-full select-none"
            style={{ maxWidth: SVG_WIDTH }}
          >
            {/* column captions */}
            <text
              x={RIGHT_X + 4}
              y={ROW_TOP - 2}
              textAnchor="start"
              fontSize="11"
              fill="var(--color-muted)"
              fontWeight="500"
              style={{ direction: 'rtl' }}
            >
              שואלת
            </text>
            <text
              x={LEFT_X - 4}
              y={ROW_TOP - 2}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-muted)"
              fontWeight="500"
              style={{ direction: 'rtl' }}
            >
              מסתכלת על
            </text>

            {/* bands */}
            <g>
              {bands.map((b, idx) => {
                const opacity =
                  selected === null ? 0.28 : selected === b.i ? 0.9 : 0.05;
                return (
                  <path
                    key={`${b.i}-${b.j}-${idx}`}
                    d={b.path}
                    stroke="var(--color-accent-2)"
                    strokeWidth={Math.max(1.2, b.w * MAX_BAND)}
                    fill="none"
                    opacity={opacity}
                    style={{ transition: 'opacity 200ms ease' }}
                  />
                );
              })}
            </g>

            {/* target row hitboxes (full row tappable) */}
            {tokens.map((_, i) => {
              const y = yFor(i);
              return (
                <rect
                  key={`hit-${i}`}
                  x={RIGHT_X - 6}
                  y={y - HIT_HEIGHT / 2}
                  width={86}
                  height={HIT_HEIGHT}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => selectTarget(i)}
                  role="button"
                  aria-label={`בחר ${tokens[i]}`}
                />
              );
            })}

            {/* target labels (right column) */}
            {tokens.map((tok, i) => {
              const y = yFor(i);
              const isActive = selected === i;
              return (
                <text
                  key={`t-${i}`}
                  x={RIGHT_X + 4}
                  y={y + 5}
                  textAnchor="start"
                  fontSize="14"
                  fontWeight={isActive ? 700 : 500}
                  fill={isActive ? 'var(--color-accent-2)' : 'var(--color-ink)'}
                  paintOrder="stroke fill"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  style={{ direction: 'rtl', pointerEvents: 'none' }}
                >
                  {tok}
                </text>
              );
            })}

            {/* source labels (left column) */}
            {tokens.map((tok, i) => {
              const y = yFor(i);
              return (
                <text
                  key={`s-${i}`}
                  x={LEFT_X - 4}
                  y={y + 5}
                  textAnchor="end"
                  fontSize="14"
                  fontWeight="500"
                  fill="var(--color-ink)"
                  paintOrder="stroke fill"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  style={{ direction: 'rtl', pointerEvents: 'none' }}
                >
                  {tok}
                </text>
              );
            })}
          </svg>
        </div>

        {/* status */}
        <div className="text-center text-sm text-[var(--color-muted)]" dir="rtl">
          {selected === null ? (
            'לחצו על מילה ימנית כדי לבודד את המשקלים שלה.'
          ) : (
            <>
              <span className="font-medium text-[var(--color-ink)]">
                "{tokens[selected]}"
              </span>{' '}
              מסתכלת הכי הרבה על{' '}
              <span className="font-medium text-[var(--color-accent-2)]">
                "{topMatch}"
              </span>
            </>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}
