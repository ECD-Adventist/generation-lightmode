// Idempotent notification creator: skips insertion if a notification already
// exists with the same (user_id, type, reference_id). Prevents duplicate fan-out.

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

  return created.id;
}