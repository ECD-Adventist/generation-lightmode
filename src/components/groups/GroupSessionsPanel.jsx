import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function GroupSessionsPanel({ user, groups, memberships }) {
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const queryClient = useQueryClient();
  const memberGroupIds = memberships.map(m => m.group_id);
  const availableGroups = groups.filter(g => memberGroupIds.includes(g.id) || g.leader_email === user?.email);
  // Only group leaders are allowed to create sessions (enforced by data permissions).
  const hostableGroups = availableGroups.filter(g => g.leader_email === user?.email);
  const { data: sessions = [] } = useQuery({ queryKey: ["groupSessions"], queryFn: () => base44.entities.GroupSession.list("-scheduled_at", 100), enabled: !!user });
  const mySessions = useMemo(() => sessions.filter(s => availableGroups.some(g => g.id === s.group_id)), [sessions, availableGroups]);

  const createMutation = useMutation({
    mutationFn: () => base44.entities.GroupSession.create({ group_id: groupId, host_email: user.email, title, description, scheduled_at: new Date(scheduledAt).toISOString(), is_active: false }),
    onSuccess: () => {
      setGroupId(""); setTitle(""); setDescription(""); setScheduledAt("");
      queryClient.invalidateQueries({ queryKey: ["groupSessions"] });
      toast.success("Session created! It now appears below. 🎥");
    },
    onError: () => {
      toast.error("Couldn't create the session. Only the group's leader can host sessions — make sure you lead this group and try again.");
    }
  });

  const inputStyle = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };
  const cardStyle = { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };

  return (
    <div className="space-y-6 font-['Inter']">
      <div className="rounded-[1.75rem] p-5 space-y-4" style={cardStyle}>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "#0B1B3D" }}>Host a group session</h3>
          <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Create a private session for study, fellowship, or prayer.</p>
        </div>
        <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full h-12 rounded-2xl px-4 focus:outline-none" style={inputStyle}>
          <option value="">{hostableGroups.length === 0 ? "You don't lead any groups yet" : "Choose a group"}</option>
          {hostableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Session title" className="w-full h-12 rounded-2xl px-4 focus:outline-none" style={inputStyle} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full min-h-[96px] rounded-2xl px-4 py-3 focus:outline-none" style={inputStyle} />
        <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="w-full h-12 rounded-2xl px-4 focus:outline-none" style={inputStyle} />
        <button onClick={() => createMutation.mutate()} disabled={!groupId || !title.trim() || !scheduledAt || createMutation.isPending} className="px-5 py-3 rounded-2xl font-semibold disabled:opacity-50" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>{createMutation.isPending ? "Creating…" : "Create session"}</button>
      </div>

      <div className="space-y-4">
        {mySessions.map(session => {
          const group = availableGroups.find(g => g.id === session.group_id);
          return (
            <div key={session.id} className="rounded-[1.75rem] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={cardStyle}>
              <div>
                <div className="text-lg font-bold" style={{ color: "#0B1B3D" }}>{session.title}</div>
                <div className="text-sm mt-1" style={{ color: "#6B7FA0" }}>{group?.name || "Group"}</div>
                {session.description && <div className="text-sm mt-2" style={{ color: "#8A97B5" }}>{session.description}</div>}
                <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: "#8A97B5" }}>
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(session.scheduled_at).toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" /> {session.is_active ? "Live now" : "Scheduled"}</span>
                </div>
              </div>
              <Link to={createPageUrl("GroupSession") + `?id=${encodeURIComponent(session.id)}`} className="px-5 py-3 rounded-2xl font-semibold transition text-center" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
                {session.is_active ? "Join room" : "Open room"}
              </Link>
            </div>
          );
        })}
        {mySessions.length === 0 && <div className="rounded-[1.75rem] p-8 text-center" style={{ ...cardStyle, color: "#8A97B5" }}>No group sessions yet.</div>}
      </div>
    </div>
  );
}