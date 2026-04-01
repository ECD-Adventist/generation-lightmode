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
      <div className="text-center py-20 text-gray-500 bg-[#121826]/50 rounded-2xl border border-white/5">
        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-bold text-lg">No Institutions</p>
        <p className="text-sm mt-1">{isOwnProfile ? "You haven't claimed any institution dashboards yet." : "This user hasn't registered any institutions."}</p>
        {isOwnProfile && (
          <Link to="/ClaimInstitutionDashboard" className="inline-block mt-4 text-[#00CFFF] font-bold hover:underline">
            Claim an Institution Dashboard
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visibleApps.map(app => {
        const page = findPage(app);
        const isApproved = app.status === "approved";

        return (
          <div key={app.id} className="bg-[#121826] rounded-2xl p-5 border border-white/5 hover:border-white/15 transition">
            <div className="flex items-center gap-3 mb-3">
              {app.logo_url ? (
                <img src={app.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00CFFF]/20 to-[#8A5CFF]/20 flex items-center justify-center border border-white/10">
                  <Building2 className="w-5 h-5 text-[#00CFFF]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white truncate flex items-center gap-1.5">
                  {app.institution_name}
                  {isApproved && <Shield className="w-3.5 h-3.5 text-[#00CFFF] shrink-0" />}
                </h4>
                <p className="text-xs text-gray-500 capitalize">{app.institution_type} • {app.country}</p>
              </div>
            </div>

            {isApproved && page ? (
              <Link
                to={`/InstitutionPage?id=${page.id}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] font-bold text-xs hover:bg-[#00CFFF]/20 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Dashboard
              </Link>
            ) : isApproved ? (
              <div className="text-center py-2.5 rounded-xl bg-green-500/10 text-green-400 text-xs font-bold">
                ✓ Approved — Dashboard being set up
              </div>
            ) : isOwnProfile ? (
              <div className={`text-center py-2.5 rounded-xl text-xs font-bold ${app.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                {app.status === "rejected" ? "✕ Application Rejected" : "⏳ Under Review"}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}