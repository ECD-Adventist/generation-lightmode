import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied, logSecurityEvent } from '../../shared/securityEvents.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;
    const validated = await readValidatedJson(req, {}, { allowEmpty: true });
    if (validated.response) return validated.response;
    if (!['admin', 'super_admin'].includes(user.role)) {
      await logPermissionDenied(base44, req, user, 'supabase_storage_stats', 'read');
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', { headers });
    if (!projectsResponse.ok) {
      return Response.json({ error: 'Unable to access the connected Supabase project' }, { status: 502 });
    }

    const projects = await projectsResponse.json();
    const configuredRef = String(secrets.get('SUPABASE_URL') || '').match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
    const projectList = Array.isArray(projects) ? projects : [];
    const project = projectList.find((item) => item.ref === configuredRef)
      || (projectList.length === 1 ? projectList[0] : null);
    if (!project?.ref) return Response.json({ error: 'Connected Supabase project could not be identified' }, { status: 502 });

    const endpoint = `https://api.supabase.com/v1/projects/${project.ref}/database/query/read-only`;
    const backupsEndpoint = `https://api.supabase.com/v1/projects/${project.ref}/database/backups`;
    const tableSql = `SELECT table_name, pg_size_pretty(pg_total_relation_size(format('%I.%I', table_schema, table_name))) AS size, pg_total_relation_size(format('%I.%I', table_schema, table_name)) AS bytes, (xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint AS row_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY bytes DESC`;
    const totalSql = `SELECT pg_size_pretty(pg_database_size(current_database())) AS total_db_size, pg_database_size(current_database()) AS total_bytes`;
    const [tablesResponse, totalResponse, backupsResponse] = await Promise.all([
      fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ query: tableSql }) }),
      fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ query: totalSql }) }),
      fetch(backupsEndpoint, { headers }),
    ]);
    if (!tablesResponse.ok || !totalResponse.ok) {
      const details = !tablesResponse.ok ? await tablesResponse.text() : await totalResponse.text();
      console.error('Supabase storage query failed:', details);
      return Response.json({ error: 'Unable to query Supabase storage statistics' }, { status: 502 });
    }

    const tablesResult = await tablesResponse.json();
    const totalResult = await totalResponse.json();
    const tables = (Array.isArray(tablesResult) ? tablesResult : []).map((table) => ({
      table_name: table.table_name,
      size: table.size,
      bytes: Number(table.bytes || 0),
      row_count: Number(table.row_count || 0),
    }));
    const total = Array.isArray(totalResult) ? totalResult[0] : null;

    let latestBackupAt = null;
    if (backupsResponse.ok) {
      const payload = await backupsResponse.json();
      const backups = Array.isArray(payload) ? payload : (payload.backups || []);
      latestBackupAt = backups
        .map((backup) => backup.inserted_at || backup.created_at || backup.completed_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
    }
    const backupAgeHours = latestBackupAt ? (Date.now() - new Date(latestBackupAt).getTime()) / 3_600_000 : null;
    const backupHealthy = backupAgeHours !== null && backupAgeHours <= 24;

    if (!backupHealthy) {
      const recentAlerts = await base44.asServiceRole.entities.SecurityEvent.filter({ event_type: 'backup_health_alert' }, '-created_date', 5).catch(() => []);
      const alertedRecently = recentAlerts.some((event) => Date.now() - new Date(event.occurred_at || event.created_date).getTime() < 86_400_000);
      if (!alertedRecently) {
        const adminEmail = secrets.get('ADMIN_EMAIL');
        if (adminEmail) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: adminEmail,
            subject: 'Backup health alert',
            body: latestBackupAt
              ? `The latest detected Supabase backup is older than 24 hours (${latestBackupAt}).`
              : 'No Supabase backup timestamp could be detected. Please verify the project backup schedule.',
          }).catch((error) => console.error('Backup alert email failed:', error?.message));
        }
        await logSecurityEvent(base44, req, {
          event_type: 'backup_health_alert', severity: 'critical', user_id: user.id,
          resource: 'supabase_backups', action: 'health_check',
          details: latestBackupAt ? `Latest backup: ${latestBackupAt}` : 'No backup timestamp detected',
        });
      }
    }

    await logAdminAction(base44, req, user, 'supabase_storage_stats', 'read');
    return Response.json({
      total_size: total?.total_db_size || '0 bytes',
      total_bytes: Number(total?.total_bytes || 0),
      table_count: tables.length,
      total_rows: tables.reduce((sum, table) => sum + table.row_count, 0),
      backup_health: {
        healthy: backupHealthy,
        latest_backup_at: latestBackupAt,
        age_hours: backupAgeHours === null ? null : Math.round(backupAgeHours * 10) / 10,
        api_available: backupsResponse.ok,
      },
      tables,
    });
  } catch (error) {
    console.error('getSupabaseStorageStats failed:', error?.message);
    return Response.json({ error: 'Unable to load storage statistics' }, { status: 500 });
  }
}