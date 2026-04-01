import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import InstitutionApplicationCard from "@/components/institution/InstitutionApplicationCard";
import NewApplicationForm from "@/components/institution/NewApplicationForm";

export default function ClaimInstitutionDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["myInstitutionApps", user?.email],
    queryFn: () => base44.entities.InstitutionApplication.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: institutionPages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["allInstitutionPages"],
    queryFn: () => base44.entities.InstitutionPage.list("-created_date", 100),
    enabled: !!user,
  });

  const findPageForApp = (app) => {
    return institutionPages.find(
      p => p.owner_email === app.user_email && p.name?.toLowerCase() === app.institution_name?.toLowerCase()
    ) || institutionPages.find(
      p => p.owner_email === app.user_email
    );
  };

  const isLoading = !user || appsLoading || pagesLoading;
  const approvedCount = applications.filter(a => a.status === "approved").length;
  const pendingCount = applications.filter(a => a.status === "pending").length;

  if (isLoading) {
    return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#00CFFF] hover:text-[#00CFFF]/80 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-['Space_Grotesk'] flex items-center gap-3">
              <Building2 className="w-8 h-8 text-[#00CFFF]" />
              My Institutions
            </h1>
            <p className="text-gray-400 mt-1">Manage your institution dashboards and applications.</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold h-12 px-6 rounded-xl hover:opacity-90 transition shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" /> New Application
            </Button>
          )}
        </div>

        {/* Stats */}
        {applications.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-[#121826] rounded-2xl p-4 border border-white/5 text-center">
              <div className="text-2xl font-black text-white font-['Space_Grotesk']">{applications.length}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Total</div>
            </div>
            <div className="bg-[#121826] rounded-2xl p-4 border border-green-500/10 text-center">
              <div className="text-2xl font-black text-green-400 font-['Space_Grotesk']">{approvedCount}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Approved</div>
            </div>
            <div className="bg-[#121826] rounded-2xl p-4 border border-yellow-500/10 text-center">
              <div className="text-2xl font-black text-yellow-400 font-['Space_Grotesk']">{pendingCount}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Pending</div>
            </div>
          </div>
        )}

        {/* New Application Form */}
        {showForm && (
          <div className="mb-8">
            <NewApplicationForm
              user={user}
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                queryClient.invalidateQueries({ queryKey: ["myInstitutionApps", user?.email] });
              }}
            />
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 && !showForm ? (
          <div className="text-center py-20 bg-[#121826] rounded-3xl border border-white/5">
            <Building2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Institution Applications Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Register your church, school, or organization to get an official institution dashboard on Generation LightMode.</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold h-12 px-8 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Submit Your First Application
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <InstitutionApplicationCard
                key={app.id}
                application={app}
                institutionPage={findPageForApp(app)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}