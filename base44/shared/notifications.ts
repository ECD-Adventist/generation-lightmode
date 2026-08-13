// Idempotent notification creator: skips insertion if a notification already
// exists with the same (user_id, type, reference_id). Prevents duplicate fan-out.
import { mirrorToSupabase } from './supabase.ts';

export async function createNotificationIdempotent(
  base44: any,
  params: {
    user_id?: string;
    type: string;
    reference_id: string;
    message: string;
    link?: string;
    actor_user_id?: string;
  }
): Promise<string | null> {
  const { user_id, type, reference_id, message, link, actor_user_id } = params;

  if (!user_id || !reference_id) return null;

  // Dedup check: skip if a notification already exists for this combination
  const existing = await base44.asServiceRole.entities.Notification.filter({
    user_id,
    type,
    reference_id,
  }).catch(() => []);
  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  const created = await base44.asServiceRole.entities.Notification.create({
    user_id,
    actor_user_id: actor_user_id || '',
    type,
    reference_id,
    message: String(message || '').slice(0, 500),
    link: link || '',
    read: false,
  });

  // Dual-write: mirror into Supabase. Awaited so the write isn't cancelled on return.
  await mirrorToSupabase('notifications', {
    id: created.id,
    user_id: created.user_id,
    actor_user_id: created.actor_user_id,
    type: created.type,
    reference_id: created.reference_id,
    message: created.message,
    link: created.link,
    read: created.read,
    created_date: created.created_date,
  });

  return created.id;
}