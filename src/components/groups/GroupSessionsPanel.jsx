import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function GroupSessionsPanel({ user, groups, memberships }) {
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const queryClient = useQueryClient();

  const memberGroupIds = memberships.map((membership) => membership.group_id);
  const availableGroups = groups.filter((group) => memberGroupIds.includes(group.id) || group.leader_email === user?.email);

  const { data: sessions = [] } = useQuery({
    queryKey: ["groupSessions"],
    queryFn: () => base44.entities.GroupSession.list("-scheduled_at", 100),
    enabled: !!user,
  });

  const mySessions = useMemo(() => sessions.filter((session) => availableGroups.some((group) => group.id === session.group_id)), [sessions, availableGroups]);

  const createMutation = useMutation({
    mutationFn: () => base44.entities.GroupSession.create({
      group_id: groupId,
      host_email: user.email,
      title,
      description,
      scheduled_at: new Date(scheduledAt).toISOString(),
      is_active: false,
    }),
    onSuccess: () => {
      setGroupId("");
      setTitle("");
      setDescription("");
      setScheduledAt("");
      queryClient.invalidateQueries({ queryKey: ["groupSessions"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-[#121826] border border-white/10 rounded-3xl p-5 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white">Host a group session</h3>
          <p className="text-sm text-gray-400 mt-1">Create a private session for study, fellowship, or prayer.</p>
        </div>
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="w-full h-12 rounded-2xl bg-[#0F1524] border border-white/10 px-4 text-white focus:outline-none">
          <option value="">Choose a group</option>
          {availableGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Session title" className="w-full h-12 rounded-2xl bg-[#0F1524] border border-white/10 px-4 text-white placeholder:text-gray-500 focus:outline-none" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="w-full min-h-[96px] rounded-2xl bg-[#0F1524] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none" />
        <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="w-full h-12 rounded-2xl bg-[#0F1524] border border-white/10 px-4 text-white focus:outline-none" />
        <button onClick={() => createMutation.mutate()} disabled={!groupId || !title.trim() || !scheduledAt} className="px-5 py-3 rounded-2xl bg-[#00CFFF] text-black font-semibold disabled:opacity-50">Create session</button>
      </div>

      <div className="space-y-4">
        {mySessions.map((session) => {
          const group = availableGroups.find((entry) => entry.id === session.group_id);
          return (
            <div key={session.id} className="bg-[#121826] border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-white">{session.title}</div>
                <div className="text-sm text-gray-400 mt-1">{group?.name || "Group"}</div>
                {session.description && <div className="text-sm text-gray-500 mt-2">{session.description}</div>}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(session.scheduled_at).toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" /> {session.is_active ? "Live now" : "Scheduled"}</span>
                </div>
              </div>
              <Link to={createPageUrl("GroupSession") + `?id=${encodeURIComponent(session.id)}`} className="px-5 py-3 rounded-2xl bg-white text-black font-semibold hover:bg-gray-200 transition text-center">
                {session.is_active ? "Join room" : "Open room"}
              </Link>
            </div>
          );
        })}
        {mySessions.length === 0 && <div className="bg-[#121826] border border-white/10 rounded-3xl p-8 text-center text-gray-400">No group sessions yet.</div>}
      </div>
    </div>
  );
}