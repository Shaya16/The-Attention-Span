import type { Env } from '../_lib/types';
import { json, badRequest, readJson, setCookie, unauthorized } from '../_lib/util';
import { mintSession } from '../_lib/auth';

const ADMIN_COOKIE = 'asadmin';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// POST /api/admin/login  { password }
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { password?: string };
  try {
    body = await readJson(request);
  } catch {
    return badRequest('expected json');
  }
  if (!body.password || typeof body.password !== 'string') return unauthorized();

  // Constant-time-ish password compare.
  const expected = env.ADMIN_PASSWORD;
  if (!expected) return json({ error: 'server not configured' }, { status: 500 });
  if (body.password.length !== expected.length) return unauthorized();
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= body.password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return unauthorized();

  const token = await mintSession(env.SESSION_SECRET, SESSION_TTL_MS);
  return json(
    { ok: true },
    {
      headers: {
        'set-cookie': setCookie(ADMIN_COOKIE, token, {
          maxAgeSec: Math.floor(SESSION_TTL_MS / 1000),
          httpOnly: true,
          sameSite: 'Lax',
        }),
      },
    },
  );
};

// POST /api/admin/login with method=DELETE-style isn't pretty; use logout subroute instead.
