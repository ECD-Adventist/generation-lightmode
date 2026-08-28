import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { inferCountryFromLocation } from '../../shared/territoryNames.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: only super_admin or admin can run bulk territory assignment' }, { status: 403 });
    }

    const users = [];
    let skip = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.User.list('-created_date', 500, skip);
      users.push(...batch);
      if (batch.length < 500) break;
      skip += 500;
    }

    const updates = users
      .map((account) => ({ account, country: inferCountryFromLocation(account) }))
      .filter(({ account, country }) => country && country !== String(account.country || '').trim())
      .map(({ account, country }) => ({ id: account.id, country }));

    await Promise.all(updates.map(({ id, ...fields }) =>
      base44.asServiceRole.entities.User.update(id, fields)
    ));

    return Response.json({
      success: true,
      assigned: updates.length,
      unresolved: users.filter((account) => !inferCountryFromLocation(account)).length,
    });
  } catch (error) {
    console.error('autoAssignTerritories failed:', error?.message);
    return Response.json({ error: 'Unable to auto-assign territories' }, { status: 500 });
  }
}