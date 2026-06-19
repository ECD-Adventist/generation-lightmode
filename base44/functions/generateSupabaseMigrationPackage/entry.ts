import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

const normalizeTableName = (entityName) => {
  if (entityName === 'User') return 'app_users';
  const snake = toSnakeCase(entityName);
  if (snake.endsWith('y')) return `${snake.slice(0, -1)}ies`;
  if (snake.endsWith('s')) return snake;
  return `${snake}s`;
};

const sqlIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

const sqlLiteral = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `'${text.replace(/'/g, "''")}'`;
};

const inferColumnType = (values) => {
  const present = values.filter((value) => value !== null && value !== undefined && value !== '');
  if (present.length === 0) return 'text';
  if (present.every((value) => typeof value === 'boolean')) return 'boolean';
  if (present.every((value) => typeof value === 'number' && Number.isFinite(value))) return 'numeric';
  if (present.every((value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) return 'timestamptz';
  if (present.every((value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))) return 'date';
  return 'text';
};

const readAllRecords = async (entity, sort) => {
  const pageSize = 1000;
  let offset = 0;
  const records = [];

  while (true) {
    const batch = await entity.list(sort, pageSize, offset);
    const rows = Array.isArray(batch) ? batch : [];
    records.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
    if (offset > 200000) break;
  }

  return records;
};

const buildEntitySql = (entityName, records) => {
  const tableName = normalizeTableName(entityName);
  const columns = Array.from(records.reduce((set, record) => {
    Object.keys(record || {}).forEach((key) => set.add(key));
    return set;
  }, new Set(['id', 'created_date', 'updated_date', 'created_by_id'])));

  const columnDefinitions = columns.map((column) => {
    const type = inferColumnType(records.map((record) => record?.[column]));
    const constraint = column === 'id' ? ' primary key' : '';
    return `  ${sqlIdentifier(column)} ${type}${constraint}`;
  }).join(',\n');

  const createTable = `create table if not exists public.${sqlIdentifier(tableName)} (\n${columnDefinitions}\n);`;

  if (records.length === 0) {
    return `-- ${entityName}: 0 rows\n${createTable}\n`;
  }

  const insertRows = records.map((record) => `(${columns.map((column) => sqlLiteral(record?.[column])).join(', ')})`).join(',\n');
  const updates = columns.filter((column) => column !== 'id').map((column) => `${sqlIdentifier(column)} = excluded.${sqlIdentifier(column)}`).join(', ');
  const insert = `insert into public.${sqlIdentifier(tableName)} (${columns.map(sqlIdentifier).join(', ')})\nvalues\n${insertRows}\non conflict (${sqlIdentifier('id')}) do update set ${updates};`;

  return `-- ${entityName}: ${records.length} rows\n${createTable}\n\n${insert}\n`;
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
    const requestedEntities = Array.isArray(payload.entity_names) && payload.entity_names.length > 0
      ? payload.entity_names.filter((name) => ENTITY_NAMES.includes(name))
      : ENTITY_NAMES;

    const manifest = {
      generated_at: new Date().toISOString(),
      target: 'Supabase SQL Editor',
      instructions: 'Run each SQL file in Supabase SQL Editor, or run full_migration.sql for the full import. Existing rows with the same id are updated.',
      entities: []
    };

    const files = [];
    const sqlParts = [
      '-- Generation LightMode Supabase migration package',
      `-- Generated at ${manifest.generated_at}`,
      'set check_function_bodies = off;'
    ];

    for (const entityName of requestedEntities) {
      const entity = base44.asServiceRole.entities[entityName];
      if (!entity) {
        manifest.entities.push({ entity_name: entityName, table_name: normalizeTableName(entityName), row_count: 0, error: 'Entity not available' });
        continue;
      }

      const records = await readAllRecords(entity, '-created_date');
      const tableName = normalizeTableName(entityName);
      const sql = buildEntitySql(entityName, records);

      manifest.entities.push({ entity_name: entityName, table_name: tableName, row_count: records.length, error: null });
      files.push({ filename: `${tableName}.sql`, entity_name: entityName, table_name: tableName, row_count: records.length, content: sql });
      sqlParts.push(sql);
    }

    files.unshift({
      filename: 'migration_manifest.json',
      entity_name: 'Manifest',
      table_name: 'manifest',
      row_count: manifest.entities.length,
      content: JSON.stringify(manifest, null, 2)
    });

    files.unshift({
      filename: 'full_migration.sql',
      entity_name: 'All',
      table_name: 'all_tables',
      row_count: manifest.entities.reduce((sum, item) => sum + item.row_count, 0),
      content: sqlParts.join('\n\n')
    });

    return Response.json({ manifest, files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});