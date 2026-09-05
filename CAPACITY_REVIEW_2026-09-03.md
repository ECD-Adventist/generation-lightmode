# Capacity review — registration and usage, web and mobile (3 Sep 2026, main @ 5b0dd5c)

Derived from the code, not from a load test. Web and the mobile app are the same React bundle
(the app is the PWA), so they share every number below; mobile differs only in smaller first
pages (4 posts instead of 10) and 600px thumbnails.

## What one user costs the backend today

| Action | Backend work per action (from the code) |
| --- | --- |
| Registration | Base44 hosted auth, then `followAllLeadersOnSignup`: reads all active leader accounts (pages of 100), reads the user's follows (up to 5,000), bulk-creates one Follow row per leader in batches of 100; `autoFollowGenerationLightMode` adds one more. With L leaders that is L+1 rows and ~L/100+3 requests per signup. |
| Opening the Feed | ~10 queries + up to 5 function calls: drops (15) + reposts (15) paged, stories (100), all of the viewer's likes (`fetchAll`), saved drops (500), unread notifications, all of the viewer's follows (`fetchAllFollowing`), leader accounts, visible authors (batched), suggested users. Two realtime subscriptions stay open. |
| Opening a Profile | 19 queries, including every follower and every following row of that profile (`fetchAllFollowers` / `fetchAllFollowing`), all likes and all saves of the viewer. Cost grows with the profile's audience. |
| Opening Messages | 8 queries: 200 conversations, then one "last message" query per conversation (N+1), all groups (`GlowGroup.list()`), memberships, join requests. Two subscriptions. |
| Prayer wall | 1 function call (server-side, paged) + 3 subscriptions. |
| Any page | Layout runs an unread-notifications query and holds 1 subscription. 31 `subscribe()` calls exist across 18 files. |
| Any backend function call | The rate limiter does 2 reads and 1–2 writes on the `ApiRateLimit` entity per call (limits: 120/min per user, 60/min per IP). |
| Uploads | Images ≤ 10 MB, audio ≤ 25 MB, served from Base44 media with 600px feed thumbnails. |

Data today: ~6.4k posts, ~19k follows, ~110 prayers, 77 entities, 81 functions.

## How much traffic can it handle

Base44 is a shared, hosted platform (Cloudflare in front, Python API behind) and does not publish
throughput numbers; the real ceiling is the plan quota in the Base44 dashboard (Usage/Billing).
From the per-action costs above, the practical envelope of the current code is:

| Scenario | Comfortable today | Where it starts to hurt |
| --- | --- | --- |
| Concurrently active users (feed, profiles, chat open) | ~300–500 | ~2,000+: realtime fan-out (every post/like/notification is pushed to every subscribed client, which then refetches) and the rate-limit ledger (3–4 writes/reads per function call) become the bottleneck |
| Daily active users | ~5,000–10,000 | ~50,000: Feed and Profile "load everything" queries per visit multiply |
| Registrations | ~1,000 per hour | ~10,000 per hour with 50+ leaders: 500k+ follow rows/hour through batched bulk creates plus function concurrency limits |
| Single popular profile | audiences up to ~3,000 followers | >5,000 followers: the profile page pulls every follower row into the browser (multi-second loads, memory) |
| Total posts | millions are fine for the paged feed | `GlowDrop.list(500)` on institution pages and `filter(status)` searches slow down past ~100k posts |

These are engineering estimates with a ±2× margin; they should be confirmed with a load test
(k6 or Artillery against a staging app) before any campaign that could bring thousands of
signups in a day.

## How to extend safely, in order

### Stage 1 — code only, no platform change (roughly doubles headroom)

1. **Replace `fetchAll` with counts + pages.** Store `followers_count`, `following_count`,
   `likes_count` on the User record (updated inside the existing functions) and page follower /
   following / likes lists 50 at a time. Fixes the popular-profile problem.
2. **Stop entity-wide realtime.** Keep `subscribe()` only for the open chat conversation and
   the group session; replace feed / notification / prayer subscriptions with polling every
   30–60 s (`refetchInterval`). This removes the fan-out storm.
3. **Make the rate limiter cheap.** Keep the ledger in a single upsert per call (or skip the
   ledger for authenticated reads and keep it for writes and guest calls). Today every function
   call is 3–4 database operations before it does any work.
4. **Kill N+1 in Messages.** Store `last_message_preview` and `last_message_at` on
   `DirectConversation` when a message is sent; the list then needs one query.
5. **Trim per-visit loads.** Stories limited to followed users, saved drops paged, `GlowGroup.list()`
   replaced by the user's groups, institution pages paged instead of `list(500)`.
6. **Registration fan-out as a job.** Create the leader follows in a scheduled function that
   drains a queue (a `SignupTask` entity) instead of inline during signup, so a burst of signups
   never blocks or fails.

### Stage 2 — backend-first migration to Supabase Postgres (10× headroom)

Already chosen as the direction; the dual-write and migration functions exist.

1. Finish the mirror and lock it down (RLS script in `supabase/security/`).
2. Move the **read** paths to Postgres: feed, profile, leaderboard, search via SQL views with
   indexes on `(status, hidden, created_date)`, `(user_email, created_date)`,
   `(follower_id)`, `(following_id)`. Postgres handles hundreds of millions of rows; use the
   connection pooler for the app and add a read replica when needed.
3. Serve those reads through Supabase edge functions or PostgREST with RLS, keeping Base44
   for auth and writes until Stage 3.
4. Add a queue table for fan-out work (notifications, signup follows, mirror writes) drained by
   a scheduled worker.
5. Load-test each step; watch p95 latency, error rate and database CPU.

### Stage 3 — own the backend (the 100M-user ambition)

1. Supabase Auth (or another OIDC provider) replaces Base44 auth; users migrate on next login.
2. Dedicated Postgres (Supabase Pro/Team or self-managed) with partitioned event tables
   (likes, views, notifications), Redis for counters and rate limits, object storage + image CDN
   with on-the-fly resizing, and a background job system.
3. "Follow all leaders" becomes implicit: leader posts are injected into every feed by rule,
   not by a Follow row per user (100 leaders × 1M users = 100M rows otherwise).
4. Observability: Sentry performance (already wired), request logs, dashboards, alerts.
5. Native shells (Capacitor) change nothing for the backend; the same limits apply.

## What to watch now

- Base44 dashboard: monthly API calls, function invocations and storage against the plan.
- Time to first feed paint on a mid-range Android on 3G (target under 3 s).
- Function error rate and 429s from the rate limiter during any campaign.
