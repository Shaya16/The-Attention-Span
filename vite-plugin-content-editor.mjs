import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = path.resolve(__dirname, 'src', 'content');
const PUBLIC_ROOT = path.resolve(__dirname, 'public');
const IMAGES_ROOT = path.resolve(PUBLIC_ROOT, 'images', 'blog');
const ASSETS_ROOT = path.resolve(__dirname, 'src', 'assets', 'blog');

function withinRoot(root, target) {
  const abs = path.resolve(root, target);
  const rel = path.relative(root, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return abs;
}
const withinContentRoot = (t) => withinRoot(CONTENT_ROOT, t);

// Slug derived from a content file path: "blog/three-things.mdx" -> "three-things"
function slugFromContentPath(rel) {
  const m = rel.match(/^blog\/(.+)\.(md|mdx)$/i);
  return m ? m[1].replace(/[^a-z0-9-_]+/gi, '-') : null;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

// Convert Date values to YYYY-MM-DD strings so the front-end never sees Date
// objects (which would round-trip through dump() as ISO timestamps).
function normalizeFrontmatter(fm) {
  if (!fm || typeof fm !== 'object') return fm;
  const out = {};
  for (const [k, v] of Object.entries(fm)) {
    out[k] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
  }
  return out;
}

function splitFrontmatter(raw) {
  const m = raw.match(FRONTMATTER_RE);
  if (!m) return { frontmatter: {}, body: raw };
  let frontmatter = {};
  try {
    frontmatter = normalizeFrontmatter(yaml.load(m[1]) ?? {});
  } catch {
    // Malformed YAML - return raw body as-is so user can fix in raw view
    return { frontmatter: {}, body: raw, _parseError: true };
  }
  return { frontmatter, body: raw.slice(m[0].length) };
}

function joinFrontmatter(frontmatter, body) {
  const hasKeys = frontmatter && typeof frontmatter === 'object' && Object.keys(frontmatter).length;
  if (!hasKeys) return body;
  const yamlText = yaml.dump(frontmatter, {
    lineWidth: 100,
    noRefs: true,
    forceQuotes: true,
    quotingType: '"',
    flowLevel: 1, // inline arrays: tags: ["a", "b"]
  }).trimEnd();
  // Strip leading newlines from body so the join always produces exactly one
  // blank line between closing --- and the body.
  const trimmedBody = body.replace(/^[\r\n]+/, '');
  return `---\n${yamlText}\n---\n\n${trimmedBody}`;
}

// Sanitize a filename for upload: keep extension, lowercase, replace non-safe chars with '-'
function safeFilename(name) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext).toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'file') + ext;
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

async function listAll(dir, base = '') {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...(await listAll(path.join(dir, entry.name), rel)));
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

export function contentEditor() {
  return {
    name: 'content-editor',
    enforce: 'pre',
    apply: 'serve',
    configureServer(server) {
      // Register synchronously so we run before Astro's catch-all SSR handler.
      server.middlewares.use('/api/admin', async (req, res, next) => {
        const fullPath = '/api/admin' + (req.url ?? '');
        const url = new URL(fullPath, 'http://x');

        try {
          if (url.pathname === '/api/admin/list' && req.method === 'GET') {
            const files = await listAll(CONTENT_ROOT);
            return send(res, 200, { files });
          }

          if (url.pathname === '/api/admin/file' && req.method === 'GET') {
            const rel = url.searchParams.get('path');
            if (!rel) return send(res, 400, { error: 'missing path' });
            const abs = withinContentRoot(rel);
            if (!abs) return send(res, 400, { error: 'path outside content root' });
            const raw = await fs.readFile(abs, 'utf8');
            const { frontmatter, body, _parseError } = splitFrontmatter(raw);
            return send(res, 200, { path: rel, frontmatter, body, raw, parseError: !!_parseError });
          }

          if (url.pathname === '/api/admin/file' && req.method === 'POST') {
            const payload = await readJson(req);
            const rel = payload.path;
            if (!rel) return send(res, 400, { error: 'missing path' });
            const abs = withinContentRoot(rel);
            if (!abs) return send(res, 400, { error: 'path outside content root' });
            let raw;
            if (typeof payload.raw === 'string') {
              raw = payload.raw;
            } else if (typeof payload.body === 'string') {
              raw = joinFrontmatter(payload.frontmatter ?? {}, payload.body);
            } else {
              return send(res, 400, { error: 'missing body or raw' });
            }
            await fs.mkdir(path.dirname(abs), { recursive: true });
            await fs.writeFile(abs, raw, 'utf8');
            return send(res, 200, { ok: true, path: rel });
          }

          if (url.pathname === '/api/admin/file/create' && req.method === 'POST') {
            const payload = await readJson(req);
            const rel = payload.path;
            if (!rel) return send(res, 400, { error: 'missing path' });
            if (!/\.(md|mdx)$/.test(rel)) return send(res, 400, { error: 'must end in .md or .mdx' });
            const abs = withinContentRoot(rel);
            if (!abs) return send(res, 400, { error: 'path outside content root' });
            try {
              await fs.access(abs);
              return send(res, 409, { error: 'file already exists' });
            } catch { /* good - doesn't exist */ }
            const raw = joinFrontmatter(payload.frontmatter ?? {}, payload.body ?? '');
            await fs.mkdir(path.dirname(abs), { recursive: true });
            await fs.writeFile(abs, raw, 'utf8');
            return send(res, 200, { ok: true, path: rel });
          }

          if (url.pathname === '/api/admin/file' && req.method === 'DELETE') {
            const rel = url.searchParams.get('path');
            if (!rel) return send(res, 400, { error: 'missing path' });
            const abs = withinContentRoot(rel);
            if (!abs) return send(res, 400, { error: 'path outside content root' });
            try { await fs.unlink(abs); }
            catch (e) { if (e.code !== 'ENOENT') throw e; }
            // Also remove associated images folder, if any
            const slug = slugFromContentPath(rel);
            if (slug) {
              const imgDir = withinRoot(IMAGES_ROOT, slug);
              if (imgDir) {
                await fs.rm(imgDir, { recursive: true, force: true });
              }
            }
            return send(res, 200, { ok: true, path: rel });
          }

          if (url.pathname === '/api/admin/file/rename' && req.method === 'POST') {
            const { from, to } = await readJson(req);
            if (!from || !to) return send(res, 400, { error: 'missing from or to' });
            if (!/\.(md|mdx)$/.test(to)) return send(res, 400, { error: 'target must end in .md or .mdx' });
            const fromAbs = withinContentRoot(from);
            const toAbs = withinContentRoot(to);
            if (!fromAbs || !toAbs) return send(res, 400, { error: 'path outside content root' });
            try {
              await fs.access(toAbs);
              return send(res, 409, { error: 'target already exists' });
            } catch { /* good */ }
            await fs.mkdir(path.dirname(toAbs), { recursive: true });
            await fs.rename(fromAbs, toAbs);
            // Move associated images folder if slug changed
            const fromSlug = slugFromContentPath(from);
            const toSlug = slugFromContentPath(to);
            if (fromSlug && toSlug && fromSlug !== toSlug) {
              const fromImg = withinRoot(IMAGES_ROOT, fromSlug);
              const toImg = withinRoot(IMAGES_ROOT, toSlug);
              if (fromImg && toImg) {
                try {
                  await fs.access(fromImg);
                  await fs.rename(fromImg, toImg);
                } catch { /* no images folder, fine */ }
              }
            }
            return send(res, 200, { ok: true, from, to });
          }

          if (url.pathname === '/api/admin/upload-asset' && req.method === 'POST') {
            // For cover images and other src/assets/ resources. Returns a path
            // relative to the MDX file (src/content/blog/<slug>.mdx).
            const payload = await readJson(req);
            const { path: contentPath, filename, base64 } = payload;
            if (!contentPath || !filename || !base64) {
              return send(res, 400, { error: 'missing path, filename, or base64' });
            }
            const slug = slugFromContentPath(contentPath);
            if (!slug) return send(res, 400, { error: 'cannot derive slug from path' });
            const targetDir = path.resolve(ASSETS_ROOT, slug);
            if (!withinRoot(ASSETS_ROOT, slug)) return send(res, 400, { error: 'bad slug' });
            await fs.mkdir(targetDir, { recursive: true });
            const safe = safeFilename(filename);
            let outName = safe;
            try {
              await fs.access(path.join(targetDir, outName));
              const ext = path.extname(safe);
              const base = path.basename(safe, ext);
              outName = `${base}-${Date.now().toString(36)}${ext}`;
            } catch { /* doesn't exist */ }
            const data = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
            await fs.writeFile(path.join(targetDir, outName), data);
            // Relative path from src/content/blog/<slug>.mdx → src/assets/blog/<slug>/<file>
            // is ../../assets/blog/<slug>/<file>
            return send(res, 200, {
              ok: true,
              src: `../../assets/blog/${slug}/${outName}`,
              filename: outName,
            });
          }

          if (url.pathname === '/api/admin/upload' && req.method === 'POST') {
            const payload = await readJson(req);
            const { path: contentPath, filename, base64 } = payload;
            if (!contentPath || !filename || !base64) {
              return send(res, 400, { error: 'missing path, filename, or base64' });
            }
            const slug = slugFromContentPath(contentPath);
            if (!slug) return send(res, 400, { error: 'cannot derive slug from path' });
            const safe = safeFilename(filename);
            const targetDir = path.resolve(IMAGES_ROOT, slug);
            // Confirm we're writing inside IMAGES_ROOT (defense against symlinks/slug tricks)
            if (!withinRoot(IMAGES_ROOT, slug)) return send(res, 400, { error: 'bad slug' });
            await fs.mkdir(targetDir, { recursive: true });
            // If filename collides, suffix with a short timestamp
            let outName = safe;
            try {
              await fs.access(path.join(targetDir, outName));
              const ext = path.extname(safe);
              const base = path.basename(safe, ext);
              outName = `${base}-${Date.now().toString(36)}${ext}`;
            } catch {
              // doesn't exist - keep original name
            }
            const data = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
            await fs.writeFile(path.join(targetDir, outName), data);
            return send(res, 200, { ok: true, url: `/images/blog/${slug}/${outName}` });
          }

          return send(res, 404, { error: 'not found' });
        } catch (err) {
          return send(res, 500, { error: String(err?.message ?? err) });
        }
      });
    },
  };
}
