import { useState } from 'react';
import DemoFrame from './DemoFrame';

type Role = 'q' | 'k' | 'v';
type Tab = 'vectors' | 'google';

const WORDS = ['היא', 'המורה', 'עצבנית'] as const;
type Word = (typeof WORDS)[number];

const VEC_DIM = 6;
const ROLE_SALT: Record<Role, number> = { q: 23, k: 37, v: 53 };

function hash32(s: string, salt: number): number {
  let h = salt >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function vectorFor(word: string, role: Role): number[] {
  const salt = ROLE_SALT[role];
  return Array.from({ length: VEC_DIM }, (_, i) => {
    const h = hash32(`${i}|${role}|${word}`, salt);
    return ((h % 200) - 100) / 100;
  });
}

function MagnitudeBars({
  values,
  color,
  ariaLabel,
}: {
  values: number[];
  color: string;
  ariaLabel?: string;
}) {
  return (
    <div className="flex gap-1" dir="ltr" role="img" aria-label={ariaLabel}>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex h-7 w-5 flex-col-reverse overflow-hidden rounded-sm border border-[var(--color-line)] sm:w-6"
          title={Math.abs(v).toFixed(2)}
        >
          <div
            style={{
              height: `${Math.max(6, Math.abs(v) * 100)}%`,
              background: color,
            }}
          />
        </div>
      ))}
    </div>
  );
}

const ROLE_LABELS: Record<Role, { he: string; en: string }> = {
  q: { he: 'שואלת', en: 'Query' },
  k: { he: 'מציעה', en: 'Key' },
  v: { he: 'תוכן', en: 'Value' },
};

const KIND_COLOR: Record<Role, string> = {
  q: 'var(--color-accent-2)',
  k: 'var(--color-accent-3)',
  v: 'var(--color-accent-4)',
};

// Concrete linguistic descriptions per (word, role).
// These are *interpretive* - real Q/K/V are learned and not directly interpretable,
// but pedagogically the descriptions make the abstraction tangible.
const DESCRIPTIONS: Record<Word, Record<Role, string>> = {
  היא: {
    q: 'מחפשת שם עצם נקבה שכבר הוזכר במשפט',
    k: 'אני כינוי גוף יחיד, מין נקבה',
    v: 'הפנייה לסובייקט קודם',
  },
  המורה: {
    q: 'מחפשת תכונה או סיבה לפעולה שלי',
    k: 'אני שם עצם נקבה, סוכנת פעולה',
    v: 'דמות סמכותית, מבצעת הצעקה',
  },
  עצבנית: {
    q: 'מחפשת את מי שמרגישה כך',
    k: 'אני תכונה רגשית של מישהי',
    v: 'סיבה רגשית לפעולה אגרסיבית',
  },
};

const GOOGLE_CONTENT: Record<Word, { snippet: string; body: string }> = {
  היא: {
    snippet: 'כינוי גוף בנקבה, מצביע על נושא קודם במשפט.',
    body: 'המילה "היא" מחפשת התייחסות אחורה, בדרך כלל למילה האחרונה בעלת המין המתאים.',
  },
  המורה: {
    snippet: 'שם עצם נקבה. דמות סמכותית בכיתה.',
    body: 'המורה היא הסוכנת של הפעולה במשפט. היא מבצעת את הצעקה ולכן יכולה להיות גם הסובייקט של "היא".',
  },
  עצבנית: {
    snippet: 'תכונה רגשית. מצב של עצבים, חוסר סבלנות.',
    body: 'עצבנות היא סיבה טבעית לצעקה. המילה הזאת היא רמז חזק שמי שמרגיש כך הוא גם מי שצעק.',
  },
};

export default function QKV() {
  const [tab, setTab] = useState<Tab>('vectors');
  const [word, setWord] = useState<Word>(WORDS[0]);

  return (
    <DemoFrame
      title="Q, K, V"
      caption="כל מילה הופכת לשלושה וקטורים שונים, אחד לכל תפקיד."
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex justify-center" dir="rtl">
          <div
            className="inline-flex rounded-lg bg-[var(--color-line)] p-1"
            role="tablist"
          >
            {(
              [
                { key: 'vectors', label: 'וקטורים' },
                { key: 'google', label: 'אנלוגיית גוגל' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-11 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-white text-[var(--color-ink)] shadow-sm'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shared word selector */}
        <div className="flex flex-col items-center gap-2" dir="rtl">
          <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            בחרו מילה מהמשפט
          </span>
          <div className="inline-flex rounded-md border border-[var(--color-line)] bg-white p-0.5">
            {WORDS.map((w) => (
              <button
                key={w}
                onClick={() => setWord(w)}
                aria-pressed={word === w}
                className={`min-h-11 rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
                  word === w
                    ? 'bg-[var(--color-ink)] text-white'
                    : 'text-[var(--color-ink)]'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {tab === 'vectors' ? <VectorsTab word={word} /> : <GoogleTab word={word} />}
      </div>
    </DemoFrame>
  );
}

function VectorsTab({ word }: { word: Word }) {
  return (
    <div className="space-y-4 rounded-lg bg-white p-3 sm:p-4">
      {/* Intro */}
      <p
        className="text-sm leading-relaxed text-[var(--color-muted)]"
        dir="rtl"
      >
        המילה{' '}
        <span className="font-bold text-[var(--color-ink)]">"{word}"</span> משחקת
        שלושה תפקידים שונים בו-זמנית. כל תפקיד הוא וקטור אחר, נלמד מאותו x דרך
        מטריצה אחרת. הנה מה שכל אחד מהם "אומר":
      </p>

      <p className="text-xs text-[var(--color-muted)]" dir="rtl">
        כל ריבוע = מספר אחד בוקטור. גובה המילוי = גודל המספר.
      </p>

      {/* Q, K, V cards */}
      <div className="space-y-3" dir="rtl">
        {(['q', 'k', 'v'] as Role[]).map((role) => {
          const desc = DESCRIPTIONS[word][role];
          const color = KIND_COLOR[role];
          const rl = ROLE_LABELS[role];
          const vec = vectorFor(word, role);
          return (
            <div
              key={role}
              className="rounded-md border bg-white p-3"
              style={{ borderColor: color }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-base font-bold"
                    style={{ color }}
                  >
                    {rl.en}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color }}
                  >
                    ({rl.he})
                  </span>
                </div>
                <MagnitudeBars
                  values={vec}
                  color={color}
                  ariaLabel={`${rl.en} vector`}
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">
                "{desc}"
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-xs italic text-[var(--color-muted)]" dir="rtl">
        ההסברים בעברית הם פרשנות אנושית. במציאות, מה ש-Q/K/V "אומרים" נלמד
        מהנתונים ולא ניתן לפענוח ישיר במילים.
      </p>
    </div>
  );
}

function GoogleTab({ word }: { word: Word }) {
  const content = GOOGLE_CONTENT[word];
  return (
    <div className="space-y-3 rounded-lg bg-white p-3 sm:p-4" dir="rtl">
      {/* Query: search box */}
      <div
        className="rounded-md border p-3"
        style={{ borderColor: KIND_COLOR.q }}
      >
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span
            className="font-mono text-base font-bold"
            style={{ color: KIND_COLOR.q }}
          >
            Query (Q)
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {ROLE_LABELS.q.he}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-3 py-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle
              cx="8.5"
              cy="8.5"
              r="5.5"
              stroke="var(--color-muted)"
              strokeWidth="1.5"
            />
            <path
              d="M 13 13 L 17 17"
              stroke="var(--color-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-mono text-base text-[var(--color-ink)]">
            {word}
          </span>
        </div>
      </div>

      <Arrow />

      {/* Key: result snippet */}
      <div
        className="rounded-md border p-3"
        style={{ borderColor: KIND_COLOR.k }}
      >
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span
            className="font-mono text-base font-bold"
            style={{ color: KIND_COLOR.k }}
          >
            Key (K)
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {ROLE_LABELS.k.he}
          </span>
        </div>
        <div className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2">
          <div className="text-sm font-semibold" style={{ color: KIND_COLOR.k }}>
            {word} - תיאור
          </div>
          <div className="mt-1 text-sm text-[var(--color-muted)]">
            {content.snippet}
          </div>
        </div>
      </div>

      <Arrow />

      {/* Value: page content */}
      <div
        className="rounded-md border p-3"
        style={{ borderColor: KIND_COLOR.v }}
      >
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span
            className="font-mono text-base font-bold"
            style={{ color: KIND_COLOR.v }}
          >
            Value (V)
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {ROLE_LABELS.v.he}
          </span>
        </div>
        <div className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm leading-relaxed text-[var(--color-ink)]">
          {content.body}
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center text-[var(--color-muted)]" aria-hidden>
      <svg width="16" height="20" viewBox="0 0 16 20">
        <path
          d="M 8 0 L 8 16 M 2 12 L 8 18 L 14 12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
