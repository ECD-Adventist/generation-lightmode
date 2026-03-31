import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Zap, Trophy, CheckCircle, XCircle, Clock, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_STYLES = {
  pending: { label: "Pending Approval", color: "#FFD000", bg: "bg-[#FFD000]/10 border-[#FFD000]/20", icon: Clock },
  approved: { label: "Active", color: "#22c55e", bg: "bg-green-500/10 border-green-500/20", icon: CheckCircle },
  rejected: { label: "Rejected", color: "#ef4444", bg: "bg-red-500/10 border-red-500/20", icon: XCircle },
};

function CreateChallengeModal({ onClose, onSubmit, currentUser, saving }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    territory_scope: currentUser?.territory_name || currentUser?.country || "",
    territory_level: currentUser?.territory_level || "country",
    metric: "glow_score",
    start_date: "",
    end_date: "",
    points_reward: 100,
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><Target size={18} className="text-[#00CFFF]" /> Create Territory Challenge</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Challenge Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Highest GlowScore Growth in Nairobi" className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00CFFF]/40" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} placeholder="Describe the challenge..." className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-[#00CFFF]/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Territory Scope</label>
              <input value={form.territory_scope} onChange={e => setForm(p => ({...p, territory_scope: e.target.value}))} placeholder="e.g. Nairobi" className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00CFFF]/40" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Metric</label>
              <select value={form.metric} onChange={e => setForm(p => ({...p, metric: e.target.value}))} className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                <option value="glow_score">Glow Score (XP)</option>
                <option value="drops">Glow Drops</option>
                <option value="followers">Followers</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(p => ({...p, start_date: e.target.value}))} className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none [color-scheme:dark]" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Points Reward</label>
            <input type="number" value={form.points_reward} onChange={e => setForm(p => ({...p, points_reward: Number(e.target.value)}))} className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00CFFF]/40" />
          </div>
          <p className="text-xs text-[#FFD000] bg-[#FFD000]/10 border border-[#FFD000]/20 rounded-lg px-3 py-2">
            ⚠️ Territory challenges require Super Admin approval before going live.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white bg-white/5 text-sm">Cancel</button>
          <button onClick={() => onSubmit(form)} disabled={saving || !form.title} className="px-5 py-2 rounded-xl bg-[#00CFFF] text-black font-bold text-sm hover:bg-[#00CFFF]/80 transition disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}

function TerritoryLeaderboard({ challenge, allUsers, drops }) {
  const leaderboard = useMemo(() => {
    const scopedUsers = allUsers.filter(u =>
      (u.territory_name === challenge.territory_scope || u.country === challenge.territory_scope || u.city === challenge.territory_scope)
    );

    return scopedUsers.map(u => {
      let score = 0;
      if (challenge.metric === "glow_score") score = u.glow_score || 0;
      else if (challenge.metric === "drops") score = drops.filter(d => d.user_email === u.email).length;
      else if (challenge.metric === "followers") score = u.followers_count || 0;
      return { name: u.full_name || u.email.split("@")[0], email: u.email, score, avatar: u.profile_picture_url };
    }).sort((a, b) => b.score - a.score).slice(0, 10);
  }, [challenge, allUsers, drops]);

  if (leaderboard.length === 0) return <p className="text-gray-500 text-xs text-center py-4">No participants in this territory yet.</p>;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Territory Leaderboard · {challenge.territory_scope}</p>
      {leaderboard.map((u, i) => (
        <div key={u.email} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
          <span className="w-5 text-xs font-black text-center" style={{ color: i === 0 ? "#FFD000" : i === 1 ? "#C8D0E0" : i === 2 ? "#C77A2B" : "#4B5563" }}>
            {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
          </span>
          <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 shrink-0">
            <img src={u.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
          </div>
          <span className="flex-1 text-sm text-white truncate">{u.name}</span>
          <span className="text-xs font-bold text-[#FFD000] flex items-center gap-1"><Zap size={10} />{u.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminTerritoryChallengesTab({ currentUser }) {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const { data: challenges = [] } = useQuery({
    queryKey: ["territory_challenges"],
    queryFn: () => base44.entities.Challenge.list("-created_date"),
  });
  const { data: allUsers = [] } = useQuery({
    queryKey: ["tc_users"],
    queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(r => r.data || []),
  });
  const { data: drops = [] } = useQuery({
    queryKey: ["tc_drops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  // Filter: territory challenges have territory_scope field
  const territoryChallenges = challenges.filter(c => c.territory_scope);

  const approveMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Challenge.update(id, { active: status === "approved" }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["territory_challenges"] });
      toast.success(vars.status === "approved" ? "Challenge approved & activated!" : "Challenge rejected.");
    }
  });

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await base44.entities.Challenge.create({
        title: form.title,
        description: form.description,
        territory_scope: form.territory_scope,
        territory_metric: form.metric,
        start_date: form.start_date,
        end_date: form.end_date,
        points_reward: form.points_reward,
        active: false, // pending super admin approval
      });
      toast.success("Challenge submitted for Super Admin approval!");
      queryClient.invalidateQueries({ queryKey: ["territory_challenges"] });

      // Notify super admins
      const superAdmins = allUsers.filter(u => u.role === "super_admin");
      await Promise.all(superAdmins.map(sa =>
        base44.entities.Notification.create({
          user_email: sa.email,
          type: "system",
          message: `New territory challenge "${form.title}" submitted for approval by ${currentUser?.full_name || currentUser?.email}.`,
          link: "/AdminCenter?tab=territory-challenges",
        })
      ));
      setShowCreate(false);
    } catch (err) {
      toast.error("Failed to create challenge: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white mb-1">🎯 Territory Challenges</h1>
          <p className="text-gray-400 text-sm">Create territory-scoped challenges. Super Admin approval required before going live.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00CFFF] text-black font-bold text-sm hover:bg-[#00CFFF]/80 transition">
          <Plus size={16} /> New Challenge
        </button>
      </div>

      {showCreate && (
        <CreateChallengeModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} currentUser={currentUser} saving={saving} />
      )}

      {territoryChallenges.length === 0 ? (
        <div className="text-center py-20 bg-[#121826] border border-white/5 rounded-2xl">
          <Target size={40} className="mx-auto text-gray-600 mb-4" />
          <p className="font-bold text-lg text-gray-400">No territory challenges yet.</p>
          <p className="text-sm text-gray-500 mt-1">Create the first challenge for your territory.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending approval section (super admin only) */}
          {isSuperAdmin && territoryChallenges.filter(c => !c.active).length > 0 && (
            <div className="bg-[#FFD000]/5 border border-[#FFD000]/20 rounded-2xl p-4">
              <p className="text-[#FFD000] font-bold text-sm mb-3 flex items-center gap-2"><Clock size={14} /> Pending Approval ({territoryChallenges.filter(c => !c.active).length})</p>
              <div className="space-y-3">
                {territoryChallenges.filter(c => !c.active).map(ch => (
                  <div key={ch.id} className="flex items-center justify-between gap-4 bg-[#121826] rounded-xl p-4 border border-white/5">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm">{ch.title}</p>
                      <p className="text-xs text-gray-400">{ch.territory_scope} · {ch.territory_metric || "glow_score"}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => approveMutation.mutate({ id: ch.id, status: "approved" })} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold hover:bg-green-500/30 transition flex items-center gap-1">
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button onClick={() => approveMutation.mutate({ id: ch.id, status: "rejected" })} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition flex items-center gap-1">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active challenges with leaderboard */}
          {territoryChallenges.filter(c => c.active).map(ch => (
            <div key={ch.id} className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
              <button onClick={() => setExpanded(expanded === ch.id ? null : ch.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <Trophy size={18} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{ch.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400">{ch.territory_scope}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-bold">ACTIVE</span>
                    {ch.end_date && <span className="text-[10px] text-gray-500">Ends {format(new Date(ch.end_date), "MMM d, yyyy")}</span>}
                  </div>
                </div>
                <Users size={16} className="text-gray-500 shrink-0" />
              </button>
              {expanded === ch.id && (
                <div className="px-5 pb-5 border-t border-white/5">
                  {ch.description && <p className="text-sm text-gray-400 mt-4 mb-2">{ch.description}</p>}
                  <TerritoryLeaderboard challenge={ch} allUsers={allUsers} drops={drops} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}