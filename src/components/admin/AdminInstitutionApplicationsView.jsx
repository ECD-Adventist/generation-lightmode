import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Clock, Filter, Layers, Loader2, Search, ShieldAlert, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const statusMeta = {
  all: { label: "All", color: "#5AC8FF" },
  pending: { label: "Pending", color: "#FFD60A" },
  approved: { label: "Approved", color: "#4ade80" },
  rejected: { label: "Rejected", color: "#f87171" },
  revoked: { label: "Revoked", color: "#fb7185" },
};

export default function AdminInstitutionApplicationsView({ applications, allUsers, onSelectApp, adminNotes }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
    revoked: applications.filter(a => a.status === "revoked").length,
  }), [applications]);

  const duplicateNames = useMemo(() => {
    const counts = new Map();
    applications.forEach(app => {
      const key = app.institution_name?.trim().toLowerCase();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter(app => {
      const applicant = allUsers.find(u => u.email === app.user_email);
      const matchesStatus = status === "all" || app.status === status;
      const matchesSearch = !q || [app.institution_name, app.contact_person, app.contact_email, app.user_email, app.country, applicant?.full_name]
        .filter(Boolean).some(value => String(value).toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [applications, allUsers, search, status]);

  const bulkMutation = useMutation({
    mutationFn: async (nextStatus) => {
      await Promise.all(selectedIds.map(id => base44.entities.InstitutionApplication.update(id, { status: nextStatus, admin_notes: adminNotes })));
      return nextStatus;
    },
    onSuccess: (nextStatus) => {
      queryClient.invalidateQueries({ queryKey: ["institutionApplications"] });
      setSelectedIds([]);
      toast.success(`${nextStatus === "approved" ? "Approved" : "Rejected"} ${selectedIds.length} application(s).`);
    },
  });

  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const kpis = [
    { label: "Total Applications", value: stats.total, icon: Layers, color: t.accent },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: t.warning },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: t.success },
    { label: "Risk Flags", value: applications.filter(app => duplicateNames.get(app.institution_name?.trim().toLowerCase()) > 1 || !allUsers.some(u => u.email === app.user_email)).length, icon: AlertTriangle, color: t.danger },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="adm-card adm-card-accent">
              <div className="flex items-center justify-between">
                <div>
                  <div className="adm-stat-big" style={{ color: item.color }}>{item.value}</div>
                  <div className="adm-stat-label">{item.label}</div>
                </div>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${item.color}22` }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="adm-card">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institution, contact, email, country..." className="pl-9 h-11 rounded-xl" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(statusMeta).map(key => (
              <button key={key} onClick={() => setStatus(key)} className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition" style={status === key ? { background: statusMeta[key].color, color: key === "pending" ? "#0B0F1A" : "#FFFFFF", borderColor: statusMeta[key].color } : { color: t.textSecondary, borderColor: t.border, background: t.surfaceMuted }}>
                {statusMeta[key].label} {key !== "all" ? stats[key] : stats.total}
              </button>
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-4 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: t.accentSoft, border: `1px solid ${t.borderStrong}` }}>
            <div className="text-sm font-bold" style={{ color: t.textPrimary }}>{selectedIds.length} selected</div>
            <div className="flex gap-2">
              <Button onClick={() => bulkMutation.mutate("approved")} disabled={bulkMutation.isPending} className="rounded-xl font-bold" style={{ background: t.success, color: "#fff" }}>Bulk Approve</Button>
              <Button onClick={() => bulkMutation.mutate("rejected")} disabled={bulkMutation.isPending} className="rounded-xl font-bold" style={{ background: t.danger, color: "#fff" }}>Bulk Reject</Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map(app => {
          const applicant = allUsers.find(u => u.email === app.user_email);
          const duplicate = duplicateNames.get(app.institution_name?.trim().toLowerCase()) > 1;
          const unknownUser = !applicant;
          const meta = statusMeta[app.status] || statusMeta.pending;
          return (
            <div key={app.id} className="rounded-3xl border p-5 transition hover:-translate-y-0.5" style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadow }}>
              <div className="flex items-start gap-4">
                <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggleSelected(app.id)} className="mt-2" />
                <button onClick={() => onSelectApp(app)} className="flex-1 text-left min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-black truncate" style={{ color: t.textPrimary }}>{app.institution_name}</h3>
                      <p className="text-sm mt-1" style={{ color: t.textSecondary }}>{app.contact_person} • {app.institution_type} • {app.country}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ background: `${meta.color}22`, color: meta.color }}>{meta.label}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: t.textMuted }}>
                    <div className="rounded-xl p-3" style={{ background: t.surfaceMuted }}>Contact: {app.contact_email || app.user_email}</div>
                    <div className="rounded-xl p-3" style={{ background: t.surfaceMuted }}>Applicant: {applicant?.full_name || "Unknown user"}</div>
                  </div>

                  {(duplicate || unknownUser) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {duplicate && <span className="adm-badge adm-badge-danger"><AlertTriangle className="w-3 h-3" /> Duplicate name</span>}
                      {unknownUser && <span className="adm-badge adm-badge-gold"><Users className="w-3 h-3" /> User not found</span>}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                    <Filter className="w-3 h-3" /> Submitted {app.created_date ? new Date(app.created_date).toLocaleDateString() : "recently"}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 rounded-2xl border" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>No applications match your filters.</div>
      )}
    </div>
  );
}