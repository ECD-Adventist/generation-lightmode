import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Search, Edit2, Trash2, Shield, Loader2, Calendar, Users, Activity,
  Filter, MapPin, Zap, AlertCircle, Mail, X, Check, User, Clock, Map,
  CheckSquare, Square, RefreshCw, Ban, Download, UserPlus, MoreVertical,
  ArrowUp, ArrowDown, ChevronsUpDown, AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import UserDetailDrawer from "./users/UserDetailDrawer";
import InviteUserModal from "./users/InviteUserModal";
import SuspendUserModal from "./users/SuspendUserModal";
import RoleElevationConfirm from "./users/RoleElevationConfirm";
import DeleteUserModal from "./users/DeleteUserModal";
import SendNotificationModal from "./users/SendNotificationModal";
import UserQuickActionsMenu from "./users/UserQuickActionsMenu";
import { exportUsersToCsv } from "./users/exportUsersCsv";
import FilterPresets from "./users/FilterPresets";
import UsersPagination from "./users/UsersPagination";
import BulkActionsBar from "./users/BulkActionsBar";
import BulkSuspendModal from "./users/BulkSuspendModal";
import BulkRoleModal from "./users/BulkRoleModal";
import BulkNotifyModal from "./users/BulkNotifyModal";
import UserActivityDot from "./users/UserActivityDot";
import VerificationBadges from "./users/VerificationBadges";
import EngagementMeter from "./users/EngagementMeter";
import { computeEngagementScore } from "./users/userEngagement";
import ProfileCompletenessBar from "./users/ProfileCompletenessBar";
import TerritoryQuickView from "./users/TerritoryQuickView";
import DuplicateRowBadge from "./users/DuplicateRowBadge";
import DuplicateDetectionPanel from "./users/DuplicateDetectionPanel";
import CohortRetentionGrid from "./users/CohortRetentionGrid";
import UsersHeatmap from "./users/UsersHeatmap";
import ViewModeToggle from "./users/ViewModeToggle";
import { detectDuplicates, buildDuplicateSuspectSet, computeProfileCompleteness } from "./users/userAnalytics";

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function roleColor(role, isDark) {
  switch (role) {
    case "super_admin": return isDark ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-700 border-purple-200";
    case "admin":
    case "ecd_admin":
    case "country_admin":
    case "union_admin":
    case "conference_field_admin":
    case "church_admin":
      return isDark ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-700 border-red-200";
    case "ecd_officer":
    case "union_officer":
    case "conference_field_officer":
    case "church_officer":
      return isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-700 border-blue-200";
    case "moderator": return isDark ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-700 border-orange-200";
    case "missionary": return isDark ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-green-100 text-green-700 border-green-200";
    case "GlowGroup Leader": return isDark ? "bg-[#00CFFF]/20 text-[#00CFFF] border-[#00CFFF]/30" : "bg-blue-100 text-blue-700 border-blue-200";
    default: return isDark ? "bg-white/5 text-gray-400 border-white/10" : "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function EditRoleModal({ targetUser, allRoles, onClose, onSave, t, isDark }) {
  const [role, setRole] = useState(targetUser.role || "user");
  const [saving, setSaving] = useState(false);
  const trackBg = isDark ? "rgba(255,255,255,0.04)" : "#EEF3FC";
  const thumbBg = "linear-gradient(180deg, #1FB8FF, #0B3FD9)";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
      <style>{`
        .admin-role-scroll::-webkit-scrollbar { width: 6px; }
        .admin-role-scroll::-webkit-scrollbar-track { background: ${trackBg}; border-radius: 3px; }
        .admin-role-scroll::-webkit-scrollbar-thumb { background: ${thumbBg}; border-radius: 3px; }
      `}</style>
      <div className="border rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg" style={{ color: t.textPrimary }}>Edit Role</h3>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: t.textMuted }}><X size={18} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: t.textSecondary }}>
          Changing role for <span className="font-semibold" style={{ color: t.textPrimary }}>{targetUser.full_name || targetUser.email}</span>
        </p>
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-2 admin-role-scroll">
          {allRoles.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition"
              style={role === r
                ? { background: t.accentSoft, borderColor: t.borderStrong, color: t.accent }
                : { background: "transparent", borderColor: t.border, color: t.textSecondary }}
            >
              <Shield size={14} />
              <span>{r === "ecd_admin" ? "ECD Admin" : r === "ecd_officer" ? "ECD Officer" : r === "conference_field_officer" ? "Conference/Field Officer" : r === "conference_field_admin" ? "Conference/Field Admin" : r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
              {role === r && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button
            disabled={saving}
            onClick={async () => { setSaving(true); await onSave(role); setSaving(false); }}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition flex items-center justify-center gap-2"
            style={{ background: t.accent, border: "none" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Role
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableTh({ label, sortKey, currentSort, onSort, t, align = "left", className = "" }) {
  const isActive = currentSort.key === sortKey;
  const dir = currentSort.dir;
  return (
    <th className={`p-4 font-semibold text-xs uppercase tracking-wider ${align === "right" ? "text-right" : ""} ${className}`} style={{ color: t.textSecondary }}>
      <button onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 uppercase tracking-wider font-semibold hover:opacity-80" style={{ color: isActive ? t.accent : t.textSecondary }}>
        {label}
        {isActive ? (dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ChevronsUpDown size={11} className="opacity-40" />}
      </button>
    </th>
  );
}

export default function AdminUsersTab({ user: currentAdmin, readOnly = false }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTerritoryStatus, setFilterTerritoryStatus] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Sort state
  const [sort, setSort] = useState({ key: "created_date", dir: "desc" });

  // Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [pendingRoleChange, setPendingRoleChange] = useState(null); // { user, newRole } for elevation confirm
  const [deletingUser, setDeletingUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null); // { user, action }
  const [notifyingUser, setNotifyingUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [quickMenuUser, setQuickMenuUser] = useState(null);

  // Bulk
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("approved");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkSuspendAction, setBulkSuspendAction] = useState(null); // "suspend" | "activate"
  const [bulkRoleOpen, setBulkRoleOpen] = useState(false);
  const [bulkNotifyOpen, setBulkNotifyOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Phase 3 — view mode + duplicate panel
  const [viewMode, setViewMode] = useState("table"); // "table" | "heatmap" | "cohorts"
  const [duplicatePanelOpen, setDuplicatePanelOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin_users_full", currentAdmin?.id, "complete"],
    queryFn: async () => {
      const records = new Map();
      for (let skip = 0; ; skip += 1000) {
        const res = await base44.functions.invoke("adminListUsers", { limit: 1000, skip });
        if (!Array.isArray(res.data)) throw new Error("Unable to load the user directory");
        res.data.forEach(record => records.set(record.id, record));
        if (res.data.length < 1000) break;
      }
      return [...records.values()];
    },
    staleTime: 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const ROLE_ORDER = [
    "super_admin", "admin", "ecd_admin", "ecd_officer", "country_admin",
    "union_admin", "union_officer", "conference_field_admin", "conference_field_officer",
    "church_admin", "church_officer", "moderator", "missionary",
    "GlowGroup Leader", "user"
  ];

  const allRoles = useMemo(() => {
    const fromData = new Set(users.map(u => u.role).filter(Boolean));
    ROLE_ORDER.forEach(r => fromData.add(r));
    return [...ROLE_ORDER, ...[...fromData].filter(r => !ROLE_ORDER.includes(r)).sort()];
  }, [users]);

  const allCountries = useMemo(() => {
    const set = new Set(users.map(u => u.country).filter(Boolean));
    return Array.from(set).sort();
  }, [users]);

  const incompleteCount = useMemo(() => users.filter(u => !u.country || !u.bio || !u.profile_picture_url).length, [users]);
  const suspendedCount = useMemo(() => users.filter(u => u.status === "suspended").length, [users]);

  const stats = useMemo(() => {
    const now = new Date();
    const last24h = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60)) <= 24).length;
    const last7Days = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60 * 24)) <= 7).length;
    const last30Days = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60 * 24)) <= 30).length;
    const males = users.filter(u => u.gender === "male").length;
    const females = users.filter(u => u.gender === "female").length;
    return { total: users.length, last24h, last7Days, last30Days, males, females };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const filtered = users.filter(u => {
      const matchesSearch = !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.country?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = filterRole === "all" || (u.role || "user") === filterRole;
      const matchesGender = filterGender === "all" || u.gender === filterGender;
      const matchesCountry = filterCountry === "all" || u.country === filterCountry;
      const matchesStatus = filterStatus === "all" || (u.status || "active") === filterStatus;
      const matchesIncomplete = !filterIncomplete || (!u.country || !u.bio || !u.profile_picture_url);

      let matchesTime = true;
      if (timeFilter !== "all" && u.created_date) {
        const diffHours = (new Date() - new Date(u.created_date)) / (1000 * 60 * 60);
        if (timeFilter === "24h") matchesTime = diffHours <= 24;
        else if (timeFilter === "7days") matchesTime = diffHours <= 24 * 7;
        else if (timeFilter === "30days") matchesTime = diffHours <= 24 * 30;
        else if (timeFilter === "6months") matchesTime = diffHours <= 24 * 180;
        else if (timeFilter === "1year") matchesTime = diffHours <= 24 * 365;
      }
      const matchesTerritoryStatus = filterTerritoryStatus === "all" || (u.territory_status || "none") === filterTerritoryStatus;

      return matchesSearch && matchesRole && matchesGender && matchesCountry && matchesStatus && matchesTime && matchesIncomplete && matchesTerritoryStatus;
    });

    // Sort
    return filtered.sort((a, b) => {
      const { key, dir } = sort;
      let av = a[key]; let bv = b[key];
      if (key === "age") { av = calcAge(a.date_of_birth); bv = calcAge(b.date_of_birth); }
      if (key === "engagement") { av = computeEngagementScore(a); bv = computeEngagementScore(b); }
      if (key === "completeness") { av = computeProfileCompleteness(a).score; bv = computeProfileCompleteness(b).score; }
      if (key === "full_name") { av = (a.display_name || a.username || a.full_name || "").toLowerCase(); bv = (b.display_name || b.username || b.full_name || "").toLowerCase(); }
      if (av == null) av = dir === "asc" ? Infinity : -Infinity;
      if (bv == null) bv = dir === "asc" ? Infinity : -Infinity;
      if (key === "created_date" || key === "updated_date") { av = new Date(av || 0).getTime(); bv = new Date(bv || 0).getTime(); }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, search, filterRole, filterGender, filterCountry, filterStatus, timeFilter, filterIncomplete, filterTerritoryStatus, sort]);

  // Reset to page 1 whenever filters/sort change
  useEffect(() => { setPage(1); }, [search, filterRole, filterGender, filterCountry, filterStatus, timeFilter, filterIncomplete, filterTerritoryStatus, sort, pageSize]);

  // Paginated slice for rendering
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  // Selected user objects (for bulk modals)
  const selectedUserObjects = useMemo(
    () => users.filter(u => selectedUsers.has(u.email)),
    [users, selectedUsers]
  );

  // Phase 3 — duplicate detection (computed once, reused for inline badges and panel)
  const duplicateGroups = useMemo(() => detectDuplicates(users), [users]);
  const duplicateSuspects = useMemo(() => buildDuplicateSuspectSet(duplicateGroups), [duplicateGroups]);

  // Lookup severity for a single user row
  const getUserDuplicateSeverity = (email) => {
    for (const g of duplicateGroups) {
      if (g.users.some(u => u.email === email)) return g.severity;
    }
    return null;
  };

  // Current filter snapshot for presets
  const currentFilters = {
    search, filterRole, filterGender, filterCountry, filterStatus,
    filterTerritoryStatus, timeFilter, filterIncomplete,
  };

  const applyPreset = (f) => {
    setSearch(f.search || "");
    setFilterRole(f.filterRole || "all");
    setFilterGender(f.filterGender || "all");
    setFilterCountry(f.filterCountry || "all");
    setFilterStatus(f.filterStatus || "all");
    setFilterTerritoryStatus(f.filterTerritoryStatus || "all");
    setTimeFilter(f.timeFilter || "all");
    setFilterIncomplete(!!f.filterIncomplete);
  };

  const handleSort = (key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "full_name" || key === "country" || key === "role" ? "asc" : "desc" }
    );
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await base44.functions.invoke("sendProfileReminder", {});
      toast.success(`✅ Reminders sent to ${res.data.sent} users!`);
    } catch {
      toast.error("Failed to send reminders.");
    } finally {
      setSendingReminders(false);
    }
  };

  const performRoleChange = async (targetUserId, newRole) => {
    try {
      await base44.functions.invoke("adminUpdateUserRole", { targetUserId, newRole });
      toast.success(`Role updated to "${newRole}"`);
      queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed to update role.";
      toast.error(msg);
      console.error("Role update failed:", err);
    }
  };

  // Called from EditRoleModal → wraps with 2-step confirmation if elevation
  const handleRoleSave = async (newRole) => {
    if (!editingUser?.id) { toast.error("User not identified"); return; }
    const ELEVATED = ["admin", "super_admin"];
    if (ELEVATED.includes(newRole) && editingUser.role !== newRole) {
      // Close role picker, open confirmation
      const target = editingUser;
      setEditingUser(null);
      setPendingRoleChange({ user: target, newRole });
      return;
    }
    await performRoleChange(editingUser.id, newRole);
    setEditingUser(null);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedUsers.size === 0) return;
    setBulkUpdating(true);
    let success = 0;
    for (const email of selectedUsers) {
      try {
        const target = users.find(u => u.email === email);
        if (target?.id) {
          await base44.functions.invoke("assignUserTerritory", { userId: target.id, status: bulkStatus });
          success++;
        }
      } catch { }
    }
    toast.success(`Updated territory status for ${success} user(s) to "${bulkStatus}"`);
    setSelectedUsers(new Set());
    setBulkUpdating(false);
    queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });
  };

  const toggleSelectUser = (email) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email); else next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(filteredUsers.map(u => u.email)));
  };

  const handleDeleteUser = async (targetUser) => {
    if (!targetUser?.id) { toast.error("Could not identify user."); return; }
    try {
      await base44.functions.invoke("adminDeleteUser", { targetUserId: targetUser.id });
      toast.success(`${targetUser.full_name || targetUser.email} removed.`);
      queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });
      setDetailUser(null);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed to remove user.";
      toast.error(msg);
    }
  };

  const handleExportCsv = () => {
    exportUsersToCsv(filteredUsers, "users.csv");
    toast.success(`Exported ${filteredUsers.length} user(s) to CSV`);
  };

  const handleExportSelected = () => {
    exportUsersToCsv(selectedUserObjects, "users-selected.csv");
    toast.success(`Exported ${selectedUserObjects.length} selected user(s)`);
  };

  const refreshAll = () => queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });

  return (
    <div className="space-y-6">
      {/* ── Modals ─────────────────────────────── */}
      {editingUser && (
        <EditRoleModal
          targetUser={editingUser}
          allRoles={allRoles}
          onClose={() => setEditingUser(null)}
          onSave={handleRoleSave}
          t={t} isDark={isDark}
        />
      )}
      {pendingRoleChange && (
        <RoleElevationConfirm
          targetUser={pendingRoleChange.user}
          newRole={pendingRoleChange.newRole}
          onCancel={() => setPendingRoleChange(null)}
          onConfirm={async () => {
            await performRoleChange(pendingRoleChange.user.id, pendingRoleChange.newRole);
            setPendingRoleChange(null);
          }}
          t={t}
        />
      )}
      {deletingUser && (
        <DeleteUserModal
          targetUser={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => handleDeleteUser(deletingUser)}
          t={t}
        />
      )}
      {suspendingUser && (
        <SuspendUserModal
          targetUser={suspendingUser.user}
          action={suspendingUser.action}
          onClose={() => setSuspendingUser(null)}
          onDone={refreshAll}
          t={t}
        />
      )}
      {notifyingUser && (
        <SendNotificationModal targetUser={notifyingUser} onClose={() => setNotifyingUser(null)} t={t} />
      )}
      {detailUser && (
        <UserDetailDrawer
          targetUser={detailUser}
          onClose={() => setDetailUser(null)}
          onEditRole={() => setEditingUser(detailUser)}
          onSendNotification={() => setNotifyingUser(detailUser)}
          onSuspendToggle={() => setSuspendingUser({ user: detailUser, action: detailUser.status === "suspended" ? "activate" : "suspend" })}
          onDelete={() => setDeletingUser(detailUser)}
          readOnly={readOnly}
          t={t}
        />
      )}
      {inviteOpen && (
        <InviteUserModal
          callerRole={currentAdmin?.role}
          onClose={() => setInviteOpen(false)}
          onInvited={refreshAll}
          t={t} isDark={isDark}
        />
      )}
      {bulkSuspendAction && (
        <BulkSuspendModal
          users={bulkSuspendAction === "suspend"
            ? selectedUserObjects.filter(u => u.status !== "suspended")
            : selectedUserObjects.filter(u => u.status === "suspended")}
          action={bulkSuspendAction}
          onClose={() => setBulkSuspendAction(null)}
          onDone={() => { setSelectedUsers(new Set()); refreshAll(); }}
          t={t}
        />
      )}
      {bulkRoleOpen && (
        <BulkRoleModal
          users={selectedUserObjects}
          allRoles={allRoles}
          onClose={() => setBulkRoleOpen(false)}
          onDone={() => { setSelectedUsers(new Set()); refreshAll(); }}
          t={t}
        />
      )}
      {bulkNotifyOpen && (
        <BulkNotifyModal
          users={selectedUserObjects}
          onClose={() => setBulkNotifyOpen(false)}
          onDone={() => { setSelectedUsers(new Set()); refreshAll(); }}
          t={t}
        />
      )}

      {isError && <div role="alert" className="rounded-xl border border-destructive p-4 text-destructive">The complete directory could not load. <button onClick={() => refetch()} className="underline font-bold">Retry</button></div>}
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Users Directory</h1>
          <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Monitor and manage your community members.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} t={t} />
          <button
            onClick={() => setDuplicatePanelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition relative"
            style={{
              borderColor: duplicateGroups.length > 0 ? "#ef4444" : t.border,
              color: duplicateGroups.length > 0 ? "#ef4444" : t.textSecondary,
              background: duplicateGroups.length > 0 ? "rgba(239,68,68,0.08)" : t.surface,
            }}
            title={duplicateGroups.length > 0 ? `${duplicateGroups.length} potential duplicates found` : "No duplicates detected"}
          >
            <AlertTriangle size={13} />
            Duplicates
            {duplicateGroups.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#ef4444", color: "#fff" }}>
                {duplicateGroups.length}
              </span>
            )}
          </button>
          <FilterPresets currentFilters={currentFilters} onApply={applyPreset} t={t} isDark={isDark} />
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition"
            style={{ borderColor: t.border, color: t.textSecondary, background: t.surface }}
          >
            <Download size={13} /> Export CSV
          </button>
          {!readOnly && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition"
              style={{ background: t.accent, border: "none", boxShadow: t.shadow }}
            >
              <UserPlus size={13} /> Invite User
            </button>
          )}
        </div>
      </div>

      {/* Phase 3 — Duplicate panel */}
      {duplicatePanelOpen && (
        <DuplicateDetectionPanel
          users={users}
          onClose={() => setDuplicatePanelOpen(false)}
          onOpenUser={(u) => { setDuplicatePanelOpen(false); setDetailUser(u); }}
          t={t}
        />
      )}

      {/* ── Incomplete banner ─────────────────── */}
      {incompleteCount > 0 && (
        <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ background: isDark ? "rgba(255,208,0,0.1)" : "#FFF8E6", border: "1px solid rgba(255,208,0,0.3)" }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[#FFD000] w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm" style={{ color: isDark ? "#FFD000" : "#CC7A00" }}>{incompleteCount} members have incomplete profiles</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Missing country, bio, or profile picture.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setFilterIncomplete(v => !v)}
              className="px-4 py-2 rounded-lg text-xs font-bold border transition"
              style={filterIncomplete ? { background: "rgba(255,208,0,0.2)", borderColor: "rgba(255,208,0,0.5)", color: isDark ? "#FFD000" : "#CC7A00" } : { borderColor: t.border, color: t.textSecondary, background: "transparent" }}
            >
              {filterIncomplete ? "Show All" : "Filter Incomplete"}
            </button>
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50"
              style={{ background: "#FFD000", color: "#0B1B3D", border: "none" }}
            >
              {sendingReminders ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
              {sendingReminders ? "Sending..." : "Send Reminders"}
            </button>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Total Users", value: stats.total, icon: <Users size={20} />, color: "#00CFFF" },
          { label: "Last 24 hrs", value: `+${stats.last24h}`, icon: <Clock size={20} />, color: "#FFD000", highlight: stats.last24h > 0 },
          { label: "Last 7 Days", value: `+${stats.last7Days}`, icon: <Activity size={20} />, color: "#FFD000" },
          { label: "Last 30 Days", value: `+${stats.last30Days}`, icon: <Calendar size={20} />, color: "#8A5CFF" },
          { label: "Male / Female", value: `${stats.males} / ${stats.females}`, icon: <User size={20} />, color: "#00CFFF" },
          { label: "Suspended", value: suspendedCount, icon: <Ban size={20} />, color: "#ef4444", highlight: suspendedCount > 0 },
        ].map((s, i) => (
          <div key={i} className="border rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surface, borderColor: s.highlight ? `${s.color}66` : t.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs" style={{ color: t.textSecondary }}>{s.label}</p>
              <p className="font-bold text-lg leading-tight" style={{ color: t.textPrimary }}>{isLoading || isError ? "—" : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters (table view only) ─────────── */}
      {viewMode === "table" && (
      <div className="border rounded-2xl p-4 flex flex-col gap-3" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <Filter size={14} className="ml-2" style={{ color: t.textMuted }} />
            <BottomSheetSelect
              value={filterRole}
              onChange={setFilterRole}
              options={[{ value: "all", label: "All Roles" }, ...allRoles.map(r => ({ value: r, label: r.replace(/_/g, " ") }))]}
              triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[120px] !text-sm"
              triggerStyle={{ color: t.textPrimary }}
            />
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <Ban size={14} className="ml-2" style={{ color: t.textMuted }} />
            <BottomSheetSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[{ value: "all", label: "All Status" }, { value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }]}
              triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[120px] !text-sm"
              triggerStyle={{ color: t.textPrimary }}
            />
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <User size={14} className="ml-2" style={{ color: t.textMuted }} />
            <BottomSheetSelect
              value={filterGender}
              onChange={setFilterGender}
              options={[
                { value: "all", label: "All Genders" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "prefer_not_to_say", label: "Prefer not to say" }
              ]}
              triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[120px] !text-sm"
              triggerStyle={{ color: t.textPrimary }}
            />
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <MapPin size={14} className="ml-2" style={{ color: t.textMuted }} />
            <BottomSheetSelect
              value={filterCountry}
              onChange={setFilterCountry}
              options={[{ value: "all", label: "All Countries" }, ...allCountries.map(c => ({ value: c, label: c }))]}
              triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[140px] !text-sm"
              triggerStyle={{ color: t.textPrimary }}
            />
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <Clock size={14} className="ml-2" style={{ color: t.textMuted }} />
            <BottomSheetSelect
              value={timeFilter}
              onChange={setTimeFilter}
              options={[
                { value: "all", label: "Any Time" },
                { value: "24h", label: "Last 24 Hours" },
                { value: "7days", label: "Last 7 Days" },
                { value: "30days", label: "Last 30 Days" },
                { value: "6months", label: "Last 6 Months" },
                { value: "1year", label: "Last 1 Year" }
              ]}
              triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[140px] !text-sm"
              triggerStyle={{ color: t.textPrimary }}
            />
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <Map size={14} className="ml-2" style={{ color: t.textMuted }} />
            <BottomSheetSelect
              value={filterTerritoryStatus}
              onChange={setFilterTerritoryStatus}
              options={[
                { value: "all", label: "All Territory Status" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "none", label: "Not Set" }
              ]}
              triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[160px] !text-sm"
              triggerStyle={{ color: t.textPrimary }}
            />
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, country..."
              className="pl-9 rounded-lg text-sm w-full"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition" style={{ color: t.textMuted }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs" style={{ color: t.textSecondary }}>
            {isLoading ? "Loading the complete directory…" : isError ? "Directory unavailable" : <>Showing <span className="font-bold" style={{ color: t.textPrimary }}>{filteredUsers.length}</span> of {users.length} users</>}
            {selectedUsers.size > 0 && <span className="ml-2 font-bold" style={{ color: t.accent }}>· {selectedUsers.size} selected</span>}
          </p>

        </div>

        {!readOnly && (
        <BulkActionsBar
          selectedCount={selectedUsers.size}
          selectedUsers={selectedUserObjects}
          bulkStatus={bulkStatus}
          setBulkStatus={setBulkStatus}
          onApplyTerritory={handleBulkStatusUpdate}
          territoryUpdating={bulkUpdating}
          onBulkSuspend={() => setBulkSuspendAction("suspend")}
          onBulkReactivate={() => setBulkSuspendAction("activate")}
          onBulkRole={() => setBulkRoleOpen(true)}
          onBulkNotify={() => setBulkNotifyOpen(true)}
          onExportSelected={handleExportSelected}
          onClear={() => setSelectedUsers(new Set())}
          t={t}
        />
        )}
      </div>
      )}

      {/* ── Heatmap view ─────────────────────── */}
      {viewMode === "heatmap" && (
        <UsersHeatmap
          users={users}
          onCountryClick={(country) => {
            setFilterCountry(country);
            setViewMode("table");
          }}
          t={t}
        />
      )}

      {/* ── Cohorts view ─────────────────────── */}
      {viewMode === "cohorts" && (
        <CohortRetentionGrid users={users} t={t} />
      )}

      {/* ── Table ─────────────────────────────── */}
      {viewMode === "table" && (
      <div className="border rounded-2xl overflow-hidden shadow-xl" style={{ background: t.surface, borderColor: t.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b" style={{ borderColor: t.border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(11,27,61,0.02)" }}>
                <th className="p-4">
                  <button onClick={toggleSelectAll} className="transition hover:opacity-70" style={{ color: t.textMuted }}>
                    {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0
                      ? <CheckSquare size={16} style={{ color: t.accent }} />
                      : <Square size={16} />}
                  </button>
                </th>
                <SortableTh label="User" sortKey="full_name" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Country" sortKey="country" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Gender" sortKey="gender" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Age" sortKey="age" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Role" sortKey="role" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Status" sortKey="status" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Territory" sortKey="territory_name" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="XP" sortKey="glow_score" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Engagement" sortKey="engagement" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Profile" sortKey="completeness" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Last Active" sortKey="updated_date" currentSort={sort} onSort={handleSort} t={t} />
                <SortableTh label="Joined" sortKey="created_date" currentSort={sort} onSort={handleSort} t={t} />
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: t.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="14" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: t.accent }} /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="14" className="p-8 text-center" style={{ color: t.textMuted }}>No users match your filters.</td></tr>
              ) : (
                pagedUsers.map(u => {
                  const age = calcAge(u.date_of_birth);
                  const isNew = u.created_date && ((new Date() - new Date(u.created_date)) / (1000 * 60 * 60)) <= 24;
                  const isSelected = selectedUsers.has(u.email);
                  const isSuspended = u.status === "suspended";
                  return (
                    <tr key={u.email} className="border-b transition" style={{ borderColor: t.border, background: isSelected ? t.accentSoft : "transparent", opacity: isSuspended ? 0.7 : 1 }}>
                      <td className="p-4">
                        <button onClick={() => toggleSelectUser(u.email)} className="transition hover:opacity-70" style={{ color: t.textMuted }}>
                          {isSelected ? <CheckSquare size={16} style={{ color: t.accent }} /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="p-4 cursor-pointer" onClick={() => setDetailUser(u)}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: t.border }} />
                            {isNew && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 rounded-full" style={{ borderColor: t.surface }} title="Joined in last 24h" />}
                            {isSuspended && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 border-2 rounded-full flex items-center justify-center" style={{ borderColor: t.surface }}><Ban size={8} className="text-white" /></span>}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-sm hover:underline" style={{ color: t.textPrimary }}>{u.display_name || u.username || u.full_name || 'Unknown'}</p>
                              <VerificationBadges user={u} />
                              {duplicateSuspects.has(u.email) && (
                                <DuplicateRowBadge
                                  severity={getUserDuplicateSeverity(u.email)}
                                  onClick={(e) => { e.stopPropagation(); setDuplicatePanelOpen(true); }}
                                  t={t}
                                />
                              )}
                            </div>
                            <p className="text-[11px]" style={{ color: t.textMuted }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                        {u.country ? (
                          <span className="flex items-center gap-1"><MapPin size={12} style={{ color: t.textMuted }} />{u.country}</span>
                        ) : <span className="text-orange-500 text-xs">Not set</span>}
                      </td>
                      <td className="p-4 text-sm capitalize" style={{ color: t.textSecondary }}>
                        {u.gender ? u.gender.replace(/_/g, " ") : <span className="text-xs" style={{ color: t.textMuted }}>—</span>}
                      </td>
                      <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                        {age !== null ? age : <span className="text-xs" style={{ color: t.textMuted }}>—</span>}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${roleColor(u.role, isDark)}`}>
                          {(u.role === "super_admin" || String(u.role).includes("admin")) && <Shield size={10} />}
                          {u.role === "ecd_admin" ? "ECD Admin" : u.role === "ecd_officer" ? "ECD Officer" : u.role === "conference_field_officer" ? "Conference/Field Officer" : u.role === "conference_field_admin" ? "Conference/Field Admin" : (u.role || "user").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="p-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                            <Ban size={10} /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                        <TerritoryQuickView user={u} t={t} />
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-xs font-bold text-[#FFD000]">
                          <Zap size={12} />{u.glow_score || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <EngagementMeter user={u} t={t} />
                      </td>
                      <td className="p-4">
                        <ProfileCompletenessBar user={u} t={t} />
                      </td>
                      <td className="p-4">
                        <UserActivityDot user={u} t={t} />
                      </td>
                      <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                        <div className="flex flex-col gap-0.5">
                          <span>{u.created_date ? new Date(u.created_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "N/A"}</span>
                          {isNew && <span className="text-[10px] text-green-500 font-bold">● NEW</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right relative">
                        <button onClick={() => setDetailUser(u)} className="p-2 transition rounded-lg mr-1 hover:opacity-70" title="View Details" style={{ color: t.textSecondary, background: t.surfaceMuted }}>
                          <Edit2 size={16} />
                        </button>
                        {!readOnly && (
                        <button onClick={() => setQuickMenuUser(quickMenuUser?.email === u.email ? null : u)} className="p-2 transition rounded-lg hover:opacity-70" title="More actions" style={{ color: t.textSecondary, background: t.surfaceMuted }}>
                          <MoreVertical size={16} />
                        </button>
                        )}
                        {!readOnly && quickMenuUser?.email === u.email && (
                          <UserQuickActionsMenu
                            targetUser={u}
                            onClose={() => setQuickMenuUser(null)}
                            onOpenDetail={() => setDetailUser(u)}
                            onEditRole={() => setEditingUser(u)}
                            onSendNotification={() => setNotifyingUser(u)}
                            onSuspendToggle={() => setSuspendingUser({ user: u, action: u.status === "suspended" ? "activate" : "suspend" })}
                            onDelete={() => setDeletingUser(u)}
                            t={t} isDark={isDark}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <UsersPagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredUsers.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          t={t}
        />
      </div>
      )}
    </div>
  );
}