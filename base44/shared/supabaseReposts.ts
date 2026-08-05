import { secrets } from 'base44:runtime';

export async function prepareRepostStorage(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
  const projectsResponse = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!projectsResponse.ok) throw new Error('Unable to resolve Supabase project');
  const projects = await projectsResponse.json();
  const configuredUrl = secrets.get('SUPABASE_URL') || '';
  const configuredRef = configuredUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
  const project = Array.isArray(projects) ? (projects.find(item => item.ref === configuredRef) || projects[0]) : null;
  if (!project?.ref) throw new Error('Supabase project is unavailable');
  const ddlResponse = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `CREATE TABLE IF NOT EXISTS public.reposts (
      id text PRIMARY KEY,
      original_post_id text NOT NULL,
      reposter_user_id text NOT NULL,
      reposter_email text,
      reposter_name text,
      caption text,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (reposter_user_id, original_post_id)
    );
    NOTIFY pgrst, 'reload schema';` }),
  });
  if (!ddlResponse.ok) throw new Error(`Unable to prepare repost storage (${ddlResponse.status})`);
  await new Promise(resolve => setTimeout(resolve, 750));
  const serviceKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) throw new Error('Supabase persistence is not configured');
  return { restUrl: `https://${project.ref}.supabase.co/rest/v1/reposts`, serviceKey };
}

export async function insertSupabaseRepost(storage, repost) {
  const response = await fetch(storage.restUrl, {
    method: 'POST',
    headers: { apikey: storage.serviceKey, Authorization: `Bearer ${storage.serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(repost),
  });
  if (!response.ok) {
    const details = await response.text();
    const error = new Error(`Supabase repost insert failed (${response.status})`);
    error.status = response.status;
    error.details = details;
    throw error;
  }
}

export async function deleteSupabaseRepost(storage, id, userId) {
  const response = await fetch(`${storage.restUrl}?id=eq.${encodeURIComponent(id)}&reposter_user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { apikey: storage.serviceKey, Authorization: `Bearer ${storage.serviceKey}` },
  });
  if (!response.ok) throw new Error(`Supabase repost delete failed (${response.status})`);
}