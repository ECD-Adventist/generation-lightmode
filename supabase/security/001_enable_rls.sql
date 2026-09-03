-- Generation LightMode — Supabase lockdown
-- Generated 3 Sep 2026 from base44/entities. Run in the Supabase SQL editor as the owner.
-- Effect: every mirrored table gets Row Level Security with NO policies for anon/authenticated,
-- so the public anon key can no longer read or write anything. The service_role key used by
-- the Base44 backend functions bypasses RLS and keeps working unchanged.
-- Tables that do not exist yet are skipped (DO block), so this is safe to re-run.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_logs',
    'admin_permissions',
    'anonymous_glow_drop_likes',
    'api_rate_limits',
    'assistant_knowledges',
    'badges',
    'blocked_users',
    'certificates',
    'challenges',
    'challenge_submissions',
    'code_engagements',
    'code_of_truths',
    'community_moments',
    'compliance_audits',
    'content_engagements',
    'country_stats',
    'daily_codes',
    'devotion_entries',
    'digital_contents',
    'direct_conversations',
    'direct_messages',
    'follows',
    'gen_lux_alerts',
    'gen_lux_keywords',
    'gen_lux_mentions',
    'glow_drops',
    'glow_drop_comments',
    'glow_drop_likes',
    'glow_groups',
    'glow_group_events',
    'glow_group_event_rsvps',
    'glow_group_join_requests',
    'glow_group_members',
    'glow_group_messages',
    'glow_group_message_reactions',
    'glow_group_resources',
    'group_devotionals',
    'group_devotional_reads',
    'group_sessions',
    'group_session_messages',
    'group_session_signals',
    'group_study_plans',
    'institutions',
    'institution_applications',
    'institution_pages',
    'kit100_settings',
    'leaderboard_seasons',
    'live_comments',
    'live_reactions',
    'live_sessions',
    'live_signals',
    'managed_leader_accounts',
    'music_tracks',
    'notifications',
    'performance_reports',
    'prayer_comments',
    'prayer_requests',
    'prayer_supports',
    'reported_comments',
    'reported_drops',
    'reposts',
    'saved_drops',
    'scheduled_posts',
    'security_events',
    'stories',
    'story_reactions',
    'story_views',
    'study_plans',
    'territory_alerts',
    'territory_leaderboards',
    'territory_member_claims',
    'territory_photos',
    'territory_photo_reactions',
    'app_users',
    'user_daily_challenges',
    'user_milestones',
    'user_study_progress'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

-- Also stop the anon role from creating anything new in the public schema.
REVOKE CREATE ON SCHEMA public FROM anon, authenticated;

-- Verify: every row should show rowsecurity = true.
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- OPTIONAL (only if you later want a public, email-free feed straight from Supabase):
-- CREATE VIEW public.glow_drops_public AS
--   SELECT id, verse, reflection, category, media_url, hashtags, likes_count, created_date
--   FROM public.glow_drops WHERE hidden = false AND status = 'approved';
-- GRANT SELECT ON public.glow_drops_public TO anon;
