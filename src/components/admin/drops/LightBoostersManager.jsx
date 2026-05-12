import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, ShieldCheck, Users, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function LightBoostersManager({ t }) {
  const queryClient = useQueryClient();
  const [busyEmail, setBusyEmail] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin_light_boosters"],
    queryFn: () => base44.entities.User.list("-updated_date", 500),
  });

  const boosters = useMemo(() => users.filter(user => user.light_booster_opt_in), [users]);
  const pending = boosters.filter(user => !user.light_booster_approved);
  const approved = boosters.filter(user => user.light_booster_approved);

  const updateBooster = async (user, approvedState) => {
    setBusyEmail(user.email);
    await base44.entities.User.update(user.id, { light_booster_approved: approvedState });
    toast.success(approvedState ? "Light Booster approved" : "Light Booster removed from active pool");
    setBusyEmail(null);
    queryClient.invalidateQueries({ queryKey: ["admin_light_boosters"] });
  };

  const BoosterRow = ({ user }) => {
    const isApproved = !!user.light_booster_approved;
    const isBusy = busyEmail === user.email;

    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-4" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.accentSoft, color: t.accent }}>
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate" style={{ color: t.textPrimary }}>{user.full_name || user.display_name || "Light Booster"}</p>
            <p className="text-xs truncate" style={{ color: t.textSecondary }}>{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: isApproved ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.14)", color: isApproved ? "#22c55e" : "#f59e0b" }}>
            {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {isApproved ? "Approved" : "Pending approval"}
          </span>
          {isApproved ? (
            <button disabled={isBusy} onClick={() => updateBooster(user, false)} className="px-3 py-2 rounded-xl text-xs font-bold border transition disabled:opacity-60" style={{ borderColor: t.border, color: t.textSecondary }}>
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
            </button>
          ) : (
            <button disabled={isBusy} onClick={() => updateBooster(user, true)} className="px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-60" style={{ background: t.gradient, color: "#FFFFFF" }}>
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: "Opted In", value: boosters.length }, { label: "Pending", value: pending.length }, { label: "Approved", value: approved.length }].map(item => (
          <div key={item.label} className="rounded-2xl border p-5" style={{ background: t.surface, borderColor: t.border }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: t.textMuted }}>{item.label}</p>
            <p className="text-3xl font-black mt-1" style={{ color: t.textPrimary }}>{item.value}</p>
          </div>
        ))}
      </div>

      {boosters.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>
          <XCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No users have opted in as Light Boosters yet.</p>
          <p className="text-sm mt-1">When users opt in, you’ll approve them here before they can be used for bonus likes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.length > 0 && <p className="text-xs uppercase tracking-widest font-bold" style={{ color: t.textMuted }}>Pending Approval</p>}
          {pending.map(user => <BoosterRow key={user.id} user={user} />)}
          {approved.length > 0 && <p className="text-xs uppercase tracking-widest font-bold pt-3" style={{ color: t.textMuted }}>Approved Pool</p>}
          {approved.map(user => <BoosterRow key={user.id} user={user} />)}
        </div>
      )}
    </div>
  );
}