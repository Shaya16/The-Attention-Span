# Hero Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current multi-mode experimental Hero with a single opinionated centerpiece that generates the tagline word-by-word (with probability flicker) and then draws faint attention arcs between attended-to words.

**Architecture:** Three files. `Hero.tsx` is the orchestrator (state machine + layout + glow + CTA). `hero/tagline.ts` is pure data (tokens, candidates, attention pairs). `hero/AttentionArcs.tsx` is a presentational SVG component that measures token DOM positions and draws animated quadratic Bézier curves. State is driven by a single `phase` enum advanced by a sequenced `setTimeout` chain in a master `useEffect`.

**Tech Stack:** Astro 5, React 19, motion (Framer Motion fork), Tailwind v4, TypeScript 5.7. No test framework in the project — verification is `npx tsc --noEmit` plus visual screenshots via the Claude Preview MCP tool.

**Verification commands (used throughout):**
- TypeScript: `npx tsc --noEmit`
- Visual: Use `mcp__Claude_Preview__preview_screenshot` against the running dev server (configured in `.claude/launch.json`, server name `astro-dev`)
- Resize for mobile checks: `mcp__Claude_Preview__preview_resize` with `width: 375` or `width: 320`

**Spec:** `docs/superpowers/specs/2026-05-24-hero-redesign-design.md`

**Important pre-task note:** The git status at the start of this work shows `M src/components/home/Hero.tsx` (uncommitted modifications from a prior session). The implementer should ask the user before starting whether to keep, stash, or discard those — this plan assumes the file is reset to its `b2654a0` HEAD state when Task 3 begins. The cleanest move is `git checkout src/components/home/Hero.tsx` before Task 3 to restore HEAD; the plan will then replace it entirely.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/components/home/hero/tagline.ts` | Create | Pure data: TOKENS, CANDIDATES, ATTENTION_PAIRS, ACCENT_INDICES |
| `src/components/home/hero/AttentionArcs.tsx` | Create | SVG arcs component; measures token positions, draws Bézier curves |
| `src/components/home/Hero.tsx` | Replace | Orchestrator: phase state machine, glow, tagline render, CTAs |

---

## Task 1: Add `hero/tagline.ts` data file

**Files:**
- Create: `src/components/home/hero/tagline.ts`

- [ ] **Step 1: Create the directory and data file**

Create `src/components/home/hero/tagline.ts` with the following content:

```ts
export const TOKENS = [
  'Machine',
  'learning,',
  'explained',
  'before',
  'your',
  'context',
  'window',
  'runs',
  'out.',
] as const;

export type TokenIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Per-token alternates shown during the flicker. The LAST entry in each array
 * is the word that lands in the final sentence — keep it in sync with TOKENS.
 */
export const CANDIDATES: Record<number, readonly string[]> = {
  0: ['Statistical', 'Deep', 'Machine'],
  1: ['thinking,', 'training,', 'learning,'],
  2: ['translated', 'decoded', 'explained'],
  3: ['until', 'after', 'before'],
  4: ['the', 'my', 'your'],
  5: ['memory', 'attention', 'context'],
  6: ['buffer', 'span', 'window'],
  7: ['gives', 'gets', 'runs'],
  8: ['dry.', 'low.', 'out.'],
};

/**
 * For each token index i, the list of previous-token indices it "attends to"
 * with a weight in [0,1]. Aesthetic, not derived from a real model.
 */
export const ATTENTION_PAIRS: Record<number, ReadonlyArray<{ target: number; weight: number }>> = {
  0: [],
  1: [{ target: 0, weight: 0.9 }],
  2: [{ target: 0, weight: 0.5 }, { target: 1, weight: 0.7 }],
  3: [{ target: 2, weight: 0.6 }],
  4: [{ target: 3, weight: 0.4 }],
  5: [{ target: 0, weight: 0.6 }, { target: 4, weight: 0.5 }],
  6: [{ target: 5, weight: 0.9 }],
  7: [{ target: 6, weight: 0.7 }, { target: 5, weight: 0.4 }],
  8: [{ target: 7, weight: 0.8 }, { target: 6, weight: 0.5 }],
};

/** Token indices that render in var(--color-accent) instead of inherit. */
export const ACCENT_INDICES: readonly number[] = [5]; // 'context'
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/hero/tagline.ts
git commit -m "feat(hero): add tagline data (tokens, candidates, attention pairs)"
```

---

## Task 2: Build `hero/AttentionArcs.tsx`

**Files:**
- Create: `src/components/home/hero/AttentionArcs.tsx`

This component is presentational — it measures positioned token DOM nodes and renders animated SVG curves. Verification is deferred to Task 6 (when it gets wired into the Hero). For now we just want it to compile.

- [ ] **Step 1: Create the file**

Create `src/components/home/hero/AttentionArcs.tsx` with this content:

```tsx
import { motion } from 'motion/react';
import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import { ATTENTION_PAIRS } from './tagline';

export type Phase =
  | 'pre'
  | 'generating'
  | 'settling'
  | 'arcs-in'
  | 'arcs-hold'
  | 'arcs-out'
  | 'cta-in'
  | 'idle';

type Props = {
  tokenRefs: Map<number, HTMLElement | null>;
  containerRef: RefObject<HTMLElement | null>;
  phase: Phase;
  /** Force a re-measure (e.g., when a new run starts and refs may have changed). */
  measureKey?: number;
};

type ArcGeom = {
  key: string;
  d: string;
  weight: number;
  sourceTokenIndex: number;
  length: number;
};

const ARC_DROP = 30; // px the control point sits below the lowest baseline
const STROKE_WIDTH = 1.5;
const WAVE_STAGGER_MS = 150;
const DRAW_DURATION_MS = 350;
const FADE_OUT_MS = 600;

function buildArcs(
  tokenRefs: Map<number, HTMLElement | null>,
  container: HTMLElement | null
): ArcGeom[] {
  if (!container) return [];
  const cRect = container.getBoundingClientRect();
  const arcs: ArcGeom[] = [];

  for (const [sourceIndexStr, pairs] of Object.entries(ATTENTION_PAIRS)) {
    const si = Number(sourceIndexStr);
    const sourceEl = tokenRefs.get(si);
    if (!sourceEl) continue;
    const sRect = sourceEl.getBoundingClientRect();
    const sx = sRect.left - cRect.left + sRect.width / 2;
    const sy = sRect.bottom - cRect.top;

    for (const { target, weight } of pairs) {
      const targetEl = tokenRefs.get(target);
      if (!targetEl) continue;
      const tRect = targetEl.getBoundingClientRect();
      const tx = tRect.left - cRect.left + tRect.width / 2;
      const ty = tRect.bottom - cRect.top;

      const mx = (sx + tx) / 2;
      const my = Math.max(sy, ty) + ARC_DROP;
      const d = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;

      // Oversize the path length for stroke-dasharray so the line clears fully.
      // A loose upper bound on quadratic arc length: chord + 2 * sagitta.
      const chord = Math.hypot(tx - sx, ty - sy);
      const length = chord + 2 * ARC_DROP + 4;

      arcs.push({ key: `${si}-${target}`, d, weight, sourceTokenIndex: si, length });
    }
  }
  return arcs;
}

export default function AttentionArcs({ tokenRefs, containerRef, phase, measureKey }: Props) {
  const [arcs, setArcs] = useState<ArcGeom[]>([]);

  useLayoutEffect(() => {
    const measure = () => setArcs(buildArcs(tokenRefs, containerRef.current));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tokenRefs, containerRef, phase, measureKey]);

  const visible = phase === 'arcs-in' || phase === 'arcs-hold' || phase === 'arcs-out';
  if (!visible || arcs.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      style={{ color: 'var(--color-accent-3)' }}
    >
      {arcs.map((arc) => {
        const delayMs = arc.sourceTokenIndex * WAVE_STAGGER_MS;
        return (
          <motion.path
            key={`${arc.key}-${measureKey ?? 0}`}
            d={arc.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            opacity={0.25 + arc.weight * 0.35}
            initial={{ strokeDasharray: arc.length, strokeDashoffset: arc.length }}
            animate={
              phase === 'arcs-out'
                ? { opacity: 0 }
                : { strokeDashoffset: 0 }
            }
            transition={
              phase === 'arcs-out'
                ? { duration: FADE_OUT_MS / 1000, ease: 'easeOut' }
                : { duration: DRAW_DURATION_MS / 1000, ease: 'easeOut', delay: delayMs / 1000 }
            }
          />
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/hero/AttentionArcs.tsx
git commit -m "feat(hero): add AttentionArcs component (SVG arcs between word refs)"
```

---

## Task 3: Replace `Hero.tsx` with new static shell

Replace the entire current `Hero.tsx` with a new shell that renders the final settled state statically — all tokens visible, glow on at idle intensity, CTAs visible, no arcs (yet), no animation. This is what the `prefers-reduced-motion` path will eventually render, and it gives a clean visual baseline before we layer the timeline on top.

**Files:**
- Modify (full replace): `src/components/home/Hero.tsx`

- [ ] **Step 1: If the working tree has unstaged Hero.tsx changes from a prior session, confirm with the user before discarding**

Run `git status` and check whether `src/components/home/Hero.tsx` shows as modified. If so, ask the user: "Discard the uncommitted Hero.tsx changes from the prior session, or save them somewhere first?" Wait for their answer before proceeding. Do NOT run `git checkout` on the file without their consent.

If the user confirms discard, run: `git checkout src/components/home/Hero.tsx`

- [ ] **Step 2: Replace the entire file**

Replace `src/components/home/Hero.tsx` with this content (full file, replaces every line):

```tsx
import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useRef } from 'react';
import { ACCENT_INDICES, TOKENS } from './hero/tagline';

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToWriting = useCallback(() => {
    const writing = document.querySelector('[data-section="writing"]');
    if (writing) {
      writing.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  }, []);

  // Static shell — every token visible, glow at idle intensity, CTAs visible.
  // Animation, flicker, and arcs are layered in by subsequent tasks.
  void prefersReduced;

  return (
    <section
      dir="ltr"
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-12"
    >
      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: '70vmin',
          height: '70vmin',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.1,
          background:
            'radial-gradient(closest-side, var(--color-accent), transparent 70%)',
        }}
      />

      {/* Tagline */}
      <div ref={containerRef} className="relative max-w-[16ch] text-center">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(2.25rem, 7vw, 5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: 'var(--color-ink)',
          }}
        >
          {TOKENS.map((tok, i) => {
            const isAccent = ACCENT_INDICES.includes(i);
            return (
              <span
                key={i}
                className="mr-[0.25em] inline-block"
                style={{ color: isAccent ? 'var(--color-accent)' : 'inherit' }}
              >
                {tok}
              </span>
            );
          })}
        </h1>
      </div>

      {/* CTA row */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-5 text-sm"
        style={{ color: 'var(--color-muted)' }}
      >
        <button
          type="button"
          aria-label="Regenerate"
          className="rounded p-2 transition hover:opacity-80"
          style={{ color: 'var(--color-muted)' }}
        >
          <RefreshIcon />
        </button>
        <button
          type="button"
          onClick={scrollToWriting}
          className="rounded px-2 py-2 transition hover:opacity-80 font-mono uppercase tracking-wider text-xs"
        >
          ↓ writing
        </button>
      </motion.div>
    </section>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with no errors.

- [ ] **Step 4: Visual verification**

Ensure the dev server is running (`mcp__Claude_Preview__preview_start` with name `astro-dev` if not). Then:
- `mcp__Claude_Preview__preview_resize` with `width: 1280, height: 800`
- `mcp__Claude_Preview__preview_screenshot`

Expected screenshot:
- Hero section ~80vh tall
- Tagline "Machine learning, explained before your context window runs out." centered, italic serif, ~5 lines (depending on viewport)
- Word "context" in accent color
- Soft circular glow visible behind tagline
- Bottom of hero: small refresh icon + "↓ WRITING" link
- No dev picker panel
- No GitHub/LinkedIn icons inside the hero

If anything looks off (overlapping elements, wrong colors, glow too strong/weak), fix inline and re-screenshot before committing.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "refactor(hero): replace multi-mode hero with static centered shell"
```

---

## Task 4: Add timeline state machine and per-token reveal

Add the phase state machine and the timeline driver. Tokens reveal one by one but without flicker yet. CTAs hide until after generation. No arcs yet.

**Files:**
- Modify: `src/components/home/Hero.tsx`

- [ ] **Step 1: Replace the file with this version**

Replace the entire `Hero.tsx` with:

```tsx
import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCENT_INDICES, TOKENS } from './hero/tagline';

type Phase =
  | 'pre'
  | 'generating'
  | 'settling'
  | 'arcs-in'
  | 'arcs-hold'
  | 'arcs-out'
  | 'cta-in'
  | 'idle';

const GLOW_FADE_IN_MS = 200;
const TOKEN_CYCLE_MS = 480;
const SETTLE_MS = 400;
const ARCS_IN_MS = 1350;
const ARCS_HOLD_MS = 800;
const ARCS_OUT_MS = 600;
const CTA_IN_MS = 400;

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>(prefersReduced ? 'idle' : 'pre');
  const [tokensRevealed, setTokensRevealed] = useState(
    prefersReduced ? TOKENS.length : 0
  );

  // Timeline driver
  useEffect(() => {
    if (prefersReduced) return;

    setPhase('pre');
    setTokensRevealed(0);
    const timeouts: number[] = [];
    const t = (ms: number, fn: () => void) => {
      timeouts.push(window.setTimeout(fn, ms));
    };

    t(0, () => setPhase('generating'));

    let elapsed = GLOW_FADE_IN_MS;
    for (let i = 0; i < TOKENS.length; i++) {
      t(elapsed, () => setTokensRevealed(i + 1));
      elapsed += TOKEN_CYCLE_MS;
    }

    t(elapsed, () => setPhase('settling'));
    elapsed += SETTLE_MS;

    t(elapsed, () => setPhase('arcs-in'));
    elapsed += ARCS_IN_MS;
    t(elapsed, () => setPhase('arcs-hold'));
    elapsed += ARCS_HOLD_MS;
    t(elapsed, () => setPhase('arcs-out'));
    elapsed += ARCS_OUT_MS;

    t(elapsed, () => setPhase('cta-in'));
    elapsed += CTA_IN_MS;

    t(elapsed, () => setPhase('idle'));

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [prefersReduced]);

  const scrollToWriting = useCallback(() => {
    const writing = document.querySelector('[data-section="writing"]');
    if (writing) {
      writing.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  }, []);

  const ctaVisible = phase === 'cta-in' || phase === 'idle';

  return (
    <section
      dir="ltr"
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: '70vmin',
          height: '70vmin',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.1,
          background:
            'radial-gradient(closest-side, var(--color-accent), transparent 70%)',
        }}
      />

      <div ref={containerRef} className="relative max-w-[16ch] text-center">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(2.25rem, 7vw, 5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: 'var(--color-ink)',
          }}
        >
          {TOKENS.map((tok, i) => {
            const isVisible = i < tokensRevealed;
            const isAccent = ACCENT_INDICES.includes(i);
            return (
              <span
                key={i}
                className="mr-[0.25em] inline-block"
                style={{
                  visibility: isVisible ? 'visible' : 'hidden',
                  color: isAccent ? 'var(--color-accent)' : 'inherit',
                }}
              >
                <motion.span
                  initial={prefersReduced || !isVisible ? false : { opacity: 0, y: 4 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : false}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="inline-block"
                >
                  {tok}
                </motion.span>
              </span>
            );
          })}
        </h1>
      </div>

      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-5 text-sm"
        style={{ color: 'var(--color-muted)' }}
        initial={false}
        animate={{ opacity: ctaVisible ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <button
          type="button"
          aria-label="Regenerate"
          className="rounded p-2 transition hover:opacity-80"
          style={{ color: 'var(--color-muted)' }}
        >
          <RefreshIcon />
        </button>
        <button
          type="button"
          onClick={scrollToWriting}
          className="rounded px-2 py-2 transition hover:opacity-80 font-mono uppercase tracking-wider text-xs"
        >
          ↓ writing
        </button>
      </motion.div>
    </section>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Visual verification (reload the page)**

The preview tool's screenshot captures a single moment. To verify the reveal:
- Take a screenshot immediately after reload (run `mcp__Claude_Preview__preview_screenshot`): tagline area should be empty or have only the first 1-2 tokens visible
- Wait ~3s, screenshot again: most/all tokens should be visible, CTAs still hidden
- Wait ~5s more, screenshot again: tagline fully visible, CTAs visible at bottom

If timing feels off (too fast/slow to read), adjust `TOKEN_CYCLE_MS` and re-verify.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "feat(hero): add timeline state machine and per-token reveal"
```

---

## Task 5: Add per-token flicker

Each newly-arriving token cycles through its candidates from `CANDIDATES` during a 140ms flicker window before landing on the final word.

**Files:**
- Modify: `src/components/home/Hero.tsx`

- [ ] **Step 1: Extract the token render into a child component with flicker logic**

In `Hero.tsx`, add the import for `CANDIDATES`:

```ts
import { ACCENT_INDICES, CANDIDATES, TOKENS } from './hero/tagline';
```

Below the `Hero` default export and above the `RefreshIcon` function, add:

```tsx
const FLICKER_STEP_MS = 50;

function Token({
  index,
  token,
  revealed,
  prefersReduced,
}: {
  index: number;
  token: string;
  revealed: number;
  prefersReduced: boolean;
}) {
  const isVisible = index < revealed;
  const isCurrent = index === revealed - 1;
  const isAccent = ACCENT_INDICES.includes(index);
  const color = isAccent ? 'var(--color-accent)' : 'inherit';

  const [flickerStep, setFlickerStep] = useState<number | null>(null);

  useEffect(() => {
    if (prefersReduced || !isCurrent) {
      setFlickerStep(null);
      return;
    }
    const candidates = CANDIDATES[index];
    if (!candidates || candidates.length <= 1) return;
    let step = 0;
    setFlickerStep(0);
    const id = window.setInterval(() => {
      step++;
      if (step >= candidates.length - 1) {
        setFlickerStep(null);
        window.clearInterval(id);
      } else {
        setFlickerStep(step);
      }
    }, FLICKER_STEP_MS);
    return () => window.clearInterval(id);
  }, [isCurrent, index, prefersReduced]);

  const displayToken =
    flickerStep !== null ? CANDIDATES[index]?.[flickerStep] ?? token : token;

  return (
    <span
      className="mr-[0.25em] inline-block"
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
        color,
      }}
    >
      <motion.span
        initial={prefersReduced || !isVisible ? false : { opacity: 0, y: 4 }}
        animate={isVisible ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="inline-block"
      >
        {displayToken}
      </motion.span>
    </span>
  );
}
```

(You'll need to import `useEffect, useState` if not already in the existing import line — they should already be there from Task 4.)

- [ ] **Step 2: Replace the inline token render with `<Token>`**

In the `Hero` component's JSX, replace the entire `<h1>` block's children with this:

```tsx
<h1
  style={{
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: 'clamp(2.25rem, 7vw, 5rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
    color: 'var(--color-ink)',
  }}
>
  {TOKENS.map((tok, i) => (
    <Token
      key={i}
      index={i}
      token={tok}
      revealed={tokensRevealed}
      prefersReduced={!!prefersReduced}
    />
  ))}
</h1>
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Visual verification**

Reload the page in the preview and take rapid screenshots (~500ms apart) during the first 4 seconds. You should see, at different moments, alternates like "Deep", "Statistical" sitting briefly in the position before settling. The final state should still show the canonical TOKENS sentence.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "feat(hero): add per-token candidate flicker during generation"
```

---

## Task 6: Wire AttentionArcs into Hero

Pass token refs into `AttentionArcs` and render it inside the tagline container. It will show/hide based on phase.

**Files:**
- Modify: `src/components/home/Hero.tsx`

- [ ] **Step 1: Import AttentionArcs and add ref-passing**

At the top of `Hero.tsx`, add:

```ts
import AttentionArcs from './hero/AttentionArcs';
```

In the `Hero` component, add token refs state above the existing `containerRef`:

```ts
const tokenRefs = useRef<Map<number, HTMLElement | null>>(new Map());
const [runId, setRunId] = useState(0); // bumped on regenerate (Task 8)
```

Pass a `registerRef` prop to `Token`:

```tsx
{TOKENS.map((tok, i) => (
  <Token
    key={i}
    index={i}
    token={tok}
    revealed={tokensRevealed}
    prefersReduced={!!prefersReduced}
    registerRef={(el: HTMLSpanElement | null) => {
      tokenRefs.current.set(i, el);
    }}
  />
))}
```

- [ ] **Step 2: Replace the entire Token component to accept and forward the ref**

Replace the `Token` component (added in Task 5) with this full version:

```tsx
function Token({
  index,
  token,
  revealed,
  prefersReduced,
  registerRef,
}: {
  index: number;
  token: string;
  revealed: number;
  prefersReduced: boolean;
  registerRef: (el: HTMLSpanElement | null) => void;
}) {
  const isVisible = index < revealed;
  const isCurrent = index === revealed - 1;
  const isAccent = ACCENT_INDICES.includes(index);
  const color = isAccent ? 'var(--color-accent)' : 'inherit';

  const [flickerStep, setFlickerStep] = useState<number | null>(null);

  useEffect(() => {
    if (prefersReduced || !isCurrent) {
      setFlickerStep(null);
      return;
    }
    const candidates = CANDIDATES[index];
    if (!candidates || candidates.length <= 1) return;
    let step = 0;
    setFlickerStep(0);
    const id = window.setInterval(() => {
      step++;
      if (step >= candidates.length - 1) {
        setFlickerStep(null);
        window.clearInterval(id);
      } else {
        setFlickerStep(step);
      }
    }, FLICKER_STEP_MS);
    return () => window.clearInterval(id);
  }, [isCurrent, index, prefersReduced]);

  const displayToken =
    flickerStep !== null ? CANDIDATES[index]?.[flickerStep] ?? token : token;

  return (
    <span
      ref={registerRef}
      className="mr-[0.25em] inline-block"
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
        color,
      }}
    >
      <motion.span
        initial={prefersReduced || !isVisible ? false : { opacity: 0, y: 4 }}
        animate={isVisible ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="inline-block"
      >
        {displayToken}
      </motion.span>
    </span>
  );
}
```

- [ ] **Step 3: Render AttentionArcs inside the container**

Inside the `<div ref={containerRef} ...>` block, add `<AttentionArcs>` as a sibling of the `<h1>`:

```tsx
<div ref={containerRef} className="relative max-w-[16ch] text-center">
  <h1 /* ... */>
    {/* tokens */}
  </h1>
  <AttentionArcs
    tokenRefs={tokenRefs.current}
    containerRef={containerRef}
    phase={phase}
    measureKey={runId}
  />
</div>
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Visual verification**

Reload the page and wait through generation. About 5 seconds in (after all tokens settle and the 400ms `settling` pause), faint curved lines in `var(--color-accent-3)` should draw from each token down and back to its attended-to previous tokens. They should hold visible for ~800ms, then fade out before the CTAs appear.

If arcs don't appear at all: check that the dev tools console doesn't show errors, and confirm `tokenRefs.current` has populated entries by adding `console.log(tokenRefs.current)` temporarily (remove before commit).

If arcs are positioned wrong: re-check the `buildArcs` math against the actual rendered layout.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "feat(hero): wire AttentionArcs into the timeline"
```

---

## Task 7: Add glow brightening per token + ambient idle pulse

Replace the static glow `<div>` with a `<Glow>` component that brightens briefly with each new token and slowly pulses while idle.

**Files:**
- Modify: `src/components/home/Hero.tsx`

- [ ] **Step 1: Track glow burst timing and add the Glow component**

In `Hero.tsx`, add to the component's state:

```ts
const [glowBurst, setGlowBurst] = useState(0);
```

In the timeline `useEffect`, modify the token reveal step so each call also bumps `glowBurst`:

```ts
for (let i = 0; i < TOKENS.length; i++) {
  t(elapsed, () => {
    setTokensRevealed(i + 1);
    setGlowBurst(Date.now());
  });
  elapsed += TOKEN_CYCLE_MS;
}
```

Below the `Hero` export (next to `Token`), add the `Glow` component:

```tsx
const GLOW_BURST_MS = 200;

function Glow({
  phase,
  burst,
  prefersReduced,
}: {
  phase: Phase;
  burst: number;
  prefersReduced: boolean;
}) {
  const baseOpacity = phase === 'pre' ? 0 : 0.1;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        width: '70vmin',
        height: '70vmin',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(closest-side, var(--color-accent), transparent 70%)',
        }}
        initial={{ opacity: 0 }}
        animate={
          prefersReduced
            ? { opacity: 0.1 }
            : phase === 'idle'
              ? { opacity: [0.08, 0.14, 0.08] }
              : { opacity: baseOpacity }
        }
        transition={
          prefersReduced
            ? { duration: 0 }
            : phase === 'idle'
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2, ease: 'easeOut' }
        }
      />
      {!prefersReduced && burst > 0 && (
        <motion.div
          key={burst}
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(closest-side, var(--color-accent), transparent 70%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.06, 0] }}
          transition={{ duration: GLOW_BURST_MS / 1000, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace the static glow `<div>` with `<Glow>`**

In the `Hero` JSX, replace the entire static glow `<div aria-hidden ...>` block with:

```tsx
<Glow phase={phase} burst={glowBurst} prefersReduced={!!prefersReduced} />
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Visual verification**

Reload. The glow should:
- Start invisible
- Fade in to ~10% as the first token appears
- Brighten subtly with each new token (look for a quick pulse, hard to catch in a single screenshot — best verified with `mcp__Claude_Preview__preview_eval` to check opacity at multiple timestamps, or just visually with the eye)
- After CTAs appear, do a slow 4-second breathing pulse

If brightening is too obvious / distracting, lower the `0.06` peak in the burst layer. If the ambient pulse is too obvious, narrow the range from `[0.08, 0.14, 0.08]` to `[0.09, 0.12, 0.09]`.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "feat(hero): add glow burst per token and ambient idle pulse"
```

---

## Task 8: Wire regenerate button

Clicking the regenerate icon restarts the timeline. The button is already in the JSX from Task 3; this task wires the click handler.

**Files:**
- Modify: `src/components/home/Hero.tsx`

- [ ] **Step 1: Add the regenerate callback**

In the `Hero` component, add:

```ts
const regenerate = useCallback(() => {
  setRunId((r) => r + 1);
}, []);
```

(`runId` was added in Task 6.)

- [ ] **Step 2: Make the timeline `useEffect` depend on `runId`**

Change the dependency array of the timeline `useEffect` from `[prefersReduced]` to `[prefersReduced, runId]`. Now bumping `runId` re-runs the effect, restarting the timeline from `pre`.

- [ ] **Step 3: Wire the button**

Add `onClick={regenerate}` to the regenerate `<button>`:

```tsx
<button
  type="button"
  onClick={regenerate}
  aria-label="Regenerate"
  className="rounded p-2 transition hover:opacity-80"
  style={{ color: 'var(--color-muted)' }}
>
  <RefreshIcon />
</button>
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Visual verification**

Reload the page, wait for the full sequence to settle, then click the regenerate icon. Verify:
- Tagline clears and re-generates from scratch
- Arcs play again
- No console errors
- No ghost arcs or tokens left over from the previous run

Use `mcp__Claude_Preview__preview_click` to click the regenerate button programmatically and `mcp__Claude_Preview__preview_screenshot` immediately after to confirm the reset.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "feat(hero): wire regenerate button to restart timeline"
```

---

## Task 9: Add mobile arcs-skip

On viewports under 640px, skip the arcs phases entirely — tagline wraps to many short lines on phones and arcs across line breaks get messy.

**Files:**
- Modify: `src/components/home/Hero.tsx`

- [ ] **Step 1: Track viewport size**

In `Hero`, add:

```ts
const MOBILE_BREAKPOINT = 640;
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  check();
  window.addEventListener('resize', check);
  return () => window.removeEventListener('resize', check);
}, []);
```

- [ ] **Step 2: Branch the timeline on `isMobile`**

In the timeline `useEffect`, replace the arcs phases block:

```ts
t(elapsed, () => setPhase('arcs-in'));
elapsed += ARCS_IN_MS;
t(elapsed, () => setPhase('arcs-hold'));
elapsed += ARCS_HOLD_MS;
t(elapsed, () => setPhase('arcs-out'));
elapsed += ARCS_OUT_MS;
```

with:

```ts
if (!isMobile) {
  t(elapsed, () => setPhase('arcs-in'));
  elapsed += ARCS_IN_MS;
  t(elapsed, () => setPhase('arcs-hold'));
  elapsed += ARCS_HOLD_MS;
  t(elapsed, () => setPhase('arcs-out'));
  elapsed += ARCS_OUT_MS;
} else {
  // Brief pause in place of arcs on mobile
  elapsed += 200;
}
```

Add `isMobile` to the dependency array: `[prefersReduced, runId, isMobile]`.

- [ ] **Step 3: Conditionally render `<AttentionArcs>`**

Wrap the `<AttentionArcs>` JSX:

```tsx
{!isMobile && (
  <AttentionArcs
    tokenRefs={tokenRefs.current}
    containerRef={containerRef}
    phase={phase}
    measureKey={runId}
  />
)}
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Visual verification at mobile sizes**

Resize and verify:

```
mcp__Claude_Preview__preview_resize  width: 375  height: 812   # iPhone
mcp__Claude_Preview__preview_screenshot
```

Expected:
- Tagline wraps to 3-5 lines, readable
- CTA row fits on one row, tap targets ~44px tall (the icon button has p-2 = 8px padding around 14px icon = 30px tappable; consider increasing to `p-3` if it looks too small)
- After generation completes, NO arcs render
- CTAs appear after a brief pause

Then:

```
mcp__Claude_Preview__preview_resize  width: 320  height: 568   # iPhone SE
mcp__Claude_Preview__preview_screenshot
```

Expected: still readable, no horizontal overflow.

Resize back to desktop and confirm arcs do still render there:

```
mcp__Claude_Preview__preview_resize  width: 1280  height: 800
mcp__Claude_Preview__preview_screenshot
```

- [ ] **Step 6: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "feat(hero): skip attention arcs on mobile viewports"
```

---

## Task 10: Reduced motion verification

`useReducedMotion()` is already wired in from Task 3 (state initializers use `prefersReduced` and the timeline `useEffect` early-returns). This task verifies that path actually renders the right thing and patches any gaps.

**Files:**
- Modify (potentially): `src/components/home/Hero.tsx`

- [ ] **Step 1: Verify the reduced-motion path with the preview tool**

Use the preview emulation:

```
mcp__Claude_Preview__preview_resize  width: 1280  height: 800
```

Then evaluate reduced motion preference. Unfortunately `preview_resize` may not toggle `prefers-reduced-motion` directly. The fallback is to temporarily force the value in code:

In `Hero.tsx`, temporarily replace `const prefersReduced = useReducedMotion();` with `const prefersReduced = true;` for verification, screenshot, then revert.

```
mcp__Claude_Preview__preview_screenshot
```

Expected:
- Page loads with the FULL tagline visible immediately
- "context" in accent color
- Glow at static ~10%
- CTAs visible immediately
- No arcs anywhere
- No animation when waiting (no breathing glow)

Revert the temporary hardcode back to `const prefersReduced = useReducedMotion();`.

- [ ] **Step 2: If the reduced-motion render had any issues, fix them inline**

Common problems to check:
- Glow opacity wrong when `prefersReduced` is true (should be 0.1 static, not 0)
- Tokens hidden (the `visibility: hidden` style requires `tokensRevealed === TOKENS.length` for all tokens to show)
- CTAs hidden (the `ctaVisible` check should include `phase === 'idle'`, which is the initial state when reduced)

After any fixes, `npx tsc --noEmit` and re-screenshot.

- [ ] **Step 3: Commit (only if fixes were needed)**

If Step 2 required changes:

```bash
git add src/components/home/Hero.tsx
git commit -m "fix(hero): correct reduced-motion fallback rendering"
```

Otherwise, no commit needed for this task.

---

## Task 11: Final cross-viewport and interaction verification

This is the "before claiming done" pass from the spec.

- [ ] **Step 1: Full sequence verification at desktop**

```
mcp__Claude_Preview__preview_resize  width: 1280  height: 800
```

Reload the page (`mcp__Claude_Preview__preview_navigate` to `http://localhost:4321/` if needed, or just trigger by re-screenshotting after a code-noop edit).

Take screenshots at ~1s intervals for 10 seconds. Verify:
- t=0: empty tagline, glow fading in
- t=2: ~4 tokens visible, mid-generation
- t=5: all tokens visible, just settled
- t=6: arcs visible
- t=7-8: arcs fading, CTAs fading in
- t=9+: settled idle state with CTAs and ambient glow pulse

- [ ] **Step 2: Regenerate behavior**

While in the settled state:
- `mcp__Claude_Preview__preview_click` on the regenerate button (selector: `button[aria-label="Regenerate"]`)
- Immediately `mcp__Claude_Preview__preview_screenshot` — should be back to empty tagline
- Wait 8 seconds, screenshot — should be settled again
- Verify no duplicate/ghost arcs from the prior run

- [ ] **Step 3: Scroll hint**

- `mcp__Claude_Preview__preview_click` on the `↓ writing` button
- Screenshot — page should scroll to reveal the post list below the hero

- [ ] **Step 4: Mobile**

```
mcp__Claude_Preview__preview_resize  width: 375  height: 812
mcp__Claude_Preview__preview_screenshot
```
Reload and verify the mobile sequence:
- Tagline wraps cleanly
- No arcs phase
- CTAs visible and tappable
- Try the regenerate button on mobile

```
mcp__Claude_Preview__preview_resize  width: 320  height: 568
mcp__Claude_Preview__preview_screenshot
```
Verify no horizontal overflow, CTAs still tappable.

- [ ] **Step 5: Console check**

`mcp__Claude_Preview__preview_console_logs` — verify there are no errors or warnings from the Hero across any of the runs.

- [ ] **Step 6: Final TypeScript check**

```bash
npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 7: Stop the dev server**

`mcp__Claude_Preview__preview_stop` on the active serverId.

- [ ] **Step 8: Report to the user**

Send a brief message summarizing:
- All tasks complete
- Verified states (desktop, mobile, regenerate, reduced motion path)
- Any tunable values the user may want to adjust (TOKEN_CYCLE_MS, glow opacities, candidate words, attention pair weights)
- Suggest a manual look in their own browser before declaring it shipped

No commit for this task — it's verification only.

---

## Summary of commits this plan produces

1. `feat(hero): add tagline data (tokens, candidates, attention pairs)`
2. `feat(hero): add AttentionArcs component (SVG arcs between word refs)`
3. `refactor(hero): replace multi-mode hero with static centered shell`
4. `feat(hero): add timeline state machine and per-token reveal`
5. `feat(hero): add per-token candidate flicker during generation`
6. `feat(hero): wire AttentionArcs into the timeline`
7. `feat(hero): add glow burst per token and ambient idle pulse`
8. `feat(hero): wire regenerate button to restart timeline`
9. `feat(hero): skip attention arcs on mobile viewports`
10. (optional) `fix(hero): correct reduced-motion fallback rendering`

11 tasks total, 9-10 commits. Each task leaves the codebase in a working, typechecked, visually verifiable state.
