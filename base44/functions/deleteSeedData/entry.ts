import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole.entities;
    const result = { TerritoryLeaderboard: 0, CountryStats: 0, ChallengeSubmission: 0 };

    for (const id of ['6a6309ad6e80ee1db850aa96', '6a6309ad6e80ee1db850aa95', '6a6309ad6e80ee1db850aa94']) {
      try {
        await svc.TerritoryLeaderboard.delete(id);
        result.TerritoryLeaderboard++;
      } catch (error) {
        console.log('TerritoryLeaderboard delete failed:', id, error?.message);
      }
    }

    for (const id of ['6a7502309201940c07ddb1c5', '6a7502309201940c07ddb1c4', '6a7502309201940c07ddb1c3']) {
      try {
        await svc.CountryStats.delete(id);
        result.CountryStats++;
      } catch (error) {
        console.log('CountryStats delete failed:', id, error?.message);
      }
    }

    for (const id of ['6a631c440969bd62e5efb496', '6a631c440969bd62e5efb495', '6a631c440969bd62e5efb494']) {
      try {
        await svc.ChallengeSubmission.delete(id);
        result.ChallengeSubmission++;
      } catch (error) {
        console.log('ChallengeSubmission delete failed:', id, error?.message);
      }
    }

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error?.message }, { status: 500 });
  }
}