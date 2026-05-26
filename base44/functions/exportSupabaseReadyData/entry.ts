import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ENTITY_NAMES = [
  "User",
  "GlowDrop",
  "GlowDropLike",
  "GlowDropComment",
  "SavedDrop",
  "ReportedDrop",
  "ReportedComment",
  "Follow",
  "Notification",
  "Story",
  "StoryReaction",
  "StoryView",
  "GlowGroup",
  "GlowGroupMember",
  "GlowGroupJoinRequest",
  "GlowGroupMessage",
  "GlowGroupMessageReaction",
  "GlowGroupEvent",
  "GlowGroupEventRSVP",
  "GlowGroupResource",
  "GroupDevotional",
  "GroupDevotionalRead",
  "GroupSession",
  "GroupSessionMessage",
  "GroupSessionSignal",
  "Challenge",
  "ChallengeSubmission",
  "UserDailyChallenge",
  "PrayerRequest",
  "PrayerSupport",
  "PrayerComment",
  "StudyPlan",
  "GroupStudyPlan",
  "UserStudyProgress",
  "Certificate",
  "Badge",
  "CodeOfTruth",
  "CodeEngagement",
  "DailyCode",
  "DevotionEntry",
  "DirectConversation",
  "DirectMessage",
  "LiveSession",
  "LiveSignal",
  "LiveComment",
  "LiveReaction",
  "Institution",
  "InstitutionPage",
  "InstitutionApplication",
  "ComplianceAudit",
  "TerritoryMemberClaim",
  "TerritoryPhoto",
  "TerritoryPhotoReaction",
  "TerritoryLeaderboard",
  "TerritoryAlert",
  "CountryStats",
  "AdminLog",
  "AdminPermission",
  "AssistantKnowledge",
  "CommunityMoment",
  "ScheduledPost",
  "Kit100Settings",
  "LeaderboardSeason",
  "ManagedLeaderAccount",
  "BlockedUser"
];

const toSnakeCase = (value) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .toLowerCase();

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (records) => {
  const columns = Array.from(records.reduce((set, record) => {
    Object.keys(record || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));

  if (columns.length === 0) return '';
  return [
    columns.map(csvEscape).join(','),
    ...records.map((record) => columns.map((column) => csvEscape(record?.[column])).join(','))
  ].join('\n');
};

const readEntityRecords = async (base44, entityName) => {
  const entity = base44.asServiceRole.entities[entityName];
  if (!entity) return { records: [], error: `Entity ${entityName} is not available in this app.` };

  const records = await entity.list('-created_date', 10000);
  return { records: Array.isArray(records) ? records : [], error: null };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const format = payload.format === 'csv' ? 'csv' : 'json';
    const requestedEntities = Array.isArray(payload.entity_names) && payload.entity_names.length > 0
      ? payload.entity_names.filter((name) => ENTITY_NAMES.includes(name))
      : ENTITY_NAMES;

    const files = [];
    const manifest = {
      exported_at: new Date().toISOString(),
      source: 'Base44',
      target: 'Supabase',
      format,
      entities: []
    };

    for (const entityName of requestedEntities) {
      const { records, error } = await readEntityRecords(base44, entityName);
      const tableName = toSnakeCase(entityName);

      manifest.entities.push({
        entity_name: entityName,
        suggested_table_name: tableName,
        row_count: records.length,
        error
      });

      if (format === 'csv') {
        files.push({
          filename: `${tableName}.csv`,
          mime_type: 'text/csv',
          entity_name: entityName,
          table_name: tableName,
          row_count: records.length,
          content: toCsv(records)
        });
      } else {
        files.push({
          filename: `${tableName}.json`,
          mime_type: 'application/json',
          entity_name: entityName,
          table_name: tableName,
          row_count: records.length,
          content: JSON.stringify({ table_name: tableName, entity_name: entityName, records }, null, 2)
        });
      }
    }

    files.unshift({
      filename: 'supabase_migration_manifest.json',
      mime_type: 'application/json',
      entity_name: 'Manifest',
      table_name: 'manifest',
      row_count: manifest.entities.length,
      content: JSON.stringify(manifest, null, 2)
    });

    return Response.json({ files, manifest });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});