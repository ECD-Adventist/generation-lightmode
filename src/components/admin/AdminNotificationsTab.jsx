import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, Send, Trash2, CheckCheck, Loader2, Users, Zap, Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminNotificationsTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ message: "", type: "system", link: "" });
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: users = [] } = useQuery({
    queryKey: ["notif_users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data || [];
    }
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin_all_notifs"],
    queryFn: () => base44.entities.Notification.list("-created_date", 200),
    refetchInterval: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_all_notifs"] })
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_all_notifs"] })
  });

  const handleBroadcast = async () => {
    if (!form.message.trim()) { toast.error("Message is required"); return; }
    setSending(true);
    try {
      await Promise.all(
        users.map(u =>
          base44.entities.Notification.create({
            user_email: u.email,
            type: form.type,
            message: form.message,
            link: form.link || undefined,
          })
        )
      );
      toast.success(`Broadcast sent to ${users.length} members!`);
      setForm({ message: "", type: "system", link: "" });
      queryClient.invalidateQueries({ queryKey: ["admin_all_notifs"] });
    } catch (e) {
      toast.error("Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const filtered = notifications.filter(n => filter === "all" ? true : n.type === filter);

  const typeColor = {
    like: "text-red-400", reply: "text-blue-400", message: "text-blue-400",
    milestone: "text-yellow-400", system: "text-violet-400", follow: "text-green-400"
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    today: notifications.filter(n => n.created_date && (Date.now() - new Date(n.created_date)) < 86400000).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Push Notifications</h1>
        <p className="text-gray-400 text-sm mt-1">Broadcast messages to all members and monitor platform alerts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sent", value: stats.total, icon: <Bell className="w-4 h-4" />, color: "#00CFFF" },
          { label: "Unread", value: stats.unread, icon: <Zap className="w-4 h-4" />, color: "#FFD000" },
          { label: "Today", value: stats.today, icon: <Info className="w-4 h-4" />, color: "#8A5CFF" },
        ].map(s => (
          <div key={s.label} className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white font-['Space_Grotesk']">{s.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast Composer */}
      <div className="bg-[#121826] border border-[#00CFFF]/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-[#00CFFF]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Broadcast to All Members</h3>
          <span className="ml-auto text-xs text-gray-500">{users.length} recipients</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Message *</label>
            <Input
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Write your broadcast message..."
              className="bg-[#0B0F1A] border-white/10 rounded-xl h-11"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 h-11 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00CFFF]/50"
            >
              <option value="system">System</option>
              <option value="milestone">Milestone</option>
              <option value="like">Like</option>
              <option value="reply">Reply</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Link (optional)</label>
          <Input
            value={form.link}
            onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
            placeholder="/Feed or https://..."
            className="bg-[#0B0F1A] border-white/10 rounded-xl h-11"
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleBroadcast}
            disabled={sending || !form.message.trim()}
            className="bg-[#00CFFF] text-black font-bold rounded-xl px-6 h-11 hover:bg-[#00CFFF]/90 flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : `Broadcast to ${users.length} Members`}
          </Button>
        </div>
      </div>

      {/* Filter & List */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-wrap gap-3">
          <h3 className="text-sm font-bold text-white">Recent Notifications</h3>
          <div className="flex gap-1">
            {["all","system","like","follow","milestone"].map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filter === t ? "bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20" : "text-gray-500 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No notifications found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(n => (
              <div key={n.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition ${n.read ? "opacity-60" : ""}`}>
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? "bg-[#00CFFF]" : "bg-gray-600"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{n.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase ${typeColor[n.type] || "text-gray-400"}`}>{n.type}</span>
                    <span className="text-[10px] text-gray-600">→ {n.user_email}</span>
                    {n.created_date && <span className="text-[10px] text-gray-600">{new Date(n.created_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read && (
                    <button onClick={() => markReadMutation.mutate(n.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#00CFFF] hover:bg-[#00CFFF]/10 transition">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(n.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}