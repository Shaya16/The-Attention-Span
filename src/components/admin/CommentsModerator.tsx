import { useEffect, useState } from 'react';

type Status = 'pending' | 'approved' | 'rejected';

interface Comment {
  id: number;
  slug: string;
  author: string;
  body: string;
  created_at: number;
  status: Status;
}

const formatTime = (ms: number) =>
  new Date(ms).toLocaleString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function CommentsModerator() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = useState<Status>('pending');
  const [items, setItems] = useState<Comment[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async (s: Status) => {
    setErr(null);
    setItems(null);
    const res = await fetch(`/api/admin/comments?status=${s}`, { credentials: 'include' });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) {
      setErr('שגיאה בטעינה');
      return;
    }
    const data = (await res.json()) as { comments: Comment[] };
    setItems(data.comments);
    setAuthed(true);
  };

  useEffect(() => {
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLoginErr(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setLoginErr('סיסמה שגויה');
        return;
      }
      setPassword('');
      await load(status);
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setAuthed(false);
    setItems(null);
  };

  const moderate = async (id: number, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/admin/comments/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setItems((arr) => (arr ?? []).filter((c) => c.id !== id));
    } else {
      setErr('פעולה נכשלה');
    }
  };

  if (authed === null) {
    return <p style={{ color: '#888' }}>טוען…</p>;
  }

  if (!authed) {
    return (
      <form
        onSubmit={doLogin}
        style={{
          maxWidth: 360,
          margin: '80px auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 24,
          border: '1px solid #eee',
          borderRadius: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>כניסת מנהל</h1>
        <input
          type="password"
          required
          autoFocus
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            font: 'inherit',
            fontSize: 14,
          }}
        />
        {loginErr && (
          <p style={{ color: '#c00', fontSize: 13, margin: 0 }}>{loginErr}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {busy ? 'בודק…' : 'כניסה'}
        </button>
      </form>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: '40px auto', padding: '0 20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>תגובות</h1>
        <button
          onClick={doLogout}
          style={{
            background: 'transparent',
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 13,
            color: '#555',
          }}
        >
          יציאה
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['pending', 'approved', 'rejected'] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              background: status === s ? '#111' : 'transparent',
              color: status === s ? '#fff' : '#555',
              border: '1px solid ' + (status === s ? '#111' : '#ddd'),
              borderRadius: 999,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {s === 'pending' ? 'ממתינות' : s === 'approved' ? 'מאושרות' : 'נדחו'}
          </button>
        ))}
      </div>

      {err && <p style={{ color: '#c00' }}>{err}</p>}

      {!items ? (
        <p style={{ color: '#888' }}>טוען…</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#888' }}>אין כלום כאן.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {items.map((c) => (
            <li
              key={c.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 8,
                padding: '12px 14px',
                background: '#fafaf9',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontSize: 12,
                  color: '#888',
                  gap: 8,
                }}
              >
                <span>
                  <strong style={{ color: '#222' }}>{c.author}</strong>
                  <span style={{ margin: '0 6px' }}>·</span>
                  <code style={{ direction: 'ltr', fontSize: 11 }}>{c.slug}</code>
                </span>
                <time>{formatTime(c.created_at)}</time>
              </div>
              <p
                style={{
                  margin: '8px 0 12px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.55,
                  fontSize: 14,
                }}
              >
                {c.body}
              </p>
              {status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => moderate(c.id, 'reject')}
                    style={{
                      background: 'transparent',
                      color: '#c00',
                      border: '1px solid #f3c2c2',
                      borderRadius: 6,
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    דחה
                  </button>
                  <button
                    onClick={() => moderate(c.id, 'approve')}
                    style={{
                      background: '#0a7a3a',
                      color: '#fff',
                      border: '1px solid #0a7a3a',
                      borderRadius: 6,
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    אשר
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
