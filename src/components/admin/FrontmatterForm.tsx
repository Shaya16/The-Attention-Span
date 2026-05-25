import { useState, useRef } from 'react';

export interface Frontmatter {
  title?: string;
  description?: string;
  pubDate?: string;
  updatedDate?: string;
  tags?: string[];
  draft?: boolean;
  image?: { src?: string; alt?: string };
  [k: string]: unknown;
}

interface Props {
  value: Frontmatter;
  currentPath: string;
  onChange: (next: Frontmatter) => void;
}

const KNOWN_FIELDS = ['title', 'description', 'pubDate', 'updatedDate', 'tags', 'draft', 'image'];

export default function FrontmatterForm({ value, currentPath, onChange }: Props) {
  const [tagDraft, setTagDraft] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const tags = value.tags ?? [];
  const image = value.image ?? {};
  const draft = !!value.draft;

  const update = (patch: Partial<Frontmatter>) => onChange({ ...value, ...patch });
  const updateImage = (patch: Partial<NonNullable<Frontmatter['image']>>) => {
    const next = { ...image, ...patch };
    // Drop the image object entirely if src is empty (alt without src is meaningless)
    if (!next.src) {
      const copy = { ...value };
      delete copy.image;
      onChange(copy);
    } else {
      // Schema requires alt to be a string whenever image is set.
      update({ image: { src: next.src, alt: next.alt ?? '' } });
    }
  };

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || tags.includes(t)) { setTagDraft(''); return; }
    update({ tags: [...tags, t] });
    setTagDraft('');
  };

  const removeTag = (t: string) => update({ tags: tags.filter((x) => x !== t) });

  const onCoverFile = async (file: File) => {
    setUploadingCover(true);
    setCoverError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).replace(/^data:[^;]+;base64,/, ''));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/upload-asset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: currentPath, filename: file.name, base64 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.status);
      }
      const { src } = await res.json();
      updateImage({ src });
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploadingCover(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const extraFields = Object.keys(value).filter((k) => !KNOWN_FIELDS.includes(k));
  const [open, setOpen] = useState(true);
  const filledCount = [
    value.title, value.description, value.pubDate, value.updatedDate,
    (value.tags?.length ?? 0) > 0, value.draft, image.src,
  ].filter(Boolean).length;

  return (
    <section className="fm">
      <button
        type="button"
        className={`fm-toggle-bar ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ background: 'transparent', border: 0, width: '100%', textAlign: 'start' }}
      >
        <span className="fm-toggle-arrow">▸</span>
        <span>מאפיינים</span>
        <span className="fm-properties-count">· {filledCount} שדות</span>
      </button>
      {open && (
      <div className="fm-body">
      <div className="fm-row">
        <label htmlFor="fm-title">כותרת</label>
        <input
          id="fm-title"
          type="text"
          value={value.title ?? ''}
          onChange={(e) => update({ title: e.target.value })}
          dir="rtl"
        />
      </div>

      <div className="fm-row">
        <label htmlFor="fm-description">תקציר</label>
        <textarea
          id="fm-description"
          rows={2}
          value={value.description ?? ''}
          onChange={(e) => update({ description: e.target.value })}
          dir="rtl"
        />
      </div>

      <div className="fm-row">
        <label htmlFor="fm-pubdate">תאריך פרסום</label>
        <input
          id="fm-pubdate"
          type="date"
          value={value.pubDate ?? ''}
          onChange={(e) => update({ pubDate: e.target.value })}
        />
      </div>

      <div className="fm-row">
        <label htmlFor="fm-updated">עודכן (אופציונלי)</label>
        <input
          id="fm-updated"
          type="date"
          value={value.updatedDate ?? ''}
          onChange={(e) => update({ updatedDate: e.target.value || undefined })}
        />
      </div>

      <div className="fm-row">
        <label htmlFor="fm-tag-input">תגיות</label>
        <div className="fm-tags">
          {tags.map((t) => (
            <span key={t} className="fm-tag">
              {t}
              <button type="button" onClick={() => removeTag(t)} aria-label={`remove ${t}`}>×</button>
            </span>
          ))}
          <input
            id="fm-tag-input"
            type="text"
            value={tagDraft}
            placeholder="הקלידו תגית ולחצו Enter"
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
              else if (e.key === 'Backspace' && !tagDraft && tags.length) {
                update({ tags: tags.slice(0, -1) });
              }
            }}
            dir="rtl"
          />
        </div>
      </div>

      <div className="fm-row">
        <label>טיוטה</label>
        <label className="fm-toggle">
          <input
            type="checkbox"
            checked={draft}
            onChange={(e) => update({ draft: e.target.checked || undefined })}
          />
          <span>הסתר מהפיד עד שיהיה מוכן</span>
        </label>
      </div>

      <div className="fm-row">
        <label>תמונה ראשית</label>
        <div className="fm-image">
          {image.src && (
            <div className="fm-image-preview">
              <code className="fm-image-src">{image.src}</code>
              <button type="button" className="fm-image-remove" onClick={() => updateImage({ src: '' })} title="הסר">×</button>
            </div>
          )}
          <div className="fm-image-actions">
            <input
              type="file"
              accept="image/*"
              ref={fileInput}
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onCoverFile(f); }}
            />
            <button type="button" onClick={() => fileInput.current?.click()} disabled={uploadingCover}>
              {uploadingCover ? '...מעלה' : (image.src ? 'החלף תמונה' : 'העלה תמונה')}
            </button>
          </div>
          {coverError && <div className="fm-image-error">שגיאה: {coverError}</div>}
          {(image.src || image.alt) && (
            <input
              type="text"
              value={image.alt ?? ''}
              placeholder="תיאור התמונה (alt)"
              onChange={(e) => updateImage({ alt: e.target.value })}
              dir="rtl"
            />
          )}
        </div>
      </div>

      {extraFields.length > 0 && (
        <div className="fm-extra-note">
          שדות נוספים נשמרים כפי שהם: {extraFields.join(', ')}
        </div>
      )}
      </div>
      )}
      <hr className="fm-divider" />
    </section>
  );
}
