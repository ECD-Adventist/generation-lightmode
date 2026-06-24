import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const ENTITY_NAMES = [
  "User", "GlowDrop", "GlowDropLike", "GlowDropComment", "SavedDrop", "ReportedDrop", "ReportedComment", "Follow", "Notification",
  "Story", "StoryReaction", "StoryView", "GlowGroup", "GlowGroupMember", "GlowGroupJoinRequest", "GlowGroupMessage", "GlowGroupMessageReaction",
  "GlowGroupEvent", "GlowGroupEventRSVP", "GlowGroupResource", "GroupDevotional", "GroupDevotionalRead", "GroupSession", "GroupSessionMessage",
  "GroupSessionSignal", "Challenge", "ChallengeSubmission", "UserDailyChallenge", "PrayerRequest", "PrayerSupport", "PrayerComment", "StudyPlan",
  "GroupStudyPlan", "UserStudyProgress", "Certificate", "Badge", "CodeOfTruth", "CodeEngagement", "DailyCode", "DevotionEntry", "DirectConversation",
  "DirectMessage", "LiveSession", "LiveSignal", "LiveComment", "LiveReaction", "Institution", "InstitutionPage", "InstitutionApplication", "ComplianceAudit",
  "TerritoryMemberClaim", "TerritoryPhoto", "TerritoryPhotoReaction", "TerritoryLeaderboard", "TerritoryAlert", "CountryStats", "AdminLog", "AdminPermission",
  "AssistantKnowledge", "CommunityMoment", "ScheduledPost", "Kit100Settings", "LeaderboardSeason", "ManagedLeaderAccount", "BlockedUser", "PerformanceReport"
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

const resolveSupabaseUrl = () => {
  const databaseUrl = Deno.env.get('SUPABASE_DATABASE_URL') || '';
  const match = databaseUrl.match(/postgres\.([a-z0-9]+)@|\/\/[^@]*@(?:db\.)?([a-z0-9]+)\.supabase\.co/i);
  const projectRef = match?.[1] || match?.[2];
  if (!projectRef) return 'https://asnsthgubpeptoiexajf.supabase.co';
  return `https://${projectRef}.supabase.co`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const listWithRetry = async (entity, sort, limit, offset) => {
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await entity.list(sort, limit, offset);
    } catch (error) {
      lastError = error;
      const message = String(error?.message || '');
      if (!message.includes('Rate limit') && !message.includes('429')) throw error;
      await sleep(800 * (attempt + 1));
    }
  }
  throw lastError;
};

const readAllRecords = async (entity) => {
  const pageSize = 500;
  let offset = 0;
  const records = [];
  while (true) {
    const batch = await listWithRetry(entity, '-created_date', pageSize, offset);
    const rows = Array.isArray(batch) ? batch : [];
    records.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
    if (offset > 500000) break;
    await sleep(150);
  }
  return records;
};

const cleanRecord = (record, allowedColumns) => {
  const row = {};
  for (const key of allowedColumns) {
    const value = record?.[key];
    row[key] = value === undefined ? null : (value && typeof value === 'object' ? JSON.stringify(value) : value);
  }
  return row;
};

const fetchTableColumns = async ({ supabaseUrl, serviceKey }) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!response.ok) throw new Error(`Could not read Supabase schema: ${response.status}`);
  const openApi = await response.json();
  const schemas = openApi?.definitions || openApi?.components?.schemas || {};
  const map = new Map();
  for (const [tableName, schema] of Object.entries(schemas)) {
    const properties = schema?.properties || {};
    map.set(tableName, Object.keys(properties));
  }
  return map;
};

const upsertRows = async ({ supabaseUrl, serviceKey, tableName, rows }) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${response.status} ${details.slice(0, 300)}`);
  }
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
    const supabaseUrl = resolveSupabaseUrl();
    const payload = await req.json().catch(() => ({}));
    const requestedEntities = Array.isArray(payload.entity_names) && payload.entity_names.length > 0
      ? payload.entity_names.filter((name) => ENTITY_NAMES.includes(name))
      : ENTITY_NAMES;
    const batchSize = Math.max(1, Math.min(Number.parseInt(payload.batch_size, 10) || 200, 500));
    const columnsByTable = await fetchTableColumns({ supabaseUrl, serviceKey });

    const results = [];
    for (const entityName of requestedEntities) {
      const entity = base44.asServiceRole.entities[entityName];
      const tableName = normalizeTableName(entityName);
      if (!entity) {
        results.push({ entity_name: entityName, table_name: tableName, row_count: 0, synced_rows: 0, status: 'skipped', error: 'Entity not available' });
        continue;
      }
      const records = await readAllRecords(entity);
      const allowedColumns = columnsByTable.get(tableName);
      let syncedRows = 0;
      let error = null;
      try {
        if (!allowedColumns || allowedColumns.length === 0) throw new Error('Table is missing in Supabase');
        for (let i = 0; i < records.length; i += batchSize) {
          const rows = records.slice(i, i + batchSize).map((record) => cleanRecord(record, allowedColumns));
          if (rows.length > 0) await upsertRows({ supabaseUrl, serviceKey, tableName, rows });
          syncedRows += rows.length;
        }
      } catch (err) {
        error = err.message;
      }
      results.push({
        entity_name: entityName,
        table_name: tableName,
        row_count: records.length,
        synced_rows: syncedRows,
        status: error ? 'failed' : 'synced',
        error,
      });
    }

    const failed = results.filter((item) => item.error);
    return Response.json({
      success: failed.length === 0,
      supabase_url: supabaseUrl,
      entity_count: results.length,
      synced_rows: results.reduce((sum, item) => sum + item.synced_rows, 0),
      failed_count: failed.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});