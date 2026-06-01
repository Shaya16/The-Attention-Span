import { useState } from 'react';
import DemoFrame from './DemoFrame';

/**
 * PretrainFinetune
 *
 * Vertical pipeline: huge data -> pretraining -> base model -> small data ->
 * finetuning -> adapted model. Tabs highlight either phase; a relative
 * cost/time bar drives home why nobody trains from scratch every time.
 */

type Focus = 'all' | 'pre' | 'fine';

const DETAIL: Record<Focus, string> = {
  all: 'אותה לולאת אימון בדיוק בשני השלבים — ההבדל היחיד הוא הדאטה והעלות.',
  pre: 'Pretraining: מריצים את הלולאה על כמויות ענק של טקסט כדי לנחש את המילה הבאה. יקר ואיטי — אבל קורה פעם אחת.',
  fine: 'Finetuning: מתחילים ממודל שכבר יודע המון, ומכווננים אותו על דאטה קטן וממוקד. זול ומהיר — לכן לא מאמנים מאפס בכל פעם.',
};

export default function PretrainFinetune() {
  const [focus, setFocus] = useState<Focus>('all');

  const litPre = focus !== 'fine';
  const litFine = focus !== 'pre';

  const op = (lit: boolean) => (lit ? 1 : 0.35);

  const Card = ({
    lit,
    title,
    sub,
    strong,
  }: {
    lit: boolean;
    title: string;
    sub: string;
    strong?: boolean;
  }) => (
    <div
      className="rounded-xl border bg-white px-4 py-3 text-center transition-opacity"
      style={{
        opacity: op(lit),
        borderColor: strong ? 'var(--color-accent-2)' : 'var(--color-line)',
        borderWidth: strong ? 2 : 1,
      }}
    >
      <div className="text-sm font-semibold text-[var(--color-ink)]">{title}</div>
      <div className="mt-0.5 text-xs text-[var(--color-muted)]">{sub}</div>
    </div>
  );

  const Phase = ({
    lit,
    label,
    sub,
    tone,
  }: {
    lit: boolean;
    label: string;
    sub: string;
    tone: string;
  }) => (
    <div
      className="flex flex-col items-center gap-1 py-1 transition-opacity"
      style={{ opacity: op(lit) }}
    >
      <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true">
        <path
          d="M8 0 L8 14 M3 9 L8 15 L13 9"
          fill="none"
          stroke={tone}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ background: `color-mix(in oklch, ${tone} 14%, transparent)`, color: tone }}
      >
        {label}
      </span>
      <span className="text-[11px] text-[var(--color-muted)]">{sub}</span>
    </div>
  );

  const Tab = ({ id, label }: { id: Focus; label: string }) => (
    <button
      onClick={() => setFocus(id)}
      className="rounded-md px-3 py-1 font-mono text-xs transition"
      style={{
        background: focus === id ? 'var(--color-ink)' : 'transparent',
        color: focus === id ? 'white' : 'var(--color-muted)',
      }}
    >
      {label}
    </button>
  );

  return (
    <DemoFrame
      title="Pretraining → Finetuning"
      caption="אותה לולאה, פעמיים. הראשונה בונה מודל בסיס שיודע שפה ועולם; השנייה מכווננת אותו למשימה. עברו בין הלשוניות כדי להתמקד."
    >
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white p-0.5 w-fit">
          <Tab id="all" label="סקירה" />
          <Tab id="pre" label="Pretraining" />
          <Tab id="fine" label="Finetuning" />
        </div>

        <div className="mx-auto flex max-w-sm flex-col items-stretch gap-1">
          <Card
            lit={litPre}
            title="דאטה ענק"
            sub="אינטרנט · ספרים · קוד · מאמרים"
          />
          <Phase
            lit={litPre}
            label="Pretraining"
            sub="שבועות · אלפי GPU · מיליוני $"
            tone="var(--color-accent)"
          />
          <Card
            lit
            strong
            title="מודל בסיס"
            sub="מבין שפה ועולם — לא מותאם למשימה"
          />
          <Phase
            lit={litFine}
            label="Finetuning"
            sub="+ דאטה קטן וממוקד · זול · מהיר"
            tone="var(--color-accent-2)"
          />
          <Card
            lit={litFine}
            title="מודל מותאם"
            sub="מכוון לדומיין ספציפי"
          />
        </div>

        {/* relative cost bars */}
        <div className="space-y-2 rounded-lg bg-white p-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
            עלות יחסית
          </div>
          <div className="flex items-center gap-2" style={{ opacity: op(litPre) }}>
            <span className="w-20 shrink-0 font-mono text-[11px] text-[var(--color-muted)]">
              Pretraining
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-line)]">
              <div className="h-full rounded-full" style={{ width: '100%', background: 'var(--color-accent)' }} />
            </div>
            <span className="w-24 shrink-0 text-left text-[11px] text-[var(--color-muted)]">
              מיליוני $ · שבועות
            </span>
          </div>
          <div className="flex items-center gap-2" style={{ opacity: op(litFine) }}>
            <span className="w-20 shrink-0 font-mono text-[11px] text-[var(--color-muted)]">
              Finetuning
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-line)]">
              <div className="h-full rounded-full" style={{ width: '4%', background: 'var(--color-accent-2)' }} />
            </div>
            <span className="w-24 shrink-0 text-left text-[11px] text-[var(--color-muted)]">
              שבריר מהעלות
            </span>
          </div>
        </div>

        <div
          className="rounded-md bg-[color-mix(in_oklch,var(--color-accent)_6%,transparent)] p-3 text-sm leading-relaxed text-[var(--color-ink)]"
        >
          {DETAIL[focus]}
        </div>
      </div>
    </DemoFrame>
  );
}
