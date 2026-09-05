# Tech stack to carry Generation LightMode to 1M users

Written 3 Sep 2026 against main. Target: **1,000,000 registered users**, web and mobile.

## The recommendation in one line

**Keep the React front end exactly as it is. Move the data and auth from Base44 onto Supabase
Postgres, which you already own and have just secured. Add Redis for counters and rate limits,
and a queue for fan-out work.** Nothing here is exotic: 1M users is a well-understood size that
Postgres handles comfortably — *if* the query patterns are fixed. They are the real risk, not
the stack.

## What 1M users actually means

| Measure | Estimate at 1M registered |
| --- | --- |
| Daily active users (10–20% is typical for a community app) | 100,000 – 200,000 |
| Peak concurrent users | 5,000 – 20,000 |
| Feed opens per day (≈5 per active user) | 500,000 – 1,000,000 |
| Database queries per second, average | ~100–200 |
| Database queries per second, peak | ~1,000–2,000 |
| Rows in `follows` (≈100 follows each) | ~100,000,000 |
| Rows in `glow_drop_likes` over a year | 100M+ |
| Media stored (≈20 images per active user) | 5–20 TB |

A single well-indexed Postgres instance (8–16 vCPU) serves 5,000–10,000 simple queries per
second. So **the target is comfortably reachable** — the failure mode is not row count, it is
the app asking for entire tables.

## The stack

| Layer | Recommendation | Why |
| --- | --- | --- |
| **Front end** | Keep **React 18 + Vite + Tailwind + Radix**, unchanged | 221 files already build on it; a Next.js rewrite buys nothing here and costs months. Server rendering matters for public marketing pages, not for a logged-in app. |
| **Mobile** | Keep the **PWA**, add **Capacitor** shells for the App Store and Play Store | Same bundle, same code. Only needed when you want push notifications and store presence. |
| **Database** | **Supabase Postgres** (Pro → Team as you grow), with the connection pooler | Already mirrored and locked down. Postgres with the right indexes and partitioned event tables handles 100M+ rows. Read replicas when reads outgrow one instance. |
| **API** | **Supabase PostgREST + Edge Functions** (Deno — same language as your 94 Base44 functions) | Your functions port with modest changes; no new language for the team. |
| **Auth** | **Supabase Auth** | Native RLS integration, social login, JWTs. Migrate users on next login so nobody is locked out. |
| **Cache, counters, rate limits** | **Upstash Redis** (serverless, pay per request) | The current rate limiter costs 3–4 database operations on *every* function call. In Redis that is one atomic increment. Also holds follower and like counters. |
| **Background jobs** | **pgmq** (a Postgres queue) or Supabase cron + worker | Signup fan-out, notification fan-out, mirror writes. Nothing heavy should run inside a request. |
| **Media** | **Cloudflare R2 + Cloudflare Images** (or Supabase Storage) | Automatic resizing at the edge; no egress fees on R2. At 5–20 TB this is the difference between a small bill and a large one. |
| **Edge / CDN** | **Cloudflare** (already in front of the site) | Static assets and caching; WAF and bot protection for the signup endpoint. |
| **Realtime** | **Supabase Realtime**, scoped to one channel per open conversation | Never subscribe a whole table. Today 31 subscriptions across 18 files push every change to every client. |
| **Search** | Postgres full-text first; **Typesense** or **Meilisearch** only if it stalls | Do not add a search service before you need one. |
| **Errors & performance** | **Sentry** (already installed) + Supabase metrics, Grafana or Better Stack | You already have `tracesSampleRate: 0.2`; keep it. |
| **Load testing** | **k6** in CI against staging | The only way these numbers stop being estimates. |

### What I am not recommending, and why

- **Next.js / Remix rewrite.** A logged-in social app gains little from server rendering, and
  a rewrite across 221 files under traffic pressure is the single riskiest thing you could do.
- **MongoDB / DynamoDB.** Your data is deeply relational (follows, likes, groups, territories).
  Postgres is the right shape and you already have the mirror.
- **Kubernetes / microservices.** At 1M users this adds an operations team's worth of work for
  no throughput gain. Revisit past 10M.
- **Firebase.** Would mean a second migration away from the Supabase work already done.

## The blockers that matter more than the stack

These are in the current code and will break at a few thousand concurrent users on *any* stack.
Fix them first; they cost days, not months.

1. **`fetchAllFollowers` / `fetchAllFollowing` load every row into the browser.** A leader with
   50,000 followers ships 50,000 rows to a phone. → Store `followers_count` / `following_count`
   on the user record; page the lists 50 at a time.
2. **Signup fan-out writes a Follow row per leader, per user.** 1M users × 50 leaders =
   50,000,000 rows that exist only to say "everyone follows the leaders". → Make leader posts
   implicit in the feed query. This alone removes half your future `follows` table.
3. **31 entity-wide realtime subscriptions.** Every post, like and notification is pushed to
   every connected client, each of which then refetches. At 10,000 concurrent this is a
   self-inflicted denial of service. → One channel per open conversation; poll everything else
   every 30–60 seconds.
4. **The rate limiter does 3–4 database operations before any request does its work.** → Redis.
5. **Messages runs one query per conversation (N+1) for 200 conversations.** → Store
   `last_message_preview` and `last_message_at` on the conversation row.
6. **Profile page fires 19 queries; Feed fires 10 plus 5 function calls.** → Combine into one
   or two endpoints per page that return exactly what the page renders.

## Phased plan

| Phase | Work | Buys you | Effort |
| --- | --- | --- | --- |
| **0 — this month** | The six fixes above, still on Base44. Add k6 load tests and a staging app. | 3–5× headroom; roughly 50,000 DAU | 2–3 weeks |
| **1 — reads on Postgres** | Point feed, profile, search, leaderboard at Supabase with proper indexes. Base44 keeps auth and writes. Redis for counters and limits. | ~200,000 DAU; the 1M target becomes reachable | 4–6 weeks |
| **2 — writes and auth** | Move writes to Supabase, migrate auth, retire the dual-write. Queue for all fan-out. | The full 1M target with room to spare | 6–8 weeks |
| **3 — only if you exceed it** | Read replicas, partition `likes` / `views` / `notifications` by month, dedicated Postgres, regional edge caching. | 10M+ | as needed |

**Do not skip Phase 0.** Migrating the current query patterns onto a new database just moves the
bottleneck and makes it more expensive.

## Rough monthly cost at 1M users, 150k DAU

| Item | Estimate |
| --- | --- |
| Supabase Team (8–16 vCPU, replica, 500 GB) | $600 – $1,500 |
| Cloudflare R2 + Images (10 TB, no egress fee) | $150 – $400 |
| Upstash Redis | $50 – $200 |
| Sentry (team tier) | $80 – $300 |
| Cloudflare Pro / WAF | $25 – $250 |
| **Total** | **≈ $900 – $2,600 / month** |

Compare against Base44's per-call pricing at that volume before deciding; that comparison is the
strongest business case for the migration.

## What to watch from day one

- Feed time-to-first-paint on a mid-range Android over 3G — target under 3 seconds.
- p95 API latency — alert above 500 ms.
- Database CPU and connection count — scale up past 70% sustained.
- 429 rate-limit responses — a spike means a campaign is outrunning the limiter.
- Signup success rate during campaigns — the fan-out job is the first thing to fail.
