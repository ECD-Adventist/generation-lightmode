import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const ENTITY_NAMES = [
  "User", "GlowDrop", "GlowDropLike", "GlowDropComment", "SavedDrop", "ReportedDrop", "ReportedComment", "Follow", "Notification",
  "Story", "StoryReaction", "StoryView", "GlowGroup", "GlowGroupMember", "GlowGroupJoinRequest", "GlowGroupMessage", "GlowGroupMessageReaction",
  "GlowGroupEvent", "GlowGroupEventRSVP", "GlowGroupResource", "GroupDevotional", "GroupDevotionalRead", "GroupSession", "GroupSessionMessage",
  "GroupSessionSignal", "Challenge", "ChallengeSubmission", "UserDailyChallenge", "PrayerRequest", "PrayerSupport", "PrayerComment", "StudyPlan",
  "GroupStudyPlan", "UserStudyProgress", "Certificate", "Badge", "CodeOfTruth", "CodeEngagement", "DailyCode", "DevotionEntry", "DirectConversation",
  "DirectMessage", "LiveSession", "LiveSignal", "LiveComment", "LiveReaction", "Institution", "InstitutionPage", "InstitutionApplication", "ComplianceAudit",
  "TerritoryMemberClaim", "TerritoryPhoto", "TerritoryPhotoReaction", "TerritoryLeaderboard", "TerritoryAlert", "CountryStats", "AdminLog", "AdminPermission",
  "AssistantKnowledge", "CommunityMoment", "ScheduledPost", "Kit100Settings", "LeaderboardSeason", "ManagedLeaderAccount", "BlockedUser", "PerformanceReport", "UserMilestone"
];

const toSnakeCase = (value) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .toLowerCase();

const normalizeTableName = (entityName) => {
  if (entityName === 'User') return 'app_users';
  const snake = toSnakeCase(entityName);
  if (snake.endsWith('y')) return `${snake.slice(0, -1)}ies`;
  if (snake.endsWith('s')) return snake;
  return `${snake}s`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' }, { status: 500 });

    const databaseUrl = Deno.env.get('SUPABASE_DATABASE_URL') || '';
    const match = databaseUrl.match(/postgres\.([a-z0-9]+)@|\/\/[^@]*@(?:db\.)?([a-z0-9]+)\.supabase\.co/i);
    const projectRef = match?.[1] || match?.[2];
    const supabaseUrl = projectRef ? `https://${projectRef}.supabase.co` : (Deno.env.get('SUPABASE_URL') || '');

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!response.ok) {
      return Response.json({ error: `Schema fetch failed: ${response.status}` }, { status: 500 });
    }
    const openApi = await response.json();
    const schemas = openApi?.definitions || openApi?.components?.schemas || {};
    const existingTables = new Set(Object.keys(schemas));

    const expected = ENTITY_NAMES.map((name) => ({
      entity: name,
      table: normalizeTableName(name),
      exists: existingTables.has(normalizeTableName(name)),
    }));

    const missing = expected.filter((e) => !e.exists);
    const present = expected.filter((e) => e.exists);

    return Response.json({
      supabase_url: supabaseUrl,
      total_expected: expected.length,
      tables_present: present.length,
      tables_missing: missing.length,
      missing_tables: missing.map((m) => m.table),
      present_tables: present.map((p) => p.table),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});