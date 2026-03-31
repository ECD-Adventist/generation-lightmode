import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all prayer requests
    const prayerRequests = await base44.entities.PrayerRequest.list('-created_date', 100);
    
    // Get all users for interest matching
    const allUsers = await base44.functions.invoke('listPublicUsers', {});
    
    // Get current user's interests (bio, territory)
    const userInterests = {
      email: user.email,
      territory: user.country || 'Global',
      keywords: (user.bio || '').toLowerCase().split(/\s+/),
    };

    // Score each prayer request for match quality
    const scoredMatches = prayerRequests
      .filter(pr => pr.user_email !== user.email) // Don't match own requests
      .map(pr => {
        let score = 0;

        // Territory match (+50 points)
        const prAuthor = allUsers.find(u => u.email === pr.user_email);
        if (prAuthor?.country === userInterests.territory) {
          score += 50;
        }

        // Category match (+30 points)
        const prCategories = [
          'Health' === pr.category,
          'Family' === pr.category,
          'Finance' === pr.category,
          'Guidance' === pr.category,
        ];

        // Keyword match in prayer content (+5 per keyword match)
        const prText = (pr.content || '').toLowerCase();
        userInterests.keywords.forEach(kw => {
          if (kw.length > 2 && prText.includes(kw)) score += 5;
        });

        // Freshness bonus (+20 for recent requests)
        if (pr.created_date) {
          const daysOld = (Date.now() - new Date(pr.created_date).getTime()) / (1000 * 60 * 60 * 24);
          if (daysOld < 3) score += 20;
          else if (daysOld < 7) score += 10;
        }

        // Not answered (+10)
        if (!pr.answered) score += 10;

        return { ...pr, matchScore: score };
      })
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5); // Top 5 matches

    return Response.json({ matches: scoredMatches });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});