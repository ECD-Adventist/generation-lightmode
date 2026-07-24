import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";
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

  const { data: sessions = [], isFetched: sessionFetched } = useQuery({
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

  // No session id in the URL, or the session no longer exists — show a clear
  // message instead of an endless spinner.
  if (user && (!sessionId || (sessionFetched && !session))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 font-['Inter'] px-6 text-center" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
        <div className="text-4xl">🎥</div>
        <h1 className="text-xl font-bold">{sessionId ? "Session not found" : "No session selected"}</h1>
        <p className="text-sm max-w-sm" style={{ color: "#6B7FA0" }}>
          {sessionId
            ? "This session may have ended or been removed."
            : "Open a session from your group's Sessions tab to join the room."}
        </p>
        <Link to={createPageUrl("GlowGroups")} className="mt-2 px-6 py-2.5 rounded-full text-sm font-bold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
          Go to GlowGroups
        </Link>
      </div>
    );
  }

  if (!user || !session) return <div className="min-h-screen flex items-center justify-center font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;
  if (!hasAccess) return <div className="min-h-screen flex items-center justify-center font-['Inter']" style={{ background: "#F6F8FC", color: "#4A5878" }}>This room is private to group members.</div>;

  return (
    <div className="min-h-screen px-4 py-6 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <div className="max-w-6xl mx-auto">
        <GroupSessionRoom user={user} session={session} />
      </div>
    </div>
  );
}