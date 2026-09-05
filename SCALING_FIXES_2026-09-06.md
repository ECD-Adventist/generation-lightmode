# Scaling fixes — the six query patterns (6 Sep 2026)

Commits `3602440` (the six fixes) and `a7151b9` (fixes from a ten-angle code review of the first
commit), both on `main`. This document is the feedback report, the scope statement, the
verification record and the manual test plan.

## Scope statement

Only the six items were worked on, plus the defects the review found in that work. Nothing else was
touched. Files changed: 30 in the first commit, 27 in the second, all listed in `git show --stat`.
Two pre-existing bugs adjacent to the work were fixed because the fix would otherwise not take
effect: PrayerMatcher wrote conversations with the wrong field names (so its chats never appeared
in Messages), and the "Repair Follow Records on Change" workflow ran a full scan of every User and
Follow row on every single follow — it would have undone fix 4 on every click.

## What changed, per item

| # | Problem | Fix | Where |
| --- | --- | --- | --- |
| 1 | Profile loaded every follower row into the phone | New `getConnections` function: counts cached on the record (`followers_count`, `following_count`, `counts_updated_at`, recounted every 6 h), first 50 of each list, and the viewer's own rows for the people on screen via one `$in` query. Profile drops capped at 200, likes 1,000, saves 500. Headers show real counts; the connections modal says "showing 50 of N". | `base44/functions/getConnections`, `src/pages/Profile.jsx`, `MobileProfile`, `MobileInstitutionProfile`, `ExecutiveProfileHeader`, `ProfileConnectionsModal`, `src/lib/follows.js` |
| 2 | Signup wrote one Follow row per leader per user | Leader accounts and the official account are followed implicitly: their posts pass the Following filter and show no Follow button; leader profiles read as Following. The signup workflow file is deleted and its function is a no-op in case the trigger lingers. | `Feed.jsx`, `DropCard.jsx`, `MobileDropCard.jsx`, `Profile.jsx`, `base44/functions/followAllLeadersOnSignup`, `base44/workflows/` |
| 3 | 31 table-wide realtime subscriptions | 14 remain, every one scoped to an open chat, group session or live room. Layout, Feed, Notifications, Prayer Wall, Live, the Messages list, GroupChat side data and the admin panels poll (30–60 s). Layout toasts notifications that arrive between polls. Messages keeps realtime only for the open conversation. | `Layout.jsx`, `Feed.jsx`, `Notifications.jsx`, `PrayerWall.jsx`, `Live.jsx`, `Messages.jsx`, `GroupChat.jsx`, admin panels |
| 4 | Rate limiter did 3–4 database operations per call | In-memory fixed-window counter (zero database work). The ledger is only written for guest traffic, sampled 1-in-5 and as a delta so it never over-counts. Trade-off (per-function, per-isolate) documented in the file. | `base44/shared/apiSecurity.ts` |
| 5 | Messages ran one query per conversation | Lists render the stored `last_message`; PrayerMatcher now maintains it (and uses the right participant fields). | `ConversationsList.jsx`, `MobileMessagesList.jsx`, `PrayerMatcher.jsx` |
| 6 | Feed fired 10 queries + 5 calls; Profile 19 | One `getFeedViewerState` call (likes ≤1,000, saves ≤500, following ≤1,000) replaces four queries and only refetches on the viewer's own actions; the unread badge shares Layout's polled query. Every follow/unfollow in the app goes through the new `manageFollow` function with an explicit action. GlowFeed, DailyTruthFeed and Discover load-everything loops bounded. | `base44/functions/getFeedViewerState`, `manageFollow`, `Feed.jsx`, `Post.jsx`, `GlowGroups.jsx`, `Notifications.jsx`, `GlowFeed.jsx`, `DailyTruthFeed.jsx`, `Discover.jsx` |

## Verification record

| Check | Result |
| --- | --- |
| ESLint on every touched file (all rules except the repo's pre-existing unused-import noise, which I left untouched in files I did not otherwise change) | clean |
| Unused imports introduced by my edits | none (each removed; pre-existing ones left alone on purpose) |
| TypeScript syntax (esbuild) on the 6 new/changed Deno functions and `apiSecurity.ts` | clean |
| Entity and workflow JSON validity | clean |
| `vite build` | succeeds, 178 assets |
| Table-wide `subscribe()` calls | 31 → 14, all room-scoped |
| Ten-angle code review of the first commit (line-by-line, removed behaviour, cross-file, language pitfalls, wrapper correctness, reuse, simplification, efficiency, altitude, plus a gap sweep) | 20 distinct defects found, all fixed in `a7151b9` (list below) |
| Live backend after push (Base44 deploys from `main`) | `getConnections`, `manageFollow`, `getFeedViewerState`, `listPrayerRequests`, `followAllLeadersOnSignup` → 401 for anonymous calls (deployed and gated); `repairAndRecoverFollows` → 403 (scheduler/admin only) |

### What the review caught and I fixed

1. Official account id `official-generation-lightmode` failed the new UUID validation (page would show 0 followers, follow did nothing). New `record-id` format.
2. Optimistic like updates wrote to a cache signed-in users no longer read (heart went the wrong way until refetch).
3. Save/unsave did not refresh the bookmark state (could create duplicate saves).
4. Counters seeded from `undefined`, drifted on concurrent follows and on bulk paths, never recounted → fresh-only bumps and a 6-hour recount.
5. Blind "toggle" against a capped following list could unfollow someone the user meant to follow → explicit actions everywhere.
6. Polling option pasted into `invalidateQueries` in two places (join requests were neither pushed nor polled).
7. Notifications page interval landed on the wrong query.
8. Prayer supports never refreshed after the subscription was removed.
9. Guest rate-limit ledger over-counted 5× past half the limit.
10. Mobile, institution and executive profile headers showed the first-page length ("50 followers").
11. Leader posts still showed a Follow button; leader profiles read as not followed.
12. Removed subscriptions had also produced the in-session toasts → Layout toasts new notifications.
13. Offline like sync and three other pages still bypassed the new backend path.
14. "Repair Follow Records on Change" workflow ran a full User + Follow scan per follow.
15. Weekly/signup fan-out workflows still present → signup workflow deleted, official account made implicit.
16. `listPrayerRequests` did one lookup per author → batched.
17. `getConnections` phases ran serially and paged the viewer's whole following → parallel + `$in`.
18. PrayerMatcher conversation field names.
19. Anonymous calls to new functions returned 500 instead of 401.
20. Dead `fetchAllFollowing` helper and misleading comment removed.

A second, independent sweep of the finished change found six more, all fixed in the follow-up commit:

21. Layout seeded its "already seen" set from the empty default before the first fetch, so every
    cold load toasted the existing unread notifications → waits for the first real result.
22. `getConnections` never cached counts for the official account (no record to write to) and
    refused to cache anything above 20,000 → in-memory 10-minute cache for record-less targets,
    cap raised to 100,000 and capped values are cached too (`counts_exact` still tells the client).
23. Follow from Profile, Post, GlowGroups and Notifications did not refresh the feed's viewer state,
    so the feed's Follow buttons could lag up to 5 minutes → all four invalidate `feedViewerState`.
24. Leader profiles were forced to read as "Following", so the button's only action was an unfollow
    that could never change anything → the button now explains that leaders are followed
    automatically, and sends nothing.
25. "Follow back" on a notification only worked if the actor was among the 40 most recent members;
    otherwise it failed silently → looks the member up by email, and shows an error toast on failure.
26. PrayerMatcher created conversations with participants in caller order while Messages uses the
    alphabetical pair, so a prayer chat could open a second, hidden thread → same ordering, and the
    new thread gets `last_message` fields so it appears in the list.
27. The weekly "Auto-follow Generation LightMode sync" workflow (every Sunday, one Follow row per
    member) was still scheduled although the official account is now followed implicitly → removed.

## What I could not test myself, and how you can

The new backend paths need a signed-in account, and I do not have one. Base44 has already deployed
the functions; the front end reaches users when Base44 publishes the app. Please run these:

1. **Profile counts.** Open your own profile on the phone and on the web. Followers / Following must
   match on both and match the old numbers. Open the Followers list: it shows up to 50 with
   "showing 50 of N" when there are more.
2. **Follow / unfollow.** From the Feed, a Profile, a Post page, GlowGroups and a "followed you"
   notification: follow someone, then unfollow. The button flips immediately, the counts change by
   one, the other person gets a "started following you" notification once.
3. **Leader posts.** In the Feed's Following tab, posts by leader accounts and by the official
   account appear even if you never followed them, and show no Follow button.
4. **Official account page.** Follower count is non-zero; Follow / Following toggles.
5. **Likes and saves.** Like a post: the heart fills at once and the count moves by one; unlike
   reverses it. Save a post: the bookmark fills at once; tapping again removes it (no duplicates).
6. **Notifications.** Have someone message or follow you while you sit on the Feed: a toast appears
   within about a minute and the badge updates.
7. **Messages.** The conversation list shows the last message text without delay; open a
   conversation and have the other person reply: it appears live.
8. **Prayer wall.** Post, pray for a request, comment; anonymous post shows "Anonymous". Another
   person's "prayed" shows within a minute.
9. **Group chat.** New messages arrive live; a new join request appears within 30 s.
10. **Guest rate limit.** Not user-visible; nothing to test.

## Effect on capacity (revised estimate)

| Measure | Before | After these fixes |
| --- | ---: | ---: |
| Backend reads per feed open (signed in) | ~15 + 3–4 per function call | ~7 |
| Rows shipped to a phone opening a leader profile with 20k followers | 20,000+ | ≤ 150 |
| Realtime fan-out per app event | every connected client | only clients in that room |
| Database operations added by rate limiting, per function call | 3–4 | 0 (signed in), ~0.3 (guest) |
| Follow rows created per signup | one per leader (≈50) | 0 |
| Comfortable concurrent users (estimate) | ~300–500 | ~2,000–3,000 |
| Comfortable daily actives (estimate) | ~5–10k | ~30–50k |

These remain estimates until a load test runs. The next ceiling is the Base44 plan quota and the
per-page query counts on Profile (still 15+), which Phase 1 of the migration (reads on Postgres)
removes.
