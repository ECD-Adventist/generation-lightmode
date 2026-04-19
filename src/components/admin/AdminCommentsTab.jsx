import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, CheckCircle, Trash2, MessageSquare, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminCommentsTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);

  const { data: reportedComments = [], isLoading } = useQuery({
    queryKey: ["reportedComments"],
    queryFn: () => base44.entities.ReportedComment.list("-created_date", 100),
    refetchInterval: 30000,
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ["allComments"],
    queryFn: () => base44.entities.GlowDropComment.list("-created_date", 1000),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["adminCommentUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportedComment.update(data.id, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportedComments"] });
      setSelectedReport(null);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => base44.entities.GlowDropComment.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allComments"] });
      queryClient.invalidateQueries({ queryKey: ["reportedComments"] });
      setSelectedReport(null);
    }
  });

  const getComment = (commentId) => allComments.find(c => c.id === commentId);
  const getUser = (email) => allUsers.find(u => u.email === email) || { email, full_name: email?.split("@")[0] };

  const pendingReports = reportedComments.filter(r => r.status === "pending");
  const resolvedReports = reportedComments.filter(r => r.status === "resolved" || r.status === "dismissed");

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Comment Moderation</h1>
        <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Review flagged comments to maintain a safe community.</p>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-2xl p-5" style={{ background: t.surface, borderColor: t.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: t.textSecondary }}>Pending Reports</p>
              <p className="text-3xl font-black mt-2" style={{ color: isDark ? "#FFD000" : "#d97706" }}>{pendingReports.length}</p>
            </div>
            <Flag className="w-10 h-10" style={{ color: isDark ? "rgba(255,208,0,0.3)" : "rgba(217,119,6,0.3)" }} />
          </div>
        </div>
        <div className="border rounded-2xl p-5" style={{ background: t.surface, borderColor: t.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: t.textSecondary }}>Resolved</p>
              <p className="text-3xl font-black mt-2" style={{ color: isDark ? "#00CFFF" : "#0B3FD9" }}>{resolvedReports.length}</p>
            </div>
            <CheckCircle className="w-10 h-10" style={{ color: isDark ? "rgba(0,207,255,0.3)" : "rgba(11,63,217,0.3)" }} />
          </div>
        </div>
        <div className="border rounded-2xl p-5" style={{ background: t.surface, borderColor: t.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: t.textSecondary }}>Total Reports</p>
              <p className="text-3xl font-black mt-2" style={{ color: t.textPrimary }}>{reportedComments.length}</p>
            </div>
            <MessageSquare className="w-10 h-10" style={{ color: t.textMuted, opacity: 0.3 }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2">
          <div className="border rounded-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
            <div className="p-5 border-b" style={{ borderColor: t.border }}>
              <h3 className="font-bold text-lg" style={{ color: t.textPrimary }}>Moderation Queue</h3>
              <p className="text-xs mt-1" style={{ color: t.textSecondary }}>{pendingReports.length} pending • {resolvedReports.length} resolved</p>
            </div>
            <div className="divide-y" style={{ borderColor: t.border }}>
              {reportedComments.length === 0 ? (
                <div className="p-8 text-center" style={{ color: t.textSecondary }}>
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No comment reports yet.</p>
                </div>
              ) : (
                reportedComments.map((report) => {
                  const reporter = getUser(report.reporter_email);
                  const isSelected = selectedReport?.id === report.id;
                  const isPending = report.status === "pending";
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-4 transition ${isSelected ? "border-l-2" : "border-l-2 border-transparent"} ${isPending ? "" : "opacity-60"}`}
                      style={{
                        background: isSelected ? t.accentSoft : (isPending ? t.surfaceMuted : "transparent"),
                        borderLeftColor: isSelected ? t.accent : "transparent"
                      }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm truncate" style={{ color: t.textPrimary }}>{reporter.full_name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide`}
                              style={isPending ? { background: isDark ? "rgba(255,208,0,0.2)" : "#fef3c7", color: isDark ? "#FFD000" : "#d97706" } : { background: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7", color: isDark ? "#4ade80" : "#16a34a" }}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: t.textSecondary }}>Reason: {report.reason}</p>
                          <p className="text-[10px] mt-1" style={{ color: t.textMuted }}>{formatDistanceToNow(new Date(report.created_date), { addSuffix: true })}</p>
                        </div>
                        <Flag className={`w-4 h-4 flex-shrink-0`} style={{ color: isPending ? (isDark ? "#FFD000" : "#d97706") : t.textMuted }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {!selectedReport ? (
            <div className="border rounded-2xl p-8 text-center sticky top-6" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Select a report to review details and take action.</p>
            </div>
          ) : (() => {
            const comment = getComment(selectedReport.comment_id);
            const reporter = getUser(selectedReport.reporter_email);
            if (!comment) {
              return (
                <div className="border rounded-2xl p-6 sticky top-6" style={{ background: t.surface, borderColor: t.border }}>
                  <p className="text-sm mb-4" style={{ color: t.textSecondary }}>Comment has been deleted.</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => updateReportMutation.mutate({ id: selectedReport.id, status: "resolved" })}
                      disabled={updateReportMutation.isPending}
                      className="w-full rounded-lg py-2 text-sm font-bold transition disabled:opacity-50"
                      style={{ background: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7", color: isDark ? "#4ade80" : "#16a34a", border: `1px solid ${isDark ? "rgba(34,197,94,0.3)" : "#bbf7d0"}` }}
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => updateReportMutation.mutate({ id: selectedReport.id, status: "dismissed" })}
                      disabled={updateReportMutation.isPending}
                      className="w-full rounded-lg py-2 text-sm font-bold transition disabled:opacity-50"
                      style={{ background: t.surfaceMuted, color: t.textSecondary, border: `1px solid ${t.border}` }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div className="border rounded-2xl p-6 sticky top-6 space-y-5" style={{ background: t.surface, borderColor: t.border }}>
                {/* Report Info */}
                <div className="border-b pb-4" style={{ borderColor: t.border }}>
                  <p className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: t.textSecondary }}>Report Details</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span style={{ color: t.textSecondary }}>Reported by:</span>
                      <p className="font-bold" style={{ color: t.textPrimary }}>{reporter.full_name}</p>
                    </div>
                    <div>
                      <span style={{ color: t.textSecondary }}>Reason:</span>
                      <p className="font-bold" style={{ color: isDark ? "#FFD000" : "#d97706" }}>{selectedReport.reason}</p>
                    </div>
                    <div>
                      <span style={{ color: t.textSecondary }}>Date:</span>
                      <p className="text-xs" style={{ color: t.textSecondary }}>{new Date(selectedReport.created_date).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Comment Content */}
                <div className="border-b pb-4" style={{ borderColor: t.border }}>
                  <p className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: t.textSecondary }}>Flagged Comment</p>
                  <div className="rounded-lg p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                    <p className="text-sm leading-relaxed break-words" style={{ color: t.textPrimary }}>{comment.content}</p>
                    <p className="text-xs mt-2" style={{ color: t.textMuted }}>By: {getUser(comment.user_email).full_name}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                    disabled={deleteCommentMutation.isPending || selectedReport.status !== "pending"}
                    className="w-full rounded-lg py-2 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: isDark ? "rgba(239,68,68,0.2)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}` }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {deleteCommentMutation.isPending ? "Deleting..." : "Delete Comment"}
                  </button>
                  <button
                    onClick={() => updateReportMutation.mutate({ id: selectedReport.id, status: "resolved" })}
                    disabled={updateReportMutation.isPending || selectedReport.status !== "pending"}
                    className="w-full rounded-lg py-2 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7", color: isDark ? "#4ade80" : "#16a34a", border: `1px solid ${isDark ? "rgba(34,197,94,0.3)" : "#bbf7d0"}` }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> {updateReportMutation.isPending ? "Updating..." : "Mark Resolved"}
                  </button>
                  <button
                    onClick={() => updateReportMutation.mutate({ id: selectedReport.id, status: "dismissed" })}
                    disabled={updateReportMutation.isPending || selectedReport.status !== "pending"}
                    className="w-full rounded-lg py-2 text-sm font-bold transition disabled:opacity-50"
                    style={{ background: t.surfaceMuted, color: t.textSecondary, border: `1px solid ${t.border}` }}
                  >
                    Dismiss Report
                  </button>
                </div>

                <p className="text-[10px] text-center" style={{ color: t.textMuted }}>Status: {selectedReport.status}</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}