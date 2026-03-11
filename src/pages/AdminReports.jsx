import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function AdminReports() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const me = await base44.auth.me();
          if (me.role !== 'admin') {
            window.location.href = createPageUrl("Feed");
          } else {
            setUser(me);
          }
        } else {
          base44.auth.redirectToLogin();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reportedDrops"],
    queryFn: () => base44.entities.ReportedDrop.filter({ status: "pending" }),
    enabled: !!user
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, dropId, action }) => {
      if (action === 'delete_drop') {
        await base44.entities.GlowDrop.delete(dropId);
        await base44.entities.ReportedDrop.update(id, { status: 'resolved' });
      } else {
        await base44.entities.ReportedDrop.update(id, { status: 'dismissed' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportedDrops"] });
      toast.success("Report handled successfully");
    }
  });

  if (loadingAuth || isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/50">
            <ShieldAlert className="text-red-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-['Space_Grotesk']">Moderation Queue</h1>
            <p className="text-gray-400">Review reported GlowDrops</p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-20 bg-[#121826]/50 rounded-2xl border border-white/5">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">All clear!</h2>
            <p className="text-gray-400">No pending reports to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-[#121826] p-6 rounded-2xl border border-red-500/20 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                  <div className="text-sm text-red-400 font-bold mb-2">Reported by: {report.reporter_email}</div>
                  <div className="text-gray-300 bg-black/30 p-3 rounded-lg border border-white/5 mb-4">
                    <strong className="text-white block mb-1">Reason for report:</strong>
                    {report.reason}
                  </div>
                  <div className="text-xs text-gray-500">Drop ID: {report.drop_id}</div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-gray-600 text-gray-300 hover:text-white"
                    onClick={() => resolveMutation.mutate({ id: report.id, action: 'dismiss' })}
                    disabled={resolveMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" /> Dismiss
                  </Button>
                  <Button 
                    className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white border-none"
                    onClick={() => resolveMutation.mutate({ id: report.id, dropId: report.drop_id, action: 'delete_drop' })}
                    disabled={resolveMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Drop
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}