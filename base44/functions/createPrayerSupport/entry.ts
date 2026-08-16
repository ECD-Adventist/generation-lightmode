import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { createNotificationIdempotent } from '../../shared/notifications.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;

    const validated = await readValidatedJson(req, {
      request_id: { type: 'string', required: true, maxLength: 64 },
    });
    if (validated.response) return validated.response;
    const { request_id } = validated.data;

    const request = await base44.asServiceRole.entities.PrayerRequest.get(request_id).catch(() => null);
    if (!request) return Response.json({ error: 'Prayer request not found' }, { status: 404 });
    const existing = await base44.entities.PrayerSupport.filter({ request_id, user_email: user.email });
    if (existing.length) return Response.json({ success: true, support: existing[0], deduplicated: true });

    const support = await base44.entities.PrayerSupport.create({ request_id, user_email: user.email });
    if (request.user_email && request.user_email !== user.email) {
      const recipient = (await base44.asServiceRole.entities.User.filter({ email: request.user_email }, '-created_date', 1))[0];
      if (recipient?.id) {
        try {
          await createNotificationIdempotent(base44, {
            user_id: recipient.id,
            actor_user_id: user.id,
            type: 'prayer',
            reference_id: `prayer_${support.id}`,
            message: `${user.full_name || user.email?.split('@')[0] || 'Someone'} prayed for your request.`,
            link: '/PrayerWall',
          });
        } catch (error) {
          console.error('[notification:error]', { type: 'prayer', recipient: recipient.id, action: 'pray_for_request', error: error?.message });
        }
      }
    }

    return Response.json({ success: true, support });
  } catch (error) {
    console.error('createPrayerSupport failed:', error?.message);
    return Response.json({ error: error?.message || 'Unable to record prayer support' }, { status: 500 });
  }
}