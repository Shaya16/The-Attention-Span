# The Attention Span - Initial Blog Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the personal ML blog running locally - extract the pre-built scaffold, wire in Shay's identity, add a Medium-style hero with `motion` entrance animations, and commit everything to a fresh local git repo. No GitHub push, no deploy.

**Architecture:** Take `~/Downloads/blog-scaffold.zip` (Astro 5 + MDX + React 19 + Tailwind v4 + KaTeX + Recharts + 4 viz components + 2 sample posts) as the starting point. Add the `motion` package. Add two new React components (`Hero.tsx`, `PostList.tsx`) for the home page, both `client:`-hydrated with `motion` entrance animations that respect `prefers-reduced-motion`. Rewrite `index.astro` to use them. Identity-replace `"your name"` placeholders and add real GitHub + LinkedIn URLs. Add inline-SVG social icons to the persistent header. Rewrite the about page and README. Verify by running dev server, walking through every route in the browser, running a production build, then `git init` and commit.

**Tech Stack:** Astro 5, MDX, React 19, Tailwind v4 (Vite plugin), KaTeX, Recharts, `motion`, TypeScript. Node.js + npm. Git. PowerShell (this is a Windows machine - use Bash tool for POSIX-y operations like `unzip`).

**Spec reference:** [docs/superpowers/specs/2026-05-24-attention-span-blog-design.md](../specs/2026-05-24-attention-span-blog-design.md)

---

## File map

After this plan runs, the project root looks like:

```
The Attention Span/
  .git/                                       # NEW (from git init)
  .gitignore                                  # from scaffold
  README.md                                   # MODIFIED (project-specific)
  astro.config.mjs                            # MODIFIED (site URL)
  package.json                                # MODIFIED (name, +motion)
  package-lock.json                           # NEW (from npm install)
  tsconfig.json                               # from scaffold, unchanged
  node_modules/                               # NEW (from npm install, gitignored)
  public/favicon.svg                          # from scaffold, unchanged
  src/
    content.config.ts                         # from scaffold, unchanged
    styles/global.css                         # from scaffold, unchanged
    layouts/
      BaseLayout.astro                        # MODIFIED (brand text + social icons)
      PostLayout.astro                        # from scaffold, unchanged
    pages/
      index.astro                             # REWRITTEN (uses Hero + PostList)
      about.astro                             # REWRITTEN (real identity, real URLs)
      rss.xml.js                              # from scaffold, unchanged
      posts/[...slug].astro                   # from scaffold, unchanged
    content/blog/
      hello-blog.md                           # from scaffold, unchanged
      three-things.mdx                        # from scaffold, unchanged
    components/
      viz/                                    # from scaffold, all 4 unchanged
        DemoFrame.tsx
        LossCurve.tsx
        GradientDescent.tsx
        AttentionDemo.tsx
      home/                                   # NEW directory
        Hero.tsx                              # NEW
        PostList.tsx                          # NEW
  docs/superpowers/                           # ALREADY EXISTS (this plan + spec)
    plans/2026-05-24-attention-span-blog.md
    specs/2026-05-24-attention-span-blog-design.md
```

---

## Task 1: Extract scaffold, install deps, init git, verify

**Files:**
- Source: `C:\Users\Shay Avivi\Downloads\blog-scaffold.zip`
- Destination: `C:\Users\Shay Avivi\Desktop\Projects\The Attention Span\` (contents at root, not in a subfolder)

- [ ] **Step 1: Extract the zip into the project root, then flatten**

The zip extracts to a `blog-scaffold/` top-level folder. We want the contents at the project root (alongside the existing `docs/` folder).

Run via Bash tool:
```bash
cd "/c/Users/Shay Avivi/Desktop/Projects/The Attention Span" && \
unzip -o "/c/Users/Shay Avivi/Downloads/blog-scaffold.zip" -d ./_extracted && \
shopt -s dotglob && \
mv ./_extracted/blog-scaffold/* ./ && \
shopt -u dotglob && \
rm -rf ./_extracted
```

Expected: no errors. The project root now contains `package.json`, `astro.config.mjs`, `src/`, `public/`, etc. alongside the existing `docs/` folder.

- [ ] **Step 2: Clean up the spurious empty directories from the zip**

The zip listing showed three malformed directory entries from an unexpanded shell brace literal:
- `src/{components/`
- `src/{components/viz,content/`
- `src/{components/viz,content/blog,layouts,pages,styles}/`

Verify they were extracted (they show up as empty directories with literal `{` in the name) and remove them:

```bash
cd "/c/Users/Shay Avivi/Desktop/Projects/The Attention Span" && \
rm -rf "src/{components" 2>/dev/null; true
```

Expected: no error (the `true` swallows non-existence). Verify with Glob `src/*` - only `components`, `content`, `layouts`, `pages`, `styles`, `content.config.ts` should be present, no literal `{` directories.

- [ ] **Step 3: Install dependencies**

Run via PowerShell (npm is a Windows-installed tool):
```powershell
npm install
```

Expected: completes with no errors. Creates `node_modules/` and `package-lock.json`. May print warnings about peer dependencies - those are fine. If `npm install` fails outright, stop and report the error.

- [ ] **Step 4: Verify the unmodified scaffold builds and serves**

Start the dev server in background:
```powershell
npm run dev
```

Wait ~3 seconds for Astro to print the local URL (typically `http://localhost:4321/`). Then verify by reading the server's stdout - it should print "ready in Xms" with no errors.

If using Bash tool with `run_in_background`, follow up with a check that the server is listening:
```bash
curl -sI http://localhost:4321/ | head -1
```
Expected: `HTTP/1.1 200 OK` (or similar 2xx status).

Stop the dev server before continuing (kill the background process).

If the server failed to start, stop and report the error - do not proceed.

- [ ] **Step 5: Initialize git and make the first commit**

```bash
cd "/c/Users/Shay Avivi/Desktop/Projects/The Attention Span" && \
git init && \
git add -A && \
git status --short | head -50
```

Expected: `git init` reports "Initialized empty Git repository". `git status --short` shows a large list of `A` (added) entries including the `src/`, `public/`, `docs/`, root config files, and the README from the scaffold. `node_modules/` and `dist/` should NOT appear (they're in `.gitignore`).

If `node_modules/` shows up, stop and verify the scaffold's `.gitignore` was extracted correctly.

Now commit:
```bash
git commit -m "chore: import blog scaffold and add design docs"
```

Expected: commit succeeds, prints the commit hash and file count.

---

## Task 2: Add motion dependency, rename package

**Files:**
- Modify: `package.json` (name field, dependencies)

- [ ] **Step 1: Install the motion package**

```powershell
npm install motion
```

Expected: completes with no errors. `motion` (the rebranded Framer Motion package) is added to `dependencies` in `package.json`, version `^11.x.x` or `^12.x.x` depending on what's current. `package-lock.json` updates.

If you see the package name `framer-motion` instead, you've installed the wrong (older, deprecated) package. The correct name is `motion` (no prefix). Uninstall and reinstall:
```powershell
npm uninstall framer-motion && npm install motion
```

- [ ] **Step 2: Update package.json `name` field**

Use the Edit tool to change the name in `package.json` from `"ml-blog"` to `"the-attention-span"`.

Old:
```json
"name": "ml-blog",
```

New:
```json
"name": "the-attention-span",
```

- [ ] **Step 3: Verify install + change**

Re-read `package.json` (Read tool) and confirm:
- `"name": "the-attention-span"` is present
- `"motion": "^..."` appears in the `dependencies` block (NOT `devDependencies`)
- All other deps from the original `package.json` are still present

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json && \
git commit -m "chore: add motion and rename package to the-attention-span"
```

---

## Task 3: Identity pass - astro.config, BaseLayout brand, about page

**Files:**
- Modify: `astro.config.mjs` (site URL)
- Modify: `src/layouts/BaseLayout.astro` (brand text only - icons added in Task 4)
- Modify: `src/pages/about.astro` (full rewrite per spec)

- [ ] **Step 1: Update site URL in astro.config.mjs**

Use Edit on `astro.config.mjs`:

Old:
```javascript
  site: 'https://your-blog.pages.dev',
```

New:
```javascript
  site: 'https://the-attention-span.pages.dev',
```

- [ ] **Step 2: Update brand text in BaseLayout.astro**

Use Edit on `src/layouts/BaseLayout.astro`:

Old:
```astro
          <span class="font-medium tracking-tight">your name</span>
```

New:
```astro
          <span class="font-medium tracking-tight">Shay</span>
```

(Note: this is the only `"your name"` reference in BaseLayout - the page title comes from the `title` prop set by each page.)

- [ ] **Step 3: Rewrite about.astro**

Use Write tool to replace `src/pages/about.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="About · The Attention Span">
  <article class="prose-post">
    <h1>About</h1>
    <p>
      I'm Shay. I'm studying machine learning and writing about it as I go.
    </p>
    <p>
      The posts here lean on interactive demos because static explanations only
      go so far. If a post has a slider, a chart you can hover, or a model
      running in your browser, it's because the idea is easier to feel than to
      describe.
    </p>
    <p>
      Reach out on <a href="https://www.linkedin.com/in/shayavivi/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      or look at the code on <a href="https://github.com/Shaya16" target="_blank" rel="noopener noreferrer">GitHub</a>.
    </p>
  </article>
</BaseLayout>
```

Note: no em dashes anywhere in this copy (per Shay's preference).

- [ ] **Step 4: Verify in the browser**

Start dev server in background:
```powershell
npm run dev
```

Then in another check, use curl to confirm the rendered HTML:
```bash
curl -s http://localhost:4321/about/ | grep -E "(I'm Shay|linkedin.com/in/shayavivi|github.com/Shaya16)" | head -5
```

Expected output: lines matching all three patterns (the new copy + both real URLs).

Also check the header on any page:
```bash
curl -s http://localhost:4321/ | grep "tracking-tight" | head -1
```
Expected: the line contains `>Shay<`, not `>your name<`.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs src/layouts/BaseLayout.astro src/pages/about.astro && \
git commit -m "feat: wire in Shay identity and rewrite about page"
```

---

## Task 4: Add GitHub + LinkedIn icons to header

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (header `<nav>` block)

- [ ] **Step 1: Add inline SVG icon links after the rss link**

Use Edit on `src/layouts/BaseLayout.astro`.

Old:
```astro
        <nav class="flex items-center gap-6 text-sm text-[var(--color-muted)]">
          <a href="/" class="hover:text-[var(--color-ink)] transition">posts</a>
          <a href="/about" class="hover:text-[var(--color-ink)] transition">about</a>
          <a href="/rss.xml" class="hover:text-[var(--color-ink)] transition">rss</a>
        </nav>
```

New:
```astro
        <nav class="flex items-center gap-6 text-sm text-[var(--color-muted)]">
          <a href="/" class="hover:text-[var(--color-ink)] transition">posts</a>
          <a href="/about" class="hover:text-[var(--color-ink)] transition">about</a>
          <a href="/rss.xml" class="hover:text-[var(--color-ink)] transition">rss</a>
          <a
            href="https://github.com/Shaya16"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            class="hover:text-[var(--color-accent)] transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.652.242 2.873.119 3.176.77.84 1.234 1.911 1.234 3.221 0 4.609-2.806 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .321.218.694.825.576C20.565 21.796 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/shayavivi/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            class="hover:text-[var(--color-accent)] transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </nav>
```

The icon `gap-6` is intentionally the same as the rest of the nav - the icons sit naturally in the row.

- [ ] **Step 2: Verify in the browser**

Start dev server:
```powershell
npm run dev
```

Check header HTML on home:
```bash
curl -s http://localhost:4321/ | grep -E "(aria-label=\"GitHub\"|aria-label=\"LinkedIn\")"
```
Expected: two matching lines (the GitHub and LinkedIn `<a>` tags).

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro && \
git commit -m "feat: add GitHub and LinkedIn icons to header nav"
```

---

## Task 5: Create Hero.tsx component

**Files:**
- Create: `src/components/home/Hero.tsx`

- [ ] **Step 1: Create the directory and the file**

Use Write tool. The file path is `src/components/home/Hero.tsx`. The Write tool will create the `home/` directory if needed.

```tsx
import { motion, useReducedMotion } from 'motion/react';

/**
 * Hero
 *
 * Medium-style banner on the home page. Big serif italic title with one
 * word in the accent color, tagline below, social icons row. Motion
 * entrance: title fades + slides up, tagline follows, socials follow.
 * Respects prefers-reduced-motion.
 */
export default function Hero() {
  const prefersReduced = useReducedMotion();

  const fadeUp = (delay: number, duration: number) =>
    prefersReduced
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration, delay, ease: 'easeOut' as const },
        };

  return (
    <section className="pt-24 pb-12">
      <motion.h1
        {...fadeUp(0, 0.6)}
        className="mb-6"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(3rem, 8vw, 6.5rem)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}
      >
        The <span style={{ color: 'var(--color-accent)' }}>Attention</span> Span
      </motion.h1>

      <motion.p
        {...fadeUp(0.12, 0.4)}
        className="max-w-md text-lg"
        style={{ fontFamily: 'Inter', color: 'var(--color-muted)' }}
      >
        Machine learning, explained before your context window runs out.
      </motion.p>

      <motion.div
        {...fadeUp(0.24, 0.4)}
        className="mt-8 flex items-center gap-4"
      >
        <a
          href="https://github.com/Shaya16"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="transition"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.652.242 2.873.119 3.176.77.84 1.234 1.911 1.234 3.221 0 4.609-2.806 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .321.218.694.825.576C20.565 21.796 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/shayavivi/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="transition"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript can parse the file**

Run via PowerShell:
```powershell
npx astro check
```

Expected: 0 errors. May print warnings about unused files (the new Hero.tsx isn't imported anywhere yet) - those are OK. If there's an error specifically in `Hero.tsx`, fix it before continuing. If `astro check` is slow on cold start, that's fine, wait it out.

If you get an error like `Cannot find module 'motion/react'`, the install in Task 2 was wrong - go back and verify the `motion` package is in `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/Hero.tsx && \
git commit -m "feat: add Hero component with motion entrance"
```

---

## Task 6: Create PostList.tsx component

**Files:**
- Create: `src/components/home/PostList.tsx`

- [ ] **Step 1: Write the file**

Use Write tool to create `src/components/home/PostList.tsx`:

```tsx
import { motion, useReducedMotion } from 'motion/react';

interface Post {
  slug: string;
  title: string;
  description: string;
  pubDate: Date;
}

interface Props {
  posts: Post[];
}

/**
 * PostList
 *
 * Animated post list for the home page. Each item fades + slides up with
 * a small stagger. Hover lifts the title and shifts to the accent color.
 * Respects prefers-reduced-motion.
 */
export default function PostList({ posts }: Props) {
  const prefersReduced = useReducedMotion();

  const formatDate = (d: Date | string) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: '2-digit',
    });
  };

  const isoDate = (d: Date | string) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString();
  };

  return (
    <ul className="space-y-1">
      {posts.map((post, i) => {
        const itemProps = prefersReduced
          ? { initial: false, animate: { opacity: 1, y: 0 } }
          : {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' as const },
            };

        return (
          <motion.li key={post.slug} {...itemProps}>
            <a
              href={`/posts/${post.slug}/`}
              className="group flex items-baseline gap-4 border-b border-[var(--color-line)] py-5 transition hover:border-[var(--color-accent)]"
            >
              <time
                dateTime={isoDate(post.pubDate)}
                className="shrink-0 font-mono text-xs text-[var(--color-muted)]"
              >
                {formatDate(post.pubDate)}
              </time>
              <span className="flex-1">
                <span className="font-medium transition group-hover:text-[var(--color-accent)]">
                  {post.title}
                </span>
                <span className="ml-2 text-sm text-[var(--color-muted)]">
                  {post.description}
                </span>
              </span>
            </a>
          </motion.li>
        );
      })}
    </ul>
  );
}
```

Note: `pubDate` is typed as `Date` but the `formatDate`/`isoDate` helpers handle both `Date` and `string` because Astro may serialize dates as strings when passing props from `.astro` to React across the island boundary. This is defensive and necessary.

- [ ] **Step 2: Verify TypeScript can parse the file**

```powershell
npx astro check
```
Expected: 0 errors in `PostList.tsx`. (The same caveats about unused-file warnings apply.)

- [ ] **Step 3: Commit**

```bash
git add src/components/home/PostList.tsx && \
git commit -m "feat: add PostList component with staggered motion entrance"
```

---

## Task 7: Rewrite index.astro to use Hero + PostList

**Files:**
- Rewrite: `src/pages/index.astro`

- [ ] **Step 1: Replace index.astro**

Use Write tool to replace `src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import Hero from '../components/home/Hero';
import PostList from '../components/home/PostList';

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

  <section class="mt-16">
    <h2 class="mb-6 text-sm font-medium uppercase tracking-widest text-[var(--color-muted)]">
      Writing
    </h2>
    {posts.length > 0 ? (
      <PostList client:visible posts={posts} />
    ) : (
      <p class="text-[var(--color-muted)]">No posts yet. Add one to <code>src/content/blog/</code>.</p>
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 2: Verify in the browser end-to-end**

Start dev server:
```powershell
npm run dev
```

Check that home page returns 200 and references the Hero content:
```bash
curl -s http://localhost:4321/ | grep -E "(The .* Attention.* Span|Machine learning, explained)" | head -3
```

Expected: at least one matching line containing the tagline ("Machine learning, explained..."). The title text may be split across multiple lines due to the `<span>` so might not appear as a single grep match - that's fine.

Also check Hero animations are wired (the page should include `motion`-generated styles):
```bash
curl -s http://localhost:4321/ | grep -c "opacity"
```
Expected: > 0 (initial opacity styles from motion will be inlined on the rendered HTML for the `client:load` island).

Stop the dev server.

- [ ] **Step 3: Run a production build**

```powershell
npm run build
```

Expected: completes with no errors. The output should print something like "Successfully built X pages". If there's an error, especially TypeScript or import errors, fix and re-run before proceeding.

After build, verify the output structure with Glob:
```
dist/index.html
dist/posts/three-things/index.html
dist/posts/hello-blog/index.html
dist/about/index.html
dist/rss.xml
dist/sitemap-index.xml
```

All six should exist. If any are missing, stop and investigate.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro && \
git commit -m "feat: rewrite home page with Hero and PostList"
```

---

## Task 8: Rewrite README.md

**Files:**
- Rewrite: `README.md`

- [ ] **Step 1: Replace README.md**

Use Write tool to replace `README.md` with:

```markdown
# The Attention Span

Personal blog for explanatory machine learning and deep learning posts, with interactive React components embedded in MDX.

## Stack

- [Astro 5](https://astro.build) with content collections
- MDX for posts that need interactive components
- React 19 islands, hydrated with `client:load` / `client:visible`
- Tailwind v4 via the Vite plugin
- [Motion](https://motion.dev) for entrance animations
- KaTeX for math (via `remark-math` + `rehype-katex`)
- Recharts for chart-based viz

## Run locally

```bash
npm install
npm run dev
```

Serves on `http://localhost:4321/`.

## Build

```bash
npm run build
```

Outputs to `dist/`. Designed to deploy to Cloudflare Pages (free tier).

## Adding a post

Drop a new `.md` or `.mdx` file into `src/content/blog/`. Frontmatter shape lives in `src/content.config.ts`.

- `.md` for plain prose
- `.mdx` when you need to embed React viz components

Import viz components from posts with relative paths:

```mdx
import LossCurve from '../../components/viz/LossCurve';

<LossCurve client:load />
```

## Adding a viz component

New file in `src/components/viz/`. Wrap output in `<DemoFrame title=... caption=...>`. Use CSS variables for colors (`var(--color-accent)`, etc.), never hardcoded hex. See `LossCurve.tsx` for the Recharts pattern, `GradientDescent.tsx` for canvas + SVG overlay, `AttentionDemo.tsx` for state-driven interactivity.

## Design tokens

Defined in `src/styles/global.css` under `@theme`. Colors are `oklch()` based.
```

- [ ] **Step 2: Commit**

```bash
git add README.md && \
git commit -m "docs: rewrite README for The Attention Span project"
```

---

## Task 9: Final end-to-end verification

This task does no editing - only verification. If anything fails, stop and report rather than papering over.

**Files:** none modified.

- [ ] **Step 1: Clean rebuild**

Remove the `dist/` from earlier and rebuild from scratch to confirm everything still works:
```bash
rm -rf dist && \
cd "/c/Users/Shay Avivi/Desktop/Projects/The Attention Span"
```
```powershell
npm run build
```

Expected: clean build with no errors. Note any warnings - they're acceptable unless they reference broken behavior.

- [ ] **Step 2: Verify build output**

Run Glob `dist/**/*.html` and confirm presence of:
- `dist/index.html`
- `dist/about/index.html`
- `dist/posts/three-things/index.html`
- `dist/posts/hello-blog/index.html`

Also Glob `dist/**/*.xml` and confirm:
- `dist/rss.xml`
- `dist/sitemap-index.xml`

- [ ] **Step 3: Inspect rendered home page from the build output**

Read `dist/index.html` (use Read tool, limit ~100 lines). Confirm it contains:
- The string `The` (followed somewhere by `Attention` and `Span` - they may be split across spans)
- The tagline `Machine learning, explained before your context window runs out.`
- A `<link rel="stylesheet"` for Google Fonts (Geist + Instrument Serif)
- A reference to the Astro-bundled JS for the Hero island

If any of those are missing, stop and investigate.

- [ ] **Step 4: Manual browser verification (the part you can't automate)**

Start the dev server one more time:
```powershell
npm run dev
```

Now open `http://localhost:4321/` in a browser **manually** and verify:

1. **Home page**:
   - Title "The Attention Span" renders large, in italic serif. The word "Attention" is coral/accent colored.
   - Tagline "Machine learning, explained before your context window runs out." sits below the title in a muted gray.
   - Two icons (GitHub + LinkedIn) sit below the tagline. Hovering each one turns it accent-colored. Clicking opens the correct profile in a new tab.
   - Below the hero is a "WRITING" header (uppercase, small), then a list of 2 posts: "Three things you can put in a blog post" (2026-05-24) and "Hello, blog" (2026-05-23).
   - On first load, the hero title fades up, then the tagline, then the icons. Then the post list staggers in below.
   - The page header (top of every page) shows `● Shay` on the left and `posts about rss [GH icon] [LI icon]` on the right.

2. **Post page `/posts/three-things/`**:
   - Date, tags, title, italic description render at the top
   - All three viz demos render and are interactive:
     - **AttentionDemo**: hovering a token highlights it and shows weights on the others
     - **GradientDescent**: clicking the colored loss surface drops a starting point and the optimizer path animates
     - **LossCurve**: hovering shows tooltip; clicking a legend entry hides/shows the line
   - The KaTeX equation under "1. Attention, illustrated" renders as proper math (not raw LaTeX)
   - Code block under "How to use these" is syntax-highlighted

3. **Post page `/posts/hello-blog/`**:
   - Plain markdown renders with the Python code block syntax-highlighted

4. **About page `/about/`**:
   - "I'm Shay" is present
   - LinkedIn and GitHub links go to the real URLs (verify by hovering - browser shows the URL in the status bar)

5. **Header icons**: on every page, click each social icon - both open correct profiles in new tab.

If anything is wrong, stop the server, fix the issue, recommit, and re-run verification. **Do NOT claim the work done unless all five sections above pass.**

Stop the dev server.

- [ ] **Step 5: Confirm clean git state**

```bash
git status
```
Expected: `nothing to commit, working tree clean`. (If `dist/` shows up, the `.gitignore` doesn't cover it - add `dist/` to `.gitignore` and commit that.)

```bash
git log --oneline
```
Expected: ~9 commits, one per task above (Tasks 1, 2, 3, 4, 5, 6, 7, 8), plus possibly the initial one.

- [ ] **Step 6: Report status**

In the final response to the user, include:
- Commit count (`git log --oneline | wc -l`)
- A concrete statement confirming the dev server was opened in a browser and all five manual checks above passed (or list which failed)
- Reminder: no push has happened. The work is committed locally only.

---

## Self-review notes

This plan was checked against the spec - every spec requirement maps to a task:

| Spec section | Task(s) |
|---|---|
| §Goal 1 (working dev environment) | Task 1, verified in Task 9 |
| §Goal 2 (Medium-style hero) | Tasks 5, 7 |
| §Goal 3 (identity wired) | Tasks 2 (package name), 3 (BaseLayout brand, about, astro.config) |
| §Goal 4 (viz components render in post) | Verified in Task 9 step 4 |
| §Goal 5 (local git, no push) | Task 1 (init), commits in every task, final check in Task 9 |
| §1 (dependencies) | Task 2 |
| §2 (identity replacements) | Task 3 (most), Task 4 (header icons), Task 8 (README) |
| §3 (Hero component) | Task 5 |
| §4 (PostList component) | Task 6 |
| §5 (index.astro rewrite) | Task 7 |
| §6 (header polish) | Task 4 |
| §7 (about rewrite) | Task 3 |
| §Verification (1–8) | Task 9 |
