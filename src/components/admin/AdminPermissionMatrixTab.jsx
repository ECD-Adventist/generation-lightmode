import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Check, X, Loader2, Save, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

// All admin tabs in the system
const ALL_TABS = [
  { id: "dashboard", label: "Dashboard", group: "Overview" },
  { id: "territory", label: "Territory Setup", group: "Overview" },
  { id: "users", label: "Users", group: "Community" },
  { id: "groups", label: "GlowGroups", group: "Community" },
  { id: "drops", label: "Glow Drops", group: "Community" },
  { id: "comments", label: "Moderation", group: "Community" },
  { id: "challenges", label: "Challenges", group: "Growth" },
  { id: "leaderboards", label: "Leaderboards", group: "Growth" },
  { id: "badges", label: "Badges & Ranks", group: "Growth" },
  { id: "countries", label: "Countries", group: "Territory" },
  { id: "territory-map", label: "Territory Map", group: "Territory" },
  { id: "territory-assign", label: "Territory Assign", group: "Territory" },
  { id: "territory-challenges", label: "Territory Challenges", group: "Territory" },
  { id: "analytics", label: "Analytics", group: "Analytics" },
  { id: "growth-analytics", label: "Growth Analytics", group: "Analytics" },
  { id: "charts", label: "Charts Dashboard", group: "Analytics" },
  { id: "codes", label: "Codes of Truth", group: "Content" },
  { id: "keepit100", label: "Keep It 100", group: "Content" },
  { id: "media", label: "Media Library", group: "Content" },
  { id: "notifications", label: "Notifications", group: "Comms" },
  { id: "announcements", label: "Announcements", group: "Comms" },
  { id: "activity", label: "Activity Feed", group: "Comms" },
  { id: "institutions", label: "Institutions", group: "Admin" },
  { id: "assistant-training", label: "AI Training", group: "Admin" },
  { id: "custom-posts", label: "Custom Posts", group: "Admin" },
  { id: "settings", label: "System Settings", group: "Admin" },
  { id: "permissions", label: "Permission Matrix", group: "Admin" },
];

// All configurable admin roles (super_admin always has full access, not configurable)
const ADMIN_ROLES = [
  { id: "admin", label: "Admin" },
  { id: "ecd_admin", label: "ECD Admin" },
  { id: "country_admin", label: "Country Admin" },
  { id: "union_admin", label: "Union Admin" },
  { id: "conference_field_admin", label: "Conference/Field Admin" },
  { id: "church_admin", label: "Church Admin" },
];

const TAB_GROUPS = [...new Set(ALL_TABS.map(t => t.group))];

function ToggleCell({ checked, onChange, color, isDark }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110" style={{
      background: checked ? `${color}15` : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      border: `1.5px solid ${checked ? color : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
    }}>
      {checked ? <Check size={14} style={{ color }} strokeWidth={3} /> : <X size={14} style={{ color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)" }} />}
    </button>
  );
}

export default function AdminPermissionMatrixTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["adminPermissions"],
    queryFn: () => base44.entities.AdminPermission.list(),
  });

  // Local state matrix: { "role::tab_id": { can_view, can_edit } }
  const [matrix, setMatrix] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize matrix from DB records
  useEffect(() => {
    const m = {};
    // Default: all roles get view access to dashboard
    ADMIN_ROLES.forEach(role => {
      ALL_TABS.forEach(tab => {
        const key = `${role.id}::${tab.id}`;
        m[key] = { can_view: tab.id === "dashboard", can_edit: false };
      });
    });
    // Overlay DB records
    permissions.forEach(p => {
      const key = `${p.role}::${p.tab_id}`;
      if (m[key]) {
        m[key] = { can_view: !!p.can_view, can_edit: !!p.can_edit, _id: p.id };
      }
    });
    setMatrix(m);
    setHasChanges(false);
  }, [permissions]);

  const updateCell = (role, tab, field, value) => {
    const key = `${role}::${tab}`;
    setMatrix(prev => {
      const cell = { ...prev[key] };
      cell[field] = value;
      // If can_edit is true, can_view must also be true
      if (field === "can_edit" && value) cell.can_view = true;
      // If can_view is false, can_edit must also be false
      if (field === "can_view" && !value) cell.can_edit = false;
      return { ...prev, [key]: cell };
    });
    setHasChanges(true);
  };

  const toggleColumnView = (role) => {
    const allChecked = ALL_TABS.every(tab => matrix[`${role}::${tab.id}`]?.can_view);
    ALL_TABS.forEach(tab => {
      const key = `${role}::${tab.id}`;
      setMatrix(prev => ({
        ...prev,
        [key]: { ...prev[key], can_view: !allChecked, can_edit: !allChecked ? prev[key]?.can_edit : false }
      }));
    });
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing, then recreate
      const existingIds = permissions.map(p => p.id);
      await Promise.all(existingIds.map(id => base44.entities.AdminPermission.delete(id)));

      // Build new records
      const records = [];
      ADMIN_ROLES.forEach(role => {
        ALL_TABS.forEach(tab => {
          const key = `${role.id}::${tab.id}`;
          const cell = matrix[key];
          if (cell && (cell.can_view || cell.can_edit)) {
            records.push({ role: role.id, tab_id: tab.id, can_view: cell.can_view, can_edit: cell.can_edit });
          }
        });
      });

      if (records.length > 0) {
        await base44.entities.AdminPermission.bulkCreate(records);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPermissions"] });
      setHasChanges(false);
      toast.success("Permission matrix saved successfully", { icon: "🔒" });
    },
    onError: () => {
      toast.error("Failed to save permissions");
    }
  });

  const viewColor = isDark ? "#00CFFF" : "#0B3FD9";
  const editColor = isDark ? "#FFD000" : "#d97706";

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 border text-xs font-bold rounded-full mb-3 uppercase tracking-widest"
            style={{ background: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2", borderColor: isDark ? "rgba(239,68,68,0.2)" : "#fecaca", color: isDark ? "#f87171" : "#dc2626" }}>
            <Shield size={12} /> Super Admin Only
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>
            Admin Permission Matrix
          </h1>
          <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>
            Define which admin roles can view or edit each tab in the Control Center.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasChanges && (
            <Button onClick={() => { queryClient.invalidateQueries({ queryKey: ["adminPermissions"] }); setHasChanges(false); }}
              className="font-bold text-xs" style={{ background: "transparent", color: t.textSecondary, border: `1px solid ${t.border}` }}>
              <RotateCcw size={14} className="mr-1.5" /> Discard
            </Button>
          )}
          <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}
            className="font-bold text-xs px-6" style={{
              background: hasChanges ? t.gradient : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: hasChanges ? "#FFFFFF" : t.textMuted,
              border: "none",
              opacity: hasChanges ? 1 : 0.5
            }}>
            {saveMutation.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
            Save Matrix
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-4 py-3 rounded-xl border" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "#FAFBFF", borderColor: t.border }}>
        <Info size={14} style={{ color: t.textMuted }} />
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${viewColor}15`, border: `1.5px solid ${viewColor}` }}>
            <Check size={10} style={{ color: viewColor }} strokeWidth={3} />
          </div>
          <span className="text-xs font-semibold" style={{ color: t.textSecondary }}>Can View</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${editColor}15`, border: `1.5px solid ${editColor}` }}>
            <Check size={10} style={{ color: editColor }} strokeWidth={3} />
          </div>
          <span className="text-xs font-semibold" style={{ color: t.textSecondary }}>Can Edit</span>
        </div>
        <span className="text-[10px] ml-auto" style={{ color: t.textMuted }}>Super Admin always has full access</span>
      </div>

      {/* Matrix Table */}
      <div className="rounded-[1.25rem] border overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                <th className="sticky left-0 z-20 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: t.textMuted, background: isDark ? t.surface : "#FAFBFF", minWidth: 180 }}>
                  Tab / Permission
                </th>
                {ADMIN_ROLES.map(role => (
                  <th key={role.id} className="px-2 py-3.5 text-center" style={{ minWidth: 100 }}>
                    <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: t.textPrimary }}>{role.label}</div>
                    <button onClick={() => toggleColumnView(role.id)} className="text-[8px] mt-1 font-bold hover:underline" style={{ color: t.accent }}>
                      Toggle All
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TAB_GROUPS.map(group => (
                <React.Fragment key={group}>
                  {/* Group Header */}
                  <tr>
                    <td colSpan={ADMIN_ROLES.length + 1} className="px-5 pt-4 pb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: t.accent }}>{group}</span>
                    </td>
                  </tr>
                  {ALL_TABS.filter(tab => tab.group === group).map(tab => {
                    return (
                      <tr key={tab.id} className="transition-colors" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"}` }}
                        onMouseOver={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.015)" : "rgba(11,63,217,0.015)"}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <td className="sticky left-0 z-10 px-5 py-2.5" style={{ background: isDark ? t.surface : "#FFFFFF" }}>
                          <span className="text-xs font-semibold" style={{ color: t.textPrimary }}>{tab.label}</span>
                        </td>
                        {ADMIN_ROLES.map(role => {
                          const key = `${role.id}::${tab.id}`;
                          const cell = matrix[key] || { can_view: false, can_edit: false };
                          return (
                            <td key={role.id} className="px-2 py-2.5">
                              <div className="flex items-center justify-center gap-2">
                                <ToggleCell checked={cell.can_view} onChange={v => updateCell(role.id, tab.id, "can_view", v)} color={viewColor} isDark={isDark} />
                                <ToggleCell checked={cell.can_edit} onChange={v => updateCell(role.id, tab.id, "can_edit", v)} color={editColor} isDark={isDark} />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}