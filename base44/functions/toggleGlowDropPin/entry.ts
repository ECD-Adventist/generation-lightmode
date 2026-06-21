import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function isEcdOfficerLeader(account) {
  if (!account) return false;
  const text = [account.leader_title, account.leader_name, account.notes]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /\becd\b/.test(text);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const dropId = String(body.drop_id || '').trim();
    const pinned = Boolean(body.pinned);
    if (!dropId) return Response.json({ error: 'Missing post id' }, { status: 400 });

    const drops = await base44.asServiceRole.entities.GlowDrop.filter({ id: dropId });
    const drop = drops[0];
    if (!drop) return Response.json({ error: 'Post not found' }, { status: 404 });

    const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ active: true });
    const leaderAccount = accounts.find((account) => account.leader_email === drop.user_email);
    const isManager = Array.isArray(leaderAccount?.manager_emails) && leaderAccount.manager_emails.includes(user.email);
    const isSuperAdmin = user.role === 'super_admin';

    if (!isEcdOfficerLeader(leaderAccount) || (!isSuperAdmin && !isManager)) {
      return Response.json({ error: 'Only super admins and managers of ECD Officer accounts can pin these announcements.' }, { status: 403 });
    }

    const updated = await base44.asServiceRole.entities.GlowDrop.update(drop.id, { pinned });

    try {
      await base44.asServiceRole.entities.AdminLog.create({
        admin_email: user.email,
        admin_name: user.full_name || user.email,
        action: pinned ? 'pin_ecd_officer_post' : 'unpin_ecd_officer_post',
        target: drop.id,
        details: `${pinned ? 'Pinned' : 'Unpinned'} ECD Officer post by ${leaderAccount.leader_name}`,
        category: 'content',
      });
    } catch (error) {
      console.warn('Audit log failed:', error?.message);
    }

    return Response.json({ success: true, pinned: updated.pinned === true });
  } catch (error) {
    console.error('toggleGlowDropPin failed:', error?.message);
    return Response.json({ error: 'Unable to update pinned status' }, { status: 500 });
  }
});