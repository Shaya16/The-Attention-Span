# Cloudflare Setup — Claps + Comments

Step-by-step to wire the new `/api/*` endpoints to D1, Turnstile, and Pages.
Do these once, then deploy as usual.

---

## 0. Install deps

```sh
npm install
```

This pulls in `wrangler` and `@cloudflare/workers-types`.

---

## 1. Create the D1 database

In the Cloudflare dashboard:

1. **Storage & Databases → D1 → Create database**
2. Name: `attention-span-db`
3. Region: closest to you
4. After creation, copy the **Database ID** (UUID)
5. Open `wrangler.toml` and replace `REPLACE_ME_AFTER_CREATING_DB` with that UUID

Or via CLI:

```sh
npx wrangler login
npx wrangler d1 create attention-span-db
# Paste the printed database_id into wrangler.toml
```

---

## 2. Bind the database to the Pages project

Dashboard → **Workers & Pages → the-attention-span → Settings → Bindings → D1 database binding**

- Variable name: `DB`
- D1 database: `attention-span-db`
- Save. Add the binding for both **Production** and **Preview** environments.

---

## 3. Run the migration

Local (creates a local SQLite for `wrangler pages dev`):

```sh
npm run db:migrate:local
```

Production:

```sh
npm run db:migrate:remote
```

You should see `0001_init.sql` applied.

---

## 4. Create a Turnstile site (spam protection on comments)

Dashboard → **Turnstile → Add Site**

- Name: `the-attention-span`
- Domain: `the-attention-span.pages.dev` (add your custom domain too if any)
- Widget mode: **Managed** (or Invisible)
- Save

Copy the two values it generates:

- **Site key** (public — goes into the frontend)
- **Secret key** (server-side — goes into env secrets)

---

## 5. Set environment variables on Pages

Dashboard → **Workers & Pages → the-attention-span → Settings → Variables and Secrets**

Add these for **Production** (and **Preview** if you want to test there):

| Name                        | Type        | Value                                                                    |
| --------------------------- | ----------- | ------------------------------------------------------------------------ |
| `PUBLIC_TURNSTILE_SITE_KEY` | Plaintext   | the Turnstile **site key** from step 4                                   |
| `ADMIN_PASSWORD`            | **Secret**  | something long, you'll type this on `/admin/comments`                    |
| `SESSION_SECRET`            | **Secret**  | random 32+ char string — generate with `openssl rand -hex 32`            |
| `TURNSTILE_SECRET`          | **Secret**  | the Turnstile **secret key** from step 4                                 |

`PUBLIC_*` must be a plaintext **build** env var (it's baked into the static JS). The other three are runtime secrets.

> CLI alternative for the secrets:
>
> ```sh
> npx wrangler pages secret put ADMIN_PASSWORD --project-name the-attention-span
> npx wrangler pages secret put SESSION_SECRET --project-name the-attention-span
> npx wrangler pages secret put TURNSTILE_SECRET --project-name the-attention-span
> ```

---

## 6. Local dev

Create `.dev.vars` (gitignored) by copying the template:

```sh
cp .dev.vars.example .dev.vars
```

The defaults use Cloudflare's always-pass test Turnstile secret. To match it on the frontend, create `.env`:

```
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

Then:

```sh
npm run preview:cf
```

This builds Astro and runs `wrangler pages dev` against `./dist` with the local D1 + `.dev.vars`. Open `http://localhost:8788`.

Plain `npm run dev` still works for content/UI edits — but `/api/*` calls won't resolve there. Use `preview:cf` whenever you need the backend.

---

## 7. First deploy

Cloudflare Pages will redeploy automatically when you push to `main`. After the first deploy:

1. Verify the `/api/stats?slugs=hello-blog` endpoint returns `{"stats": {...}}`
2. Open a post page, click the clap button — the count should persist on reload
3. Submit a test comment — it should land in the **pending** tab on `/admin/comments`

---

## 8. Moderating comments

1. Visit `https://the-attention-span.pages.dev/admin/comments`
2. Enter your `ADMIN_PASSWORD`
3. Approve / reject pending items. Approved comments appear under the post immediately; the `comment_count` on the homepage preview goes up on next page load.

The admin page is `noindex,nofollow` and password-gated — safe to leave at a guessable URL.

---

## Notes

- **Cap**: each visitor can clap up to 50 times per post (cookie-tracked).
- **Comment moderation**: every new comment starts as `pending`. There's no automatic publishing.
- **Cookie**: `asvid` (visitor) is a random UUID, 1-year `HttpOnly` cookie. `asadmin` is HMAC-signed and expires in 30 days.
- **Reset local DB** if you want to wipe and start over:
  ```sh
  rm -rf .wrangler/state/v3/d1
  npm run db:migrate:local
  ```
