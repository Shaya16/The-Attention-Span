import { parseCookies, setCookie } from './util';

const COOKIE = 'asvid';

export interface VisitorResult {
  id: string;
  setCookieHeader: string | null;
}

// Get or mint a visitor id. If the cookie is missing, we mint a new id and
// return a Set-Cookie header for the caller to attach to the response.
export function getOrMintVisitor(request: Request): VisitorResult {
  const cookies = parseCookies(request.headers.get('cookie'));
  const existing = cookies[COOKIE];
  if (existing && /^[a-f0-9-]{36}$/i.test(existing)) {
    return { id: existing, setCookieHeader: null };
  }
  const id = crypto.randomUUID();
  return {
    id,
    setCookieHeader: setCookie(COOKIE, id, {
      maxAgeSec: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: 'Lax',
    }),
  };
}

export function readVisitor(request: Request): string | null {
  const cookies = parseCookies(request.headers.get('cookie'));
  const v = cookies[COOKIE];
  return v && /^[a-f0-9-]{36}$/i.test(v) ? v : null;
}
