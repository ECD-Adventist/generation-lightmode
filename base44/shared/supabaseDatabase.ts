import { Client } from 'npm:pg@8.13.1';

export async function connectSupabaseDatabase(base44, savedUrl) {
  const parsed = new URL(savedUrl);
  const urlText = `${parsed.hostname}${parsed.username}`;
  const projectRef = urlText.match(/(?:db\.)?([a-z0-9]+)\.supabase\.co|postgres\.([a-z0-9]+)/i)?.[1]
    || urlText.match(/postgres\.([a-z0-9]+)/i)?.[1];
  let connectionString = savedUrl;
  if (projectRef) {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const response = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
    const projects = await response.json();
    const project = Array.isArray(projects) ? projects.find(item => item.ref === projectRef) : null;
    if (project?.region) {
      connectionString = `postgresql://postgres.${projectRef}:${parsed.password}@aws-0-${project.region}.pooler.supabase.com:6543/postgres?sslmode=require`;
    }
  }
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    statement_timeout: 10000,
  });
  await client.connect();
  return client;
}