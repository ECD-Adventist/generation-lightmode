import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

const PAGE_SIZE = 500;
const CATEGORIES = new Set(['warriors', 'institutions', 'groups', 'territories']);

const text = (value) => String(value || '').trim();
const emailKey = (value) => text(value).toLowerCase();
const scoreOf = (user) => Number(user?.xp_points ?? user?.glow_score ?? 0) || 0;

async function listAll(service, entityName) {
  const rows = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await service.entities[entityName].list('-created_date', PAGE_SIZE, skip);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, actor);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      category: { type: 'string', maxLength: 30 },
      limit: { type: 'number', integer: true, min: 1, max: 50 },
      skip: { type: 'number', integer: true, min: 0, max: 100000 },
      search: { type: 'string', maxLength: 100 },
    });
    if (validated.response) return validated.response;
    const body = validated.data;
    const category = CATEGORIES.has(body.category) ? body.category : 'warriors';
    const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 50);
    const skip = Math.max(Number(body.skip) || 0, 0);
    const search = text(body.search).toLowerCase();
    const service = base44.asServiceRole;

    const [users, institutions, claims, groups, memberships] = await Promise.all([
      listAll(service, 'User'),
      listAll(service, 'InstitutionPage'),
      listAll(service, 'TerritoryMemberClaim'),
      listAll(service, 'GlowGroup'),
      listAll(service, 'GlowGroupMember'),
    ]);

    const usersByEmail = new Map(users.map((user) => [emailKey(user.email), user]));
    const warriors = users
      .map((user) => ({
        type: 'warrior', id: user.id, name: text(user.display_name || user.full_name || user.username) || 'Light Warrior',
        subtitle: text(user.country) || 'Global', image_url: text(user.profile_picture || user.profile_picture_url),
        score: scoreOf(user), country: text(user.country),
      }))
      .filter((item) => item.score > 0);

    const approvedClaims = claims.filter((claim) => claim.status === 'approved');
    const institutionRows = institutions.filter((institution) => institution.verified === true).map((institution) => {
      const owner = emailKey(institution.owner_email);
      const memberEmails = new Set(approvedClaims
        .filter((claim) => emailKey(claim.institution_owner_email) === owner)
        .map((claim) => emailKey(claim.member_email)).filter(Boolean));
      const score = [...memberEmails].reduce((sum, memberEmail) => sum + scoreOf(usersByEmail.get(memberEmail)), 0);
      return {
        type: 'institution', id: institution.id, slug: text(institution.slug), name: text(institution.name) || 'Institution',
        subtitle: text(institution.category) || 'Institution', image_url: text(institution.logo_url), score,
        member_count: memberEmails.size, location: text(institution.location),
      };
    });

    const membersByGroup = new Map();
    memberships.forEach((membership) => {
      const groupId = text(membership.group_id);
      if (!groupId) return;
      if (!membersByGroup.has(groupId)) membersByGroup.set(groupId, new Set());
      membersByGroup.get(groupId).add(emailKey(membership.user_email));
    });
    const groupRows = groups.filter((group) => group.privacy !== 'private').map((group) => {
      const memberEmails = membersByGroup.get(text(group.id)) || new Set();
      return {
        type: 'group', id: group.id, name: text(group.name) || 'GlowGroup', subtitle: text(group.country) || 'Global',
        image_url: text(group.profile_picture_url),
        score: [...memberEmails].reduce((sum, memberEmail) => sum + scoreOf(usersByEmail.get(memberEmail)), 0),
        member_count: memberEmails.size, country: text(group.country),
      };
    });

    const territoryMap = new Map();
    users.forEach((user) => {
      const country = text(user.country);
      if (!country) return;
      if (!territoryMap.has(country)) territoryMap.set(country, { type: 'territory', id: country.toLowerCase(), name: country, subtitle: 'Territory', score: 0, member_count: 0 });
      const row = territoryMap.get(country);
      row.score += scoreOf(user);
      row.member_count += 1;
    });
    const territoryRows = [...territoryMap.values()];

    const allRows = { warriors, institutions: institutionRows, groups: groupRows, territories: territoryRows };
    const counts = Object.fromEntries(Object.entries(allRows).map(([key, rows]) => [key, rows.length]));
    let selected = allRows[category] || warriors;
    if (search) selected = selected.filter((item) => `${item.name} ${item.subtitle} ${item.country || ''} ${item.location || ''}`.toLowerCase().includes(search));
    selected.sort((a, b) => b.score - a.score || (b.member_count || 0) - (a.member_count || 0) || a.name.localeCompare(b.name));
    const page = selected.slice(skip, skip + limit).map((item, index) => ({ ...item, rank: skip + index + 1 }));

    return Response.json({ items: page, total: selected.length, has_more: skip + page.length < selected.length, counts });
  } catch (error) {
    console.error('getLightLeadersLeaderboard failed:', error?.message);
    return Response.json({ error: 'Unable to load Light Leaders rankings' }, { status: 500 });
  }
}
