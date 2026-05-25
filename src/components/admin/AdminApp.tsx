import { useEffect, useRef, useState, useCallback } from 'react';
import MdxEditorIsland, { type EditorHandle } from './MdxEditorIsland';
import FrontmatterForm, { type Frontmatter } from './FrontmatterForm';

function slugFromPath(p: string): string | null {
  const m = p.match(/^blog\/(.+)\.(mdx?|MDX?)$/);
  return m ? m[1] : null;
}

function postUrlFor(p: string): string | null {
  const s = slugFromPath(p);
  return s ? `/posts/${s}` : null;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// MDXEditor parses `\text{Attention}` inside math as a JS expression and dies.
// Wrap math in a JSX element on load so MDX treats the LaTeX as an opaque
// string attribute; unwrap on save back to the original markdown syntax.
const MATH_BLOCK_RE = /\$\$([\s\S]*?)\$\$/g;
const MATH_INLINE_RE = /(?<![\w$\\])\$([^\s$][^$\n]*?[^\s$]|[^\s$\\])\$(?!\w)/g;
const escapeForJsxString = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
const unescapeFromJsxString = (s: string) =>
  s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

function wrapMathForEditor(md: string): string {
  let out = md.replace(MATH_BLOCK_RE, (_, latex) =>
    `<MdxMathBlock latex="${escapeForJsxString(latex.trim())}" />`
  );
  out = out.replace(MATH_INLINE_RE, (_, latex) =>
    `<MdxMath latex="${escapeForJsxString(latex)}" />`
  );
  return out;
}

const MATH_WRAPPER_BLOCK_RE = /<MdxMathBlock\s+latex="((?:[^"\\]|\\.)*)"\s*\/>/g;
const MATH_WRAPPER_INLINE_RE = /<MdxMath\s+latex="((?:[^"\\]|\\.)*)"\s*\/>/g;

function unwrapMathForSave(md: string): string {
  let out = md.replace(MATH_WRAPPER_BLOCK_RE, (_, latex) =>
    `$$\n${unescapeFromJsxString(latex)}\n$$`
  );
  out = out.replace(MATH_WRAPPER_INLINE_RE, (_, latex) =>
    `$${unescapeFromJsxString(latex)}$`
  );
  return out;
}

interface SavedSnapshot {
  frontmatter: Frontmatter;
  body: string; // wrapped form (math-wrapped, CRLF-normalized)
}

const eqFm = (a: Frontmatter, b: Frontmatter) => JSON.stringify(a) === JSON.stringify(b);

export default function AdminApp() {
  const [files, setFiles] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({});
  const [initialBody, setInitialBody] = useState<string>('');
  const [saved, setSaved] = useState<SavedSnapshot>({ frontmatter: {}, body: '' });
  const [editorBody, setEditorBody] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const editorRef = useRef<EditorHandle>(null);

  const dirty = !!currentPath && (!eqFm(frontmatter, saved.frontmatter) || editorBody !== saved.body);

  // ------- file list -------
  const loadList = useCallback(async () => {
    const res = await fetch('/api/admin/list');
    const j = await res.json();
    setFiles(j.files ?? []);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // ------- open file -------
  const openFile = useCallback(async (path: string) => {
    if (dirty && !confirm('Discard unsaved changes?')) return;
    const res = await fetch('/api/admin/file?path=' + encodeURIComponent(path));
    const j = await res.json();
    const wrappedBody = wrapMathForEditor((j.body ?? '').replace(/\r\n/g, '\n'));
    setCurrentPath(path);
    setFrontmatter(j.frontmatter ?? {});
    setInitialBody(wrappedBody);
    setEditorBody(wrappedBody);
    setSaved({ frontmatter: j.frontmatter ?? {}, body: wrappedBody });
    setStatus('saved');
    history.replaceState(null, '', '/admin?path=' + encodeURIComponent(path));
  }, [dirty]);

  // Open via URL param on first load
  useEffect(() => {
    const initial = new URLSearchParams(location.search).get('path');
    if (initial) openFile(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- change tracking -------
  const handleEditorChange = useCallback((md: string) => {
    setEditorBody(md);
  }, []);

  // ------- save -------
  const save = useCallback(async () => {
    if (!currentPath) return;
    const editorMd = editorRef.current?.getMarkdown() ?? editorBody;
    const body = unwrapMathForSave(editorMd);
    // Optimistically clear dirty BEFORE the POST so that any page reload
    // triggered by Vite/Astro doesn't fire the "unsaved changes" prompt.
    const optimisticSnapshot: SavedSnapshot = { frontmatter, body: editorMd };
    const previousSnapshot = saved;
    setSaved(optimisticSnapshot);
    setStatus('saving…');
    const res = await fetch('/api/admin/file', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: currentPath, frontmatter, body }),
    });
    if (!res.ok) {
      // Roll back the optimistic snapshot so the user can retry
      setSaved(previousSnapshot);
      const err = await res.json().catch(() => ({}));
      setStatus('error: ' + (err.error || res.status));
      return;
    }
    // Re-read to align with whatever the server's idempotent representation is
    // (e.g. js-yaml-normalized frontmatter, body unchanged).
    const after = await fetch('/api/admin/file?path=' + encodeURIComponent(currentPath)).then(r => r.json());
    const wrappedBody = wrapMathForEditor((after.body ?? '').replace(/\r\n/g, '\n'));
    setSaved({ frontmatter: after.frontmatter ?? {}, body: wrappedBody });
    setStatus('saved');
  }, [currentPath, frontmatter, editorBody, saved]);

  // Ctrl+S keymap
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [save]);

  // beforeunload prompt
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  // ------- post management -------
  const newPost = useCallback(async () => {
    const slug = prompt('סלאג לפוסט החדש (אותיות לועזיות, ספרות ומקפים בלבד)');
    if (!slug) return;
    const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
    if (!safeSlug) { alert('סלאג לא חוקי'); return; }
    const title = prompt('כותרת לפוסט (אפשר עברית):') ?? safeSlug;
    const path = `blog/${safeSlug}.mdx`;
    const res = await fetch('/api/admin/file/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path,
        frontmatter: { title, description: '', pubDate: todayISO(), tags: [] },
        body: '\n',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('יצירה נכשלה: ' + (err.error || res.status));
      return;
    }
    await loadList();
    openFile(path);
  }, [loadList, openFile]);

  const deletePost = useCallback(async (path: string) => {
    if (!confirm(`למחוק את ${path}? גם תיקיית התמונות תימחק.`)) return;
    const res = await fetch('/api/admin/file?path=' + encodeURIComponent(path), { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('מחיקה נכשלה: ' + (err.error || res.status));
      return;
    }
    if (currentPath === path) {
      setCurrentPath(null);
      setFrontmatter({});
      setInitialBody('');
      setEditorBody('');
      setSaved({ frontmatter: {}, body: '' });
      history.replaceState(null, '', '/admin');
    }
    await loadList();
  }, [currentPath, loadList]);

  const renamePost = useCallback(async (path: string) => {
    const current = path.replace(/^blog\//, '').replace(/\.(mdx?|MDX?)$/, '');
    const next = prompt(`שינוי שם - סלאג חדש:`, current);
    if (!next) return;
    const safeNext = next.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
    if (!safeNext || safeNext === current) return;
    if (dirty && !confirm('יש שינויים שלא נשמרו - להמשיך?')) return;
    const newPath = `blog/${safeNext}.mdx`;
    const res = await fetch('/api/admin/file/rename', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from: path, to: newPath }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('שינוי שם נכשל: ' + (err.error || res.status));
      return;
    }
    await loadList();
    if (currentPath === path) {
      setCurrentPath(null);
      setFrontmatter({});
      setInitialBody('');
      setEditorBody('');
      setSaved({ frontmatter: {}, body: '' });
      openFile(newPath);
    }
  }, [currentPath, dirty, loadList, openFile]);

  const postUrl = currentPath ? postUrlFor(currentPath) : null;

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1 className="admin-title">Editor</h1>
        <span className="admin-filename">{currentPath ?? '-'}</span>
        <span className={`admin-status admin-status-${dirty ? 'dirty' : status}`}>
          {dirty ? '● לא נשמר' : status === 'saved' ? '✓ נשמר' : status}
        </span>
        <span className="admin-spacer" />
        {postUrl && (
          <a className="admin-btn" href={postUrl} target="_blank" rel="noopener">פתח פוסט ↗</a>
        )}
        <button className="admin-btn admin-btn-primary" onClick={save} disabled={!currentPath}>
          שמור (Ctrl+S)
        </button>
      </header>

      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <span>פוסטים</span>
          <button className="admin-icon-btn" onClick={newPost} title="פוסט חדש">+</button>
        </div>
        <div className="admin-file-list">
          {files.map((f) => (
            <div key={f} className={`admin-file ${f === currentPath ? 'active' : ''}`}>
              <button className="admin-file-open" onClick={() => openFile(f)} title={f}>{f}</button>
              <button className="admin-file-action" onClick={() => renamePost(f)} title="שנה שם">✎</button>
              <button className="admin-file-action admin-file-action-danger" onClick={() => deletePost(f)} title="מחק">×</button>
            </div>
          ))}
        </div>
      </aside>

      <main className="admin-main">
        {currentPath ? (
          <div className="admin-main-inner">
            <FrontmatterForm
              value={frontmatter}
              currentPath={currentPath}
              onChange={setFrontmatter}
            />
            <MdxEditorIsland
              key={currentPath}
              initialMarkdown={initialBody}
              currentPath={currentPath}
              onChange={handleEditorChange}
              ref={editorRef}
            />
          </div>
        ) : (
          <div className="admin-empty">
            <div>
              <p>בחרו פוסט מהצד או צרו חדש.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
