# Blog widget upgrades - design

Scope: upgrade the 4 existing interactive widgets in `src/content/blog/the-simple-idea-behind-every-llm.mdx` and add 2 new ones. Mobile-first; the blog audience is primarily on phones.

## Cross-cutting requirements

- **SVG containers**: `width: 100%`, `max-width: 360–400px`, scale with viewport
- **Touch targets**: minimum 44px tall buttons / interactive elements
- **SVG label text**: minimum 14px (current 11–13px is too small for phones)
- **Control rows**: `flex-col` by default, `sm:flex-row` at ≥640px
- **All UI text in Hebrew** (captions, button labels, tab names)
- **No hover-only states**: every hover effect must also fire on tap
- **Pointer events**: use PointerEvents for touch + mouse parity
- **Animations**: CSS transitions or `requestAnimationFrame` only - no animation libraries
- **Wrapper**: every widget uses the existing `DemoFrame` component for consistent framing

## 1. DotProduct v2

**File:** `src/components/viz/DotProduct.tsx` (rewrite)

**Plot:** unchanged 2D plane SVG. Vector `a` is fixed at a baseline direction (1.0, 0.5 - pointing up-right). Vector `b` moves via controls.

**Default controls - 4 preset buttons** (Hebrew):

| Label | Effect on b |
|---|---|
| אותו כיוון | b ← a (aligned) |
| ניצב | b ← perp(a) |
| כיוון הפוך | b ← -a |
| באמצע | b ← rotate(a, 45°) |

Each press animates `b` from current → target over 300ms via `requestAnimationFrame` (lerp x, y). Numeric panels (`a · b`, `angle`) update live during the animation.

**Power-user toggle:** below the buttons, a small "טווח חופשי" toggle. When on, exposes draggable handles on `a` and `b` (current v1 behavior). When off (default), drag handles hidden.

**Text:** title "מכפלה סקלרית". Caption "לחצו על כפתור. אותו כיוון = חיובי. ניצב = אפס. הפוך = שלילי."

**Mobile:** plot 320×320 max. Buttons in a 2×2 grid on mobile, single row on ≥640px. Numeric panels stay 2-col grid.

## 2. EmbeddingSpace v2

**File:** `src/components/viz/EmbeddingSpace.tsx` (rewrite)

**Plot:** keep current SVG. Start with 3 anchor words always visible: שמח, עצוב, מכונית. These cannot be removed.

**Badge vocabulary** (~12 words, predefined coordinates, semantic groups):

| Group | Words | Color |
|---|---|---|
| רגשות חיוביים | שמח (anchor), מאושר, אוהב, גאה | accent-3 (green) |
| רגשות שליליים | עצוב (anchor), כועס, מפחד, שונא | accent-2 (blue) |
| חפצים | מכונית (anchor), אופניים, מטוס, כיסא | accent-4 (amber) |
| ניטרליים | אדיש, חושב | muted |

**Interaction:** tap a badge → word fades in at its position (300ms). Tap again → fades out. Active badges have filled background; inactive are outlined.

**Visual aids:** the emotion-axis dashed line + cluster ring from v1 persist but only render when their constituent words are active.

**No distance readout** - pure visual.

**Mobile:** badges in a wrap-flex grid below the plot. Each badge `min-h-9 px-3` (≥36×44px). SVG 360×360 max, full viewport width on phones.

## 3. WeightedSum (new)

**File:** `src/components/viz/WeightedSum.tsx` (new)
**Goes into:** `the-simple-idea-behind-every-llm.mdx`, in or right after the "הבעיה האמיתית" section (after the equation $y_i = \sum \alpha_{i,j} x_j$).

**Goal:** make the weighted-sum equation tangible - y is a true weighted average of word vectors.

**Layout (mobile-first vertical):**
- **Top:** 240×240 SVG plane with 3 source-word vectors:
  - קופסה (left side)
  - מזוודה (upper-right)
  - גדולה (lower-right)
  - Plus a **black y vector** computed live as $\sum \alpha_j x_j$
- **Middle:** 3 preset buttons: "שווה משקל" / "רק על קופסה" / "רק על גדולה"
- **Bottom:** 3 horizontal sliders (one per word), labeled with α value

**Auto-normalization:** sliders auto-balance so $\sum \alpha = 1$. Moving one slider up scales the others down proportionally. Visual indicator next to each slider shows current α as a percentage.

**Text:** title "ממוצע משוקלל". Caption "המשקלים שולטים על המיקום של y. נסו לשנות אותם."

**Mobile:** entire widget stacks vertically. Sliders are styled `<input type="range">` with full-width thumb tracks.

## 4. QKV (new)

**File:** `src/components/viz/QKV.tsx` (new)
**Goes into:** "הטריק הגדול" section (between the Q/K/V equation block and the Google analogy paragraph).

**Layout:** segmented-control tabs at top with two modes:

### Tab A: "וקטורים" (Vector flow)

- Word selector (segmented buttons): היא / קופסה / נכנסה
- Below: the selected word $x_i$ shown as a 6-cell mini-heatmap
- Three downward arrows fanning out to three boxes labeled **Q**, **K**, **V**
- Each box contains its own 6-cell mini-heatmap (deterministic per word, so values are stable)
- Below each box: Hebrew role caption - "שואל" / "מציע מידע" / "תוכן"

Implementation note: derive Q/K/V values from a seeded hash of the word so they look "real" but require no model.

### Tab B: "אנלוגיית גוגל"

- A stylized Google-style search box at top showing the Hebrew word as a query (Q)
- Three "result cards" below, each with a snippet (K = title/metadata) and body (V = page content)
- Visual arrows: the Q matches the K of one result, which "returns" the V
- Same word selector at top (shared state with Tab A)

**Tabs styling:** segmented control with rounded pill, active tab has darker bg. Both tabs use the same word selector - switching tabs preserves which word is selected.

**Mobile:** tabs stay horizontal (only 2). Inside Tab A, Q/K/V boxes stack vertically on phones, row of 3 on desktop. Inside Tab B, result cards stack always.

## 5. AttentionDemo v2 (Sankey)

**File:** `src/components/viz/AttentionDemo.tsx` (rewrite)

**Layout:**
- **Top:** row of 3–4 sentence chips (preset Hebrew sentences from the post). One is selected at a time. Examples:
  - "הקופסה לא נכנסה למזוודה כי היא הייתה גדולה מדי"
  - "המורה צעקה על התלמידה כי היא הייתה עצבנית"
  - "המורה צעקה על התלמידה כי היא התחצפה"
- **No text input** - drops the keyboard problem on mobile entirely.
- **Middle (the Sankey):**
  - Two columns of the sentence's words. Right column = "target" words (Hebrew reading start). Left column = "source" words (same list).
  - SVG bezier bands flow right→left from each target to each source. Band width = attention weight (computed via existing heuristic, kept but tuned: distance decay + shared-letters + pronoun-lookback bonus for pronouns like היא/הוא).
  - Self-loops (word attending to itself) rendered as a short arc that loops back to the same row.
- **Default state:** all bands visible at 30% opacity (so the whole picture is visible without overwhelming).
- **Tap interaction:** tap a right-column (target) word → only its outgoing bands stay at full opacity; others fade to 8%. Tap the same word again or tap background → reset.

**Heuristic tuning:** keep the existing distance-decay + shared-letter signals; add a pronoun-lookback bonus so pronouns like "היא" get higher weights pointing to nearby nouns. The existing post caption already disclaims this is heuristic, so no factual change.

**Mobile:** Sankey scales width-fit. On phones (<500px) the two columns get closer together; bands shorter. Sentence chips wrap if they overflow; each chip ≥44px tall.

## Build order

1. **DotProduct v2** - smallest scope, establishes the mobile control patterns (button row, animation, toggle)
2. **EmbeddingSpace v2** - extends v1, exercises the badge pattern
3. **WeightedSum** - new, builds on patterns from 1 & 2
4. **QKV** - new, conceptually hardest; benefits from earlier patterns
5. **AttentionDemo v2 Sankey** - biggest viz, want it last when interaction language is stable

Each widget: build → wire into MDX → verify in preview at mobile viewport (375px) before moving to next.

## Out of scope

- No real attention model in browser (all heuristic / deterministic-from-hash)
- No new pages or routes
- No changes to global typography or theming beyond what's needed for widget legibility
- No animation library; rAF + CSS only
- No new dependencies in `package.json`
