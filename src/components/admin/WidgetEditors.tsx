import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  type JsxEditorProps,
  NestedLexicalEditor,
  useLexicalNodeRemove,
  useMdastNodeUpdater,
} from '@mdxeditor/editor';
import katex from 'katex';
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import type * as Mdast from 'mdast';

type AnyJsxNode = MdxJsxFlowElement | MdxJsxTextElement;

// ----- math escape helpers (must match AdminApp.wrapMathForEditor) -----
// JSX attribute strings in MDX are taken literally - backslashes are NOT
// auto-unescaped - so we apply the same escape/unescape inside MathEditor.
const escapeMathForJsx = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
const unescapeMathFromJsx = (s: string) =>
  s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

// ----- attribute helpers -----
function getAttr(node: AnyJsxNode, name: string): string {
  const attr = node.attributes?.find(
    (a): a is MdxJsxAttribute => a.type === 'mdxJsxAttribute' && a.name === name,
  );
  if (!attr || typeof attr.value !== 'string') return '';
  return attr.value;
}

function setAttr<T extends AnyJsxNode>(node: T, name: string, value: string): T {
  const existing = node.attributes?.find(
    (a): a is MdxJsxAttribute => a.type === 'mdxJsxAttribute' && a.name === name,
  );
  const attributes = existing
    ? (node.attributes ?? []).map((a) =>
        a === existing ? ({ ...a, value } as MdxJsxAttribute) : a,
      )
    : [
        ...(node.attributes ?? []),
        { type: 'mdxJsxAttribute' as const, name, value } as MdxJsxAttribute,
      ];
  return { ...node, attributes };
}

// ----- shared chrome (delete + settings buttons on hover) -----
function WidgetChrome({
  children,
  onSettings,
  block = true,
}: {
  children: ReactNode;
  onSettings?: () => void;
  block?: boolean;
}) {
  const remove = useLexicalNodeRemove();
  return (
    <span
      className="widget-chrome"
      style={{ position: 'relative', display: block ? 'block' : 'inline-block' }}
    >
      {children}
      <span className="widget-chrome-actions" contentEditable={false}>
        {onSettings && (
          <button
            type="button"
            className="widget-chrome-btn"
            title="הגדרות"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onSettings(); }}
            aria-label="settings"
          >
            ⚙
          </button>
        )}
        <button
          type="button"
          className="widget-chrome-btn widget-chrome-btn-danger"
          title="מחק"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); remove(); }}
          aria-label="delete"
        >
          ×
        </button>
      </span>
    </span>
  );
}

// ----- popover/modal for editing props -----
function WidgetModal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="widget-modal-backdrop" onClick={onClose}>
      <div className="widget-modal" onClick={(e) => e.stopPropagation()}>
        <div className="widget-modal-head">
          <span>{title}</span>
          <button type="button" className="widget-modal-close" onClick={onClose} aria-label="close">×</button>
        </div>
        <div className="widget-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ===================== MATH (inline + block) =====================
export function MathEditor(props: JsxEditorProps) {
  const block = props.descriptor.kind === 'flow';
  const update = useMdastNodeUpdater<AnyJsxNode>();
  // The mdast attribute stores escaped LaTeX (matches AdminApp's wrap format).
  // Unescape for display and editing.
  const latex = unescapeMathFromJsx(getAttr(props.mdastNode, 'latex'));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(latex);

  useEffect(() => { setDraft(latex); }, [latex]);

  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !previewRef.current) return;
    try {
      katex.render(draft || '\\,', previewRef.current, { throwOnError: false, displayMode: block });
    } catch (e) {
      if (previewRef.current) previewRef.current.textContent = String(e);
    }
  }, [draft, open, block]);

  // The visible rendering: actual KaTeX
  const renderEl = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!renderEl.current) return;
    try {
      katex.render(latex || '\\,', renderEl.current, { throwOnError: false, displayMode: block });
    } catch {
      if (renderEl.current) renderEl.current.textContent = latex;
    }
  }, [latex, block]);

  const save = () => {
    // Re-escape for the mdast attribute so the on-save unwrap recovers the original.
    update(setAttr(props.mdastNode, 'latex', escapeMathForJsx(draft)));
    setOpen(false);
  };

  return (
    <WidgetChrome block={block} onSettings={() => setOpen(true)}>
      <span
        className={`widget-math ${block ? 'widget-math-block' : 'widget-math-inline'}`}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
      >
        <span ref={renderEl} contentEditable={false} />
      </span>
      <WidgetModal title={block ? 'משוואה' : 'מתמטיקה אינליין'} open={open} onClose={() => setOpen(false)}>
        <label className="widget-field-label">LaTeX</label>
        <textarea
          className="widget-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          dir="ltr"
          autoFocus
          rows={block ? 5 : 2}
        />
        <label className="widget-field-label">תצוגה מקדימה</label>
        <div className="widget-preview" ref={previewRef} />
        <div className="widget-modal-foot">
          <button type="button" className="widget-btn" onClick={() => setOpen(false)}>ביטול</button>
          <button type="button" className="widget-btn widget-btn-primary" onClick={save}>שמור</button>
        </div>
      </WidgetModal>
    </WidgetChrome>
  );
}

// ===================== CALLOUT =====================
const CALLOUT_TYPES = [
  { value: 'info',    label: 'מידע',  bg: '#e7f3f9', bd: '#4a9ad4', icon: 'i' },
  { value: 'warning', label: 'אזהרה', bg: '#faecdc', bd: '#e0a14e', icon: '!' },
  { value: 'note',    label: 'הערה',  bg: '#ede9f4', bd: '#8b7bb8', icon: '✎' },
  { value: 'tip',     label: 'טיפ',   bg: '#e6f3ec', bd: '#4ea672', icon: '★' },
] as const;

export function CalloutEditor(props: JsxEditorProps) {
  const update = useMdastNodeUpdater<MdxJsxFlowElement>();
  const node = props.mdastNode as MdxJsxFlowElement;
  const type = getAttr(node, 'type') || 'info';
  const title = getAttr(node, 'title');
  const preset = CALLOUT_TYPES.find((p) => p.value === type) ?? CALLOUT_TYPES[0];
  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState(type);
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => { setDraftType(type); setDraftTitle(title); }, [type, title]);

  const save = () => {
    let next = setAttr(node, 'type', draftType);
    if (draftTitle) next = setAttr(next, 'title', draftTitle);
    else next = { ...next, attributes: (next.attributes ?? []).filter((a) => !(a.type === 'mdxJsxAttribute' && a.name === 'title')) };
    update(next);
    setOpen(false);
  };

  return (
    <WidgetChrome onSettings={() => setOpen(true)}>
      <div
        className="widget-callout"
        style={{
          borderInlineStart: `4px solid ${preset.bd}`,
          background: preset.bg,
        }}
      >
        <div className="widget-callout-head" style={{ color: preset.bd }} contentEditable={false}>
          <span className="widget-callout-icon" style={{ background: preset.bd }}>{preset.icon}</span>
          <span className="widget-callout-label">{title || preset.label}</span>
        </div>
        <div className="widget-callout-body">
          <NestedLexicalEditor<MdxJsxFlowElement>
            block
            getContent={(n) => n.children as Mdast.RootContent[]}
            getUpdatedMdastNode={(n, children) => ({
              ...n,
              children: children as MdxJsxFlowElement['children'],
            })}
          />
        </div>
      </div>
      <WidgetModal title="הגדרות Callout" open={open} onClose={() => setOpen(false)}>
        <label className="widget-field-label">סוג</label>
        <div className="widget-type-picker">
          {CALLOUT_TYPES.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`widget-type-chip ${draftType === p.value ? 'active' : ''}`}
              style={{ borderColor: draftType === p.value ? p.bd : 'transparent', background: p.bg, color: p.bd }}
              onClick={() => setDraftType(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="widget-field-label">כותרת (אופציונלי)</label>
        <input
          className="widget-input"
          type="text"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder={preset.label}
          dir="auto"
        />
        <div className="widget-modal-foot">
          <button type="button" className="widget-btn" onClick={() => setOpen(false)}>ביטול</button>
          <button type="button" className="widget-btn widget-btn-primary" onClick={save}>שמור</button>
        </div>
      </WidgetModal>
    </WidgetChrome>
  );
}

// ===================== SPOILER =====================
export function SpoilerEditor(props: JsxEditorProps) {
  const update = useMdastNodeUpdater<MdxJsxFlowElement>();
  const node = props.mdastNode as MdxJsxFlowElement;
  const summary = getAttr(node, 'summary') || 'הצג תשובה';
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(summary);
  useEffect(() => { setDraft(summary); }, [summary]);

  const save = () => {
    update(setAttr(node, 'summary', draft));
    setOpen(false);
  };

  return (
    <WidgetChrome onSettings={() => setOpen(true)}>
      <div className="widget-spoiler">
        <div className="widget-spoiler-summary" contentEditable={false}>
          <span className="widget-spoiler-arrow">▸</span> {summary}
        </div>
        <div className="widget-spoiler-body">
          <NestedLexicalEditor<MdxJsxFlowElement>
            block
            getContent={(n) => n.children as Mdast.RootContent[]}
            getUpdatedMdastNode={(n, children) => ({
              ...n,
              children: children as MdxJsxFlowElement['children'],
            })}
          />
        </div>
      </div>
      <WidgetModal title="הגדרות Spoiler" open={open} onClose={() => setOpen(false)}>
        <label className="widget-field-label">כותרת ההסתרה (summary)</label>
        <input
          className="widget-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          dir="auto"
        />
        <div className="widget-modal-foot">
          <button type="button" className="widget-btn" onClick={() => setOpen(false)}>ביטול</button>
          <button type="button" className="widget-btn widget-btn-primary" onClick={save}>שמור</button>
        </div>
      </WidgetModal>
    </WidgetChrome>
  );
}

// ===================== PULL QUOTE =====================
export function PullQuoteEditor(props: JsxEditorProps) {
  const update = useMdastNodeUpdater<MdxJsxFlowElement>();
  const node = props.mdastNode as MdxJsxFlowElement;
  const cite = getAttr(node, 'cite');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(cite);
  useEffect(() => { setDraft(cite); }, [cite]);

  const save = () => {
    const cleared = draft.trim() === '';
    let next: MdxJsxFlowElement;
    if (cleared) {
      next = { ...node, attributes: (node.attributes ?? []).filter((a) => !(a.type === 'mdxJsxAttribute' && a.name === 'cite')) };
    } else {
      next = setAttr(node, 'cite', draft);
    }
    update(next);
    setOpen(false);
  };

  return (
    <WidgetChrome onSettings={() => setOpen(true)}>
      <blockquote className="widget-pullquote">
        <NestedLexicalEditor<MdxJsxFlowElement>
          block
          getContent={(n) => n.children as Mdast.RootContent[]}
          getUpdatedMdastNode={(n, children) => ({
            ...n,
            children: children as MdxJsxFlowElement['children'],
          })}
        />
        {cite && <footer className="widget-pullquote-cite" contentEditable={false}>- {cite}</footer>}
      </blockquote>
      <WidgetModal title="הגדרות ציטוט" open={open} onClose={() => setOpen(false)}>
        <label className="widget-field-label">מקור הציטוט (cite, אופציונלי)</label>
        <input
          className="widget-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          dir="auto"
        />
        <div className="widget-modal-foot">
          <button type="button" className="widget-btn" onClick={() => setOpen(false)}>ביטול</button>
          <button type="button" className="widget-btn widget-btn-primary" onClick={save}>שמור</button>
        </div>
      </WidgetModal>
    </WidgetChrome>
  );
}

// ===================== TERM (inline) =====================
export function TermEditor(props: JsxEditorProps) {
  const update = useMdastNodeUpdater<MdxJsxTextElement>();
  const node = props.mdastNode as MdxJsxTextElement;
  const name = getAttr(node, 'name');
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  useEffect(() => { setDraftName(name); }, [name]);

  const save = () => {
    update(setAttr(node, 'name', draftName));
    setOpen(false);
  };

  return (
    <WidgetChrome block={false} onSettings={() => setOpen(true)}>
      <span className="widget-term">
        <span className="widget-term-name" contentEditable={false}>{name || 'מונח'}</span>
        <NestedLexicalEditor<MdxJsxTextElement>
          getContent={(n) => n.children as Mdast.RootContent[]}
          getUpdatedMdastNode={(n, children) => ({
            ...n,
            children: children as MdxJsxTextElement['children'],
          })}
          contentEditableProps={{ style: { display: 'none' } }}
        />
      </span>
      <WidgetModal title="הגדרות מונח" open={open} onClose={() => setOpen(false)}>
        <label className="widget-field-label">המונח (name)</label>
        <input
          className="widget-input"
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          dir="auto"
        />
        <label className="widget-field-label">ההגדרה (תוכן הטולטיפ)</label>
        <div className="widget-nested-host">
          <NestedLexicalEditor<MdxJsxTextElement>
            getContent={(n) => n.children as Mdast.RootContent[]}
            getUpdatedMdastNode={(n, children) => ({
              ...n,
              children: children as MdxJsxTextElement['children'],
            })}
          />
        </div>
        <div className="widget-modal-foot">
          <button type="button" className="widget-btn" onClick={() => setOpen(false)}>ביטול</button>
          <button type="button" className="widget-btn widget-btn-primary" onClick={save}>שמור</button>
        </div>
      </WidgetModal>
    </WidgetChrome>
  );
}

// ===================== VIZ component placeholder =====================
export function VizEditor(props: JsxEditorProps) {
  const update = useMdastNodeUpdater<MdxJsxFlowElement>();
  const node = props.mdastNode as MdxJsxFlowElement;
  const name = props.descriptor.name ?? 'Component';
  const [open, setOpen] = useState(false);

  // Show all string-valued attrs in the modal as editable fields
  const stringAttrs = (node.attributes ?? []).filter(
    (a): a is MdxJsxAttribute => a.type === 'mdxJsxAttribute' && typeof a.value === 'string',
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    const m: Record<string, string> = {};
    for (const a of stringAttrs) m[a.name] = a.value as string;
    setDrafts(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    let next = node;
    for (const [k, v] of Object.entries(drafts)) {
      next = setAttr(next, k, v);
    }
    update(next);
    setOpen(false);
  };

  return (
    <WidgetChrome onSettings={() => setOpen(true)}>
      <div className="widget-viz">
        <div className="widget-viz-icon" contentEditable={false}>◆</div>
        <div className="widget-viz-body" contentEditable={false}>
          <div className="widget-viz-name">{name}</div>
          <div className="widget-viz-hint">רכיב אינטראקטיבי - ייטען בעת צפייה בפוסט</div>
        </div>
      </div>
      <WidgetModal title={`הגדרות ${name}`} open={open} onClose={() => setOpen(false)}>
        {stringAttrs.length === 0 ? (
          <div className="widget-viz-empty">לרכיב זה אין מאפיינים ערוכים. השתמשו במצב המקור (M↓) לעריכה מתקדמת.</div>
        ) : (
          stringAttrs.map((a) => (
            <div key={a.name} className="widget-viz-prop">
              <label className="widget-field-label">{a.name}</label>
              <input
                className="widget-input"
                type="text"
                value={drafts[a.name] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [a.name]: e.target.value }))}
                dir="auto"
              />
            </div>
          ))
        )}
        <div className="widget-modal-foot">
          <button type="button" className="widget-btn" onClick={() => setOpen(false)}>ביטול</button>
          <button type="button" className="widget-btn widget-btn-primary" onClick={save}>שמור</button>
        </div>
      </WidgetModal>
    </WidgetChrome>
  );
}
