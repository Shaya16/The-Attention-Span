import { useTokenizer } from './useTokenizer';

interface Props {
  he?: string;
  en?: string;
}

// One fixed bilingual example, no card. Both bars share the same scale (the
// same "window"), so Hebrew visibly eats more of it than English for identical
// content. No inputs, no abstract numbers — just the gap.
export default function ContextWindow({
  he = 'שלום, מה שלומך היום?',
  en = 'Hello, how are you today?',
}: Props) {
  const { ready, count } = useTokenizer();
  const heTok = ready ? count(he) : 0;
  const enTok = ready ? count(en) : 0;
  // Scale so the heavier language (Hebrew) fills ~80% of the illustrative window.
  const scale = Math.max(heTok, 1) / 0.8;
  const ratio = enTok ? heTok / enTok : 0;

  return (
    <div className="not-prose my-7 space-y-4">
      <div className="space-y-4">
        <Row
          lang="עברית"
          sample={he}
          sampleDir="rtl"
          tokens={heTok}
          scale={scale}
          ready={ready}
          color="var(--color-accent)"
        />
        <Row
          lang="אנגלית"
          sample={en}
          sampleDir="ltr"
          tokens={enTok}
          scale={scale}
          ready={ready}
          color="var(--color-accent-3)"
        />
      </div>

      <p className="text-[11px] text-[var(--color-muted)]" dir="rtl">
        רוחב הפס = אותו חלון הקשר לשתי השפות (להמחשה). האפור = מה שנשאר פנוי.
      </p>

      {ready && ratio > 0 && (
        <p className="text-sm text-[var(--color-ink)]" dir="rtl">
          אותו משפט בדיוק, אבל עברית תופסת פי{' '}
          <span className="font-mono font-bold text-[var(--color-accent)]">
            ×{ratio.toFixed(1)}
          </span>{' '}
          יותר מהחלון, כלומר נכנס ממנה פחות לאותו זיכרון ונשאר פחות מקום להמשך השיחה.
        </p>
      )}
    </div>
  );
}

function Row({
  lang,
  sample,
  sampleDir,
  tokens,
  scale,
  ready,
  color,
}: {
  lang: string;
  sample: string;
  sampleDir: 'rtl' | 'ltr';
  tokens: number;
  scale: number;
  ready: boolean;
  color: string;
}) {
  const pct = ready ? Math.min(100, Math.max(4, (tokens / scale) * 100)) : 4;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3" dir="rtl">
        <span className="text-sm font-medium text-[var(--color-ink)]">{lang}</span>
        <span className="font-mono text-xs text-[var(--color-muted)]">
          {ready ? tokens : '…'} טוקנים
        </span>
      </div>
      <p className="truncate font-mono text-xs text-[var(--color-muted)]" dir={sampleDir}>
        {sample}
      </p>
      <div className="h-7 overflow-hidden rounded-md bg-[var(--color-line)]" dir="rtl">
        <div
          className="h-full rounded-md transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
