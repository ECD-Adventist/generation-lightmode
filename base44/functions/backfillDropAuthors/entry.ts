import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';
import { readValidatedJson } from '../../shared/apiSecurity.ts';
import { mirrorToSupabase } from '../../shared/supabase.ts';

export default async function(req) {
  const base44 = createClientFromRequest(req);
  if (!await authorizeSchedulerOrAdmin(base44, req)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validated = await readValidatedJson(req, {
    batch_size: { type: 'integer', minimum: 1, maximum: 500 },
    dry_run: { type: 'boolean' },
    scheduler_token: { type: 'string', maxLength: 500 }
  });
  if (validated.response) return validated.response;

  const batchSize = validated.data.batch_size || 100;
  const drops = await base44.asServiceRole.entities.GlowDrop.filter({
    $or: [
      { author_name: { $exists: false } },
      { author_name: null },
      { author_username: { $exists: false } },
      { author_username: null },
      { author_avatar: { $exists: false } },
      { author_avatar: null }
    ]
  }, 'created_date', batchSize);

  if (!drops.length) {
    return Response.json({ success: true, processed: 0, remaining: false });
  }

  const emails = [...new Set(drops.map((drop) => drop.user_email).filter(Boolean))];
  const users = emails.length
    ? await base44.asServiceRole.entities.User.filter({ email: { $in: emails } }, '-created_date', Math.min(emails.length, 500))
    : [];
  const usersByEmail = new Map(users.map((user) => [String(user.email).toLowerCase(), user]));

  const updates = drops.map((drop) => {
    const user = usersByEmail.get(String(drop.user_email || '').toLowerCase());
    return {
      id: drop.id,
      author_name: drop.author_name || user?.full_name || user?.display_name || user?.username || 'Generation LightMode Member',
      author_username: drop.author_username || user?.username || '',
      author_avatar: drop.author_avatar || user?.profile_picture || user?.profile_picture_url || ''
    };
  });

  if (validated.data.dry_run) {
    return Response.json({ success: true, dry_run: true, matched: updates.length });
  }

  await base44.asServiceRole.entities.GlowDrop.bulkUpdate(updates);
  for (const update of updates) {
    const original = drops.find((drop) => drop.id === update.id);
    await mirrorToSupabase('glow_drops', { ...original, ...update });
  }

  return Response.json({ success: true, processed: updates.length, remaining: updates.length === batchSize });
}