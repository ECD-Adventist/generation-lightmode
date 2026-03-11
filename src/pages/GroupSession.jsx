import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import GroupSessionRoom from "@/components/groups/GroupSessionRoom";

export default function GroupSession() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("id");

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    });
  }, []);

  const { data: sessions = [] } = useQuery({
    queryKey: ["groupSessionCurrent", sessionId],
    queryFn: () => base44.entities.GroupSession.filter({ id: sessionId }),
    enabled: !!sessionId && !!user,
  });

  const session = sessions[0];

  const { data: memberships = [] } = useQuery({
    queryKey: ["groupSessionMemberships", user?.email],
    queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groupSessionGroups"],
    queryFn: () => base44.entities.GlowGroup.list(),
    enabled: !!user,
  });

  const hasAccess = useMemo(() => {
    if (!user || !session) return false;
    const group = groups.find((entry) => entry.id === session.group_id);
    return memberships.some((membership) => membership.group_id === session.group_id) || group?.leader_email === user.email;
  }, [user, session, memberships, groups]);

  if (!user || !session) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading session...</div>;
  if (!hasAccess) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">This room is private to group members.</div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <GroupSessionRoom user={user} session={session} />
      </div>
    </div>
  );
}