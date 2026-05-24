# The Attention Span

Personal blog for explanatory machine learning and deep learning posts, with interactive React components embedded directly in MDX.

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
