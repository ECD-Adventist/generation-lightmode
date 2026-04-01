import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import InstitutionDashboardEditor from "@/components/institution/InstitutionDashboardEditor";

export default function InstitutionDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    });
  }, []);

  const { data: page, isLoading } = useQuery({
    queryKey: ["institutionPageEdit", pageId],
    queryFn: () => base44.entities.InstitutionPage.get(pageId),
    enabled: !!pageId && !!user,
  });

  if (!pageId) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center justify-center gap-4">
        <Building2 className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400">No institution specified.</p>
        <Link to="/ClaimInstitutionDashboard" className="text-[#00CFFF] hover:underline text-sm">Back to My Institutions</Link>
      </div>
    );
  }

  if (isLoading || !user) {
    return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Institution page not found.</p>
        <Link to="/ClaimInstitutionDashboard" className="text-[#00CFFF] hover:underline text-sm">Back to My Institutions</Link>
      </div>
    );
  }

  // Only allow the owner or admins
  const isOwner = page.owner_email === user.email;
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isOwner && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">You don't have permission to manage this institution.</p>
        <Link to={createPageUrl("Feed")} className="text-[#00CFFF] hover:underline text-sm">Back to Feed</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Manage: {page.name}
            </h1>
            <span className="text-xs text-gray-500">Institution Dashboard</span>
          </div>
          <Link to={`/InstitutionPage?id=${page.id}`} className="text-xs text-[#00CFFF] font-bold hover:underline">View Public Page →</Link>
        </div>
      </div>

      <InstitutionDashboardEditor page={page} user={user} />
    </div>
  );
}