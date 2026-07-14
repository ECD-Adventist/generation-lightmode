import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { Client } from 'npm:pg@8.13.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const databaseUrl = Deno.env.get('SUPABASE_DATABASE_URL');
    if (!databaseUrl) return Response.json({ error: 'No database URL' }, { status: 500 });

    const parsed = new URL(databaseUrl);
    const projectRef = parsed.hostname.match(/([a-z0-9]+)\.supabase\.co/)?.[1] || 'asnsthgubpeptoiexajf';

    // Try pooler connection via pg (node-postgres)
    const poolerUrl = `postgresql://postgres.${projectRef}:${parsed.password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`;

    const client = new Client({
      connectionString: poolerUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      const result = await client.query('SELECT 1 as ok');
      await client.end();
      return Response.json({ success: true, test: 'pg:pooler:6543', rows: result.rows });
    } catch (e) {
      try { await client.end(); } catch {}
      
      // Try direct connection
      const directUrl = `postgresql://${parsed.username}:${parsed.password}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
      const client2 = new Client({
        connectionString: directUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      try {
        await client2.connect();
        const result2 = await client2.query('SELECT 1 as ok');
        await client2.end();
        return Response.json({ success: true, test: 'pg:direct:5432', rows: result2.rows });
      } catch (e2) {
        try { await client2.end(); } catch {}
        return Response.json({
          success: false,
          pooler_error: e.message,
          direct_error: e2.message,
        });
      }
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});