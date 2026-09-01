import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import GlowGroupsStats from "./groups/GlowGroupsStats";
import GlowGroupsToolbar from "./groups/GlowGroupsToolbar";
import GlowGroupsTable from "./groups/GlowGroupsTable";
import GroupDetailDrawer from "./groups/GroupDetailDrawer";
import { computeGroupActivity } from "./groups/groupActivity";
import { buildTerritoryScope, scopeGroups } from "@/lib/territoryScope";

export default function AdminGlowGroupsTab({ user, territoryRestricted, territoryCountries, territoryRegions, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  // Fetch groups, members, and messages in parallel
  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["admin_groups"],
    queryFn: () => base44.entities.GlowGroup.list(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["admin_group_members"],
    queryFn: () => base44.entities.GlowGroupMember.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin_group_messages"],
    queryFn: () => base44.entities.GlowGroupMessage.list("-created_date", 500),
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterActivity, setFilterActivity] = useState("all");
  const [filterPrivacy, setFilterPrivacy] = useState("all");
  const [sort, setSort] = useState({ key: "activityScore", dir: "desc" });
  const [detailGroup, setDetailGroup] = useState(null);

  // Territory scoping — honours both chosen countries and chosen regions.
  const scope = useMemo(
    () => buildTerritoryScope({ territoryRestricted, territoryApproved, territoryCountries, territoryRegions }),
    [territoryRestricted, territoryApproved, territoryCountries, territoryRegions]
  );
  const scopedGroups = useMemo(() => scopeGroups(scope, groups), [scope, groups]);

  // Build lookup maps once
  const { memberCountByGroup, lastMessageByGroup } = useMemo(() => {
    const mc = new Map();
    members.forEach(m => {
      if (!m.group_id) return;
      mc.set(m.group_id, (mc.get(m.group_id) || 0) + 1);
    });

    const lm = new Map();
    messages.forEach(msg => {
      if (!msg.group_id || !msg.created_date) return;
      const existing = lm.get(msg.group_id);
      if (!existing || new Date(msg.created_date) > new Date(existing)) {
        lm.set(msg.group_id, msg.created_date);
      }
    });

    return { memberCountByGroup: mc, lastMessageByGroup: lm };
  }, [members, messages]);

  // Enrich each group with activity + member count + last message
  const enrichedRows = useMemo(() => {
    return scopedGroups.map(g => {
      const memberCount = memberCountByGroup.get(g.id) || 0;
      const lastMessageAt = lastMessageByGroup.get(g.id) || null;
      const activity = computeGroupActivity({
        memberCount,
        lastMessageAt,
        groupCreatedAt: g.created_date,
      });
      return {
        group: g,
        memberCount,
        lastMessageAt,
        activity,
        activityScore: activity.score,
      };
    });
  }, [scopedGroups, memberCountByGroup, lastMessageByGroup]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalMembers = enrichedRows.reduce((sum, r) => sum + r.memberCount, 0);
    const countries = new Set(enrichedRows.map(r => r.group.country).filter(Boolean));
    const thrivingCount = enrichedRows.filter(r => r.activity.tier === "thriving").length;

    // Top leader by group count
    const leaderCounts = new Map();
    enrichedRows.forEach(r => {
      const email = r.group.leader_email;
      if (!email) return;
      leaderCounts.set(email, (leaderCounts.get(email) || 0) + 1);
    });
    let topLeader = null;
    leaderCounts.forEach((count, email) => {
      if (!topLeader || count > topLeader.groupCount) topLeader = { email, groupCount: count };
    });

    return {
      totalGroups: enrichedRows.length,
      totalMembers,
      countriesCount: countries.size,
      thrivingCount,
      topLeader,
    };
  }, [enrichedRows]);

  // Country list for filter
  const allCountries = useMemo(() => {
    const set = new Set(scopedGroups.map(g => g.country).filter(Boolean));
    return Array.from(set).sort();
  }, [scopedGroups]);

  // Filter + sort pipeline
  const displayedRows = useMemo(() => {
    const filtered = enrichedRows.filter(r => {
      const g = r.group;
      const matchesSearch = !search ||
        g.name?.toLowerCase().includes(search.toLowerCase()) ||
        g.leader_email?.toLowerCase().includes(search.toLowerCase()) ||
        (g.tags || "").toLowerCase().includes(search.toLowerCase());
      const matchesCountry = filterCountry === "all" || g.country === filterCountry;
      const matchesActivity = filterActivity === "all" || r.activity.tier === filterActivity;
      const matchesPrivacy = filterPrivacy === "all" || (g.privacy || "public") === filterPrivacy;
      return matchesSearch && matchesCountry && matchesActivity && matchesPrivacy;
    });

    return filtered.sort((a, b) => {
      const { key, dir } = sort;
      let av, bv;
      switch (key) {
        case "name":          av = (a.group.name || "").toLowerCase(); bv = (b.group.name || "").toLowerCase(); break;
        case "leader":        av = (a.group.leader_email || "").toLowerCase(); bv = (b.group.leader_email || "").toLowerCase(); break;
        case "country":       av = (a.group.country || "").toLowerCase(); bv = (b.group.country || "").toLowerCase(); break;
        case "members":       av = a.memberCount; bv = b.memberCount; break;
        case "privacy":       av = a.group.privacy || "public"; bv = b.group.privacy || "public"; break;
        case "activityScore": av = a.activityScore; bv = b.activityScore; break;
        case "lastMessageAt": av = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0; bv = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0; break;
        case "created_date":  av = new Date(a.group.created_date || 0).getTime(); bv = new Date(b.group.created_date || 0).getTime(); break;
        default: av = 0; bv = 0;
      }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [enrichedRows, search, filterCountry, filterActivity, filterPrivacy, sort]);

  const handleSort = (key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { key, dir: ["name", "leader", "country", "privacy"].includes(key) ? "asc" : "desc" }
    );
  };

  const handleViewGroup = (g) => {
    // Open details in a right-side drawer instead of a new browser tab.
    setDetailGroup(g);
  };

  const handleMessageLeader = (g) => {
    if (!g.leader_email) { toast.error("No leader email on record"); return; }
    window.location.href = `${createPageUrl("Messages")}?to=${encodeURIComponent(g.leader_email)}`;
  };

  const handleDeleteGroup = async (g) => {
    if (!window.confirm(`Permanently delete "${g.name}"? Members and messages will remain but the group will be removed.`)) return;
    try {
      await base44.entities.GlowGroup.delete(g.id);
      toast.success(`Deleted "${g.name}"`);
      queryClient.invalidateQueries({ queryKey: ["admin_groups"] });
    } catch (err) {
      toast.error(err?.message || "Failed to delete group");
    }
  };

  if (territoryRestricted && !territoryApproved) {
    return (
      <div className="border rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>
        Please confirm your territory first (Territory Setup — select your countries) to manage groups in your region.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>GlowGroups Management</h1>
        <p className="text-sm md:text-base mt-1" style={{ color: t.textSecondary }}>
          Monitor community groups, member engagement, and cell leaders globally.
        </p>
      </div>

      <GlowGroupsStats stats={stats} t={t} />

      <GlowGroupsToolbar
        search={search} setSearch={setSearch}
        filterCountry={filterCountry} setFilterCountry={setFilterCountry}
        filterActivity={filterActivity} setFilterActivity={setFilterActivity}
        filterPrivacy={filterPrivacy} setFilterPrivacy={setFilterPrivacy}
        allCountries={allCountries}
        t={t}
      />

      <p className="text-xs" style={{ color: t.textSecondary }}>
        Showing <span className="font-bold" style={{ color: t.textPrimary }}>{displayedRows.length}</span> of {enrichedRows.length} group{enrichedRows.length === 1 ? "" : "s"}
        {loadingGroups && <span className="ml-2" style={{ color: t.textMuted }}>· loading...</span>}
      </p>

      <GlowGroupsTable
        rows={displayedRows}
        sort={sort}
        onSort={handleSort}
        onViewGroup={handleViewGroup}
        onMessageLeader={handleMessageLeader}
        onDeleteGroup={handleDeleteGroup}
        isDark={isDark}
        t={t}
      />

      {detailGroup && (
        <GroupDetailDrawer group={detailGroup} onClose={() => setDetailGroup(null)} t={t} isDark={isDark} />
      )}
    </div>
  );
}