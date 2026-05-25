# The Attention Span - initial blog scaffold

**Date:** 2026-05-24
**Status:** Approved - ready for implementation plan

## Context

Shay is starting a personal blog for explanatory machine learning and deep learning content. The defining feature is interactive React components (attention visualizers, gradient descent demos, charts) embedded directly in MDX posts. The GitHub repo `Shaya16/The-Attention-Span` exists but is empty, and the local working directory is empty.

A pre-built scaffold (`blog-scaffold.zip` in `~/Downloads`) already contains most of the stack: Astro 5 + MDX + React 19 + Tailwind v4 + KaTeX + Recharts, four well-built viz components, two sample posts, layouts, content collection, RSS, sitemap, and favicon. The work for this spec is therefore **not "build from scratch"** but rather: **extract the scaffold, customize it for Shay's identity, and add the Medium-style hero with motion that he asked for.**

## Goals

1. A working local dev environment for the blog (`npm run dev` serves the site, `npm run build` produces a clean static build).
2. A Medium-style home page with a banner hero (title + tagline + social links + motion entrance).
3. Personal identity wired in: name, site title, real GitHub and LinkedIn URLs.
4. All four scaffold viz components rendering correctly inside the sample MDX post.
5. Local git repo initialized and the work committed. **No push, no Cloudflare wiring** in this round.

## Non-goals (out of scope for this spec)

- Dark mode
- Deploying to Cloudflare Pages (Shay will wire that up himself)
- Pushing to GitHub
- Writing real explanatory post content beyond the two sample posts already in the scaffold
- Additional viz components beyond the four shipped in the scaffold
- Author photo / illustrations
- Analytics, tracking, comments

## What's in the scaffold (delta context)

Files at the root of `blog-scaffold/` in the zip (paths shown as they'll land after extraction):

```
astro.config.mjs                              # Astro config, MDX+remarkMath+rehypeKatex, tailwindcss vite plugin, sitemap
package.json                                  # deps: astro 5, @astrojs/{mdx,react,rss,sitemap}, tailwind 4, recharts, katex, remark-math, rehype-katex
tsconfig.json
.gitignore
README.md
public/favicon.svg
src/
  content.config.ts                           # `blog` collection, glob loader, zod schema (title, description, pubDate, tags, draft)
  styles/global.css                           # @import tailwindcss; @theme tokens (oklch); prose-post and demo-frame components
  layouts/
    BaseLayout.astro                          # html shell, fonts via Google Fonts CDN, header with nav, footer
    PostLayout.astro                          # post chrome (date, tags, title, italic description, slot)
  pages/
    index.astro                               # home (current: hero h1 + post list, no banner)
    about.astro                               # about (placeholder content)
    rss.xml.js                                # RSS feed
    posts/[...slug].astro                     # post route
  content/blog/
    hello-blog.md                             # plain-markdown sample post
    three-things.mdx                          # MDX sample using all 3 viz components + KaTeX
  components/viz/
    DemoFrame.tsx                             # wrapper used by all viz components
    LossCurve.tsx                             # Recharts line chart, togglable series, demo training-run data
    GradientDescent.tsx                       # Canvas loss surface (Himmelblau) + SVG path overlay; SGD/Momentum/Adam toggle; LR slider
    AttentionDemo.tsx                         # Editable sentence, hover-to-attend, synthetic softmax weights
```

The viz components and posts are high quality and used **as-is** - no edits needed in this spec.

## Customizations (the actual work)

### 1. Dependencies

- Add `motion` (the rebranded Framer Motion) via `npm install motion`. Used in the new `Hero` component and a small `PostList` wrapper for staggered entrance.
- Update `package.json` `name` from `"ml-blog"` to `"the-attention-span"`.

### 2. Identity replacements

| File | Change |
|---|---|
| `src/layouts/BaseLayout.astro` | Header brand text `"your name"` → `"Shay"`. Add GitHub + LinkedIn icon links after `rss` link. |
| `src/pages/index.astro` | Page title `"your name · interactive ML"` → `"The Attention Span"`. Remove the current placeholder h1 block (replaced by `<Hero />`). |
| `src/pages/about.astro` | Page title `"about · your name"` → `"About · The Attention Span"`. Replace `"I'm your name"` with `"I'm Shay"`. Replace placeholder `#` LinkedIn and GitHub links with real URLs. Tighten the about copy to 2–3 short paragraphs in Shay's voice (intuition-first, no marketing tone, no em dashes). |
| `astro.config.mjs` | `site: 'https://your-blog.pages.dev'` → `site: 'https://the-attention-span.pages.dev'` (placeholder, Shay can update when Cloudflare is wired). |
| `README.md` | Replace scaffold-generic README with a short project-specific one (3–4 sections: what this is, how to run it, where to add posts, where to add viz components). |

### 3. Hero component

**New file:** `src/components/home/Hero.tsx`

**Props:** none for this version (content is hardcoded).

**Renders:**
- A `<section>` taking the top of the page (no fixed height; content-driven, generous vertical padding ~6rem top, ~3rem bottom).
- **Title:** "The Attention Span" - Instrument Serif italic, `clamp(3rem, 8vw, 6.5rem)`, tight letter-spacing (`-0.04em`), tight line-height (1.0). Accent color used on a single word (the word `"Attention"` styled with `color: var(--color-accent)`).
- **Tagline:** "Machine learning, explained before your context window runs out." - Geist, ~1.25rem, `var(--color-muted)`, max-width ~28rem.
- **Social row:** Inline SVG icons (GitHub and LinkedIn) - no new dependency. Icons are 20×20, neutral stroke, hover transitions to `var(--color-accent)`. URLs:
  - GitHub: `https://github.com/Shaya16`
  - LinkedIn: `https://www.linkedin.com/in/shayavivi/`

**Motion behavior (using `motion` package):**
- On mount, title fades in (`opacity 0 → 1`) and translates up (`y: 16 → 0`) over 600ms with `easeOut`.
- Tagline follows with a 120ms delay, same animation, slightly faster (400ms).
- Social row follows with a 240ms delay.
- Wrap the section in a `prefers-reduced-motion: reduce` check - if reduced motion is on, render the final state immediately with no animation.

**Hydration:** `client:load` (above the fold, small JS payload).

### 4. PostList wrapper (small)

**New file:** `src/components/home/PostList.tsx`

**Props:** `posts: Array<{ slug: string; title: string; description: string; pubDate: Date }>`

**Renders:** The same post-list markup currently inline in `index.astro` (date · title · description, with hover lift on the accent color), but wrapped in `motion` `<ul>` with a small staggered entrance (each `<li>` fades + slides up 8px, staggered 60ms). Also reduced-motion respected.

**Hydration:** `client:visible` (below the fold).

### 5. `index.astro` rewrite

Becomes:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import Hero from '../components/home/Hero.tsx';
import PostList from '../components/home/PostList.tsx';

const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .map((p) => ({
    slug: p.id,
    title: p.data.title,
    description: p.data.description,
    pubDate: p.data.pubDate,
  }));
---

<BaseLayout title="The Attention Span">
  <Hero client:load />
  <section class="mt-20">
    <h2 class="mb-6 text-sm font-medium uppercase tracking-widest text-[var(--color-muted)]">Writing</h2>
    <PostList client:visible posts={posts} />
    {posts.length === 0 && (
      <p class="text-[var(--color-muted)]">No posts yet.</p>
    )}
  </section>
</BaseLayout>
```

### 6. Header polish in `BaseLayout.astro`

Header structure becomes:

```
[ ● Shay ]              [posts] [about] [rss] [GH icon] [LI icon]
```

- Existing accent dot stays.
- Brand text changes from "your name" to "Shay".
- After the existing `rss` link, add two icon-only `<a>` tags with inline SVG (same icons used in Hero, smaller: 16×16). External-link target `_blank` with `rel="noopener noreferrer"`.

### 7. About page rewrite

Short content draft (Shay can edit):

> # About
>
> I'm Shay. I'm studying machine learning and writing about it as I go.
>
> The posts here lean on interactive demos because static explanations only go so far. If a post has a slider, a chart you can hover, or a model running in your browser, it's because the idea is easier to feel than to describe.
>
> Reach out on [LinkedIn](https://www.linkedin.com/in/shayavivi/) or look at the code on [GitHub](https://github.com/Shaya16).

No em dashes. Real social URLs. Removes the `#` placeholders and the `RSS` list item (RSS is in the header already).

## Critical files (where changes happen)

| File | Action |
|---|---|
| `package.json` | edit (add `motion`, rename) |
| `src/layouts/BaseLayout.astro` | edit (header brand + icons) |
| `src/pages/index.astro` | rewrite (use Hero + PostList) |
| `src/pages/about.astro` | edit (real identity, real URLs, rewrite copy) |
| `src/components/home/Hero.tsx` | **create** |
| `src/components/home/PostList.tsx` | **create** |
| `astro.config.mjs` | edit (`site` field) |
| `README.md` | rewrite |
| All viz components, sample posts, content.config.ts, PostLayout, global.css | **no change** |

## Verification

The work is "done" only after all of these pass:

1. `npm install` completes with no errors.
2. `npm run dev` starts the dev server; opening `http://localhost:4321/` shows:
   - The Medium-style hero with the title, tagline, social links
   - Motion entrance on first load (title fades up, then tagline, then socials)
   - The "Writing" section below with the two sample posts listed
3. Navigating to `http://localhost:4321/posts/three-things/` renders the MDX post with:
   - All three viz components interactive (hover the attention demo, click the gradient descent surface, toggle a series on the loss curve)
   - The KaTeX math block rendered correctly
4. Navigating to `http://localhost:4321/posts/hello-blog/` renders the plain markdown post with the Python code block syntax-highlighted.
5. Navigating to `http://localhost:4321/about/` renders the rewritten about page with real social links (verify the `href` values, not just the visible text).
6. Hovering the GitHub and LinkedIn icons in the header changes their color to the accent.
7. `npm run build` completes with no errors; the `dist/` directory contains `index.html`, `posts/three-things/index.html`, `posts/hello-blog/index.html`, `about/index.html`, `rss.xml`, `sitemap-index.xml`.
8. `git status` shows a clean working tree after the initial commit; `git log` shows one commit.

If any of the above fails, do **not** report the work as complete - fix the failure first, or stop and report the failure with the actual error message.

## Open assumptions baked into the spec

These are decisions I'm making rather than asking again. Push back if any is wrong:

- The site URL placeholder `https://the-attention-span.pages.dev` is fine for `astro.config.mjs` `site` field for now (used only for RSS/sitemap absolute URLs). Shay will swap it when Cloudflare is wired.
- The word styled with the accent color in the hero is **"Attention"** (not "Span"). It's the more interesting word and ties to the ML theme.
- Inline SVG over `lucide-react` for the two social icons. Two SVGs vs. a 13kb dependency - not worth it for this build.
- Existing fonts-via-Google-Fonts approach in `BaseLayout.astro` is kept. Self-hosting via `@fontsource/*` is a future optimization, not part of this build.
- Routes stay as `/posts/[slug]` (from the scaffold). Not changing to `/blog/`.
- The two sample posts ship with the scaffold's `pubDate` values (2026-05-23 and 2026-05-24). These are fine for now.
