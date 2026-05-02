import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function normalizeCountry(country) {
  if (!country) return country;
  let normalized = country.trim().replace(/\s+/g, " ");

  const aliases = {
    "République Démocratique du Congo": "Democratic Republic of the Congo",
    "Republique Democratique du Congo": "Democratic Republic of the Congo",
    "Rep. Dem. du Congo": "Democratic Republic of the Congo",
    "RDC": "Democratic Republic of the Congo",
    "DRC": "Democratic Republic of the Congo",
    "Congo DR": "Democratic Republic of the Congo",
    "Congo, Democratic Republic": "Democratic Republic of the Congo",
    "Tanzanie": "Tanzania",
    "United Republic of Tanzania": "Tanzania",
    "Ouganda": "Uganda",
    "Kenia": "Kenya",
    "Ethiopie": "Ethiopia",
    "Éthiopie": "Ethiopia",
  };

  return aliases[normalized] || normalized;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
  let updatedCount = 0;
  const changes = [];

  for (const u of users) {
    if (!u.country) continue;
    const original = u.country;
    const normalized = normalizeCountry(original);
    if (normalized !== original) {
      await base44.asServiceRole.entities.User.update(u.id, { country: normalized });
      updatedCount++;
      changes.push({ email: u.email, from: original, to: normalized });
    }
  }

  return Response.json({ success: true, total_scanned: users.length, updated: updatedCount, changes });
});