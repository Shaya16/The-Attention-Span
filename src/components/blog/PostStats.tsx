interface Props {
  claps: number;
  comments: number;
  tone?: 'light' | 'dark';
}

const fmt = (n: number) => n.toLocaleString('he-IL');

export default function PostStats({ claps, comments, tone = 'light' }: Props) {
  if (claps === 0 && comments === 0) return null;

  const color = tone === 'dark' ? 'text-white/80' : 'text-[var(--color-muted)]';

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs ${color}`}
      dir="ltr"
      aria-label={`${fmt(claps)} מחיאות כפיים, ${fmt(comments)} תגובות`}
    >
      <span className="inline-flex items-center gap-1">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 21s-6-4.35-9-8.5C1.5 9.5 3 6 6.5 6c1.74 0 3.41.81 4.5 2.09C12.09 6.81 13.76 6 15.5 6 19 6 20.5 9.5 21 12.5c-3 4.15-9 8.5-9 8.5z" />
        </svg>
        <span className="tabular-nums">{fmt(claps)}</span>
      </span>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span className="tabular-nums">{fmt(comments)}</span>
      </span>
    </span>
  );
}
