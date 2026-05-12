import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Search, ExternalLink, Shield, Filter } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

/**
 * Lists every Glow Drop posted under a Managed Leader Account identity.
 * Lets admins/super-admins filter by leader, search the content, and delete posts.
 */
export default function AdminLeaderPostsTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [leaderFilter, setLeaderFilter] = useState("all");

  const { data: accounts = [] } = useQuery({
    queryKey: ["managedLeaderAccounts"],
    queryFn: () => base44.entities.ManagedLeaderAccount.list("-created_date"),
  });

  // Pull a generous slice of recent drops; we then filter to those under leader identities.
  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["leaderPostsAll"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const leaderEmails = useMemo(() => new Set(accounts.map(a => a.leader_email)), [accounts]);
  const accountsByEmail = useMemo(() => {
    const m = {};
    accounts.forEach(a => { m[a.leader_email] = a; });
    return m;
  }, [accounts]);

  const leaderPosts = useMemo(() => {
    return drops.filter(d => leaderEmails.has(d.user_email));
  }, [drops, leaderEmails]);

  const filtered = useMemo(() => {
    let list = leaderPosts;
    if (leaderFilter !== "all") {
      list = list.filter(d => d.user_email === leaderFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        (d.verse || "").toLowerCase().includes(q) ||
        (d.reflection || "").toLowerCase().includes(q) ||
        (d.hashtags || "").toLowerCase().includes(q) ||
        (accountsByEmail[d.user_email]?.leader_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [leaderPosts, leaderFilter, search, accountsByEmail]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GlowDrop.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderPostsAll"] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Post deleted");
    },
    onError: (e) => toast.error(e?.message || "Could not delete"),
  });

  const handleDelete = (drop) => {
    const account = accountsByEmail[drop.user_email];
    const label = account?.leader_name || drop.user_email;
    if (!confirm(`Delete this post from ${label}? This cannot be undone.`)) return;
    deleteMutation.mutate(drop.id);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: t.accent }}>Control Center</p>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Leader Posts</h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            All Glow Drops published under managed leader identities. Delete posts on behalf of leaders here.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by verse, reflection, hashtag, or leader…"
            className="w-full pl-9 pr-3 h-10 rounded-xl text-sm focus:outline-none"
            style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.textPrimary }}
          />
        </div>
        <div className="relative md:w-72">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: t.textMuted }} />
          <select
            value={leaderFilter}
            onChange={(e) => setLeaderFilter(e.target.value)}
            className="w-full pl-9 pr-8 h-10 rounded-xl text-sm focus:outline-none appearance-none"
            style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.textPrimary }}
          >
            <option value="all">All leaders ({accounts.length})</option>
            {accounts.map(a => (
              <option key={a.id} value={a.leader_email}>{a.leader_name}{a.leader_title ? ` — ${a.leader_title}` : ""}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin" style={{ color: t.accent }} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: t.surface, border: `1px dashed ${t.border}` }}>
          <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: t.textMuted }} />
          <p className="font-bold" style={{ color: t.textPrimary }}>
            {leaderPosts.length === 0 ? "No leader posts yet" : "No posts match your filters"}
          </p>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            {leaderPosts.length === 0 ? "When managers post on behalf of a leader, those posts will appear here." : "Try clearing the search or selecting a different leader."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(drop => {
            const account = accountsByEmail[drop.user_email];
            return (
              <div key={drop.id} className="rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden group" style={{ 
                background: isDark 
                  ? "linear-gradient(180deg, rgba(0, 207, 255, 0.04) 0%, rgba(15, 20, 33, 1) 100%)"
                  : `linear-gradient(180deg, ${t.surfaceAlt} 0%, ${t.surface} 100%)`,
                backgroundColor: t.surface,
                border: `1px solid ${t.border}`,
                boxShadow: t.shadow
              }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: isDark ? "linear-gradient(180deg, rgba(0,207,255,0.05) 0%, rgba(138,92,255,0.05) 100%)" : `linear-gradient(180deg, ${t.accentSoft} 0%, transparent 100%)` }} />
                
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center relative z-10" style={{ background: t.surfaceMuted, border: `1px solid ${t.border}` }}>
                  {account?.leader_profile_picture_url ? (
                    <img src={account.leader_profile_picture_url} alt={account.leader_name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-5 h-5" style={{ color: t.textMuted }} />
                  )}
                </div>

                <div className="min-w-0 flex-1 relative z-10">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{account?.leader_name || drop.user_email}</span>
                    {account?.leader_title && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: t.accentSoft, color: t.accent }}>{account.leader_title}</span>}
                    <span className="text-[11px]" style={{ color: t.textMuted }}>
                      · {drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith("Z") ? drop.created_date : drop.created_date + "Z"), { addSuffix: true }) : ""}
                    </span>
                  </div>

                  {drop.verse && <p className="text-sm font-bold mb-1 line-clamp-1" style={{ color: t.accent }}>{drop.verse}</p>}
                  {drop.reflection && <p className="text-sm line-clamp-3" style={{ color: t.textSecondary }}>{drop.reflection.replace(/<[^>]*>/g, " ")}</p>}

                  <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: t.textMuted }}>
                    {typeof drop.likes_count === "number" && <span>❤ {drop.likes_count}</span>}
                    {drop.category && <span className="px-2 py-0.5 rounded-full" style={{ background: t.appBg, color: t.textSecondary }}>{drop.category}</span>}
                    {drop.hashtags && <span className="truncate max-w-[300px]">{drop.hashtags}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 relative z-10">
                  <Link
                    to={`${createPageUrl("Post")}?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
                    target="_blank"
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition hover:opacity-80`}
                    style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${isDark ? t.border : t.borderStrong}` }}
                    title="Open post"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(drop)}
                    disabled={deleteMutation.isPending}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition disabled:opacity-50 hover:opacity-80`}
                    style={{ background: t.dangerSoft, color: t.danger, border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.4)'}` }}
                    title="Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}