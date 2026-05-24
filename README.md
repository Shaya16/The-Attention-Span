# your ml blog

An interactive blog for machine learning explainers, built with **Astro + MDX + React + Tailwind**.

The whole point: you write posts in markdown, but you can drop real React
components into any post for live demos — attention visualizers, gradient
descent on a loss surface, interactive charts, tiny models running in the
browser, whatever you want to build.

## Quick start

```bash
# install
npm install

# dev server (hot reload, http://localhost:4321)
npm run dev

# production build
npm run build

# preview production build locally
npm run preview
```

## What's in here

```
src/
├── components/viz/        # Interactive React components for posts
│   ├── AttentionDemo.tsx  # — token attention, hoverable
│   ├── GradientDescent.tsx# — click-to-drop optimizer on a loss surface
│   ├── LossCurve.tsx      # — interactive Recharts line chart
│   └── DemoFrame.tsx      # — consistent visual wrapper for demos
├── content/blog/          # ← your posts go here (.md or .mdx)
├── layouts/               # Page shells (BaseLayout, PostLayout)
├── pages/                 # Routes (index, posts/[slug], about, rss.xml)
└── styles/global.css      # Design tokens + base styles
```

## Writing posts

Drop a `.md` or `.mdx` file into `src/content/blog/`:

```mdx
---
title: "How attention actually works"
description: "An interactive tour."
pubDate: 2026-05-25
tags: ["transformers", "attention"]
---

import AttentionDemo from '../../components/viz/AttentionDemo';

# How attention actually works

Some prose, some math:

$$ \text{softmax}(QK^\top / \sqrt{d_k})V $$

Then a live demo:

<AttentionDemo client:load defaultSentence="hello world" />

More prose. Done.
```

**`.md`** = plain markdown, no components.
**`.mdx`** = markdown + React components.

The `client:load` directive tells Astro to hydrate the component in the
browser. Use `client:visible` for heavy components that should wait until
they scroll into view.

## Math

Wrap inline math in `$...$` and display math in `$$...$$`. KaTeX is
already wired up.

## Building new interactive components

1. Create a new file in `src/components/viz/`, e.g. `Backprop.tsx`
2. Write a React component (use `DemoFrame` as a wrapper for consistent styling)
3. Import it in any post: `import Backprop from '../../components/viz/Backprop';`
4. Drop it in: `<Backprop client:load />`

The included demos use:
- **recharts** — charts (loss curves, metrics)
- Plain canvas/SVG — custom visualizations

To add more libraries, just `npm install` them. Useful ones for ML posts:

```bash
npm install d3                    # custom data viz
npm install three @react-three/fiber @react-three/drei  # 3D
npm install onnxruntime-web       # run actual ONNX models in the browser
npm install @tensorflow/tfjs      # alternative: TF.js
npm install plotly.js react-plotly.js   # interactive scientific plots
```

## Deploying to Cloudflare Pages (free)

1. Push this repo to GitHub
2. Go to https://dash.cloudflare.com → Pages → Create a project → Connect to Git
3. Pick the repo. Settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (set as env var `NODE_VERSION=20`)
4. Click Deploy. First build takes ~2 minutes. You get a free `yourblog.pages.dev`.
5. Every `git push` to main triggers a new deploy automatically.

Alternatively: **Vercel** works the same way (`npm run build`, output `dist`).
Both have generous free tiers for a blog.

## Working with Claude Code

The whole point of this setup is that everything is just files. Open the
folder in your editor with Claude Code and try:

- "Build a new viz component in `src/components/viz/Backprop.tsx` that animates backpropagation through a 2-layer net. Use the same `DemoFrame` wrapper as the others."
- "Take the LossCurve component and add a brush selector for zooming."
- "Refactor the AttentionDemo to load real weights from a JSON file in `public/`."
- "Add a `<ModelInference>` component that loads `public/mnist.onnx` with onnxruntime-web and runs inference on a 28x28 canvas the user draws on."

Keep prompts scoped to one component or feature at a time.

## Customizing the look

The whole design system lives in `src/styles/global.css`. The accent colors
are CSS variables (`--color-accent`, etc.) — change them in one place and
the whole site updates.

The fonts are **Geist** (sans) and **Instrument Serif** (display headings),
loaded from Google Fonts in `BaseLayout.astro`. Swap them out there.

## Updating the site identity

Search for `your name` and `your-blog.pages.dev` and replace with your
actual values. Files to update:

- `src/layouts/BaseLayout.astro` (header)
- `src/pages/index.astro` (homepage hero)
- `src/pages/about.astro` (about page)
- `src/pages/rss.xml.js` (RSS metadata)
- `astro.config.mjs` (site URL)
