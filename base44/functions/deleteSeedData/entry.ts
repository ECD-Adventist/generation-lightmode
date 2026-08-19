import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const logs = [];

    try {
      const tl = await base44.entities.TerritoryLeaderboard.list({ limit: 100 });
      logs.push('user TL count: ' + tl.length);
      for (const r of tl) {
        logs.push('user TL: ' + r.id + ' ' + r.territory_name);
        try {
          await base44.entities.TerritoryLeaderboard.delete(r.id);
          logs.push('user TL deleted: ' + r.id);
        } catch (error) {
          logs.push('user TL delete err: ' + error.message);
        }
      }
    } catch (error) {
      logs.push('user TL err: ' + error.message);
    }

    try {
      const tl2 = await base44.asServiceRole.entities.TerritoryLeaderboard.filter({});
      logs.push('svc TL filter count: ' + tl2.length);
    } catch (error) {
      logs.push('svc TL filter err: ' + error.message);
    }

    try {
      const all = await base44.asServiceRole.entities.TerritoryLeaderboard.list({ limit: 100, skip: 0 });
      logs.push('svc TL list2: ' + all.length);
    } catch (error) {
      logs.push('svc TL list2 err: ' + error.message);
    }

    return Response.json({ logs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}