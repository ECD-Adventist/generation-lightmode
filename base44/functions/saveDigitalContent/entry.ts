import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ALLOWED_ROLES = [
  'admin', 'super_admin', 'ecd_admin', 'country_admin',
  'union_admin', 'conference_field_admin', 'church_admin'
];

// Admin save/update/delete for All Things New content. Runs with the service role so
// content management works for every authorized admin role.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, data } = body || {};

    if (action === 'delete') {
      if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
      await base44.asServiceRole.entities.DigitalContent.delete(id);
      return Response.json({ success: true });
    }

    if (!data?.title || !data?.drive_link || !data?.scheduled_at) {
      return Response.json({ error: 'Title, Drive link and schedule are required' }, { status: 400 });
    }

    const payload = {
      title: String(data.title).slice(0, 200),
      description: String(data.description || '').slice(0, 2000),
      content_type: data.content_type,
      category: data.category || undefined,
      language: data.language,
      drive_link: data.drive_link,
      thumbnail_url: data.thumbnail_url || '',
      scheduled_at: data.scheduled_at
    };

    const record = id
      ? await base44.asServiceRole.entities.DigitalContent.update(id, payload)
      : await base44.asServiceRole.entities.DigitalContent.create(payload);

    return Response.json({ success: true, item: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}