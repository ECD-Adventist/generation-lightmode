import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceApiRateLimit } from '../../shared/apiSecurity.ts';

// Hard cap to avoid full-table scans (audit F-19). Aggregates are computed
// server-side and only non-PII counts/snippets are returned to the client.
const SCAN_CAP = 5000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const rateLimited = await enforceApiRateLimit(base44, req);
    if (rateLimited) return rateLimited;
    const svc = base44.asServiceRole;

    // Read each entity independently and tolerate individual failures so a single
    // RLS / auth hiccup can never zero-out the entire public snapshot.
    const safeList = async (entity) => {
      try {
        return await svc.entities[entity].list('-created_date', SCAN_CAP);
      } catch (e) {
        console.error(`getPublicCommunitySnapshot: ${entity} read failed:`, e?.message);
        return [];
      }
    };

    const [users, groups, groupMembers, drops, challenges, submissions] = await Promise.all([
      safeList('User'),
      safeList('GlowGroup'),
      safeList('GlowGroupMember'),
      safeList('GlowDrop'),
      safeList('Challenge'),
      safeList('ChallengeSubmission'),
    ]);

    // Only approved, non-hidden drops are part of the public movement story.
    const approvedDrops = drops.filter((d) => d.status === 'approved' && !d.hidden && !d.is_flagged);

    const COUNTRY_ALIASES = {
      "usa": "United States",
      "u.s.a.": "United States",
      "us": "United States",
      "united states of america": "United States",
      "uk": "United Kingdom",
      "great britain": "United Kingdom",
      "england": "United Kingdom",
      "southafrica": "South Africa",
      "united republic of tanzania": "Tanzania",
      "tanzanie": "Tanzania",
      "kenia": "Kenya",
      "ouganda": "Uganda",
      "ethiopie": "Ethiopia",
      "éthiopie": "Ethiopia",
      "drc": "Democratic Republic of the Congo",
      "rdc": "Democratic Republic of the Congo",
      "dr congo": "Democratic Republic of the Congo",
      "congo dr": "Democratic Republic of the Congo",
      "congo, democratic republic": "Democratic Republic of the Congo",
      "république démocratique du congo": "Democratic Republic of the Congo",
      "republique democratique du congo": "Democratic Republic of the Congo",
      "rep. dem. du congo": "Democratic Republic of the Congo",
      "democratic republic of congo": "Democratic Republic of the Congo",
      "s. sudan": "South Sudan",
      "ivory coast": "Côte d'Ivoire",
    };

    const normalizeCountry = (countryName) => {
      if (!countryName) return "";
      const cleaned = String(countryName).trim().replace(/\s+/g, " ");
      return COUNTRY_ALIASES[cleaned.toLowerCase()] || cleaned;
    };

    const userCountryByEmail = new Map(users.map((user) => [user.email, normalizeCountry(user.country)]));

    const countryStatsMap = new Map();
    const ensureCountry = (countryName) => {
      const country = normalizeCountry(countryName);
      if (!countryStatsMap.has(country)) {
        countryStatsMap.set(country, { country, users: 0, groups: 0, drops: 0 });
      }
      return countryStatsMap.get(country);
    };

    users.forEach((user) => {
      const country = normalizeCountry(user.country);
      if (country) ensureCountry(country).users += 1;
    });

    groups.forEach((group) => {
      ensureCountry(group.country).groups += 1;
    });

    approvedDrops.forEach((drop) => {
      const country = userCountryByEmail.get(drop.user_email);
      if (country) ensureCountry(country).drops += 1;
    });

    const memberCountByGroup = groupMembers.reduce((acc, member) => {
      acc[member.group_id] = (acc[member.group_id] || 0) + 1;
      return acc;
    }, {});

    const participantsByChallenge = submissions.reduce((acc, submission) => {
      acc[submission.challenge_id] = (acc[submission.challenge_id] || 0) + 1;
      return acc;
    }, {});

    const countryStats = Array.from(countryStatsMap.values()).sort((a, b) => {
      const aScore = a.users + a.groups + a.drops;
      const bScore = b.users + b.groups + b.drops;
      return bScore - aScore;
    });

    const topGroups = groups
      .map((group) => ({
        id: group.id,
        name: group.name,
        country: group.country || 'Global',
        description: group.description || '',
        membersCount: memberCountByGroup[group.id] || 0,
      }))
      .sort((a, b) => b.membersCount - a.membersCount)
      .slice(0, 6);

    const publicChallenges = challenges
      .map((challenge) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description || '',
        points_reward: challenge.points_reward || 0,
        active: challenge.active !== false,
        start_date: challenge.start_date || null,
        end_date: challenge.end_date || null,
        participantsCount: participantsByChallenge[challenge.id] || 0,
      }))
      .sort((a, b) => Number(b.active) - Number(a.active) || b.participantsCount - a.participantsCount);

    const recentDrops = approvedDrops.slice(0, 6).map((drop) => ({
      id: drop.id,
      verse: drop.verse || '',
      reflection: drop.reflection || '',
      likes_count: drop.likes_count || 0,
      country: userCountryByEmail.get(drop.user_email) || 'Global',
      category: drop.category || '',
    }));

    const totalCountries = new Set(users.map((user) => normalizeCountry(user.country)).filter(Boolean)).size;

    return Response.json({
      totalUsers: users.length,
      totalGroups: groups.length,
      totalDrops: approvedDrops.length,
      totalCountries,
      totalChallenges: publicChallenges.filter((challenge) => challenge.active).length,
      countryStats,
      topGroups,
      recentDrops,
      challenges: publicChallenges,
    });
  } catch (error) {
    console.error('getPublicCommunitySnapshot failed:', error?.message);
    return Response.json({ error: 'Unable to load community snapshot' }, { status: 500 });
  }
});