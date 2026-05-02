import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, Building2, ExternalLink, Shield } from "lucide-react";

export default function ProfileInstitutionsTab({ profileEmail, isOwnProfile }) {
  // Fetch applications by this user
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["userInstitutionApps", profileEmail],
    queryFn: () => base44.entities.InstitutionApplication.filter({ user_email: profileEmail }, "-created_date"),
    enabled: !!profileEmail,
  });

  // Fetch all institution pages to match approved applications
  const { data: institutionPages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["allInstitutionPages"],
    queryFn: () => base44.entities.InstitutionPage.list("-created_date", 100),
  });

  const isLoading = appsLoading || pagesLoading;

  // For public view, only show approved applications
  const visibleApps = isOwnProfile ? applications : applications.filter(a => a.status === "approved");

  const findPage = (app) => {
    return institutionPages.find(
      p => p.owner_email === app.user_email && p.name?.toLowerCase() === app.institution_name?.toLowerCase()
    ) || institutionPages.find(
      p => p.owner_email === app.user_email
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin" /></div>;
  }

  if (visibleApps.length === 0) {
    return (
      <div className="text-center py-12 px-4 sm:py-20 text-gray-400 bg-[#121826] rounded-3xl border border-white/10 shadow-xl shadow-black/10">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#00CFFF]/15 to-[#8A5CFF]/15 border border-[#00CFFF]/20">
          <Building2 className="w-7 h-7 text-[#00CFFF]" />
        </div>
        <p className="font-black text-base sm:text-lg text-white">No Institutions</p>
        <p className="text-xs sm:text-sm mt-1 max-w-xs mx-auto leading-relaxed">{isOwnProfile ? "You haven't claimed any institution dashboards yet." : "This user hasn't registered any institutions."}</p>
        {isOwnProfile && (
          <Link to="/ClaimInstitutionDashboard" className="inline-flex mt-5 px-4 py-2.5 rounded-full text-[#0B0F1A] bg-[#00CFFF] font-black text-xs active:scale-95 transition">
            Claim Institution
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="py-2 sm:py-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {visibleApps.map(app => {
        const page = findPage(app);
        const isApproved = app.status === "approved";

        return (
          <div key={app.id} className="relative overflow-hidden bg-[#121826] rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xl shadow-black/10 transition hover:border-[#00CFFF]/30">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: isApproved ? "#00CFFF" : "#FFD000" }} />

            <div className="relative flex items-start gap-3 mb-4 min-w-0">
              {app.logo_url ? (
                <img src={app.logo_url} alt="" className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-white/10 shrink-0" />
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#00CFFF]/20 to-[#8A5CFF]/20 flex items-center justify-center border border-white/10 shrink-0">
                  <Building2 className="w-5 h-5 text-[#00CFFF]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1.5 min-w-0">
                  <h4 className="font-black text-white text-sm sm:text-base leading-tight break-words min-w-0">
                    {app.institution_name}
                  </h4>
                  {isApproved && <Shield className="w-3.5 h-3.5 text-[#00CFFF] shrink-0 mt-0.5" />}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/5 text-gray-300 border border-white/10 capitalize">{app.institution_type}</span>
                  {app.country && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20">{app.country}</span>}
                </div>
              </div>
            </div>

            {isApproved && page ? (
              <div className="relative flex flex-col sm:flex-row gap-2">
                {isOwnProfile && (
                  <Link
                    to={`/InstitutionDashboard?id=${page.id}`}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-[#00CFFF]/15 to-[#8A5CFF]/15 border border-[#00CFFF]/25 text-[#00CFFF] font-black text-xs active:scale-95 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Manage
                  </Link>
                )}
                <Link
                  to={`/InstitutionPage?id=${page.id}`}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-black text-xs active:scale-95 transition"
                >
                  View Page
                </Link>
              </div>
            ) : isApproved ? (
              <div className="relative text-center py-2.5 rounded-2xl bg-green-500/10 text-green-400 text-xs font-black border border-green-500/15">
                Approved — Dashboard setup in progress
              </div>
            ) : isOwnProfile ? (
              <div className={`relative text-center py-2.5 rounded-2xl text-xs font-black border ${app.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/15" : "bg-yellow-500/10 text-yellow-300 border-yellow-500/15"}`}>
                {app.status === "rejected" ? "Application Rejected" : "Under Review"}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}