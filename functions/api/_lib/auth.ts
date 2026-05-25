// HMAC-SHA256 signed cookies for admin session.
// Cookie value format: `${expiryUnixMs}.${base64urlSig}`

const enc = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let s = '';
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) s += String.fromCharCode(view[i]);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return base64url(sig);
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function mintSession(secret: string, ttlMs: number): Promise<string> {
  const expiry = String(Date.now() + ttlMs);
  const sig = await hmac(secret, expiry);
  return `${expiry}.${sig}`;
}

export async function verifySession(secret: string, value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf('.');
  if (dot === -1) return false;
  const expiry = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = await hmac(secret, expiry);
  if (!timingSafeEq(sig, expected)) return false;
  const exp = Number(expiry);
  if (!Number.isFinite(exp)) return false;
  return exp > Date.now();
}
