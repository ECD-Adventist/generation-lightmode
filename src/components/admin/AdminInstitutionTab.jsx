import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminInstitutionTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["institutionApplications"],
    queryFn: () => base44.entities.InstitutionApplication.list("-created_date"),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
  });

  const approveAppMutation = useMutation({
    mutationFn: async (appId) => {
      const app = applications.find(a => a.id === appId);
      await base44.entities.InstitutionApplication.update(appId, { status: "approved", admin_notes: adminNotes });

      if (app?.user_email) {
        const applicant = allUsers.find(u => u.email === app.user_email);
        if (applicant?.id) {
          const nextRole = applicant.role && applicant.role !== "user" ? applicant.role : "church_admin";
          await base44.entities.User.update(applicant.id, {
            role: nextRole,
            territory_name: app.institution_name,
            territory_level: app.institution_type === "organization" ? "ecd" : app.institution_type === "church" ? "church" : applicant.territory_level,
            territory_status: "approved"
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutionApplications"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      setSelectedApp(null);
      setAdminNotes("");
      toast.success("Application approved and control center access saved!");
    },
  });

  const rejectAppMutation = useMutation({
    mutationFn: async (appId) => {
      await base44.entities.InstitutionApplication.update(appId, { status: "rejected", admin_notes: adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutionApplications"] });
      setSelectedApp(null);
      setAdminNotes("");
      toast.success("Application rejected!");
    },
  });

  const getApplicantInfo = (email) => {
    return allUsers.find(u => u.email === email);
  };

  const statusConfig = {
    pending: { icon: Clock, color: isDark ? "text-yellow-400" : "text-amber-600", bg: isDark ? "bg-yellow-500/10" : "bg-amber-100" },
    approved: { icon: CheckCircle, color: isDark ? "text-green-400" : "text-green-700", bg: isDark ? "bg-green-500/10" : "bg-green-100" },
    rejected: { icon: XCircle, color: isDark ? "text-red-400" : "text-red-700", bg: isDark ? "bg-red-500/10" : "bg-red-100" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Institution Dashboard Applications</h2>
          <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Review requests for official institution accounts.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ background: isDark ? "rgba(255,208,0,0.1)" : "#fef3c7", color: isDark ? "#FFD000" : "#d97706", borderColor: isDark ? "rgba(255,208,0,0.2)" : "#fde68a" }}>
            {applications.filter(a => a.status === "pending").length} Pending
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ background: isDark ? "rgba(34,197,94,0.1)" : "#dcfce7", color: isDark ? "#4ade80" : "#16a34a", borderColor: isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0" }}>
            {applications.filter(a => a.status === "approved").length} Approved
          </span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>
          <p>No institution applications yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map(app => {
            const Config = statusConfig[app.status];
            const Icon = Config.icon;

            return (
              <div
                key={app.id}
                className="rounded-2xl p-6 border transition cursor-pointer shadow-sm hover:shadow-md"
                style={{ background: t.surface, borderColor: t.border }}
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>{app.institution_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${Config.bg} ${Config.color}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: t.textSecondary }}>
                      <span className="font-semibold" style={{ color: t.textPrimary }}>{app.contact_person}</span> • {app.institution_type} • {app.country}
                    </p>
                    <div className="flex gap-6 text-xs" style={{ color: t.textMuted }}>
                      <div><span style={{ color: t.textSecondary }}>Email:</span> {app.contact_email}</div>
                      <div><span style={{ color: t.textSecondary }}>Phone:</span> {app.contact_phone || "N/A"}</div>
                    </div>
                  </div>
                  {app.logo_url && (
                    <img src={app.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover border" style={{ borderColor: t.border }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-3xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" style={{ background: t.surface, borderColor: t.border }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: t.textPrimary }}>{selectedApp.institution_name}</h2>
              <button onClick={() => setSelectedApp(null)} className="transition hover:opacity-70" style={{ color: t.textSecondary }}>
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {selectedApp.logo_url && (
                <div className="flex justify-center">
                  <img src={selectedApp.logo_url} alt="Logo" className="w-32 h-32 rounded-xl object-cover border" style={{ borderColor: t.border }} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>Institution Type</p>
                  <p className="font-semibold capitalize" style={{ color: t.textPrimary }}>{selectedApp.institution_type}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>Country</p>
                  <p className="font-semibold" style={{ color: t.textPrimary }}>{selectedApp.country}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>Contact Person</p>
                  <p className="font-semibold" style={{ color: t.textPrimary }}>{selectedApp.contact_person}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>Email</p>
                  <p className="font-semibold" style={{ color: t.textPrimary }}>{selectedApp.contact_email}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Phone</p>
                <p style={{ color: t.textPrimary }}>{selectedApp.contact_phone || "Not provided"}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Procedures & Guidelines</p>
                <div className="rounded-xl p-4 text-sm max-h-48 overflow-y-auto border" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
                  {selectedApp.procedures_description}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Commitment & Values</p>
                <div className="rounded-xl p-4 text-sm max-h-48 overflow-y-auto border" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
                  {selectedApp.commitment_description}
                </div>
              </div>

              {selectedApp.status === "pending" && (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: t.textSecondary }}>Admin Notes (Optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes for approval/rejection reason..."
                      className="w-full border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none transition"
                      style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => approveAppMutation.mutate(selectedApp.id)}
                      disabled={approveAppMutation.isPending}
                      className="flex-1 font-bold h-12 rounded-xl transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: isDark ? "#22c55e" : "#16a34a", color: "#fff" }}
                    >
                      {approveAppMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                    </Button>
                    <Button
                      onClick={() => rejectAppMutation.mutate(selectedApp.id)}
                      disabled={rejectAppMutation.isPending}
                      className="flex-1 font-bold h-12 rounded-xl transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: isDark ? "#ef4444" : "#dc2626", color: "#fff" }}
                    >
                      {rejectAppMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
                    </Button>
                  </div>
                </>
              )}

              {selectedApp.status !== "pending" && selectedApp.admin_notes && (
                <div className="border rounded-xl p-4" style={{ background: isDark ? "rgba(59,130,246,0.1)" : "#eff6ff", borderColor: isDark ? "rgba(59,130,246,0.3)" : "#bfdbfe" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: isDark ? "#60a5fa" : "#2563eb" }}>ADMIN NOTES</p>
                  <p className="text-sm" style={{ color: t.textPrimary }}>{selectedApp.admin_notes}</p>
                </div>
              )}

              <Button
                onClick={() => setSelectedApp(null)}
                variant="ghost"
                className="w-full h-12 border"
                style={{ color: t.textSecondary, borderColor: t.border }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}