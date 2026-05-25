import type { Env, CommentRow } from './_lib/types';
import { AUTHOR_MAX_LEN, COMMENT_MAX_LEN } from './_lib/types';
import { json, badRequest, readJson } from './_lib/util';
import { verifyTurnstile } from './_lib/turnstile';

interface Body {
  slug?: string;
  author?: string;
  body?: string;
  turnstileToken?: string;
}

// GET /api/comments?slug=...
// Returns approved comments for a single post.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug')?.trim();
  if (!slug) return badRequest('missing slug');

  const res = await env.DB
    .prepare(
      `SELECT id, author, body, created_at
       FROM comments
       WHERE slug = ? AND status = 'approved'
       ORDER BY created_at ASC
       LIMIT 500`,
    )
    .bind(slug)
    .all<Pick<CommentRow, 'id' | 'author' | 'body' | 'created_at'>>();

  return json({ comments: res.results ?? [] });
};

// POST /api/comments  { slug, author, body, turnstileToken }
// Inserts as 'pending'. Does not bump post_stats.comment_count until approval.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: Body;
  try {
    payload = await readJson<Body>(request);
  } catch {
    return badRequest('expected json');
  }

  const slug = payload.slug?.trim();
  const author = payload.author?.trim();
  const text = payload.body?.trim();
  const token = payload.turnstileToken?.trim();

  if (!slug || slug.length > 200) return badRequest('bad slug');
  if (!author || author.length > AUTHOR_MAX_LEN) return badRequest('bad author');
  if (!text || text.length > COMMENT_MAX_LEN) return badRequest('bad body');
  if (!token) return badRequest('missing turnstile');

  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    null;
  const ok = await verifyTurnstile(env.TURNSTILE_SECRET, token, ip);
  if (!ok) return json({ error: 'turnstile failed' }, { status: 403 });

  await env.DB
    .prepare(
      `INSERT INTO comments (slug, author, body, created_at, status)
       VALUES (?, ?, ?, ?, 'pending')`,
    )
    .bind(slug, author, text, Date.now())
    .run();

  return json({ ok: true, status: 'pending' });
};
