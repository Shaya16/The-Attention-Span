# Hero redesign - Live LLM-generation centerpiece

**Date:** 2026-05-24
**Component:** `src/components/home/Hero.tsx`
**Status:** Design approved, ready for implementation plan

## Goal

Replace the current multi-mode experimental Hero with a single opinionated, slick, editorial hero in the style of OpenAI / Anthropic / Medium blog homepages. The tagline "Machine learning, explained before your context window runs out." is the centerpiece, animated as a live LLM generation: each word flickers through alternative candidates before settling, and after the sentence completes, faint attention arcs draw between attended-to word pairs.

The hero should:
- Feel slick and considered, not busy or gimmicky
- Tie the visual identity to the blog's name ("The Attention Span") by literally showing attention
- Play once on load, with a tiny regenerate button for returning visitors
- Work well on mobile (Shay's readers are primarily mobile)
- Honor `prefers-reduced-motion`

## What the user sees

1. Page loads. A soft circular accent-colored glow fades in behind an empty tagline area.
2. The tagline appears word by word. Each word briefly flickers through 2-3 candidate alternatives before settling into the chosen word. The glow brightens with each new token.
3. After the sentence finishes, faint curved arcs draw beneath the tagline, connecting each word back to 1-2 previous words it "attends to."
4. Arcs hold briefly, then fade out. A tiny regenerate icon and a "↓ writing" scroll hint fade in at the bottom.
5. The glow settles into a slow ambient pulse.
6. Clicking the regenerate icon replays the whole sequence (minus the initial glow fade-in).

Total runtime from load to settled: ~8 seconds.

## Layout

- `<section>` with `min-height: 80vh`, flex-centered both axes.
- Wrapped in `dir="ltr"` so the English tagline lays out correctly inside the globally-RTL site.
- **No wordmark in the hero.** The header already carries the brand (logo + name); repeating it here adds noise.
- **Tagline:**
  - Font: Instrument Serif italic (matches existing site title font)
  - Size: `clamp(2.25rem, 7vw, 5rem)`, line-height ~1.05, letter-spacing -0.03em
  - Color: `var(--color-ink)` for most words. One or two key words get `var(--color-accent)` (initial pick: "Attention" if present, else "context" - author-chosen, defined in `ACCENT_INDICES`).
  - Max-width ~16ch so it wraps into 2-3 lines on desktop, 3-4 on mobile
- **Glow:**
  - Soft circular radial gradient, `var(--color-accent)` at low opacity
  - Sized ~1.4x the tagline bounding box
  - Behind the tagline, pointer-events none, aria-hidden
- **CTA row** (fades in after generation completes):
  - Tiny regenerate icon button (refresh arrow, ~14px), muted color, hover brightens
  - "↓ writing" link that smooth-scrolls to the post list section
  - Both on a single row, small gap between them

## Animation timeline

All durations tunable in code. Defaults:

| Phase | Time | Description |
|---|---|---|
| 0. `pre` | 0ms | Hero mounted, tagline empty, glow at 0% |
| 1. Glow on | 0–200ms | Glow fades to ambient ~10% opacity |
| 2. `generating` | 200–4520ms | 9 tokens × 480ms per token cycle |
| 3. `settling` | 4520–4920ms | All 9 tokens visible, 400ms pause |
| 4. `arcs-in` | 4920–6270ms | Attention arcs draw in waves grouped by source token (~150ms per wave × 9 source tokens) |
| 5. `arcs-hold` | 6270–7070ms | All arcs held visible (800ms) |
| 6. `arcs-out` | 7070–7670ms | Arcs fade out (600ms) |
| 7. `cta-in` | 7670–8070ms | Regenerate button + scroll hint fade in (400ms) |
| 8. `idle` | 8070ms+ | Glow does a slow 4s ambient pulse, loops |

### Per-token generation (phase 2)

Each token cycle is 480ms total:
1. 140ms flicker: 2-3 candidate alternatives swap in place at ~50ms each
2. 100ms settle: chosen word lands with subtle y-fade (4px → 0)
3. 240ms read-pause before the next token starts
4. Glow brightens during settle: 10% → 16% → 10% over 200ms (overlaps into the read-pause)

Candidates are authored, not computed. Initial draft (editable):

| Index | Token | Candidates (last is chosen) |
|---|---|---|
| 0 | Machine | Statistical, Deep, Machine |
| 1 | learning, | thinking,, training,, learning, |
| 2 | explained | translated, decoded, explained |
| 3 | before | until, after, before |
| 4 | your | the, my, your |
| 5 | context | memory, attention, context |
| 6 | window | buffer, span, window |
| 7 | runs | gives, gets, runs |
| 8 | out. | dry., low., out. |

### Attention arcs (phase 4)

- Rendered as thin SVG quadratic Bézier curves below the tagline baseline
- Each word draws 1-2 arcs back to its "attended-to" previous words
- Stroke: `var(--color-accent-3)` at 1.5px, opacity scales with weight (0.25–0.6 range)
- Arcs draw in waves grouped by source token (all arcs from token i draw simultaneously, then token i+1's wave starts ~150ms later) via stroke-dasharray animation
- Arc Y position uses each word's actual baseline (so arcs respect line wrapping)

Authored attention pairs (per token → list of `{targetIndex, weight}`):

| Token (i) | Attended-to indices and weights |
|---|---|
| 0 Machine | - (first token) |
| 1 learning, | {0: 0.9} |
| 2 explained | {0: 0.5, 1: 0.7} |
| 3 before | {2: 0.6} |
| 4 your | {3: 0.4} |
| 5 context | {0: 0.6, 4: 0.5} |
| 6 window | {5: 0.9} |
| 7 runs | {6: 0.7, 5: 0.4} |
| 8 out. | {7: 0.8, 6: 0.5} |

These weights are aesthetic, not derived. Edit freely.

### Regenerate

Click the regenerate icon → reset `tokensRevealed` to 0 and `phase` to `pre`. Re-kick the timeline. Skip phase 0's initial glow fade-in (glow stays on between runs).

### Reduced motion

If `useReducedMotion()` returns true:
- Skip all timers
- Render immediately with `tokensRevealed = TOKENS.length`, `phase = 'idle'`
- Glow at static 10% opacity, no ambient pulse animation
- No attention arcs render at all
- CTA row visible immediately

## File structure

Three files (one new directory):

```
src/components/home/
  Hero.tsx                      # orchestrator (~150 lines, down from ~400)
  hero/
    tagline.ts                  # TOKENS, CANDIDATES, ATTENTION_PAIRS data
    AttentionArcs.tsx           # SVG arcs component
```

### `Hero.tsx` responsibilities
- Owns `phase` and `tokensRevealed` state
- Single master `useEffect` drives the timeline via sequenced `setTimeout`s
- Cleanup on unmount and on regenerate (clear all pending timeouts)
- Renders: glow div, tagline `<p>` with one inline `<span>` per token, `<AttentionArcs>` (when phase ∈ arcs-in/hold/out and viewport ≥ 640px), CTA row
- Renders `useReducedMotion()` fallback before any timers fire

### `tagline.ts` responsibilities
- Export `TOKENS: string[]`
- Export `CANDIDATES: Record<number, string[]>` (last entry per array is the chosen word)
- Export `ATTENTION_PAIRS: Record<number, Array<{ target: number; weight: number }>>`
- Export `ACCENT_INDICES: number[]` (which token indices get `var(--color-accent)` color)
- Pure data, no imports

### `AttentionArcs.tsx` responsibilities
- Props: `tokenRefs: Map<number, HTMLElement>`, `pairs: typeof ATTENTION_PAIRS`, `phase: Phase`
- Uses `useLayoutEffect` to measure token positions on mount and on window resize
- Renders an SVG positioned absolutely over the tagline area
- For each pair, draws a quadratic Bézier curve from the bottom-center of the source word to the bottom-center of the target word, with the control point ~30px below the midpoint
- Animates `stroke-dashoffset` from `pathLength` → 0 during `arcs-in`
- Fades opacity during `arcs-out`

## Mobile

- Default mobile sizing falls out of the `clamp()` on tagline font size (min 2.25rem = 36px)
- Tagline wraps to 3-4 lines on phones - acceptable
- **Attention arcs phase is skipped entirely when viewport width < 640px** (arcs across line breaks get visually messy). Phases 4-6 collapse to a single 200ms pause. CTA fades in earlier.
- Glow scales proportionally with the tagline
- CTA row remains a single row on mobile (tap targets ≥ 44px even though icons are 14px - wrap them in padded buttons)

## Code to remove

From the current `Hero.tsx`:
- `MeshBg`, `DotsBg`, `GrainBg`, `SimpleBg` (all four background components)
- `Background` switcher
- `PickerPanel`, `BG_LABEL`, `REVEAL_LABEL`, `BgMode`, `RevealMode` types
- Old `TokenSpan` logic for `probabilities` and `attention` modes (replaced by new generation + arcs)
- Old `Cursor` component (not used in new design)
- `synthWeights` function (replaced by `ATTENTION_PAIRS` data)
- `ALT_FOR_INDEX` (replaced by `CANDIDATES` data)
- GitHub + LinkedIn icon block (header already has them)

## Verification before claiming done

- Load the page in the preview, watch the full sequence end-to-end, screenshot at each phase boundary
- Toggle `prefers-color-scheme: dark` and reduced-motion via the preview tool; confirm reduced-motion path renders the final settled state correctly
- Resize to 375px (iPhone) and 320px, confirm tagline doesn't overflow horizontally and the CTA row is tappable
- Click regenerate, confirm it cleanly restarts without ghost timers from the previous run
- Confirm no console errors, no layout shift after the first paint

## Out of scope

- Header / nav changes (already in good shape after recent commits)
- Post list section styling (this redesign is hero-only)
- Dark mode (not currently in the design system)
- Animated wordmark / logo changes
- Sound or haptic effects
