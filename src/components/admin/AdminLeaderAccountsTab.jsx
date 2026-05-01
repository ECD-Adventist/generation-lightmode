import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Edit3, Search, UserPlus, X, Camera, Shield, ChevronRight } from "lucide-react";
import { toast } from "sonner";
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
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition shrink-0"
          style={{ background: t.gradient, color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11,63,217,0.25)" }}
        >
          <Plus className="w-4 h-4" /> New Leader Account
        </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(account => (
            <div key={account.id} className="rounded-2xl p-5 transition" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: t.accentSoft, border: `1px solid ${t.border}` }}>
                  {account.leader_profile_picture_url ? (
                    <img src={account.leader_profile_picture_url} alt={account.leader_name} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5" style={{ color: t.textMuted }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold font-['Space_Grotesk'] truncate" style={{ color: t.textPrimary }}>{account.leader_name}</h3>
                    {account.active === false && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>INACTIVE</span>
                    )}
                  </div>
                  {account.leader_title && <p className="text-xs font-semibold truncate" style={{ color: t.accent }}>{account.leader_title}</p>}
                  <p className="text-[11px] truncate mt-0.5" style={{ color: t.textMuted }}>{account.leader_email}</p>
                </div>
              </div>

              {account.leader_country && (
                <p className="text-[11px] mb-2" style={{ color: t.textSecondary }}>📍 {account.leader_country}</p>
              )}

              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.textMuted }}>
                  Managers ({(account.manager_emails || []).length}/3)
                </p>
                {(account.manager_emails || []).length === 0 ? (
                  <p className="text-xs italic" style={{ color: t.textMuted }}>No managers assigned</p>
                ) : (
                  <div className="space-y-1">
                    {account.manager_emails.map((email, i) => (
                      <div key={i} className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2" style={{ background: t.appBg, color: t.textSecondary }}>
                        <UserPlus className="w-3 h-3 shrink-0" style={{ color: t.accent }} />
                        <span className="truncate">{email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition"
                  style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.border}` }}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(account)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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