import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import GenLuxHeader from "./genlux/GenLuxHeader";
import GenLuxStats from "./genlux/GenLuxStats";
import GenLuxKeywordTable from "./genlux/GenLuxKeywordTable";
import GenLuxMentions from "./genlux/GenLuxMentions";
import GenLuxInsights from "./genlux/GenLuxInsights";
import AddGenLuxKeywordModal from "./genlux/AddGenLuxKeywordModal";

export default function AdminGenLuxMissionIntelligence({ user }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const canManage = ["admin", "super_admin", "ecd_admin"].includes(user?.role);
  const autoRefresh = { refetchInterval: 30000, refetchIntervalInBackground: true };
  const { data: keywords = [], isLoading } = useQuery({ queryKey: ["genlux-keywords"], queryFn: () => base44.entities.GenLuxKeyword.list("-updated_date", 100), ...autoRefresh });
  const { data: mentions = [] } = useQuery({ queryKey: ["genlux-mentions"], queryFn: () => base44.entities.GenLuxMention.list("-discovered_at", 200), ...autoRefresh });
  const { data: alerts = [] } = useQuery({ queryKey: ["genlux-alerts"], queryFn: () => base44.entities.GenLuxAlert.list("-created_date", 100), ...autoRefresh });
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["genlux-keywords"] }),
    queryClient.invalidateQueries({ queryKey: ["genlux-mentions"] }),
    queryClient.invalidateQueries({ queryKey: ["genlux-alerts"] })
  ]);

  const scan = useMutation({
    mutationFn: () => base44.functions.invoke("scanGenLuxWeb", {}),
    onSuccess: (response) => { refresh(); toast.success(`Scan complete: ${response.data.discovered || 0} new mentions found`); },
    onError: (error) => toast.error(error?.response?.data?.error || "Web scan failed")
  });
  const manage = useMutation({
    mutationFn: (payload) => base44.functions.invoke("manageGenLuxKeyword", payload),
    onSuccess: () => { refresh(); setAddOpen(false); },
    onError: (error) => toast.error(error?.response?.data?.error || "Unable to update monitoring")
  });
  const handleDelete = (keyword) => {
    if (window.confirm(`Stop monitoring “${keyword.term}”?`)) manage.mutate({ action: "delete", id: keyword.id });
  };

  if (isLoading) return <div className="adm-card py-16 text-center adm-text-muted">Loading mission intelligence…</div>;
  return <div className="space-y-4 pb-12">
    <GenLuxHeader scanning={scan.isPending} canManage={canManage} onScan={() => scan.mutate()} onAdd={() => setAddOpen(true)} />
    <GenLuxStats keywords={keywords} mentions={mentions} alerts={alerts} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><GenLuxKeywordTable keywords={keywords} canManage={canManage} onToggle={(k) => manage.mutate({ action: "toggle", id: k.id, active: !k.active })} onDelete={handleDelete} /><GenLuxMentions mentions={mentions} /></div>
    <GenLuxInsights keywords={keywords} alerts={alerts} canManage={canManage} onRead={(id) => manage.mutate({ action: "mark_alert_read", id })} />
    <AddGenLuxKeywordModal open={addOpen} saving={manage.isPending} onClose={() => setAddOpen(false)} onSave={(value) => manage.mutate({ action: "create", ...value })} />
  </div>;
}