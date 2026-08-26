import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { readValidatedJson } from '../../shared/apiSecurity.ts';
import { mirrorToSupabase, deleteFromSupabase } from '../../shared/supabase.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin', 'ecd_admin'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const validated = await readValidatedJson(req, {
      action: { type: 'string', required: true, enum: ['create', 'toggle', 'delete', 'mark_alert_read'] },
      id: { type: 'string', maxLength: 64 }, term: { type: 'string', maxLength: 200 },
      kind: { type: 'string', enum: ['keyword', 'hashtag', 'campaign', 'phrase'] }, active: { type: 'boolean' }
    });
    if (validated.response) return validated.response;
    const { action, id, term, kind, active } = validated.data;
    if (action === 'create') {
      const cleanTerm = (term || '').trim();
      if (!cleanTerm) return Response.json({ error: 'Keyword is required' }, { status: 400 });
      const duplicate = await base44.asServiceRole.entities.GenLuxKeyword.filter({ term: cleanTerm }, '-created_date', 1);
      if (duplicate.length) return Response.json({ error: 'This keyword is already monitored' }, { status: 409 });
      const record = await base44.asServiceRole.entities.GenLuxKeyword.create({ term: cleanTerm, kind: kind || 'keyword', active: true });
      await mirrorToSupabase('genlux_keywords', record);
      return Response.json({ success: true, record });
    }
    if (!id) return Response.json({ error: 'Record id is required' }, { status: 400 });
    if (action === 'toggle') {
      const record = await base44.asServiceRole.entities.GenLuxKeyword.update(id, { active: Boolean(active) });
      await mirrorToSupabase('genlux_keywords', record);
      return Response.json({ success: true, record });
    }
    if (action === 'mark_alert_read') {
      const record = await base44.asServiceRole.entities.GenLuxAlert.update(id, { read: true });
      await mirrorToSupabase('genlux_alerts', record);
      return Response.json({ success: true, record });
    }
    await base44.asServiceRole.entities.GenLuxKeyword.delete(id);
    await deleteFromSupabase('genlux_keywords', id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}