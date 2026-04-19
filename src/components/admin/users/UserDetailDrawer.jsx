import React, { useEffect, useState } from "react";
import { X, Loader2, User, Zap, Heart, FileText, Shield, Ban, CheckCircle2, Edit2, Trash2, Bell, MapPin, Calendar, Mail, Phone, Globe, Award, Users as UsersIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

function StatTile({ icon, label, value, color, t }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</div>
        <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: t.textMuted }}>{label}</p>
      </div>
      <p className="text-xl font-bold" style={{ color: t.textPrimary }}>{value}</p>
    </div>
  );
}

function OverviewTab({ data, t }) {
  const u = data.user;
  const s = data.stats;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {u.status === "suspended" && (
        <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-500">Account suspended</p>
            {u.suspended_reason && <p className="text-xs mt-0.5" style={{ color: t.textSecondary }}>Reason: {u.suspended_reason}</p>}
            {u.suspended_by && <p className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>By {u.suspended_by} · {u.suspended_at ? new Date(u.suspended_at).toLocaleDateString() : ""}</p>}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={<Zap size={14} />} label="Glow Score" value={s.total_drops > 0 ? u.glow_score : u.glow_score || 0} color="#FFD000" t={t} />
        <StatTile icon={<FileText size={14} />} label="Total Drops" value={s.total_drops} color="#00CFFF" t={t} />
        <StatTile icon={<Heart size={14} />} label="Likes Received" value={s.total_likes_received} color="#f43f5e" t={t} />
        <StatTile icon={<UsersIcon size={14} />} label="Groups Led" value={s.owned_groups} color="#8A5CFF" t={t} />
        <StatTile icon={<Award size={14} />} label="Streak" value={u.faith_streak_count || 0} color="#22c55e" t={t} />
        <StatTile icon={<Shield size={14} />} label="Prayers" value={s.prayer_requests} color="#06b6d4" t={t} />
      </div>

      {/* Profile fields */}
      <div className="rounded-xl p-4 border space-y-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        <h4 className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: t.textMuted }}>Profile</h4>
        {u.bio && <p className="text-sm italic" style={{ color: t.textSecondary }}>"{u.bio}"</p>}
        <div className="grid grid-cols-2 gap-3 text-xs mt-3">
          <div><span style={{ color: t.textMuted }}>Email: </span><span style={{ color: t.textPrimary }}>{u.email}</span></div>
          {u.phone && <div><span style={{ color: t.textMuted }}>Phone: </span><span style={{ color: t.textPrimary }}>{u.phone}</span></div>}
          {u.country && <div><span style={{ color: t.textMuted }}>Country: </span><span style={{ color: t.textPrimary }}>{u.country}</span></div>}
          {u.city && <div><span style={{ color: t.textMuted }}>City: </span><span style={{ color: t.textPrimary }}>{u.city}</span></div>}
          {u.gender && <div><span style={{ color: t.textMuted }}>Gender: </span><span style={{ color: t.textPrimary }}>{u.gender.replace(/_/g, " ")}</span></div>}
          {u.date_of_birth && <div><span style={{ color: t.textMuted }}>DOB: </span><span style={{ color: t.textPrimary }}>{u.date_of_birth}</span></div>}
          {u.pledge_signed && <div className="col-span-2 flex items-center gap-1.5" style={{ color: "#22c55e" }}><CheckCircle2 size={12} /> Pledge signed {u.pledge_signed_at && `on ${new Date(u.pledge_signed_at).toLocaleDateString()}`}</div>}
        </div>
      </div>

      {/* Territory */}
      {u.territory_name && (
        <div className="rounded-xl p-4 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
          <h4 className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: t.textMuted }}>Territory</h4>
          <div className="flex items-center gap-2 text-sm" style={{ color: t.textPrimary }}>
            <MapPin size={14} style={{ color: t.accent }} /> {u.territory_name}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: t.accentSoft, color: t.accent }}>{u.territory_status || "not set"}</span>
          </div>
          {u.territory_countries && <p className="text-xs mt-1" style={{ color: t.textSecondary }}>{u.territory_countries}</p>}
        </div>
      )}

      <div className="text-[10px] pt-2" style={{ color: t.textMuted }}>
        Joined {u.created_date ? new Date(u.created_date).toLocaleDateString() : "—"} · Last updated {u.updated_date ? new Date(u.updated_date).toLocaleDateString() : "—"}
      </div>
    </div>
  );
}

function DropsTab({ data, t }) {
  if (!data.recentDrops?.length) {
    return <p className="text-sm text-center py-8" style={{ color: t.textMuted }}>No drops yet.</p>;
  }
  return (
    <div className="space-y-2">
      {data.recentDrops.map(d => (
        <div key={d.id} className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: t.accent }}>{d.verse || "No verse"}</span>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full`} style={{
              background: d.status === "approved" ? "rgba(34,197,94,0.15)" : d.status === "pending" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
              color: d.status === "approved" ? "#22c55e" : d.status === "pending" ? "#f59e0b" : "#ef4444"
            }}>{d.status}</span>
          </div>
          <p className="text-xs" style={{ color: t.textSecondary }}>{d.reflection}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: t.textMuted }}>
            <span className="flex items-center gap-1"><Heart size={10} /> {d.likes_count}</span>
            {d.category && <span>#{d.category}</span>}
            <span>{d.created_date ? new Date(d.created_date).toLocaleDateString() : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditLogTab({ data, t }) {
  if (!data.auditLog?.length) {
    return <p className="text-sm text-center py-8" style={{ color: t.textMuted }}>No admin actions logged for this user yet.</p>;
  }

  const actionColor = (action) => {
    if (action.includes("deleted") || action.includes("suspended")) return "#ef4444";
    if (action.includes("activated") || action.includes("invited")) return "#22c55e";
    if (action.includes("role")) return "#8A5CFF";
    return "#00CFFF";
  };

  return (
    <div className="space-y-2">
      {data.auditLog.map(a => (
        <div key={a.id} className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${actionColor(a.action)}18`, color: actionColor(a.action) }}>
              {a.action.replace(/_/g, " ")}
            </span>
            <span className="text-[10px]" style={{ color: t.textMuted }}>{a.created_date ? new Date(a.created_date).toLocaleString() : ""}</span>
          </div>
          {a.details && <p className="text-xs" style={{ color: t.textSecondary }}>{a.details}</p>}
          <p className="text-[10px] mt-1" style={{ color: t.textMuted }}>By {a.admin_name || a.admin_email}</p>
        </div>
      ))}
    </div>
  );
}

export default function UserDetailDrawer({ targetUser, onClose, onEditRole, onSendNotification, onSuspendToggle, onDelete, t }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("adminGetUserDetail", { targetUserId: targetUser.id });
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [targetUser.id]);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "drops", label: `Drops (${data?.stats?.total_drops ?? 0})` },
    { key: "audit", label: `Audit Log (${data?.auditLog?.length ?? 0})` },
  ];

  return (
    <div className="fixed inset-0 z-[190] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full shadow-2xl overflow-y-auto" style={{ background: t.surface, borderLeft: `1px solid ${t.border}` }}>

        {/* Cover + header */}
        <div className="relative">
          <div className="h-24" style={{ background: data?.user?.cover_picture_url ? `url(${data.user.cover_picture_url}) center/cover` : t.gradient }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 -mt-10 relative">
          <img
            src={data?.user?.profile_picture_url || targetUser.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
            className="w-20 h-20 rounded-full border-4 object-cover"
            style={{ borderColor: t.surface }}
            alt=""
          />
          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold" style={{ color: t.textPrimary }}>{targetUser.full_name || "Unknown"}</h2>
              {data?.user?.role && data.user.role !== "user" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: t.accentSoft, color: t.accent }}>
                  {data.user.role === "ecd_admin" ? "ECD Admin" : data.user.role.replace(/_/g, " ")}
                </span>
              )}
              {data?.user?.status === "suspended" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                  <Ban size={10} /> Suspended
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: t.textMuted }}>{targetUser.email}</p>
          </div>

          {/* Quick actions row */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button onClick={onEditRole} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>
              <Edit2 size={12} /> Role
            </button>
            <button onClick={onSendNotification} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>
              <Bell size={12} /> Notify
            </button>
            <button onClick={onSuspendToggle} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition" style={data?.user?.status === "suspended" ? { borderColor: "rgba(34,197,94,0.4)", color: "#22c55e", background: "rgba(34,197,94,0.08)" } : { borderColor: "rgba(245,158,11,0.4)", color: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
              {data?.user?.status === "suspended" ? <><CheckCircle2 size={12} /> Reactivate</> : <><Ban size={12} /> Suspend</>}
            </button>
            <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition" style={{ borderColor: "rgba(239,68,68,0.4)", color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
              <Trash2 size={12} /> Remove
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border-b" style={{ borderColor: t.border }}>
            {tabs.map(tb => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className="px-4 py-2 text-xs font-bold transition relative"
                style={{ color: tab === tb.key ? t.accent : t.textMuted }}
              >
                {tb.label}
                {tab === tb.key && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: t.accent }} />}
              </button>
            ))}
          </div>

          <div className="py-5">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: t.accent }} /></div>
            ) : !data ? (
              <p className="text-sm text-center py-8 text-red-500">Failed to load user details.</p>
            ) : (
              <>
                {tab === "overview" && <OverviewTab data={data} t={t} />}
                {tab === "drops" && <DropsTab data={data} t={t} />}
                {tab === "audit" && <AuditLogTab data={data} t={t} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}