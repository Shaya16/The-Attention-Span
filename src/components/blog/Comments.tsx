import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface Props {
  slug: string;
}

interface Comment {
  id: number;
  author: string;
  body: string;
  created_at: number;
}

const TURNSTILE_SITE_KEY =
  (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined) ?? '';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

let turnstileScriptLoaded = false;
function loadTurnstile(): Promise<void> {
  if (turnstileScriptLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      turnstileScriptLoaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error('turnstile script failed'));
    document.head.appendChild(s);
  });
}

const formatTime = (ms: number) =>
  new Date(ms).toLocaleString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function Comments({ slug }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Load comments.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { comments?: Comment[] } | null) => {
        if (cancelled) return;
        setComments(data?.comments ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Mount Turnstile widget once script is loaded.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !widgetRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(widgetRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (t) => setToken(t),
          'expired-callback': () => setToken(null),
          'error-callback': () => setToken(null),
          theme: 'auto',
          size: 'flexible',
        });
      })
      .catch(() => {
        // Silent — the form will surface "captcha not loaded" on submit.
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!author.trim()) {
      setError('נא להזין שם');
      return;
    }
    if (!body.trim()) {
      setError('נא לכתוב תגובה');
      return;
    }
    if (TURNSTILE_SITE_KEY && !token) {
      setError('נא להמתין לסיום אימות האנטי-ספאם');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          author: author.trim(),
          body: body.trim(),
          turnstileToken: token ?? '',
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'submit failed');
      }
      setSuccess(true);
      setAuthor('');
      setBody('');
      setToken(null);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="comments"
      className="mt-12 scroll-mt-8 border-t border-[var(--color-line)] pt-10"
      dir="rtl"
      aria-labelledby="comments-heading"
    >
      <h2
        id="comments-heading"
        className="mb-6 text-xl font-semibold tracking-tight"
      >
        תגובות{' '}
        <span className="text-[var(--color-muted)]">
          ({comments.length.toLocaleString('he-IL')})
        </span>
      </h2>

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">טוען תגובות…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          תהיו הראשונים להגיב.
        </p>
      ) : (
        <ul className="space-y-6">
          {comments.map((c) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg border border-[var(--color-line)] bg-[color-mix(in_oklch,var(--color-paper)_92%,var(--color-line))] p-4"
            >
              <div className="flex items-baseline justify-between gap-2 text-xs text-[var(--color-muted)]">
                <span className="font-medium text-[var(--color-ink)]" dir="auto">
                  {c.author}
                </span>
                <time dateTime={new Date(c.created_at).toISOString()}>
                  {formatTime(c.created_at)}
                </time>
              </div>
              <p
                className="mt-2 whitespace-pre-wrap text-[0.95rem] leading-relaxed"
                dir="auto"
              >
                {c.body}
              </p>
            </motion.li>
          ))}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-10 flex flex-col gap-3 rounded-xl border border-[var(--color-line)] p-4 sm:p-5"
      >
        <h3 className="text-sm font-medium text-[var(--color-muted)]">
          השאירו תגובה
        </h3>
        {success ? (
          <p className="text-sm text-[var(--color-accent-3)]">
            תודה! התגובה ממתינה לאישור ותופיע כאן בקרוב.
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-muted)]">שם</span>
          <input
            type="text"
            required
            maxLength={60}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="rounded-md border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            dir="auto"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-muted)]">תגובה</span>
          <textarea
            required
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="resize-y rounded-md border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm leading-relaxed focus:border-[var(--color-accent)] focus:outline-none"
            dir="auto"
          />
        </label>

        {TURNSTILE_SITE_KEY ? (
          <div ref={widgetRef} className="my-1" />
        ) : (
          <p className="text-xs text-[var(--color-muted)]">
            (אנטי-ספאם לא הוגדר — הוסיפו <code>PUBLIC_TURNSTILE_SITE_KEY</code>)
          </p>
        )}

        {error ? (
          <p className="text-sm text-[var(--color-accent)]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="self-end rounded-full border border-[var(--color-ink)] bg-[var(--color-ink)] px-5 py-2 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? 'שולח…' : 'שלחו'}
        </button>
      </form>
    </section>
  );
}
