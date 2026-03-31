import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Building2, Mail, Phone, Globe, MapPin, Loader2 } from "lucide-react";

export default function AdminInstitutionsTab() {
  const [filter, setFilter] = useState("pending");
  const [updatingId, setUpdatingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["institutions", filter],
    queryFn: () => filter === "all"
      ? base44.entities.Institution.list("-submitted_at")
      : base44.entities.Institution.filter({ status: filter }, "-submitted_at")
  });

  const updateStatus = async (id, status, applicantEmail, institutionName) => {
    try {
      setUpdatingId(id);
      await base44.entities.Institution.update(id, { status });
      
      // Send notification email
      await base44.functions.invoke('notifyInstitutionApplicationDecision', {
        applicant_email: applicantEmail,
        institution_name: institutionName,
        status: status
      });
      
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast.success(`Application ${status} and email sent`);
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColors = {
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    approved: "text-green-400 bg-green-400/10 border-green-400/30",
    rejected: "text-red-400 bg-red-400/10 border-red-400/30"
  };

  const statusIcons = {
    pending: <Clock className="w-3.5 h-3.5" />,
    approved: <CheckCircle className="w-3.5 h-3.5" />,
    rejected: <XCircle className="w-3.5 h-3.5" />
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#00CFFF]" /> Institution Applications
        </h2>
        <div className="flex gap-2 ml-auto">
          {["pending", "approved", "rejected", "all"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${filter === s ? "bg-[#00CFFF] text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-[#121826] rounded-2xl border border-white/5">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No {filter} applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-[#121826] rounded-2xl border border-white/10 p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{app.institution_name}</h3>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${statusColors[app.status]}`}>
                      {statusIcons[app.status]} {app.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#8A5CFF]/15 text-[#8A5CFF] border border-[#8A5CFF]/20 uppercase">
                      {app.institution_type}
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">{app.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#00CFFF] shrink-0" />
                      <span className="truncate">{app.contact_email}</span>
                    </div>
                    {app.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#00CFFF] shrink-0" />
                        <span>{app.contact_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#00CFFF] shrink-0" />
                      <span className="truncate">{app.institution_address}</span>
                    </div>
                    {app.website_url && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#00CFFF] shrink-0" />
                        <a href={app.website_url} target="_blank" rel="noopener noreferrer" className="text-[#00CFFF] hover:underline truncate">{app.website_url}</a>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Applicant: <span className="text-gray-300">{app.applicant_email}</span>
                    {app.submitted_at && (
                      <span className="ml-3">Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {app.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={updatingId === app.id}
                      onClick={() => updateStatus(app.id, "approved", app.applicant_email, app.institution_name)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                    </button>
                    <button
                      disabled={updatingId === app.id}
                      onClick={() => updateStatus(app.id, "rejected", app.applicant_email, app.institution_name)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}