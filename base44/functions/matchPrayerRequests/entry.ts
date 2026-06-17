import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function publicPrayerShape(prayer) {
  return {
    id: prayer.id,
    content: prayer.content || '',
    category: prayer.category || 'Other',
    is_anonymous: prayer.is_anonymous === true,
    answered: prayer.answered === true,
    created_date: prayer.created_date || null,
    user_email: prayer.is_anonymous === true ? null : prayer.user_email,
    matchScore: prayer.matchScore || 0,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const prayerRequests = await base44.asServiceRole.entities.PrayerRequest.list('-created_date', 100);
    const otherRequests = prayerRequests.filter((prayer) => prayer.user_email !== user.email && prayer.answered !== true);
    const keywords = String(user.bio || '').toLowerCase().split(/\s+/).filter((word) => word.length > 2).slice(0, 20);

    const scoredMatches = otherRequests
      .map((prayer) => {
        let score = 0;
        const text = String(prayer.content || '').toLowerCase();
        keywords.forEach((keyword) => { if (text.includes(keyword)) score += 5; });
        if (prayer.category && prayer.category !== 'Other') score += 10;
        if (prayer.created_date) {
          const daysOld = (Date.now() - new Date(prayer.created_date).getTime()) / (1000 * 60 * 60 * 24);
          if (daysOld < 3) score += 20;
          else if (daysOld < 7) score += 10;
        }
        if (!prayer.answered) score += 10;
        return { ...prayer, matchScore: score };
      })
      .filter((match) => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5)
      .map(publicPrayerShape);

    return Response.json({ matches: scoredMatches });
  } catch (error) {
    console.error('matchPrayerRequests failed:', error?.message);
    return Response.json({ error: 'Unable to match prayer requests' }, { status: 500 });
  }
});