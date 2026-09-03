# Security scan — generation-lightmode (main @ 91922ce, 3 Sep 2026)

Scope: the GitHub repository (React/Vite front end, 80 Base44 Deno functions, 77 entity
definitions, service worker, CSP) plus two live checks: the response headers of
lightmode.ecd.adventist.org and the Supabase project the app mirrors data into.
Method: dependency audit, secret scan, XSS-sink review, per-function auth review, entity
RLS review, header review, anonymous-key probe. No changes were made to live systems.

## Findings, most severe first

### 1. CRITICAL — Supabase mirror readable by anyone with the public anon key

The browser bundle ships `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(`src/lib/supabaseGlowDrops.js` reads `glow_drops` directly). Row Level Security is not
enabled on the mirrored tables, so the anon key returns full rows to anyone:

| table | rows readable today | contains |
| --- | --- | --- |
| `glow_drops` | 6,383 | `user_email`, `created_by` for every post |
| `follows` | 18,974 | the whole social graph |
| `prayer_requests` | 109 | `user_email`, `created_by`, personal prayer text |

`direct_messages` and `app_users` exist but are empty, so nothing is exposed there yet;
they will be the moment the migration backfills them.

Fix (do this first):
1. In Supabase, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on every mirrored table.
2. Add policies: `anon` gets **no** access to `follows`, `prayer_requests`, `direct_messages`,
   `app_users`; for `glow_drops` either no anon access (let Base44 serve the feed, which it
   already does) or a read-only view that excludes `user_email` / `created_by`.
3. Service-role writes from the Base44 functions are unaffected (service role bypasses RLS).
4. Rotate the anon key afterwards so cached copies of the bundle stop working.

### 2. HIGH — Prayer requests expose the requester's email to every user

`base44/entities/PrayerRequest.jsonc` has `"read": true`, and the record stores
`user_email` for non-anonymous prayers. Any signed-in user (and the public snapshot paths)
can list every prayer with its author's email. Anonymous prayers are handled correctly
(`submitPrayerRequest` blanks `user_email`), but the field itself should never reach
other users.

Fix: serve the prayer wall through a function that strips `user_email` / `created_by`
(return `author_name` only), or restrict entity read to owner + officers and keep the
public wall on the function path. Same pattern is worth applying to `GlowDrop`
(`read: true`, rows carry `user_email`).

### 3. MEDIUM — CSP allows `'unsafe-inline'` scripts

`index.html` ships `script-src 'self' 'unsafe-inline' blob:`. The comment explains Base44's
builder needs inline scripts. With inline allowed, the CSP no longer stops injected script
in an XSS. Mitigations already in place: DOMPurify on all rich HTML, no `eval`. Ask Base44
whether nonces or hashes can replace `'unsafe-inline'` on the production build; if the
builder preview needs it, ship two policies (preview vs production).

### 4. MEDIUM — Session token lives in `localStorage`

`src/lib/app-params.js` stores the Base44 access token in `localStorage`, so any XSS
would read it. This is the Base44 SDK's model and cannot be changed app-side; it raises the
value of fixing 3 and keeping DOMPurify strict.

### 5. LOW — Hardening gaps on live headers

Present: HSTS (1 year), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`. Missing: `includeSubDomains; preload` on HSTS, a `Permissions-Policy`
(camera, microphone, geolocation), and a CSP delivered as a header rather than a meta tag
(meta CSP cannot enforce `frame-ancestors`; X-Frame-Options covers that today). These are
Base44 hosting settings; raise with them.

### 6. LOW — `target="_blank"` links without `rel="noopener"`

Eleven anchors (admin tabs, chat windows, consent sheets, compliance page). Modern
browsers imply `noopener` for `_blank`, so the tab-napping risk is historical; still worth
adding `rel="noopener noreferrer"` for older WebViews.

### 7. LOW — Rich-text sanitizer allows remote images

`sanitizeRichHtml` permits `<img src="https://…">`, so a post can embed a tracking pixel.
Acceptable for a social feed; if unwanted, proxy images or drop `img` from `ALLOWED_TAGS`.

### 8. INFO — Tokens shared during this work

Three GitHub tokens were pasted into chat sessions on 2–3 September. Two are already
invalid; revoke the classic `ghp_…` token once the push work is finished, and create a
scoped one when needed again. The Supabase anon key is public by design but should be
rotated after RLS is enabled (finding 1).

## What checked out clean

- `npm audit` (production and dev): 0 vulnerabilities.
- No secrets committed: `.env*` ignored, only `Deno.env.get(...)` references to service keys.
- All 80 backend functions create the client from the request and check `auth.me()`;
  admin, scheduler and owner checks are present where service-role writes happen
  (`deleteGlowDrop`, `deleteMyAccount`, `manageRepost`, `submitPrayerRequest`, admin*,
  publish*, reconcile*). Guest likes are rate-limited (`enforceApiRateLimit`).
- Entity RLS is defined on 76 of 77 entities; messages, conversations, notifications,
  saved drops, reports, blocks and challenges are correctly scoped to the owner or
  admin roles.
- `dangerouslySetInnerHTML` is used only with DOMPurify output or generated CSS.
- Service worker never intercepts `/api`, `/auth`, `/login`, `/logout`, `/oauth`.
- No `eval`, `new Function`, `document.write`, or location assignment from URL parameters.

## Suggested order of work

1. Enable RLS and policies on Supabase (finding 1), then rotate the anon key.
2. Stop returning `user_email` from prayer and drop reads (finding 2).
3. Ask Base44 about CSP nonces and header-level policies (findings 3 and 5).
4. Add `rel="noopener noreferrer"` to the eleven links (finding 6).
5. Revoke the working GitHub token when done (finding 8).
