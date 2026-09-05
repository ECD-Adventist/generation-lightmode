import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit } from '../../shared/apiSecurity.ts';
import { waitUntil } from 'base44:runtime';

const PAGE_SIZE = 5000;
const CACHE_TTL_MS = 5 * 60_000;
const SNAPSHOT_FIELDS = {
  User: ['email', 'country'],
  GlowGroup: ['id', 'name', 'country', 'description'],
  GlowGroupMember: ['group_id'],
  GlowDrop: ['id', 'user_email', 'status', 'hidden', 'is_flagged', 'verse', 'reflection', 'likes_count', 'category'],
  Challenge: ['id', 'title', 'description', 'points_reward', 'active', 'start_date', 'end_date'],
  ChallengeSubmission: ['challenge_id'],
};
let snapshotCache = null;
let snapshotRefresh = null;
let nextRefreshAt = 0;

async function buildSnapshot(svc) {

    // Read every database page so map totals stay accurate as the community grows.
    const safeList = async (entity) => {
      try {
        const records = [];
        for (let skip = 0; ; skip += PAGE_SIZE) {
          const page = await svc.entities[entity].list('-created_date', PAGE_SIZE, skip, SNAPSHOT_FIELDS[entity]);
          records.push(...page);
          if (page.length < PAGE_SIZE) break;
        }
        return records;
      } catch (e) {
        console.error(`getPublicCommunitySnapshot: ${entity} read failed:`, e?.message);
        throw e;
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
      "usa": "United States", "u.s.a.": "United States", "us": "United States", "united states of america": "United States",
      "uk": "United Kingdom", "great britain": "United Kingdom", "england": "United Kingdom",
      "southafrica": "South Africa", "united republic of tanzania": "Tanzania", "tanzanie": "Tanzania",
      "kenia": "Kenya", "ouganda": "Uganda", "ethiopie": "Ethiopia", "éthiopie": "Ethiopia",
      "drc": "Democratic Republic of the Congo", "rdc": "Democratic Republic of the Congo", "rd congo": "Democratic Republic of the Congo",
      "dr congo": "Democratic Republic of the Congo", "congo": "Democratic Republic of the Congo",
      "congo dr": "Democratic Republic of the Congo", "congo, democratic republic": "Democratic Republic of the Congo",
      "république démocratique du congo": "Democratic Republic of the Congo", "republique democratique du congo": "Democratic Republic of the Congo",
      "rep. dem. du congo": "Democratic Republic of the Congo", "democratic republic of congo": "Democratic Republic of the Congo",
      "s. sudan": "South Sudan", "ivory coast": "Côte d'Ivoire", "somali": "Somalia",
    };
    const CANONICAL_COUNTRIES = [
      "Kenya", "Tanzania", "Uganda", "Rwanda", "Burundi", "Ethiopia", "Somalia", "Djibouti", "Eritrea", "Sudan", "South Sudan",
      "Democratic Republic of the Congo", "Zambia", "Namibia", "Zimbabwe", "Angola", "Nigeria", "Ghana", "South Africa",
      "United States", "United Kingdom", "Canada", "Brazil", "India", "Philippines", "Australia", "China", "France", "Côte d'Ivoire",
    ];
    const canonicalByLower = new Map(CANONICAL_COUNTRIES.map((country) => [country.toLowerCase(), country]));

    const normalizeCountry = (countryName) => {
      if (!countryName) return "";
      const cleaned = String(countryName).replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").trim().replace(/\s+/g, " ");
      const lower = cleaned.toLowerCase();
      if (!lower || lower === "other" || lower === "ecd" || lower === "global") return "";
      if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];
      if (canonicalByLower.has(lower)) return canonicalByLower.get(lower);
      const aliasMatch = Object.entries(COUNTRY_ALIASES).find(([alias]) => lower.includes(alias));
      if (aliasMatch) return aliasMatch[1];
      const countryMatch = CANONICAL_COUNTRIES.find((country) => lower.includes(country.toLowerCase()));
      if (countryMatch) return countryMatch;
      if (/lubumbashi|bukavu/.test(lower)) return "Democratic Republic of the Congo";
      if (/kisumu|khwisero|nairobi|webuye/.test(lower)) return "Kenya";
      if (/arua|mbarara|kampala/.test(lower)) return "Uganda";
      if (/dar es salaam/.test(lower)) return "Tanzania";
      if (/butanyerera/.test(lower)) return "Burundi";
      return cleaned;
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
      const country = normalizeCountry(group.country);
      if (country) ensureCountry(country).groups += 1;
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

    const totalCountries = countryStats.length;

    return {
      generated_at: new Date().toISOString(),
      totalUsers: users.length,
      totalGroups: groups.length,
      totalDrops: approvedDrops.length,
      totalCountries,
      totalChallenges: publicChallenges.filter((challenge) => challenge.active).length,
      countryStats,
      topGroups,
      recentDrops,
      challenges: publicChallenges,
    };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    if (snapshotCache && Date.now() - Date.parse(snapshotCache.generated_at) < 60_000) {
      return Response.json(snapshotCache);
    }
    const [saved] = await base44.entities.CommunitySnapshotCache.filter({ cache_key: 'public-community-v1' }, '-generated_at', 1);
    if (saved?.snapshot?.generated_at) snapshotCache = saved.snapshot;

    const refresh = () => {
      if (!snapshotRefresh) {
        nextRefreshAt = Date.now() + 60_000;
        snapshotRefresh = (async () => {
          const user = await base44.auth.me().catch(() => null);
          const rateLimited = await enforceApiRateLimit(base44, req, user);
          if (rateLimited) throw new Error('Rate limit exceeded');
          // Administrators already have full read access; other callers only
          // receive the explicitly public aggregate, never underlying records.
          const client = user?.role === 'admin' ? base44 : base44.asServiceRole;
          const snapshot = await buildSnapshot(client);
          const record = { cache_key: 'public-community-v1', generated_at: snapshot.generated_at, snapshot };
          if (saved?.id) await client.entities.CommunitySnapshotCache.update(saved.id, record);
          else await client.entities.CommunitySnapshotCache.create(record);
          snapshotCache = snapshot;
          console.info('Community snapshot saved', { totalUsers: snapshot.totalUsers, totalGroups: snapshot.totalGroups, totalDrops: snapshot.totalDrops, generated_at: snapshot.generated_at });
          return snapshot;
        })().finally(() => { snapshotRefresh = null; });
      }
      return snapshotRefresh;
    };

    if (snapshotCache) {
      if (Date.now() - Date.parse(snapshotCache.generated_at) >= CACHE_TTL_MS && Date.now() >= nextRefreshAt) {
        waitUntil(refresh().catch(error => console.error('Community snapshot refresh failed; retaining saved totals:', error?.message)));
      }
      return Response.json(snapshotCache);
    }
    return Response.json(await refresh());
  } catch (error) {
    console.error('getPublicCommunitySnapshot failed:', error?.message);
    if ((error?.status || error?.response?.status) === 429 || /rate limit exceeded/i.test(error?.message || '')) {
      return Response.json({ error: 'Community totals are temporarily busy. Please retry shortly.' }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    return Response.json({ error: 'Unable to load community snapshot' }, { status: 500 });
  }
}