import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Plus, Eye, FileText, Calendar, CheckCircle, AlertCircle, Clock, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import ComplianceAuditForm from "@/components/compliance/ComplianceAuditForm";

const statusConfig = {
  submitted: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Submitted" },
  under_review: { icon: AlertCircle, color: "text-blue-400", bg: "bg-blue-500/20", label: "Under Review" },
  approved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20", label: "Approved" },
  requires_revision: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/20", label: "Revision Needed" }
};

export default function ComplianceReporting() {
  const [user, setUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const me = await base44.auth.me();
          setUser(me);
          
          // Fetch institution if user is a leader
          const institutions = await base44.entities.InstitutionApplication.filter({ 
            applicant_email: me.email,
            status: "approved"
          });
          if (institutions.length > 0) {
            setInstitution(institutions[0]);
          }
        } else {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }
    checkAuth();
  }, []);

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["complianceAudits", user?.email],
    queryFn: () => base44.entities.ComplianceAudit.filter({ leader_email: user?.email }, '-created_date'),
    enabled: !!user
  });

  const filteredAudits = statusFilter === "all" 
    ? audits 
    : audits.filter(a => a.status === statusFilter);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-[#FFD000] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-gray-400 mb-6">Only approved institution leaders can access the compliance reporting portal.</p>
          <Link to={createPageUrl("Dashboard")} className="inline-block px-6 py-3 bg-[#00CFFF] text-black font-bold rounded-lg hover:opacity-90 transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-20">
      <style>{`
        @keyframes pan-map {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float-light {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.35; }
        }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none w-[200vw] flex" style={{ animation: "pan-map 180s linear infinite" }}>
        <div className="h-full w-[100vw] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: "url('https://media.base44.com/images/public/69a6fca6155ae283f1b55144/7dea9e31b_digital-world-map-hologram-blue-background.jpg')", filter: "grayscale(1) brightness(0.5) contrast(1.3)" }} />
      </div>

      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-[#00CFFF] rounded-full blur-[120px] z-0 opacity-[0.08] pointer-events-none animate-[float-light_8s_ease-in-out_infinite]"></div>
      <div className="absolute top-[50%] left-[70%] w-[400px] h-[400px] bg-[#00CFFF] rounded-full blur-[140px] z-0 opacity-[0.06] pointer-events-none animate-[float-light_12s_ease-in-out_infinite_2s]"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-['Space_Grotesk'] mb-2 text-[#00CFFF]">ECD Compliance Reporting Portal</h1>
          <p className="text-gray-400">Submit and manage periodic compliance audits for <strong>{institution.institution_name}</strong></p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#121826] border border-white/10 rounded-2xl p-6">
            <div className="text-3xl font-black text-[#00CFFF]">{audits.length}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Total Submissions</div>
          </div>
          <div className="bg-[#121826] border border-white/10 rounded-2xl p-6">
            <div className="text-3xl font-black text-green-400">{audits.filter(a => a.status === 'approved').length}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Approved</div>
          </div>
          <div className="bg-[#121826] border border-white/10 rounded-2xl p-6">
            <div className="text-3xl font-black text-yellow-400">{audits.filter(a => a.status === 'submitted').length}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Pending Review</div>
          </div>
          <div className="bg-[#121826] border border-white/10 rounded-2xl p-6">
            <div className="text-3xl font-black text-red-400">{audits.filter(a => a.status === 'requires_revision').length}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Revision Needed</div>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold rounded-lg h-11 px-6 flex items-center gap-2 hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" /> New Audit Submission
          </Button>

          <div className="flex gap-2 flex-wrap">
            {["all", "submitted", "under_review", "approved", "requires_revision"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition border ${
                  statusFilter === status
                    ? "bg-[#00CFFF]/20 border-[#00CFFF]/50 text-[#00CFFF]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                }`}
              >
                {status === "all" ? "All" : status.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Audits List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-12 bg-[#121826]/50 rounded-2xl border border-white/5">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No compliance audits yet. Start by submitting your first audit.</p>
              <button onClick={() => setIsFormOpen(true)} className="mt-4 text-[#00CFFF] hover:underline font-bold">
                Submit Audit
              </button>
            </div>
          ) : (
            filteredAudits.map(audit => {
              const config = statusConfig[audit.status] || statusConfig.submitted;
              const Icon = config.icon;
              return (
                <div
                  key={audit.id}
                  className="bg-[#121826] border border-white/10 rounded-2xl p-6 hover:border-[#00CFFF]/30 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{audit.territory_name}</h3>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                          <span className={config.color}>{config.label}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                        <div>
                          <span className="text-gray-500 text-xs">Members</span>
                          <p className="font-bold text-white">{audit.member_count}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Period</span>
                          <p className="font-bold text-white capitalize">{audit.audit_period}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Supervision</span>
                          <p className="font-bold text-white capitalize">{audit.supervision_frequency}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">ECD Compliance</span>
                          <p className={`font-bold ${
                            audit.ecd_alignment_status === "fully_compliant" ? "text-green-400" :
                            audit.ecd_alignment_status === "mostly_compliant" ? "text-yellow-400" :
                            audit.ecd_alignment_status === "partially_compliant" ? "text-orange-400" :
                            "text-red-400"
                          }`}>
                            {audit.ecd_alignment_status.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>

                      {audit.supervision_activities && (
                        <p className="text-sm text-gray-300 line-clamp-2 mb-3">{audit.supervision_activities}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(audit.created_date).toLocaleDateString()}
                        </span>
                        {audit.documentation_urls?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" />
                            {audit.documentation_urls.length} document{audit.documentation_urls.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {audit.reviewer_feedback && (
                        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                          <p className="text-xs text-gray-400"><strong>Reviewer Feedback:</strong> {audit.reviewer_feedback}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => setSelectedAudit(audit)}
                      variant="ghost"
                      className="h-10 px-4 text-[#00CFFF] hover:bg-[#00CFFF]/10 rounded-lg"
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <ComplianceAuditForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} user={user} institution={institution} />

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-white/10 rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setSelectedAudit(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <FileText className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-[#00CFFF] mb-4">{selectedAudit.territory_name} - Audit Details</h2>

            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Status</p>
                <p className="font-bold">{statusConfig[selectedAudit.status].label}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Members</p>
                  <p className="font-bold">{selectedAudit.member_count}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Audit Period</p>
                  <p className="font-bold capitalize">{selectedAudit.audit_period}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Supervision Activities</p>
                <p>{selectedAudit.supervision_activities}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">ECD Compliance Status</p>
                <p className="font-bold capitalize">{selectedAudit.ecd_alignment_status.replace(/_/g, " ")}</p>
              </div>

              {selectedAudit.ecd_standards_met?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Standards Met</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedAudit.ecd_standards_met.map(s => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAudit.ecd_gaps && (
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Compliance Gaps</p>
                  <p>{selectedAudit.ecd_gaps}</p>
                </div>
              )}

              {selectedAudit.corrective_actions && (
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Corrective Actions</p>
                  <p>{selectedAudit.corrective_actions}</p>
                </div>
              )}

              {selectedAudit.notes && (
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Additional Notes</p>
                  <p>{selectedAudit.notes}</p>
                </div>
              )}

              {selectedAudit.documentation_urls?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-2">Documentation</p>
                  <div className="space-y-2">
                    {selectedAudit.documentation_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#00CFFF] hover:underline text-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Document {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedAudit.reviewer_feedback && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
                  <p className="text-gray-500 text-xs uppercase mb-1">Reviewer Feedback</p>
                  <p>{selectedAudit.reviewer_feedback}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAudit(null)}
              className="mt-6 w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}