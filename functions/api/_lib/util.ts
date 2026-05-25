export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers ?? {}),
    },
  });
}

export function badRequest(message: string): Response {
  return json({ error: message }, { status: 400 });
}

export function unauthorized(): Response {
  return json({ error: 'unauthorized' }, { status: 401 });
}

export function readJson<T>(request: Request): Promise<T> {
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error('expected application/json');
  }
  return request.json() as Promise<T>;
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const name = part.slice(0, i).trim();
    const val = part.slice(i + 1).trim();
    if (name) out[name] = decodeURIComponent(val);
  }
  return out;
}

export function setCookie(
  name: string,
  value: string,
  opts: { maxAgeSec: number; httpOnly?: boolean; sameSite?: 'Lax' | 'Strict' | 'None' } = { maxAgeSec: 60 * 60 * 24 * 365 },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${opts.maxAgeSec}`,
    `Path=/`,
    `SameSite=${opts.sameSite ?? 'Lax'}`,
    `Secure`,
  ];
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  return parts.join('; ');
}
