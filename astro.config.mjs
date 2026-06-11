// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { contentEditor } from './vite-plugin-content-editor.mjs';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://the-attention-span.com',

  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    react(),
    sitemap(),
  ],

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },

  vite: {
    plugins: [tailwindcss(), contentEditor()], // dev-only admin api + uploads
    optimizeDeps: {
      // Pre-bundle the tokenizer so its lazy import in the tokenization post
      // doesn't trigger an on-the-fly re-optimization + full page reload.
      include: ['gpt-tokenizer/encoding/cl100k_base'],
    },
  },

  adapter: cloudflare()
});