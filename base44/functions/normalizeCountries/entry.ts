import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { inferCountryFromLocation } from '../../shared/territoryNames.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = [];
    let skip = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.User.list('-created_date', 500, skip);
      users.push(...batch);
      if (batch.length < 500) break;
      skip += 500;
    }

    const updates = [];
    const changes = [];
    for (const account of users) {
      const original = String(account.country || '').trim();
      const normalized = inferCountryFromLocation(account);
      if (normalized && normalized !== original) {
        updates.push({ id: account.id, country: normalized });
        changes.push({ from: original || 'Unassigned', to: normalized });
      }
    }

    await Promise.all(updates.map(({ id, ...fields }) =>
      base44.asServiceRole.entities.User.update(id, fields)
    ));

    return Response.json({
      success: true,
      total_scanned: users.length,
      updated: updates.length,
      unresolved: users.filter((account) => !inferCountryFromLocation(account)).length,
      changes,
    });
  } catch (error) {
    console.error('normalizeCountries failed:', error?.message);
    return Response.json({ error: 'Unable to normalize countries' }, { status: 500 });
  }
}