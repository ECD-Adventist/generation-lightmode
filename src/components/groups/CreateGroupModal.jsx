import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CreateGroupModal({ isOpen, onClose, user }) {
  const [data, setData] = useState({ name: "", country: "", description: "" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const group = await base44.entities.GlowGroup.create({
        leader_email: user.email,
        ...data,
      });
      // Auto-join leader as member
      await base44.entities.GlowGroupMember.create({ user_email: user.email, group_id: group.id }).catch(() => {});
      return group;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ["allGroups"] });
      queryClient.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["myGroups", user?.email] });
      toast.success("GlowGroup created! ✨");
      onClose();
      setData({ name: "", country: "", description: "" });
      navigate(createPageUrl("GroupChat") + `?id=${encodeURIComponent(group.id)}`);
    },
    onError: () => toast.error("Failed to create group"),
  });

  if (!isOpen) return null;

  const inputStyle = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(11, 27, 61, 0.5)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-[1.5rem] overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 20px 60px rgba(11, 63, 217, 0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9, #FFD000)" }} />
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: "#E6ECF5" }}>
          <div>
            <h3 className="font-bold text-lg" style={{ color: "#0B1B3D", fontFamily: "Space Grotesk, sans-serif" }}>Start a GlowGroup ✨</h3>
            <p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>Your accountability community of 4–6 friends.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (!data.name.trim() || !data.country.trim()) return; createMutation.mutate(); }} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5 ml-1" style={{ color: "#6B7FA0" }}>Group Name</label>
            <input required placeholder="e.g. Nairobi Radiant" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5 ml-1" style={{ color: "#6B7FA0" }}>City / Country</label>
            <input required placeholder="e.g. Kigali, Rwanda" value={data.country} onChange={e => setData({ ...data, country: e.target.value })} className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5 ml-1" style={{ color: "#6B7FA0" }}>Mission Focus</label>
            <textarea placeholder="e.g. Campus outreach and weekly prayer..." value={data.description} onChange={e => setData({ ...data, description: e.target.value })} rows={3} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none" style={inputStyle} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-bold transition" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>Cancel</button>
            <button type="submit" disabled={createMutation.isPending || !data.name.trim() || !data.country.trim()} className="px-6 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-2 disabled:opacity-60" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</> : "Launch Group ⚡"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}