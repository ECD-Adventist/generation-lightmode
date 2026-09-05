# Security report — generation-lightmode (3 Sep 2026)

Scope: the GitHub repository (React/Vite front end, 81 Base44 Deno functions, 77 entity
definitions, service worker, CSP) plus live checks of lightmode.ecd.adventist.org response
headers and the Supabase project the app mirrors into. Method: dependency audit, secret scan,
XSS-sink review, per-function auth review, entity rule review, header review, anonymous-key probe.

## Score

| Area | Weight | Before | After this commit | After the Supabase script is run |
| --- | ---: | ---: | ---: | ---: |
| Data exposure and access control | 30% | 20% | 70% | 95% ✅ |
| Backend function authorisation | 15% | 95% | 95% | 95% |
| Dependencies | 10% | 100% | 100% | 100% |
| Secrets management | 10% | 100% | 100% | 100% |
| XSS and input handling | 15% | 75% | 90% | 90% |
| Transport and security headers | 10% | 70% | 70% | 70% |
| Session and token handling | 5% | 60% | 60% | 60% |
| Service worker and PWA | 5% | 90% | 90% | 90% |
| **Overall** | | **66%** | **83%** | **91%** ✅ achieved 3 Sep 2026 |

The last 9 points sit with Base44 hosting (inline-script CSP, header-level policies, token in
`localStorage`) and cannot be closed from this repository; they are listed under "Remaining".

## What was fixed in this commit

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| 1 | Critical | The browser held the Supabase anon key and **wrote** posts straight into `glow_drops` (`src/lib/supabaseGlowDrops.js`); with no RLS the key could read and write every mirrored table. | Browser Supabase access removed entirely: `mirrorGlowDropToSupabase` now calls the server function `dualWriteSupabase`, which re-reads the record and checks ownership; `supabaseClient.js` deleted; the anon key no longer appears in the bundle (verified on the build). |
| 1b | Critical | Mirrored tables readable by anyone (6,383 posts, 18,974 follows, 109 prayers with emails). | `supabase/security/001_enable_rls.sql` enables and forces RLS on all 77 mirrored tables and revokes anon/authenticated; README explains the 5-minute apply and anon-key rotation. Needs to be run in the Supabase SQL editor (no database credentials are in this repo, by design). |
| 2 | High | Prayer requests and comments were world-readable entities; Base44's `created_by` named the author even on anonymous prayers, and the dashboard tab created anonymous prayers with the email attached. | New backend function `listPrayerRequests` serves the wall with `created_by`/`created_by_id` stripped and no email on anonymous entries; `PrayerRequest` and `PrayerComment` entity reads are now owner + moderator only; the dashboard tab creates through `submitPrayerRequest`, which blanks the email for anonymous prayers. Prayer wall, mobile wall, dashboard prayer tab and analytics tab updated. |
| 6 | Low | Eleven `target="_blank"` links without `rel="noopener"`. | All eleven now carry `rel="noopener noreferrer"`; the HTML sanitizer also forces it on any link inside rich posts. |
| 7 | Low | Rich posts could embed images from any host (tracking pixels). | Sanitizer allow-list: images must be https and come from `media.base44.com` or this origin. |

## Applied to the live database — 3 Sep 2026

`supabase/security/001_enable_rls.sql` was run in the Supabase SQL editor. All 70 existing
tables report `rowsecurity = true`, and the public keys are now denied:

| Probe with the public (anon / publishable) key | Before | After |
| --- | --- | --- |
| `glow_drops` | 9,010 rows | 401 permission denied |
| `follows` | 28,788 rows | 401 permission denied |
| `prayer_requests` (emails + prayer text) | 132 rows | 401 permission denied |
| `app_users`, `notifications`, `direct_messages`, `glow_group_messages` | readable | 401 permission denied |
| insert into `glow_drops` | accepted | 401 rejected |

Backend functions are unaffected: `service_role` bypasses RLS.

**Outstanding key rotation:** the `service_role` key was pasted into a chat during this work and
must be rolled (Project Settings → API), with `SUPABASE_SERVICE_ROLE_KEY` updated in the Base44
function secrets. The anon key no longer needs rotating — the app does not use it and RLS blocks it.

## Remaining (needs Base44 hosting or an operator action)

| # | Severity | Finding | What to do |
| --- | --- | --- | --- |
| 3 | Medium | CSP `script-src` allows `'unsafe-inline'` (Base44's builder requires it). | Ask Base44 for nonce/hash support on the production build, or a separate production policy. |
| 4 | Medium | Base44 SDK keeps the access token in `localStorage`. | Platform behaviour; keep the sanitizer strict and CSP as tight as Base44 allows. |
| 5 | Low | HSTS lacks `includeSubDomains; preload`; no `Permissions-Policy`; CSP is a meta tag so `frame-ancestors` cannot apply (X-Frame-Options DENY covers clickjacking). | Hosting headers; raise with Base44. |
| 8 | Info | GitHub tokens were pasted in chat during this work. | Revoke the classic token when pushes are finished; rotate the Supabase anon key after RLS. |

## What checked out clean

- `npm audit` (production and dev): 0 vulnerabilities.
- No secrets committed; `.env*` ignored; service keys only via `Deno.env.get(...)`.
- All 81 backend functions build the client from the request and check `auth.me()`; admin,
  scheduler and owner checks guard every service-role write (`deleteGlowDrop`, `deleteMyAccount`,
  `manageRepost`, `submitPrayerRequest`, the `admin*`, `publish*` and `reconcile*` jobs).
  Guest likes are rate-limited (`enforceApiRateLimit`).
- Entity rules on 76 of 77 entities scope messages, conversations, notifications, saved drops,
  reports, blocks and challenges to their owner or admin roles.
- `dangerouslySetInnerHTML` only ever receives DOMPurify output or generated CSS.
- Service worker never intercepts `/api`, `/auth`, `/login`, `/logout`, `/oauth`.
- No `eval`, `new Function`, `document.write`, or navigation driven by URL parameters.
- Live headers present: HSTS (1 year), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`.

## Verification notes

- Build after the changes: `dist/assets` contains no Supabase project id and no anon key.
- New function `listPrayerRequests` passes an esbuild TypeScript syntax check; entity JSON validates.
- Prayer flows that could not be exercised without a signed-in test account (wall, comments,
  dashboard prayer tab) should be smoke-tested after Base44 publishes: post, pray, comment,
  anonymous post shows "Anonymous" with no email.
