# Leaving Base44: Migration Plan (Backend First)

**Why backend-first, not Next.js-first:** Next.js replaces the frontend framework only.
It does not touch the 894 `base44.*` calls across 194 files, the 65 backend functions, or
where your data actually lives. Rewriting the frontend before the backend is portable means
rewriting it twice. This plan gets the backend fully independent of Base44 first — Next.js
(or staying on Vite/React, which also works fine against Supabase) becomes a much smaller,
lower-risk decision afterward.

## What's already true today (verified against the live repo)

- **66 entities** defined as JSON Schema in `base44/entities/*.jsonc` — this repo already has
  a machine-readable schema for every table. `User` (39 fields) and `GlowDrop` (36 fields)
  are the largest.
- **A dual-write pipeline already runs in production**: `src/lib/dualWriteSupabase.js` and
  `src/lib/supabaseGlowDrops.js` mirror `glow_drops`, `follows`, `direct_messages`, and
  `notifications` into Supabase the moment they're created in Base44, from ~20 call sites
  across the UI.
- **A bulk migrator exists**: `base44/functions/migrateBase44ToSupabase/entry.ts` walks all
  66 entities via the Base44 SDK, infers a Postgres schema, and upserts everything in
  batches of 250. It works, but the schema it produces is inferred from sample data
  (`text`/`numeric`/`boolean`/`timestamptz` guesses) — no constraints, no foreign keys, no
  indexes beyond primary key.
- **Nothing reads from Supabase yet.** Every page still reads through `base44.entities.X`.
  Supabase today is a write-only shadow copy.
- **No `@supabase/supabase-js` client is installed** — existing Supabase access is raw
  PostgREST `fetch()` calls (frontend, using the anon key) or the `postgres` npm package
  over a direct connection (backend Deno functions, using the service role key).

## Known issue to fix regardless of migration pace

`src/lib/supabaseGlowDrops.js` POSTs to `glow_drops` directly from the browser using the
**public anon key**. Unless Row Level Security policies on that table are locked down, this
is an open write endpoint — anyone can insert fake drops without going through Base44's
validation. Worth checking/fixing this week, independent of everything else below.

---

## Target architecture

- **Database:** Supabase Postgres (already provisioned — `SUPABASE_DATABASE_URL` is in use).
- **Auth:** Supabase Auth, replacing Base44 auth. This is the highest-risk single piece —
  see Phase 2.
- **API access:** `@supabase/supabase-js` client (not yet installed) for typed queries +
  Realtime subscriptions, replacing raw REST calls.
- **File storage:** Supabase Storage, replacing Base44's media hosting
  (`media.base44.com` URLs currently embedded in records).
- **Frontend framework:** unchanged for now (Vite/React). Revisit Next.js once the above is
  live and stable — see "Where Next.js fits," below.

---

## Phase 0 — Real schema, not inferred schema (1–2 weeks)

Convert all 66 `base44/entities/*.jsonc` files into hand-reviewed Postgres DDL:
proper types, `NOT NULL` where the schema says required, actual foreign keys
(`user_email` → `app_users.email`, `drop_id` → `glow_drops.id`, etc. — currently these are
just loose strings with no referential integrity), and indexes on every column used in a
`filter()`/`list()` call today (start by grepping `base44.entities.X.filter(` call sites per
entity to see real query patterns).

This replaces `migrateBase44ToSupabase`'s type-inference with a schema that won't need
migrating again in six months. Do this once, correctly, before any bulk backfill.

## Phase 1 — Row Level Security policies (parallel with Phase 0)

Every table needs explicit RLS policies before it's safe to read/write from the client
directly (today, Base44 does this validation server-side; Supabase pushes it to the
database layer). Rough shape, per entity group:

- **Public-read tables** (`GlowDrop` where `status = 'approved'`, `CodeOfTruth`, `DailyCode`):
  anon `SELECT` allowed, `INSERT`/`UPDATE` restricted to service role or owner.
- **Owner-only tables** (`Notification`, `SavedDrop`, `DirectMessage`): `SELECT`/`INSERT`
  restricted to `auth.uid()` matching the record's owner.
- **Admin-only tables** (`AdminLog`, `SecurityEvent`, `ComplianceAudit`): no anon access at
  all, service role only.

This is the step that actually prevents the anon-key issue mentioned above, and it's the
same work needed regardless of frontend framework.

## Phase 2 — Auth migration (highest risk — plan separately, don't rush)

Base44 auth (Google/Microsoft/Facebook/Apple/email, per the live sign-in screen) needs to
become Supabase Auth. Options, roughly in order of how much user disruption they cause:

1. **Supabase supports the same OAuth providers** — reconnect them under Supabase's OAuth
   config, map existing `User.email` records to new Supabase `auth.users` rows by email
   match. Users re-consent to OAuth once, no password reset needed.
2. **Email/password users** can't be migrated directly (Base44 won't hand over password
   hashes) — plan on a forced password-reset email flow for that subset.
3. Keep `User` entity data (role, bio, territory, badges, etc.) in `app_users`, linked
   1:1 to `auth.users` by UUID once matched.

Do this on a **test cohort first** (e.g., admin accounts), not the full ~800 users, and only
after Phase 0/1 are solid.

## Phase 3 — Backfill (use existing tooling, on the new schema)

Re-point `migrateBase44ToSupabase` at the Phase 0 schema instead of letting it create tables
on the fly. Run it, verify row counts match Base44 per entity, spot-check a sample of
records for data fidelity (especially `GlowDrop` and `User` given their field count).

## Phase 4 — Read cutover, one entity at a time

Start with the **lowest-risk, most-isolated** entities, not the feed. Suggested order based
on what's already partially wired and what has the fewest cross-entity dependencies:

1. `Notification` (dual-write already exists, owner-scoped, low blast radius if wrong)
2. `Follow` (dual-write already exists, simple shape)
3. `DirectMessage` / `DirectConversation` (dual-write exists, but higher user-visible risk)
4. `GlowDrop` + `GlowDropLike` + `GlowDropComment` (the feed — highest visibility, do last
   among the "already dual-written" set, once the pattern is proven)
5. Everything else, grouped by feature area (GlowGroups, Prayer, Live, Institution, Territory)

Per entity: swap the specific `base44.entities.X.list/filter/create` calls for
`supabase.from('table').select/insert`, behind a feature flag if one doesn't already exist,
so a single entity can be rolled back independently.

## Phase 5 — Write cutover + stop dual-write

Once reads are confirmed correct and stable for an entity, switch writes to go directly to
Supabase and delete the corresponding `dualWriteSupabase()` / `mirrorToSupabase()` call for
that table. Base44 stops being touched for that entity entirely.

## Phase 6 — Decommission

Once every entity has moved through Phases 4–5, Base44's entities/auth/functions are no
longer load-bearing. What's left to decide: keep Base44 for hosting only (cheapest,
mid-risk), or move hosting too (own deploy pipeline, full independence).

---

## Where Next.js fits

Only after Phase 4 is meaningfully underway (a few entities live on Supabase reads) does
"what frontend framework" become a real, low-risk decision — at that point you're choosing
a frontend against a backend you already own, not against a black box. Vite/React (current)
works fine against Supabase indefinitely; Next.js would mainly buy you SSR/SEO for public
pages (Feed previews, Impact, About) and its own file-based routing, at the cost of
rewriting all 123 files currently on `react-router-dom`. Reasonable to defer this decision
entirely until Phase 4 is done.

---

## Immediate next steps (this week, low-risk, no auth migration needed)

1. Lock down RLS on the `glow_drops` table specifically — closes the open anon-write gap
   today, independent of everything else.
2. Write the real Phase 0 DDL for the 5–6 entities in the Phase 4 cutover order above,
   instead of all 66 at once.
3. Install `@supabase/supabase-js` and replace the raw `fetch()` calls in
   `supabaseGlowDrops.js` / `dualWriteSupabase.js` with the typed client — same behavior,
   better foundation for Phase 4.
