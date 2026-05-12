import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Edit3, Search, UserPlus, Camera, Shield, FileText, UsersRound, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import LeaderAccountFormModal from "./leader-accounts/LeaderAccountFormModal";

export default function AdminLeaderAccountsTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [autoFollowingId, setAutoFollowingId] = useState(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["managedLeaderAccounts"],
    queryFn: () => base44.entities.ManagedLeaderAccount.list("-created_date"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ManagedLeaderAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managedLeaderAccounts"] });
      toast.success("Account deleted");
    },
    onError: (e) => toast.error(e?.message || "Could not delete"),
  });

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(a =>
      (a.leader_name || "").toLowerCase().includes(q) ||
      (a.leader_email || "").toLowerCase().includes(q) ||
      (a.leader_title || "").toLowerCase().includes(q) ||
      (a.manager_emails || []).some(m => m.toLowerCase().includes(q))
    );
  }, [accounts, search]);

  const handleEdit = (account) => {
    setEditing(account);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleDelete = (account) => {
    if (!confirm(`Delete the account for ${account.leader_name}? This cannot be undone.`)) return;
    deleteMutation.mutate(account.id);
  };

  const handleAutoFollow = async (account) => {
    if (!confirm(`Make all registered users follow ${account.leader_name}? Existing followers will be skipped.`)) return;
    setAutoFollowingId(account.id);
    try {
      const response = await base44.functions.invoke("adminMakeUsersFollowLeader", {
        leader_email: account.leader_email,
      });
      const result = response.data || {};
      toast.success(`Auto-follow complete: ${result.created || 0} new follower${result.created === 1 ? "" : "s"} added.`);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || "Auto-follow failed");
    } finally {
      setAutoFollowingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: t.accent }}>Control Center</p>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Administrators Accounts</h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            Create leader identities and assign up to 3 admins/users who can post on their behalf. Posts will appear under the leader's name.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            to={`${createPageUrl("AdminCenter")}?tab=leader-posts`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition"
            style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.border}` }}
          >
            <FileText className="w-4 h-4" /> Manage Leader Posts
          </Link>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition"
            style={{ background: t.gradient, color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11,63,217,0.25)" }}
          >
            <Plus className="w-4 h-4" /> New Leader Account
          </button>
        </div>
      </div>

      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by leader name, email, or manager..."
          className="w-full pl-9 pr-3 h-10 rounded-xl text-sm focus:outline-none"
          style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.textPrimary }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin" style={{ color: t.accent }} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: t.surface, border: `1px dashed ${t.border}` }}>
          <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: t.textMuted }} />
          <p className="font-bold" style={{ color: t.textPrimary }}>No leader accounts yet</p>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>Create one to let admins post on behalf of leaders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(account => (
            <div key={account.id} className="rounded-[24px] p-6 relative overflow-hidden group break-inside-avoid flex flex-col" style={{ 
              background: "linear-gradient(180deg, rgba(0, 207, 255, 0.15) 0%, rgba(22, 29, 43, 1) 35%)",
              backgroundColor: "#161D2B",
              border: "1px solid rgba(255, 255, 255, 0.06)", 
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)"
            }}>
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.08) 100%)" }} />

              {/* Avatar Section */}
              <div className="relative w-[140px] h-[140px] mx-auto mb-6 mt-2 shrink-0">
                {/* Glowing gradient ring */}
                <div className="absolute inset-[-6px] rounded-full" style={{ background: "linear-gradient(180deg, #00CFFF 0%, #8A5CFF 60%, transparent 100%)", opacity: 0.9 }} />
                <div className="absolute inset-0 rounded-full" style={{ background: "#161D2B" }} />
                <div className="absolute inset-[5px] rounded-full overflow-hidden bg-[#1A2235]">
                  {account.leader_profile_picture_url ? (
                    <img src={account.leader_profile_picture_url} alt={account.leader_name} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 m-auto mt-[50px] text-[#C8D0E0] opacity-50" />
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 relative flex flex-col items-center text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="font-bold text-[22px] leading-tight" style={{ color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {account.leader_name}
                  </h3>
                  {account.active === false && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>INACTIVE</span>
                  )}
                </div>
                
                <p className="text-[14px] mb-4 text-[#C8D0E0]" style={{ fontFamily: "Inter, sans-serif", minHeight: "42px" }}>
                  {account.leader_bio ? (account.leader_bio.length > 80 ? account.leader_bio.substring(0, 80) + '...' : account.leader_bio) : "No bio provided."}
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {account.leader_title && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold inline-block" style={{ background: "rgba(255, 255, 255, 0.05)", color: "#C8D0E0", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                      {account.leader_title}
                    </span>
                  )}
                  {account.leader_country && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold inline-block" style={{ background: "rgba(255, 255, 255, 0.05)", color: "#C8D0E0", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                      📍 {account.leader_country}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold inline-block" style={{ background: "rgba(255, 255, 255, 0.05)", color: "#C8D0E0", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    👥 {(account.manager_emails || []).length} Manager{((account.manager_emails || []).length !== 1) ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Action Icons Strip */}
              <div className="flex items-center justify-center gap-2 pt-4 mt-auto border-t border-[rgba(255,255,255,0.06)] relative z-10">
                <a
                  href={`mailto:${account.leader_email}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-[rgba(255,255,255,0.08)] group/btn"
                  title={`Email ${account.leader_name} (${account.leader_email})`}
                >
                  <Mail className="w-5 h-5 text-[#C8D0E0] group-hover/btn:text-[#00CFFF]" strokeWidth={1.5} />
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://generationlightmode.com/leader/${account.id}`);
                    toast.success("Profile link copied");
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-[rgba(255,255,255,0.08)] group/btn"
                  title="Copy Profile Link"
                >
                  <Share2 className="w-5 h-5 text-[#C8D0E0] group-hover/btn:text-[#00CFFF]" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleEdit(account)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-[rgba(255,255,255,0.08)] group/btn"
                  title="Edit Account"
                >
                  <Edit3 className="w-5 h-5 text-[#C8D0E0] group-hover/btn:text-[#00CFFF]" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleAutoFollow(account)}
                  disabled={autoFollowingId === account.id || account.active === false}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-50 group/btn"
                  title="Auto-Follow: Make users follow this leader"
                >
                  {autoFollowingId === account.id ? <Loader2 className="w-5 h-5 animate-spin text-[#C8D0E0]" strokeWidth={1.5} /> : <UsersRound className="w-5 h-5 text-[#C8D0E0] group-hover/btn:text-[#00CFFF]" strokeWidth={1.5} />}
                </button>
                <button
                  onClick={() => handleDelete(account)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-[rgba(239,68,68,0.15)] group/btn"
                  title="Delete Account"
                >
                  <Trash2 className="w-5 h-5 text-[#C8D0E0] group-hover/btn:text-[#EF4444]" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <LeaderAccountFormModal
          account={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ["managedLeaderAccounts"] });
          }}
        />
      )}
    </div>
  );
}