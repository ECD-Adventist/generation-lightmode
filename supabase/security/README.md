# Supabase security lockdown

The app mirrors Base44 data into Supabase. Until this script runs, the project's public
anon key (which every browser bundle used to contain) can read and write the mirrored
tables. `001_enable_rls.sql` turns on Row Level Security on every mirrored table and
revokes the anon/authenticated roles, so only the server-side service key can touch data.

## Apply (5 minutes)

1. Supabase dashboard → SQL Editor → New query.
2. Paste the contents of `001_enable_rls.sql` and Run. It is idempotent.
3. Check the final SELECT: every table must show `rowsecurity = true`.
4. Project Settings → API → **Regenerate** the `anon` key (old builds cached the previous one).
   The app no longer needs the anon key at all, so nothing has to be updated.
5. Confirm from a terminal that anon reads now fail:

```bash
curl -s -H "apikey: <new anon key>" "https://asnsthgubpeptoiexajf.supabase.co/rest/v1/glow_drops?select=id&limit=1"
```

Expected: an empty array or a permission error, never rows.

## Why the app keeps working

All writes go through Base44 functions (`dualWriteSupabase`, `submitPrayerRequest`,
`migrateBase44ToSupabase`, …) that use `SUPABASE_SERVICE_ROLE_KEY` from the server
secrets. `service_role` bypasses RLS. The browser never talks to Supabase.
