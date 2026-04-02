import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminInstitutionTab() {
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
    pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    approved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
    rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Institution Dashboard Applications</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400">
            {applications.filter(a => a.status === "pending").length} Pending
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400">
            {applications.filter(a => a.status === "approved").length} Approved
          </span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-[#121826] rounded-2xl border border-white/5">
          <p>No institution applications yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map(app => {
            const Config = statusConfig[app.status];
            const Icon = Config.icon;
            const applicant = getApplicantInfo(app.user_email);

            return (
              <div
                key={app.id}
                className="bg-[#121826] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition cursor-pointer"
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{app.institution_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${Config.bg} ${Config.color}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      <span className="font-semibold text-white">{app.contact_person}</span> • {app.institution_type} • {app.country}
                    </p>
                    <div className="flex gap-6 text-xs text-gray-500">
                      <div><span className="text-gray-400">Email:</span> {app.contact_email}</div>
                      <div><span className="text-gray-400">Phone:</span> {app.contact_phone || "N/A"}</div>
                    </div>
                  </div>
                  {app.logo_url && (
                    <img src={app.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F1A] rounded-3xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedApp.institution_name}</h2>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {selectedApp.logo_url && (
                <div className="flex justify-center">
                  <img src={selectedApp.logo_url} alt="Logo" className="w-32 h-32 rounded-xl object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Institution Type</p>
                  <p className="text-white font-semibold capitalize">{selectedApp.institution_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Country</p>
                  <p className="text-white font-semibold">{selectedApp.country}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Contact Person</p>
                  <p className="text-white font-semibold">{selectedApp.contact_person}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-white font-semibold">{selectedApp.contact_email}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Phone</p>
                <p className="text-white">{selectedApp.contact_phone || "Not provided"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Procedures & Guidelines</p>
                <div className="bg-[#121826] rounded-xl p-4 text-gray-200 text-sm max-h-48 overflow-y-auto">
                  {selectedApp.procedures_description}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Commitment & Values</p>
                <div className="bg-[#121826] rounded-xl p-4 text-gray-200 text-sm max-h-48 overflow-y-auto">
                  {selectedApp.commitment_description}
                </div>
              </div>

              {selectedApp.status === "pending" && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Admin Notes (Optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes for approval/rejection reason..."
                      className="w-full bg-[#121826] border border-white/10 rounded-xl p-3 text-white text-sm resize-none h-20"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => approveAppMutation.mutate(selectedApp.id)}
                      disabled={approveAppMutation.isPending}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold h-12 rounded-xl"
                    >
                      {approveAppMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                    </Button>
                    <Button
                      onClick={() => rejectAppMutation.mutate(selectedApp.id)}
                      disabled={rejectAppMutation.isPending}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-12 rounded-xl"
                    >
                      {rejectAppMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
                    </Button>
                  </div>
                </>
              )}

              {selectedApp.status !== "pending" && selectedApp.admin_notes && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-xs text-blue-400 font-bold mb-1">ADMIN NOTES</p>
                  <p className="text-white text-sm">{selectedApp.admin_notes}</p>
                </div>
              )}

              <Button
                onClick={() => setSelectedApp(null)}
                variant="ghost"
                className="w-full h-12"
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