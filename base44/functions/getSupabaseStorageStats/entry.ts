import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const accessToken = Deno.env.get('SUPABASE_ACCESS_TOKEN');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!accessToken || !serviceRoleKey) {
      return Response.json({ error: 'Supabase credentials are not configured' }, { status: 500 });
    }

    const projectRef = (Deno.env.get('SUPABASE_URL') || '').match(/([a-z0-9]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
      return Response.json({ error: 'SUPABASE_URL is not configured' }, { status: 500 });
    }
    const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const tableSql = `SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::text)) AS size, pg_total_relation_size(quote_ident(table_name)::text) AS bytes, (xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) AS c FROM public.%I', table_name), false, true, '')))[1]::text::int AS row_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY bytes DESC`;
    const totalSql = `SELECT pg_size_pretty(pg_database_size(current_database())) AS total_db_size, pg_database_size(current_database()) AS total_bytes`;

    const [tablesResponse, totalResponse] = await Promise.all([
      fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ query: tableSql }) }),
      fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ query: totalSql }) }),
    ]);

    if (!tablesResponse.ok || !totalResponse.ok) {
      const details = !tablesResponse.ok ? await tablesResponse.text() : await totalResponse.text();
      return Response.json({ error: `Supabase query failed: ${details}` }, { status: 502 });
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

    return Response.json({
      total_size: total?.total_db_size || '0 bytes',
      total_bytes: Number(total?.total_bytes || 0),
      table_count: tables.length,
      total_rows: tables.reduce((sum, table) => sum + table.row_count, 0),
      tables,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});