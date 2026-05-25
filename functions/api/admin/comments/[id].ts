import type { Env, CommentRow } from '../../_lib/types';
import { json, badRequest, readJson, unauthorized } from '../../_lib/util';
import { requireAdmin } from '../_guard';

// POST /api/admin/comments/:id  { action: 'approve' | 'reject' }
// Only pending → approved/rejected transitions are allowed.
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAdmin(request, env))) return unauthorized();

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return badRequest('bad id');

  let body: { action?: string };
  try {
    body = await readJson(request);
  } catch {
    return badRequest('expected json');
  }
  const action = body.action;
  if (action !== 'approve' && action !== 'reject') return badRequest('bad action');

  const current = await env.DB
    .prepare('SELECT id, slug, status FROM comments WHERE id = ?')
    .bind(id)
    .first<Pick<CommentRow, 'id' | 'slug' | 'status'>>();
  if (!current) return json({ error: 'not found' }, { status: 404 });
  if (current.status !== 'pending') return badRequest('not pending');

  const now = Date.now();
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  if (action === 'approve') {
    await env.DB.batch([
      env.DB
        .prepare('UPDATE comments SET status = ? WHERE id = ?')
        .bind(newStatus, id),
      env.DB
        .prepare(
          `INSERT INTO post_stats (slug, clap_total, comment_count, updated_at)
           VALUES (?1, 0, 1, ?2)
           ON CONFLICT (slug) DO UPDATE
             SET comment_count = comment_count + 1, updated_at = ?2`,
        )
        .bind(current.slug, now),
    ]);
  } else {
    await env.DB
      .prepare('UPDATE comments SET status = ? WHERE id = ?')
      .bind(newStatus, id)
      .run();
  }

  return json({ ok: true, id, status: newStatus });
};
