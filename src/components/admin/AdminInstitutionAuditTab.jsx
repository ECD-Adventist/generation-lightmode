import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Building2, UserCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const INSTITUTION_ROLES = ["church_admin", "conference_field_admin", "union_admin", "country_admin", "ecd_admin"];

export default function AdminInstitutionAuditTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const queryClient = useQueryClient();
  const [revokingEmail, setRevokingEmail] = useState(null);

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["institutionApplications"],
    queryFn: () => base44.entities.InstitutionApplication.list("-created_date", 1000),
  });

  const { data: institutionPages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["institutionPagesAudit"],
    queryFn: () => base44.entities.InstitutionPage.list("-created_date", 1000),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["adminInstitutionAuditUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("adminListUsers", {});
      return res.data || [];
    },
  });

  const auditRows = useMemo(() => {
    const byEmail = new Map();

    applications.forEach((app) => {
      if (!app.user_email) return;
      const row = byEmail.get(app.user_email) || { email: app.user_email, applications: [], pages: [] };
      row.applications.push(app);
      byEmail.set(app.user_email, row);
    });

    institutionPages.forEach((page) => {
      if (!page.owner_email || page.owner_email === "system@lightmode.com") return;
      const row = byEmail.get(page.owner_email) || { email: page.owner_email, applications: [], pages: [] };
      row.pages.push(page);
      byEmail.set(page.owner_email, row);
    });

    return Array.from(byEmail.values())
      .map((row) => {
        const user = users.find((u) => u.email === row.email);
        const approvedApps = row.applications.filter((app) => app.status === "approved");
        const latestApp = row.applications[0];
        const hasActiveProfile = approvedApps.length > 0;
        return {
          ...row,
          user,
          approvedApps,
          latestApp,
          hasActiveProfile,
          approvalStatus: hasActiveProfile ? "approved" : latestApp?.status || (row.pages.length ? "page_only" : "none"),
        };
      })
      .filter((row) => row.hasActiveProfile || row.pages.length > 0)
      .sort((a, b) => Number(b.hasActiveProfile) - Number(a.hasActiveProfile));
  }, [applications, institutionPages, users]);

  const revokeMutation = useMutation({
    mutationFn: async (row) => {
      const note = `Institution status revoked by admin on ${new Date().toISOString()}.`;
      await Promise.all(
        row.approvedApps.map((app) => base44.entities.InstitutionApplication.update(app.id, {
          status: "revoked",
          admin_notes: app.admin_notes ? `${app.admin_notes}\n\n${note}` : note,
        }))
      );

      if (row.user?.id && row.user.role === "church_admin") {
        await base44.entities.User.update(row.user.id, {
          role: "user",
          territory_status: "revoked",
          territory_name: "",
        });
      }
    },
    onMutate: (row) => setRevokingEmail(row.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutionApplications"] });
      queryClient.invalidateQueries({ queryKey: ["adminInstitutionAuditUsers"] });
      toast.success("Institution status revoked.");
    },
    onSettled: () => setRevokingEmail(null),
  });

  if (appsLoading || pagesLoading || usersLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: t.accent }} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="adm-card">
          <div className="adm-stat-big">{auditRows.length}</div>
          <div className="adm-stat-label">Institution-linked Users</div>
        </div>
        <div className="adm-card">
          <div className="adm-stat-big" style={{ color: t.success }}>{auditRows.filter(r => r.hasActiveProfile).length}</div>
          <div className="adm-stat-label">Active Profiles</div>
        </div>
        <div className="adm-card">
          <div className="adm-stat-big" style={{ color: t.warning }}>{auditRows.filter(r => r.pages.length && !r.hasActiveProfile).length}</div>
          <div className="adm-stat-label">Dashboard Page Only</div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        {auditRows.length === 0 ? (
          <div className="text-center py-16" style={{ color: t.textSecondary }}>No active institution profiles found.</div>
        ) : auditRows.map((row) => {
          const canRevoke = row.approvedApps.length > 0;
          const isRevoking = revokingEmail === row.email;
          return (
            <div key={row.email} className="p-5 border-b last:border-b-0" style={{ borderColor: t.border }}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: row.hasActiveProfile ? t.successSoft : t.warningSoft }}>
                    {row.hasActiveProfile ? <UserCheck className="w-5 h-5" style={{ color: t.success }} /> : <Building2 className="w-5 h-5" style={{ color: t.warning }} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold truncate" style={{ color: t.textPrimary }}>{row.user?.full_name || row.latestApp?.institution_name || row.email}</h3>
                    <p className="text-xs truncate mt-0.5" style={{ color: t.textMuted }}>{row.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`adm-badge ${row.hasActiveProfile ? "adm-badge-success" : "adm-badge-gold"}`}>{row.approvalStatus.replace("_", " ")}</span>
                      {row.user?.role && <span className="adm-badge">{row.user.role.replace(/_/g, " ")}</span>}
                      {row.pages.length > 0 && <span className="adm-badge">{row.pages.length} dashboard page{row.pages.length === 1 ? "" : "s"}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <a href={`/Profile?user=${encodeURIComponent(row.email)}`} target="_blank" rel="noreferrer" className="adm-btn-secondary">
                    <ExternalLink className="w-3.5 h-3.5" /> View Profile
                  </a>
                  <Button
                    onClick={() => revokeMutation.mutate(row)}
                    disabled={!canRevoke || isRevoking}
                    className="rounded-xl font-bold"
                    style={{ background: canRevoke ? t.danger : t.surfaceMuted, color: canRevoke ? "#fff" : t.textMuted }}
                  >
                    {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                    Revoke Institution Status
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs" style={{ color: t.textSecondary }}>
                {row.applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                    <div className="font-bold" style={{ color: t.textPrimary }}>{app.institution_name}</div>
                    <div>{app.institution_type} • {app.country} • {app.status}</div>
                  </div>
                ))}
                {row.pages.slice(0, 2).map((page) => (
                  <div key={page.id} className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                    <div className="font-bold" style={{ color: t.textPrimary }}>{page.name}</div>
                    <div>Institution page • {page.verified ? "Verified" : "Not verified"}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}