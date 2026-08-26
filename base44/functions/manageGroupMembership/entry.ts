import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { deleteFromSupabase, mirrorToSupabase } from '../../shared/supabase.ts';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

async function createMirroredNotification(base44, payload) {
  const created = await base44.asServiceRole.entities.Notification.create(payload);
  await mirrorToSupabase('notifications', created);
  return created;
}

// Leader-only actions for managing a GlowGroup:
// - set_role: assign/change a member's role within the group
// - remove_member: kick a member from the group
// - transfer_leadership: pass the leader role to another member
// - delete_group: permanently delete the group (leader only)
// - update_group: edit group name/country/description
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, group_id } = body;
    if (!group_id || !action) {
      return Response.json({ error: 'Missing group_id or action' }, { status: 400 });
    }

    const groups = await base44.asServiceRole.entities.GlowGroup.filter({ id: group_id });
    const group = groups[0];
    if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });

    const isLeader = normalizeEmail(group.leader_email) === normalizeEmail(user.email);
    const isSuperAdmin = user.role === 'super_admin';
    if (!isLeader && !isSuperAdmin) {
      return Response.json({ error: 'Only the group leader or a super admin can perform this action' }, { status: 403 });
    }

    if (action === 'set_role') {
      const { target_email, role } = body;
      const allowedRoles = ['member', 'moderator', 'scribe', 'coordinator', 'worship_lead', 'prayer_lead'];
      if (!target_email || !allowedRoles.includes(role)) {
        return Response.json({ error: 'Invalid target_email or role' }, { status: 400 });
      }
      if (target_email === group.leader_email) {
        return Response.json({ error: 'Cannot change leader role here. Use transfer_leadership.' }, { status: 400 });
      }
      const memberships = await base44.asServiceRole.entities.GlowGroupMember.filter({ group_id, user_email: target_email });
      const membership = memberships[0];
      if (!membership) return Response.json({ error: 'User is not a member of this group' }, { status: 404 });

      const updatedMembership = await base44.asServiceRole.entities.GlowGroupMember.update(membership.id, { role });
      await mirrorToSupabase('GlowGroupMember', updatedMembership);

      await createMirroredNotification(base44, {
        user_email: target_email,
        type: 'system',
        message: `You were assigned the role of "${role.replace('_', ' ')}" in "${group.name}".`,
        link: `/GroupChat?id=${group_id}`,
      }).catch(() => {});

      return Response.json({ success: true, role });
    }

    if (action === 'remove_member') {
      const { target_email } = body;
      if (!target_email) return Response.json({ error: 'Missing target_email' }, { status: 400 });
      if (target_email === group.leader_email) {
        return Response.json({ error: 'Cannot remove the leader. Transfer leadership first.' }, { status: 400 });
      }
      const memberships = await base44.asServiceRole.entities.GlowGroupMember.filter({ group_id, user_email: target_email });
      for (const m of memberships) {
        await base44.asServiceRole.entities.GlowGroupMember.delete(m.id);
        await deleteFromSupabase('GlowGroupMember', m.id);
      }

      await createMirroredNotification(base44, {
        user_email: target_email,
        type: 'system',
        message: `You were removed from the group "${group.name}".`,
        link: `/GlowGroups`,
      }).catch(() => {});

      return Response.json({ success: true });
    }

    if (action === 'transfer_leadership') {
      const { target_email } = body;
      if (!target_email) return Response.json({ error: 'Missing target_email' }, { status: 400 });
      if (target_email === group.leader_email) {
        return Response.json({ error: 'This user is already the leader' }, { status: 400 });
      }
      const memberships = await base44.asServiceRole.entities.GlowGroupMember.filter({ group_id, user_email: target_email });
      if (memberships.length === 0) {
        return Response.json({ error: 'New leader must be an existing member of the group' }, { status: 400 });
      }

      const previousLeaderEmail = group.leader_email;

      // Promote new leader
      const updatedGroup = await base44.asServiceRole.entities.GlowGroup.update(group_id, { leader_email: target_email });
      await mirrorToSupabase('GlowGroup', updatedGroup);

      // Ensure new leader's membership role is "member" (leader tracked on group itself)
      const updatedNewLeaderMembership = await base44.asServiceRole.entities.GlowGroupMember.update(memberships[0].id, { role: 'member' });
      await mirrorToSupabase('GlowGroupMember', updatedNewLeaderMembership);

      // Ensure previous leader has a membership record so they remain in the group as a regular member
      if (previousLeaderEmail) {
        const existingPrev = await base44.asServiceRole.entities.GlowGroupMember.filter({ group_id, user_email: previousLeaderEmail });
        if (existingPrev.length === 0) {
          const previousLeaderMembership = await base44.asServiceRole.entities.GlowGroupMember.create({
            user_email: previousLeaderEmail,
            group_id,
            joined_at: new Date().toISOString(),
            role: 'moderator',
          });
          await mirrorToSupabase('GlowGroupMember', previousLeaderMembership);
        }
      }

      // Notify both
      await Promise.all([
        createMirroredNotification(base44, {
          user_email: target_email,
          type: 'system',
          message: `You are now the leader of "${group.name}" 👑`,
          link: `/GroupChat?id=${group_id}`,
        }).catch(() => {}),
        previousLeaderEmail ? createMirroredNotification(base44, {
          user_email: previousLeaderEmail,
          type: 'system',
          message: `You transferred leadership of "${group.name}".`,
          link: `/GroupChat?id=${group_id}`,
        }).catch(() => {}) : Promise.resolve(),
      ]);

      return Response.json({ success: true, new_leader: target_email });
    }

    if (action === 'delete_group') {
      // Full cascade in both Base44 and Supabase. Super admins can execute this
      // from Group Settings even when they are not the original group leader.
      const [members, messages, reactions, events, requests, resources, devotionals, sessions, studyPlans] = await Promise.all([
        base44.asServiceRole.entities.GlowGroupMember.filter({ group_id }),
        base44.asServiceRole.entities.GlowGroupMessage.filter({ group_id }),
        base44.asServiceRole.entities.GlowGroupMessageReaction.filter({ group_id }).catch(() => []),
        base44.asServiceRole.entities.GlowGroupEvent.filter({ group_id }),
        base44.asServiceRole.entities.GlowGroupJoinRequest.filter({ group_id }),
        base44.asServiceRole.entities.GlowGroupResource.filter({ group_id }).catch(() => []),
        base44.asServiceRole.entities.GroupDevotional.filter({ group_id }).catch(() => []),
        base44.asServiceRole.entities.GroupSession.filter({ group_id }).catch(() => []),
        base44.asServiceRole.entities.GroupStudyPlan.filter({ group_id }).catch(() => []),
      ]);

      const [eventRsvps, devotionalReads, sessionMessages, sessionSignals] = await Promise.all([
        Promise.all(events.map(event => base44.asServiceRole.entities.GlowGroupEventRSVP.filter({ event_id: event.id }).catch(() => []))).then(rows => rows.flat()),
        Promise.all(devotionals.map(item => base44.asServiceRole.entities.GroupDevotionalRead.filter({ devotional_id: item.id }).catch(() => []))).then(rows => rows.flat()),
        Promise.all(sessions.map(session => base44.asServiceRole.entities.GroupSessionMessage.filter({ session_id: session.id }).catch(() => []))).then(rows => rows.flat()),
        Promise.all(sessions.map(session => base44.asServiceRole.entities.GroupSessionSignal.filter({ session_id: session.id }).catch(() => []))).then(rows => rows.flat()),
      ]);

      const memberEmails = [...new Set(members.map(m => m.user_email).filter(Boolean))];
      const deleteMirroredRows = async (entityName, rows) => {
        for (const row of rows) {
          await base44.asServiceRole.entities[entityName].delete(row.id).catch(() => null);
          await deleteFromSupabase(entityName, row.id);
        }
      };

      // Delete dependent rows before their parents.
      await deleteMirroredRows('GlowGroupEventRSVP', eventRsvps);
      await deleteMirroredRows('GroupDevotionalRead', devotionalReads);
      await deleteMirroredRows('GroupSessionMessage', sessionMessages);
      await deleteMirroredRows('GroupSessionSignal', sessionSignals);
      await deleteMirroredRows('GlowGroupMessageReaction', reactions);
      await deleteMirroredRows('GlowGroupMessage', messages);
      await deleteMirroredRows('GlowGroupEvent', events);
      await deleteMirroredRows('GlowGroupJoinRequest', requests);
      await deleteMirroredRows('GlowGroupResource', resources);
      await deleteMirroredRows('GroupDevotional', devotionals);
      await deleteMirroredRows('GroupSession', sessions);
      await deleteMirroredRows('GroupStudyPlan', studyPlans);
      await deleteMirroredRows('GlowGroupMember', members);
      await base44.asServiceRole.entities.GlowGroup.delete(group_id);
      await deleteFromSupabase('GlowGroup', group_id);

      // Notify former members after deletion.
      const actorLabel = user.role === 'super_admin' ? 'a super administrator' : 'its leader';
      await Promise.all(memberEmails.map(email =>
        createMirroredNotification(base44, {
          user_email: email,
          type: 'system',
          message: `The group "${group.name}" was closed by ${actorLabel}.`,
          link: `/GlowGroups`,
        }).catch(() => {})
      ));

      return Response.json({ success: true });
    }

    if (action === 'update_group') {
      const { name, country, description, profile_picture_url, cover_picture_url, welcome_message, privacy, tags } = body;
      const updates = {};
      if (typeof name === 'string' && name.trim()) updates.name = name.trim();
      if (typeof country === 'string') updates.country = country.trim();
      if (typeof description === 'string') updates.description = description.trim();
      if (typeof profile_picture_url === 'string') updates.profile_picture_url = profile_picture_url;
      if (typeof cover_picture_url === 'string') updates.cover_picture_url = cover_picture_url;
      if (typeof welcome_message === 'string') updates.welcome_message = welcome_message.trim();
      if (privacy === 'public' || privacy === 'private') updates.privacy = privacy;
      if (typeof tags === 'string') updates.tags = tags.trim();
      if (Object.keys(updates).length === 0) return Response.json({ error: 'No valid fields to update' }, { status: 400 });

      const updatedGroup = await base44.asServiceRole.entities.GlowGroup.update(group_id, updates);
      await mirrorToSupabase('GlowGroup', updatedGroup);
      return Response.json({ success: true, updates });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('manageGroupMembership error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});