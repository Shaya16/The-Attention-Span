import type { Env } from './_lib/types';
import { CLAP_CAP_PER_VISITOR } from './_lib/types';
import { json, badRequest, readJson } from './_lib/util';
import { getOrMintVisitor } from './_lib/visitor';

interface Body {
  slug?: string;
  taps?: number;
}

// POST /api/claps  { slug, taps }
// Increments visitor's clap count up to CLAP_CAP_PER_VISITOR.
// Atomically bumps post_stats.clap_total by the applied delta.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Body;
  try {
    body = await readJson<Body>(request);
  } catch {
    return badRequest('expected json');
  }

  const slug = body.slug?.trim();
  const taps = Math.floor(Number(body.taps));
  if (!slug || slug.length > 200) return badRequest('bad slug');
  if (!Number.isFinite(taps) || taps < 1 || taps > CLAP_CAP_PER_VISITOR) {
    return badRequest('bad taps');
  }

  const { id: vid, setCookieHeader } = getOrMintVisitor(request);
  const now = Date.now();

  const existing = await env.DB
    .prepare('SELECT count FROM claps WHERE slug = ? AND visitor_id = ?')
    .bind(slug, vid)
    .first<{ count: number }>();
  const prev = existing?.count ?? 0;
  const newCount = Math.min(CLAP_CAP_PER_VISITOR, prev + taps);
  const delta = newCount - prev;

  if (delta > 0) {
    await env.DB.batch([
      env.DB
        .prepare(
          `INSERT INTO claps (slug, visitor_id, count, updated_at)
           VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT (slug, visitor_id) DO UPDATE
             SET count = ?3, updated_at = ?4`,
        )
        .bind(slug, vid, newCount, now),
      env.DB
        .prepare(
          `INSERT INTO post_stats (slug, clap_total, comment_count, updated_at)
           VALUES (?1, ?2, 0, ?3)
           ON CONFLICT (slug) DO UPDATE
             SET clap_total = clap_total + ?2, updated_at = ?3`,
        )
        .bind(slug, delta, now),
    ]);
  }

  const total = await env.DB
    .prepare('SELECT clap_total FROM post_stats WHERE slug = ?')
    .bind(slug)
    .first<{ clap_total: number }>();

  const headers: Record<string, string> = {};
  if (setCookieHeader) headers['set-cookie'] = setCookieHeader;
  return json(
    { slug, myClaps: newCount, total: total?.clap_total ?? 0, cap: CLAP_CAP_PER_VISITOR },
    { headers },
  );
};
