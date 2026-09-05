import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';
import { resolveLegacyUserCountry } from '../../shared/countryResolution.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (caller.role !== 'admin') {
      await logPermissionDenied(base44, req, caller, 'users', 'normalize_countries');
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      dry_run: { type: 'boolean' },
      country_values: { type: 'array', maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 100 } },
      limit: { type: 'number', integer: true, min: 1, max: 500 },
      skip: { type: 'number', integer: true, min: 0, max: 1000000 },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;

    const dryRun = validated.data.dry_run !== false;
    const limit = validated.data.limit || 100;
    const skip = validated.data.skip || 0;
    const countryValues = validated.data.country_values;
    const users = countryValues?.length
      ? await base44.entities.User.filter({ country: { $in: countryValues } }, 'id', limit, skip)
      : await base44.entities.User.list('id', limit, skip);
    const updates = [];
    const changes = [];

    for (const account of users) {
      const original = String(account.country || '').trim();
      const normalized = resolveLegacyUserCountry(account);
      if (normalized && normalized !== original) {
        updates.push({ id: account.id, country: normalized });
        changes.push({ id: account.id, from: original, to: normalized });
      }
    }

    if (!dryRun && updates.length) {
      const rateLimited = await enforceApiRateLimit(base44, req, caller);
      if (rateLimited) return rateLimited;
      // Built-in users support individual updates; the batch endpoint rejects them.
      for (const update of updates) {
        await base44.entities.User.update(update.id, { country: update.country });
      }
      await logAdminAction(base44, req, caller, 'users', 'normalize_countries', `Normalized ${updates.length} explicit country values`);
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      total_scanned: users.length,
      eligible: updates.length,
      updated: dryRun ? 0 : updates.length,
      changes,
      next_skip: users.length === limit ? skip + limit : null,
    });
  } catch (error) {
    console.error('normalizeCountries failed:', error?.message);
    return Response.json({ error: 'Unable to normalize countries' }, { status: 500 });
  }
}