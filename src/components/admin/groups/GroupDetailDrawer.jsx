import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Users, Globe, Lock, Unlock, Mail, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";

function Row({ label, value, t }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2" style={{ borderBottom: `1px solid ${t.border}` }}>
      <span className="text-[11px] uppercase tracking-wider shrink-0" style={{ color: t.textMuted }}>{label}</span>
      <span className="text-sm text-right break-words" style={{ color: t.textPrimary }}>{value || "—"}</span>
    </div>
  );
}

export default function GroupDetailDrawer({ group, onClose, t, isDark }) {
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["group_drawer_members", group?.id],
    queryFn: () => base44.entities.GlowGroupMember.filter({ group_id: group.id }, "-created_date", 200),
    enabled: !!group?.id,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["group_drawer_messages", group?.id],
    queryFn: () => base44.entities.GlowGroupMessage.filter({ group_id: group.id }, "-created_date", 20),
    enabled: !!group?.id,
  });

  if (!group) return null;
  const isPrivate = (group.privacy || "public") === "private";

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(4,8,18,0.55)" }} onClick={onClose} />
      <aside
        className="relative h-full w-full max-w-md overflow-y-auto shadow-2xl"
        style={{ background: t.surface, borderLeft: `1px solid ${t.border}` }}
      >
        <div className="sticky top-0 z-10 px-5 py-4 flex items-start justify-between gap-3 backdrop-blur-xl"
             style={{ background: isDark ? "rgba(11,15,26,0.92)" : "rgba(255,255,255,0.92)", borderBottom: `1px solid ${t.border}` }}>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: t.accent }}>Group Details</p>
            <h2 className="text-lg font-bold font-['Space_Grotesk'] truncate" style={{ color: t.textPrimary }}>{group.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition hover:opacity-70" style={{ background: t.surfaceMuted, color: t.textSecondary }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {group.cover_picture_url && (
            <img src={group.cover_picture_url} alt="" className="w-full h-32 object-cover rounded-xl border" style={{ borderColor: t.border }} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-xl p-3" style={{ background: t.surfaceMuted, borderColor: t.border }}>
              <p className="text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: t.textMuted }}><Users size={11} /> Members</p>
              <p className="text-xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{loadingMembers ? "…" : members.length}</p>
            </div>
            <div className="border rounded-xl p-3" style={{ background: t.surfaceMuted, borderColor: t.border }}>
              <p className="text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: t.textMuted }}><MessageSquare size={11} /> Recent Messages</p>
              <p className="text-xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{loadingMessages ? "…" : messages.length}</p>
            </div>
          </div>

          <div>
            <Row label="Country" value={<span className="inline-flex items-center gap-1.5"><Globe size={12} style={{ color: t.accent }} />{group.country}</span>} t={t} />
            <Row label="Leader" value={<span className="inline-flex items-center gap-1.5"><Mail size={12} style={{ color: t.accent }} />{group.leader_email}</span>} t={t} />
            <Row label="Privacy" value={<span className="inline-flex items-center gap-1.5">{isPrivate ? <Lock size={12} /> : <Unlock size={12} />}{isPrivate ? "Private" : "Public"}</span>} t={t} />
            <Row label="Tags" value={group.tags} t={t} />
            <Row label="Created" value={group.created_date ? format(new Date(group.created_date), "MMM d, yyyy") : null} t={t} />
          </div>

          {group.description && (
            <div>
              <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>{group.description}</p>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Members</p>
            {loadingMembers ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: t.accent }} />
            ) : members.length === 0 ? (
              <p className="text-sm" style={{ color: t.textMuted }}>No members yet.</p>
            ) : (
              <div className="border rounded-xl divide-y max-h-64 overflow-y-auto" style={{ borderColor: t.border }}>
                {members.map(m => (
                  <div key={m.id} className="px-3 py-2 flex items-center justify-between gap-2" style={{ borderColor: t.border }}>
                    <span className="text-xs truncate" style={{ color: t.textPrimary }}>{m.user_email}</span>
                    <span className="text-[10px] font-bold uppercase shrink-0" style={{ color: t.textMuted }}>{(m.role || "member").replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Latest Activity</p>
            {loadingMessages ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: t.accent }} />
            ) : messages.length === 0 ? (
              <p className="text-sm" style={{ color: t.textMuted }}>No messages yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {messages.map(msg => (
                  <div key={msg.id} className="border rounded-xl px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                    <p className="text-[10px] mb-0.5" style={{ color: t.textMuted }}>
                      {msg.user_email}{msg.created_date ? ` · ${format(new Date(msg.created_date), "MMM d, HH:mm")}` : ""}
                    </p>
                    <p className="text-xs break-words" style={{ color: t.textSecondary }}>{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}