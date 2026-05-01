import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OFFICER_TITLE_PATTERNS = [
  /president/i,
  /executive\s+secretar(?:y|ies)/i,
  /treasurer/i,
];

const normalize = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const splitTerritories = (value) => String(value || '')
  .split(/[;,|]/)
  .map(normalize)
  .filter(Boolean);

const isOfficerAccount = (account) => {
  const text = `${account.leader_title || ''} ${account.leader_name || ''}`;
  return OFFICER_TITLE_PATTERNS.some((pattern) => pattern.test(text));
};

const territoryMatches = (account, userTerritories) => {
  const accountTerritories = splitTerritories(account.leader_country);
  if (accountTerritories.length === 0 || userTerritories.length === 0) return false;
  return accountTerritories.some((territory) => userTerritories.includes(territory));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const userTerritories = [
      normalize(body.country || user.country),
      normalize(body.territory_name || user.territory_name),
      ...splitTerritories(user.territory_countries),
    ].filter(Boolean);

    if (userTerritories.length === 0) {
      return Response.json({ success: true, followed: 0, skipped: true, reason: 'No territory on user profile yet' });
    }

    const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ active: true });
    const officers = accounts.filter((account) =>
      account.leader_email &&
      account.leader_email !== user.email &&
      isOfficerAccount(account) &&
      territoryMatches(account, userTerritories)
    );

    if (officers.length === 0) {
      return Response.json({ success: true, followed: 0, matched_officers: 0 });
    }

    const existingFollows = await base44.asServiceRole.entities.Follow.filter({ follower_email: user.email });
    const alreadyFollowing = new Set(existingFollows.map((follow) => follow.following_email));

    const followsToCreate = officers
      .filter((officer) => !alreadyFollowing.has(officer.leader_email))
      .map((officer) => ({
        follower_email: user.email,
        following_email: officer.leader_email,
      }));

    if (followsToCreate.length > 0) {
      await base44.asServiceRole.entities.Follow.bulkCreate(followsToCreate);
    }

    return Response.json({
      success: true,
      followed: followsToCreate.length,
      matched_officers: officers.length,
      officer_emails: officers.map((officer) => officer.leader_email),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});