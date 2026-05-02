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

  const ownedPages = institutionPages.filter(p => p.owner_email === profileEmail);

  const applicationItems = (isOwnProfile ? applications : applications.filter(a => a.status === "approved")).map(app => {
    const page = institutionPages.find(
      p => p.owner_email === app.user_email && p.name?.toLowerCase() === app.institution_name?.toLowerCase()
    ) || institutionPages.find(p => p.owner_email === app.user_email);

    return { type: "application", app, page, id: app.id };
  });

  const pageOnlyItems = ownedPages
    .filter(page => !applicationItems.some(item => item.page?.id === page.id))
    .map(page => ({ type: "page", page, id: page.id }));

  const visibleItems = [...applicationItems, ...pageOnlyItems];

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin" /></div>;
  }

  if (visibleItems.length === 0) {
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
      {visibleItems.map(item => {
        const app = item.app;
        const page = item.page;
        const isApproved = item.type === "page" || app?.status === "approved";
        const name = app?.institution_name || page?.name;
        const type = app?.institution_type || page?.category;
        const location = app?.country || page?.location;
        const logoUrl = app?.logo_url || page?.logo_url;

        return (
          <div key={item.id} className="bg-[#121826] rounded-2xl p-5 border border-white/5 hover:border-white/15 transition">
            <div className="flex items-center gap-3 mb-3">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00CFFF]/20 to-[#8A5CFF]/20 flex items-center justify-center border border-white/10">
                  <Building2 className="w-5 h-5 text-[#00CFFF]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white truncate flex items-center gap-1.5">
                  {name}
                  {isApproved && <Shield className="w-3.5 h-3.5 text-[#00CFFF] shrink-0" />}
                </h4>
                <p className="text-xs text-gray-500 capitalize">{type} • {location}</p>
              </div>
            </div>

            {isApproved && page ? (
              <div className="flex gap-2">
                {isOwnProfile && (
                  <Link
                    to={`/InstitutionDashboard?id=${page.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#00CFFF]/10 to-[#8A5CFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] font-bold text-xs hover:from-[#00CFFF]/20 hover:to-[#8A5CFF]/20 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Manage
                  </Link>
                )}
                <Link
                  to={`/InstitutionPage?id=${page.id}`}
                  className={`${isOwnProfile ? "" : "flex-1"} flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold text-xs hover:bg-white/10 transition`}
                >
                  View Page
                </Link>
              </div>
            ) : isApproved ? (
              <div className="text-center py-2.5 rounded-xl bg-green-500/10 text-green-400 text-xs font-bold">
                ✓ Approved — Institution profile ready
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