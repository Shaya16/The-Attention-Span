import type { Env, CommentRow } from '../_lib/types';
import { json, unauthorized } from '../_lib/util';
import { requireAdmin } from './_guard';

// GET /api/admin/comments?status=pending|approved|rejected (default pending)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireAdmin(request, env))) return unauthorized();

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? 'pending';
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return json({ error: 'bad status' }, { status: 400 });
  }

  const res = await env.DB
    .prepare(
      `SELECT id, slug, author, body, created_at, status
       FROM comments
       WHERE status = ?
       ORDER BY created_at DESC
       LIMIT 200`,
    )
    .bind(status)
    .all<CommentRow>();

  return json({ comments: res.results ?? [] });
};
