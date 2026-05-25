import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  diffSourcePlugin,
  jsxPlugin,
  type JsxComponentDescriptor,
  insertJsx$,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertCodeBlock,
  InsertThematicBreak,
  DiffSourceToggleWrapper,
} from '@mdxeditor/editor';
import { usePublisher } from '@mdxeditor/gurx';
import '@mdxeditor/editor/style.css';
import {
  MathEditor,
  CalloutEditor,
  SpoilerEditor,
  PullQuoteEditor,
  TermEditor,
  VizEditor,
} from './WidgetEditors';

// Components that live in src/components/blog/ - render with custom editors.
const BLOG_COMPONENTS: JsxComponentDescriptor[] = [
  {
    name: 'Callout',
    kind: 'flow',
    source: '../../components/blog/Callout.astro',
    props: [
      { name: 'type', type: 'string' },
      { name: 'title', type: 'string' },
    ],
    hasChildren: true,
    defaultExport: true,
    Editor: CalloutEditor,
  },
  {
    name: 'Spoiler',
    kind: 'flow',
    source: '../../components/blog/Spoiler.astro',
    props: [{ name: 'summary', type: 'string' }],
    hasChildren: true,
    defaultExport: true,
    Editor: SpoilerEditor,
  },
  {
    name: 'PullQuote',
    kind: 'flow',
    source: '../../components/blog/PullQuote.astro',
    props: [{ name: 'cite', type: 'string' }],
    hasChildren: true,
    defaultExport: true,
    Editor: PullQuoteEditor,
  },
  {
    name: 'Term',
    kind: 'text',
    source: '../../components/blog/Term.astro',
    props: [{ name: 'name', type: 'string' }],
    hasChildren: true,
    defaultExport: true,
    Editor: TermEditor,
  },
];

// Viz components - heavy interactive React widgets. Render as placeholder chips
// in the editor (Generic editor with their props), not the real component.
const VIZ_NAMES = [
  'AttentionDemo',
  'GradientDescent',
  'LossCurve',
  'DotProduct',
  'Softmax',
  'EmbeddingSpace',
  'QKV',
  'WeightedSum',
];

const VIZ_COMPONENTS: JsxComponentDescriptor[] = VIZ_NAMES.map((name) => ({
  name,
  kind: 'flow' as const,
  source: `../../components/viz/${name}`,
  // Common props on viz components in this project. Extras pass through.
  props: [
    { name: 'client:load', type: 'string' },
    { name: 'client:visible', type: 'string' },
    { name: 'client:idle', type: 'string' },
    { name: 'defaultSentence', type: 'string' },
    { name: 'data', type: 'expression' },
  ],
  hasChildren: false,
  defaultExport: true,
  Editor: VizEditor,
}));

// Pseudo-components used by AdminApp to wrap math during round-trip so MDX
// won't try to parse \text{...} as a JS expression. Pure editor-side constructs;
// AdminApp strips them out before save.
const MATH_DESCRIPTORS: JsxComponentDescriptor[] = [
  {
    name: 'MdxMath',
    kind: 'text',
    props: [{ name: 'latex', type: 'string' }],
    hasChildren: false,
    Editor: MathEditor,
  },
  {
    name: 'MdxMathBlock',
    kind: 'flow',
    props: [{ name: 'latex', type: 'string' }],
    hasChildren: false,
    Editor: MathEditor,
  },
];

const ALL_DESCRIPTORS: JsxComponentDescriptor[] = [
  ...MATH_DESCRIPTORS,
  ...BLOG_COMPONENTS,
  ...VIZ_COMPONENTS,
];

// ---------- Insert Widget menu ----------
const emptyParagraph = () => ({
  type: 'paragraph' as const,
  children: [{ type: 'text' as const, value: '' }],
});

function InsertWidgetMenu() {
  const insertJsx = usePublisher(insertJsx$);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setCoords(null); return; }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      // Show below the button by default; anchor to its right edge so menu doesn't overflow viewport
      const menuWidth = 220;
      const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
      setCoords({ top: rect.bottom + 4, left });
    }
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  const items = [
    {
      label: 'Callout (info)',
      run: () => insertJsx({
        kind: 'flow', name: 'Callout',
        props: { type: 'info' },
        children: [emptyParagraph()],
      }),
    },
    {
      label: 'Callout (warning)',
      run: () => insertJsx({
        kind: 'flow', name: 'Callout',
        props: { type: 'warning' },
        children: [emptyParagraph()],
      }),
    },
    {
      label: 'Spoiler',
      run: () => insertJsx({
        kind: 'flow', name: 'Spoiler',
        props: { summary: 'הצג תשובה' },
        children: [emptyParagraph()],
      }),
    },
    {
      label: 'Pull quote',
      run: () => insertJsx({
        kind: 'flow', name: 'PullQuote',
        props: {},
        children: [emptyParagraph()],
      }),
    },
    {
      label: 'Term (hover definition)',
      run: () => insertJsx({
        kind: 'text', name: 'Term',
        props: { name: '' },
        children: [{ type: 'text' as const, value: 'הגדרה' }],
      }),
    },
    { divider: true as const },
    {
      label: 'Inline math',
      run: () => insertJsx({
        kind: 'text', name: 'MdxMath',
        props: { latex: 'x' },
      }),
    },
    {
      label: 'Block math',
      run: () => insertJsx({
        kind: 'flow', name: 'MdxMathBlock',
        props: { latex: 'x = y' },
      }),
    },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc',
          background: 'transparent', cursor: 'pointer', fontSize: 13,
        }}
        title="Insert widget"
      >
        + Widget ▾
      </button>
      {open && coords && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed', top: coords.top, left: coords.left,
            width: 220,
            background: 'white', border: '1px solid #ccc',
            borderRadius: 6, boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            padding: 4, zIndex: 10000,
          }}
        >
          {items.map((it, i) =>
            'divider' in it ? (
              <div key={`d${i}`} style={{ height: 1, background: '#eee', margin: '4px 0' }} />
            ) : (
              <button
                key={it.label}
                type="button"
                onClick={() => { it.run(); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'start',
                  background: 'transparent', border: 0, padding: '6px 10px',
                  fontSize: 13, cursor: 'pointer', borderRadius: 4, color: '#1a1a1a',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}

const CODE_LANGS = {
  '': 'plain',
  js: 'JavaScript',
  ts: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  python: 'Python',
  py: 'Python',
  bash: 'Bash',
  sh: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  md: 'Markdown',
  mdx: 'MDX',
  html: 'HTML',
  css: 'CSS',
};

export interface EditorHandle {
  getMarkdown: () => string;
  setMarkdown: (md: string) => void;
  focus: () => void;
}

interface Props {
  initialMarkdown: string;
  /** Used to derive the image upload folder slug. */
  currentPath: string;
  onChange?: (md: string) => void;
}

const MdxEditorIsland = forwardRef<EditorHandle, Props>(({ initialMarkdown, currentPath, onChange }, ref) => {
  const editorRef = useRef<MDXEditorMethods>(null);

  useImperativeHandle(ref, () => ({
    getMarkdown: () => editorRef.current?.getMarkdown() ?? '',
    setMarkdown: (md) => editorRef.current?.setMarkdown(md),
    focus: () => editorRef.current?.focus(),
  }));

  // Reload the editor's content when the file path changes
  useEffect(() => {
    editorRef.current?.setMarkdown(initialMarkdown);
  }, [currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadImage(file: File): Promise<string> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).replace(/^data:[^;]+;base64,/, ''));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: currentPath, filename: file.name || 'image.png', base64 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `upload failed (${res.status})`);
    }
    return (await res.json()).url;
  }

  return (
    <MDXEditor
      ref={editorRef}
      markdown={initialMarkdown}
      onChange={onChange}
      contentEditableClassName="mdx-editor-content"
      toMarkdownOptions={{ bullet: '-', emphasis: '*', strong: '*', fence: '`', rule: '-' }}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin({ imageUploadHandler: uploadImage }),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'python' }),
        codeMirrorPlugin({ codeBlockLanguages: CODE_LANGS }),
        markdownShortcutPlugin(),
        jsxPlugin({ jsxComponentDescriptors: ALL_DESCRIPTORS }),
        diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: initialMarkdown }),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <BlockTypeSelect />
              <ListsToggle />
              <CreateLink />
              <InsertImage />
              <InsertTable />
              <InsertCodeBlock />
              <InsertThematicBreak />
              <InsertWidgetMenu />
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
    />
  );
});

MdxEditorIsland.displayName = 'MdxEditorIsland';
export default MdxEditorIsland;
