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

const jsonSchemaToSqlType = (prop) => {
  if (!prop) return 'text';
  if (prop.type === 'boolean') return 'boolean';
  if (prop.type === 'number' || prop.type === 'integer') return 'numeric';
  if (prop.type === 'array' || prop.type === 'object') return 'jsonb';
  if (prop.format === 'date-time') return 'timestamptz';
  if (prop.format === 'date') return 'date';
  return 'text';
};

const inferTypeFromValue = (value) => {
  if (value === null || value === undefined) return 'text';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number' && Number.isFinite(value)) return 'numeric';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return 'timestamptz';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
  if (typeof value === 'object') return 'jsonb';
  return 'text';
};

const generateTableDDL = (entityName, sampleRecord) => {
  const tableName = normalizeTableName(entityName);

  // Always include built-in columns
  const allColumns = [
    { name: 'id', type: 'text', pk: true },
    { name: 'created_date', type: 'timestamptz' },
    { name: 'updated_date', type: 'timestamptz' },
    { name: 'created_by_id', type: 'text' },
  ];

  const record = sampleRecord || {};
  for (const key of Object.keys(record)) {
    if (['id', 'created_date', 'updated_date', 'created_by_id'].includes(key)) continue;
    allColumns.push({ name: key, type: inferTypeFromValue(record[key]) });
  }

  const columnDefs = allColumns.map(col => {
    const def = `"${col.name}" ${col.type}`;
    return col.pk ? `${def} primary key` : def;
  }).join(',\n  ');

  return `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n  ${columnDefs}\n);`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const batchIndex = Math.max(0, Number.parseInt(payload.batch_index, 10) || 0);
    const batchSize = Math.max(1, Math.min(Number.parseInt(payload.batch_size, 10) || 10, 20));
    const startIdx = batchIndex * batchSize;
    const endIdx = startIdx + batchSize;
    const batchEntities = ENTITY_NAMES.slice(startIdx, endIdx);
    const requestedEntities = Array.isArray(payload.entity_names) && payload.entity_names.length > 0
      ? payload.entity_names.filter((name) => ENTITY_NAMES.includes(name))
      : batchEntities;

    const sqlParts = [
      '-- Generation LightMode: Supabase Table DDL',
      `-- Generated at ${new Date().toISOString()}`,
      '-- Run this in the Supabase SQL Editor to create all tables',
      'set check_function_bodies = off;',
      '',
    ];

    const manifest = [];

    for (const entityName of requestedEntities) {
      const entity = base44.asServiceRole.entities[entityName];
      if (!entity) {
        manifest.push({ entity: entityName, table: normalizeTableName(entityName), status: 'skipped', error: 'Entity not available' });
        continue;
      }

      let sampleRecord = null;
      try {
        const records = await entity.list('-created_date', 1, 0);
        sampleRecord = Array.isArray(records) && records.length > 0 ? records[0] : null;
      } catch (e) {
        // Continue with null sample - table will be created with built-in columns only
      }

      const ddl = generateTableDDL(entityName, sampleRecord);
      sqlParts.push(`-- Table: ${entityName}`);
      sqlParts.push(ddl);
      sqlParts.push('');
      manifest.push({ entity: entityName, table: normalizeTableName(entityName), status: 'ddl_generated' });
    }

    // Add RLS policies (enable RLS on all tables, allow service_role to bypass)
    sqlParts.push('-- Enable Row Level Security');
    sqlParts.push('-- (service_role bypasses RLS automatically)');

    for (const item of manifest) {
      if (item.status === 'ddl_generated') {
        sqlParts.push(`ALTER TABLE public."${item.table}" ENABLE ROW LEVEL SECURITY;`);
      }
    }

    const fullSql = sqlParts.join('\n');

    if (payload.return_sql === false) {
      return Response.json({ manifest, sql_length: fullSql.length });
    }

    return Response.json({
      manifest,
      sql: fullSql,
      sql_length: fullSql.length,
      table_count: manifest.filter(m => m.status === 'ddl_generated').length,
      batch_index: batchIndex,
      batch_size: batchSize,
      has_more: endIdx < ENTITY_NAMES.length,
      total_entities: ENTITY_NAMES.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});