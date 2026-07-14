import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import postgres from 'npm:postgres@3.4.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const databaseUrl = Deno.env.get('SUPABASE_DATABASE_URL');
    if (!databaseUrl) return Response.json({ error: 'No database URL' }, { status: 500 });

    const parsed = new URL(databaseUrl);
    const projectRef = parsed.hostname.match(/([a-z0-9]+)\.supabase\.co/)?.[1] || 'asnsthgubpeptoiexajf';

    // Try pooler on port 6543 (transaction mode - recommended for serverless)
    const poolerUrl6543 = `postgresql://postgres.${projectRef}:${parsed.password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
    // Try direct connection
    const directUrl = `postgresql://${parsed.username}:${parsed.password}@db.${projectRef}.supabase.co:5432/postgres`;

    const results = [];

    // Test 1: Pooler port 6543
    try {
      const sql = postgres(poolerUrl6543, { ssl: 'require', max: 1, prepare: false, connect_timeout: 10 });
      const rows = await Promise.race([
        sql`select 1 as ok`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 15s')), 15000))
      ]);
      await sql.end({ timeout: 3 });
      results.push({ test: 'pooler:6543', status: 'ok', rows });
    } catch (e) {
      results.push({ test: 'pooler:6543', status: 'failed', error: e.message });
    }

    // Test 2: Direct connection
    try {
      const sql = postgres(directUrl, { ssl: 'require', max: 1, prepare: false, connect_timeout: 10 });
      const rows = await Promise.race([
        sql`select 1 as ok`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 15s')), 15000))
      ]);
      await sql.end({ timeout: 3 });
      results.push({ test: 'direct:5432', status: 'ok', rows });
    } catch (e) {
      results.push({ test: 'direct:5432', status: 'failed', error: e.message });
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});