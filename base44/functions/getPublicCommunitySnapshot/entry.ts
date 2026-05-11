import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate caller
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [users, groups, groupMembers, drops, challenges, submissions] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 10000),
      base44.asServiceRole.entities.GlowGroup.list('-created_date', 10000),
      base44.asServiceRole.entities.GlowGroupMember.list('-created_date', 10000),
      base44.asServiceRole.entities.GlowDrop.list('-created_date', 10000),
      base44.asServiceRole.entities.Challenge.list('-created_date', 10000),
      base44.asServiceRole.entities.ChallengeSubmission.list('-created_date', 10000),
    ]);

    const hiddenEmails = new Set(['nottainnovation@gmail.com']);
    const normalizeCountry = (countryName) => {
      const value = (countryName || 'Global').trim();
      if (value === 'DR Congo' || value === 'Democratic Republic of the Congo' || value === 'République Démocratique du Congo') return 'République Démocratique du Congo';
      return value || 'Global';
    };

    const publicUsers = users.filter((user) => !hiddenEmails.has(user.email));
    const userCountryByEmail = new Map(publicUsers.map((user) => [user.email, normalizeCountry(user.country)]));

    const countryStatsMap = new Map();
    const ensureCountry = (countryName) => {
      const country = normalizeCountry(countryName);
      if (!countryStatsMap.has(country)) {
        countryStatsMap.set(country, { country, users: 0, groups: 0, drops: 0 });
      }
      return countryStatsMap.get(country);
    };

    publicUsers.forEach((user) => {
      ensureCountry(user.country).users += 1;
    });

    groups.forEach((group) => {
      ensureCountry(group.country).groups += 1;
    });

    drops.forEach((drop) => {
      ensureCountry(userCountryByEmail.get(drop.user_email)).drops += 1;
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

    const recentDrops = drops.slice(0, 6).map((drop) => ({
      id: drop.id,
      verse: drop.verse || '',
      reflection: drop.reflection || '',
      likes_count: drop.likes_count || 0,
      country: userCountryByEmail.get(drop.user_email) || 'Global',
      category: drop.category || '',
    }));

    return Response.json({
      totalUsers: publicUsers.length,
      totalGroups: groups.length,
      totalDrops: drops.length,
      totalCountries: countryStats.length,
      totalChallenges: publicChallenges.filter((challenge) => challenge.active).length,
      countryStats,
      topGroups,
      recentDrops,
      challenges: publicChallenges,
    });
  } catch (error) {
    console.error('getPublicCommunitySnapshot failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});