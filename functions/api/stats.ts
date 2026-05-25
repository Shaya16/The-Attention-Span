import type { Env, PostStatsRow } from './_lib/types';
import { json, badRequest } from './_lib/util';
import { readVisitor } from './_lib/visitor';

// GET /api/stats?slugs=a,b,c
// Returns: { stats: { [slug]: { claps, comments, myClaps } } }
// `myClaps` is per-visitor (from the cookie) and is 0 when no cookie is present.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const slugsParam = url.searchParams.get('slugs');
  if (!slugsParam) return badRequest('missing slugs');

  const slugs = slugsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);

  if (slugs.length === 0) return json({ stats: {} });

  const placeholders = slugs.map(() => '?').join(',');
  const statsRes = await env.DB
    .prepare(`SELECT slug, clap_total, comment_count FROM post_stats WHERE slug IN (${placeholders})`)
    .bind(...slugs)
    .all<PostStatsRow>();

  const out: Record<string, { claps: number; comments: number; myClaps: number }> = {};
  for (const slug of slugs) {
    out[slug] = { claps: 0, comments: 0, myClaps: 0 };
  }
  for (const row of statsRes.results ?? []) {
    out[row.slug] = { claps: row.clap_total, comments: row.comment_count, myClaps: 0 };
  }

  const vid = readVisitor(request);
  if (vid) {
    const mine = await env.DB
      .prepare(`SELECT slug, count FROM claps WHERE visitor_id = ? AND slug IN (${placeholders})`)
      .bind(vid, ...slugs)
      .all<{ slug: string; count: number }>();
    for (const row of mine.results ?? []) {
      if (out[row.slug]) out[row.slug].myClaps = row.count;
    }
  }

  return json({ stats: out });
};
