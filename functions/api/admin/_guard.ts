import type { Env } from '../_lib/types';
import { verifySession } from '../_lib/auth';
import { parseCookies } from '../_lib/util';

export async function requireAdmin(request: Request, env: Env): Promise<boolean> {
  const cookies = parseCookies(request.headers.get('cookie'));
  return verifySession(env.SESSION_SECRET, cookies['asadmin']);
}
