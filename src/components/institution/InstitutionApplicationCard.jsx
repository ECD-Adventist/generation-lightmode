import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, XCircle, ExternalLink, Building2 } from "lucide-react";

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Pending Review" },
  approved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Rejected" },
};

export default function InstitutionApplicationCard({ application, institutionPage }) {
  const config = statusConfig[application.status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`bg-[#121826] rounded-2xl p-6 border ${config.border} hover:border-white/20 transition group`}>
      <div className="flex items-start gap-4">
        {application.logo_url ? (
          <img src={application.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00CFFF]/20 to-[#8A5CFF]/20 border border-white/10 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-[#00CFFF]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-lg font-bold text-white truncate">{application.institution_name}</h3>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color} flex items-center gap-1`}>
              <Icon className="w-3 h-3" /> {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-2 capitalize">{application.institution_type} • {application.country}</p>
          <p className="text-xs text-gray-500">{application.contact_person} • {application.contact_email}</p>
        </div>
      </div>

      {application.admin_notes && (
        <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Admin Feedback</p>
          <p className="text-sm text-gray-300">{application.admin_notes}</p>
        </div>
      )}

      {application.status === "approved" && institutionPage && (
        <div className="mt-4 flex gap-3">
          <Link
            to={`/InstitutionDashboard?id=${institutionPage.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#00CFFF]/10 to-[#8A5CFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] font-bold text-sm hover:from-[#00CFFF]/20 hover:to-[#8A5CFF]/20 transition"
          >
            <ExternalLink className="w-4 h-4" /> Manage Dashboard
          </Link>
          <Link
            to={`/InstitutionPage?id=${institutionPage.id}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold text-sm hover:bg-white/10 transition"
          >
            View Page
          </Link>
        </div>
      )}

      {application.status === "approved" && !institutionPage && (
        <div className="mt-4 text-center py-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-500">
          Dashboard page is being set up by the admin team.
        </div>
      )}
    </div>
  );
}