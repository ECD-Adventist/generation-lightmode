import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, CheckCircle, Trash2, MessageSquare, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminCommentsTab() {
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
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121826] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Pending Reports</p>
              <p className="text-3xl font-black text-[#FFD000] mt-2">{pendingReports.length}</p>
            </div>
            <Flag className="w-10 h-10 text-[#FFD000]/30" />
          </div>
        </div>
        <div className="bg-[#121826] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Resolved</p>
              <p className="text-3xl font-black text-[#00CFFF] mt-2">{resolvedReports.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-[#00CFFF]/30" />
          </div>
        </div>
        <div className="bg-[#121826] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total Reports</p>
              <p className="text-3xl font-black text-white mt-2">{reportedComments.length}</p>
            </div>
            <MessageSquare className="w-10 h-10 text-white/30" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2">
          <div className="bg-[#121826] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="font-bold text-lg">Moderation Queue</h3>
              <p className="text-xs text-gray-400 mt-1">{pendingReports.length} pending • {resolvedReports.length} resolved</p>
            </div>
            <div className="divide-y divide-white/5">
              {reportedComments.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No comment reports yet.</p>
                </div>
              ) : (
                reportedComments.map((report) => {
                  const comment = getComment(report.comment_id);
                  const reporter = getUser(report.reporter_email);
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-4 hover:bg-white/3 transition ${
                        selectedReport?.id === report.id ? "bg-[#00CFFF]/10 border-l-2 border-[#00CFFF]" : ""
                      } ${report.status === "pending" ? "bg-[#FFD000]/5" : "opacity-60"}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-sm truncate">{reporter.full_name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                              report.status === "pending" ? "bg-[#FFD000]/20 text-[#FFD000]" : "bg-green-500/20 text-green-400"
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">Reason: {report.reason}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{formatDistanceToNow(new Date(report.created_date), { addSuffix: true })}</p>
                        </div>
                        <Flag className={`w-4 h-4 flex-shrink-0 ${report.status === "pending" ? "text-[#FFD000]" : "text-gray-600"}`} />
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
            <div className="bg-[#121826] border border-white/10 rounded-2xl p-8 text-center text-gray-400 sticky top-6">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Select a report to review details and take action.</p>
            </div>
          ) : (() => {
            const comment = getComment(selectedReport.comment_id);
            const reporter = getUser(selectedReport.reporter_email);
            if (!comment) {
              return (
                <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 sticky top-6">
                  <p className="text-sm text-gray-400 mb-4">Comment has been deleted.</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => updateReportMutation.mutate({ id: selectedReport.id, status: "resolved" })}
                      disabled={updateReportMutation.isPending}
                      className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded-lg py-2 text-sm font-bold transition disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => updateReportMutation.mutate({ id: selectedReport.id, status: "dismissed" })}
                      disabled={updateReportMutation.isPending}
                      className="w-full bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg py-2 text-sm font-bold transition disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 sticky top-6 space-y-5">
                {/* Report Info */}
                <div className="border-b border-white/5 pb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Report Details</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Reported by:</span>
                      <p className="font-bold text-white">{reporter.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Reason:</span>
                      <p className="font-bold text-[#FFD000]">{selectedReport.reason}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="text-xs text-gray-400">{new Date(selectedReport.created_date).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Comment Content */}
                <div className="border-b border-white/5 pb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Flagged Comment</p>
                  <div className="bg-[#0B0F1A] rounded-lg p-3 border border-white/5">
                    <p className="text-sm text-gray-300 leading-relaxed break-words">{comment.content}</p>
                    <p className="text-xs text-gray-600 mt-2">By: {getUser(comment.user_email).full_name}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                    disabled={deleteCommentMutation.isPending || selectedReport.status !== "pending"}
                    className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg py-2 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {deleteCommentMutation.isPending ? "Deleting..." : "Delete Comment"}
                  </button>
                  <button
                    onClick={() => updateReportMutation.mutate({ id: selectedReport.id, status: "resolved" })}
                    disabled={updateReportMutation.isPending || selectedReport.status !== "pending"}
                    className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded-lg py-2 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> {updateReportMutation.isPending ? "Updating..." : "Mark Resolved"}
                  </button>
                  <button
                    onClick={() => updateReportMutation.mutate({ id: selectedReport.id, status: "dismissed" })}
                    disabled={updateReportMutation.isPending || selectedReport.status !== "pending"}
                    className="w-full bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg py-2 text-sm font-bold transition disabled:opacity-50"
                  >
                    Dismiss Report
                  </button>
                </div>

                <p className="text-[10px] text-gray-600 text-center">Status: {selectedReport.status}</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}