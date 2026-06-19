import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import postgres from 'npm:postgres@3.4.5';

const ENTITY_NAMES = [
  "User", "GlowDrop", "GlowDropLike", "GlowDropComment", "SavedDrop", "ReportedDrop", "ReportedComment", "Follow", "Notification",
  "Story", "StoryReaction", "StoryView", "GlowGroup", "GlowGroupMember", "GlowGroupJoinRequest", "GlowGroupMessage", "GlowGroupMessageReaction",
  "GlowGroupEvent", "GlowGroupEventRSVP", "GlowGroupResource", "GroupDevotional", "GroupDevotionalRead", "GroupSession", "GroupSessionMessage",
  "GroupSessionSignal", "Challenge", "ChallengeSubmission", "UserDailyChallenge", "PrayerRequest", "PrayerSupport", "PrayerComment", "StudyPlan",
  "GroupStudyPlan", "UserStudyProgress", "Certificate", "Badge", "CodeOfTruth", "CodeEngagement", "DailyCode", "DevotionEntry", "DirectConversation",
  "DirectMessage", "LiveSession", "LiveSignal", "LiveComment", "LiveReaction", "Institution", "InstitutionPage", "InstitutionApplication", "ComplianceAudit",
  "TerritoryMemberClaim", "TerritoryPhoto", "TerritoryPhotoReaction", "TerritoryLeaderboard", "TerritoryAlert", "CountryStats", "AdminLog", "AdminPermission",
  "AssistantKnowledge", "CommunityMoment", "ScheduledPost", "Kit100Settings", "LeaderboardSeason", "ManagedLeaderAccount", "BlockedUser"
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

const inferColumnType = (values) => {
  const present = values.filter((value) => value !== null && value !== undefined && value !== '');
  if (present.length === 0) return 'text';
  if (present.every((value) => typeof value === 'boolean')) return 'boolean';
  if (present.every((value) => typeof value === 'number' && Number.isFinite(value))) return 'numeric';
  if (present.every((value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) return 'timestamptz';
  if (present.every((value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))) return 'date';
  return 'text';
};

const readAllRecords = async (entity) => {
  const pageSize = 1000;
  let offset = 0;
  const records = [];

  while (true) {
    const batch = await entity.list('-created_date', pageSize, offset);
    const rows = Array.isArray(batch) ? batch : [];
    records.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
    if (offset > 500000) break;
  }

  return records;
};

const valueForDatabase = (value, dataType) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return JSON.stringify(value);
  if (dataType === 'boolean') return Boolean(value);
  if (['numeric', 'integer', 'bigint', 'double precision', 'real'].includes(dataType)) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
  return value;
};

const resolveDatabaseUrl = async (base44, originalUrl) => {
  const parsed = new URL(originalUrl);
  const directHostMatch = parsed.hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
  if (!directHostMatch || (parsed.port && parsed.port !== '5432')) return originalUrl;

  const projectRef = directHostMatch[1];
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
  const response = await fetch('https://api.supabase.com/v1/projects', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const projects = await response.json();
  const project = Array.isArray(projects) ? projects.find((item) => item.ref === projectRef) : null;
  if (!project?.region) return originalUrl;

  const username = encodeURIComponent(`postgres.${projectRef}`);
  const password = parsed.password || '';
  const database = parsed.pathname || '/postgres';
  const search = parsed.search || '';
  return `postgresql://${username}:${password}@aws-0-${project.region}.pooler.supabase.com:6543${database}${search}`;
};

const migrateEntity = async ({ sql, base44, entityName }) => {
  const entity = base44.asServiceRole.entities[entityName];
  const tableName = normalizeTableName(entityName);

  if (!entity) {
    return { entity_name: entityName, table_name: tableName, row_count: 0, status: 'skipped', error: 'Entity not available' };
  }

  const records = await readAllRecords(entity);
  const columnSet = records.reduce((set, record) => {
    Object.keys(record || {}).forEach((key) => set.add(key));
    return set;
  }, new Set(['id', 'created_date', 'updated_date', 'created_by_id']));
  const columns = Array.from(columnSet);

  await sql`create table if not exists public.${sql(tableName)} (id text primary key)`;

  const existingColumnsRows = await sql`
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = ${tableName}
  `;
  const existingTypes = new Map(existingColumnsRows.map((row) => [row.column_name, row.data_type]));

  const typeByColumn = new Map();
  for (const column of columns) {
    const existingType = existingTypes.get(column);
    if (existingType) {
      typeByColumn.set(column, existingType);
      continue;
    }
    const inferredType = column === 'id' ? 'text' : inferColumnType(records.map((record) => record?.[column]));
    await sql`alter table public.${sql(tableName)} add column if not exists ${sql(column)} ${sql.unsafe(inferredType)}`;
    typeByColumn.set(column, inferredType);
  }

  if (records.length === 0) {
    return { entity_name: entityName, table_name: tableName, row_count: 0, status: 'created_empty_table', error: null };
  }

  const batchSize = 250;
  const updateClause = columns
    .filter((column) => column !== 'id')
    .map((column) => `"${column.replace(/"/g, '""')}" = excluded."${column.replace(/"/g, '""')}"`)
    .join(', ');

  for (let i = 0; i < records.length; i += batchSize) {
    const rows = records.slice(i, i + batchSize).map((record) => {
      const row = {};
      for (const column of columns) {
        row[column] = valueForDatabase(record?.[column], typeByColumn.get(column));
      }
      return row;
    });

    await sql`
      insert into public.${sql(tableName)} ${sql(rows, columns)}
      on conflict (id) do update set ${sql.unsafe(updateClause)}
    `;
  }

  return { entity_name: entityName, table_name: tableName, row_count: records.length, status: 'migrated', error: null };
};

Deno.serve(async (req) => {
  let sql;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const savedDatabaseUrl = Deno.env.get('SUPABASE_DATABASE_URL');
    if (!savedDatabaseUrl) return Response.json({ error: 'SUPABASE_DATABASE_URL is not set' }, { status: 500 });
    const databaseUrl = await resolveDatabaseUrl(base44, savedDatabaseUrl);

    const payload = await req.json().catch(() => ({}));
    const requestedEntities = Array.isArray(payload.entity_names) && payload.entity_names.length > 0
      ? payload.entity_names.filter((name) => ENTITY_NAMES.includes(name))
      : ENTITY_NAMES;

    if (payload.debug_connection === true) {
      const safeUrl = new URL(databaseUrl);
      return Response.json({ host: safeUrl.hostname, port: safeUrl.port, username: safeUrl.username, database: safeUrl.pathname });
    }

    sql = postgres(databaseUrl, { ssl: 'require', max: 1, prepare: false, idle_timeout: 20 });
    await sql`select 1 as ok`;

    const results = [];
    for (const entityName of requestedEntities) {
      const result = await migrateEntity({ sql, base44, entityName });
      results.push(result);
    }

    const migratedRows = results.reduce((sum, item) => sum + (item.error ? 0 : item.row_count), 0);
    const failed = results.filter((item) => item.error);

    return Response.json({
      success: failed.length === 0,
      migrated_rows: migratedRows,
      entity_count: results.length,
      failed_count: failed.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    if (sql) await sql.end({ timeout: 5 });
  }
});