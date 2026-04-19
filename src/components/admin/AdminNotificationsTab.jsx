import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, Send, Trash2, CheckCheck, Loader2, Users, Zap, Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminNotificationsTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

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
    like: isDark ? "text-red-400" : "text-red-600",
    reply: isDark ? "text-blue-400" : "text-blue-600",
    message: isDark ? "text-blue-400" : "text-blue-600",
    milestone: isDark ? "text-yellow-400" : "text-yellow-600",
    system: isDark ? "text-violet-400" : "text-violet-600",
    follow: isDark ? "text-green-400" : "text-green-600"
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    today: notifications.filter(n => n.created_date && (Date.now() - new Date(n.created_date)) < 86400000).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Push Notifications</h1>
        <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Broadcast messages to all members and monitor platform alerts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sent", value: stats.total, icon: <Bell className="w-4 h-4" />, color: isDark ? "#00CFFF" : "#0B3FD9" },
          { label: "Unread", value: stats.unread, icon: <Zap className="w-4 h-4" />, color: isDark ? "#FFD000" : "#d97706" },
          { label: "Today", value: stats.today, icon: <Info className="w-4 h-4" />, color: isDark ? "#8A5CFF" : "#7e22ce" },
        ].map(s => (
          <div key={s.label} className="border rounded-2xl p-5 flex items-center gap-4" style={{ background: t.surface, borderColor: t.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{s.value}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: t.textMuted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast Composer */}
      <div className="border rounded-2xl p-6 space-y-4 shadow-sm" style={{ background: t.surface, borderColor: t.borderStrong }}>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4" style={{ color: t.accent }} />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: t.textPrimary }}>Broadcast to All Members</h3>
          <span className="ml-auto text-xs" style={{ color: t.textMuted }}>{users.length} recipients</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider mb-1.5 block font-bold" style={{ color: t.textSecondary }}>Message *</label>
            <Input
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Write your broadcast message..."
              className="rounded-xl h-11 border transition"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider mb-1.5 block font-bold" style={{ color: t.textSecondary }}>Type</label>
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full border rounded-xl px-3 h-11 text-sm focus:outline-none transition"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
            >
              <option value="system">System</option>
              <option value="milestone">Milestone</option>
              <option value="like">Like</option>
              <option value="reply">Reply</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider mb-1.5 block font-bold" style={{ color: t.textSecondary }}>Link (optional)</label>
          <Input
            value={form.link}
            onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
            placeholder="/Feed or https://..."
            className="rounded-xl h-11 border transition"
            style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleBroadcast}
            disabled={sending || !form.message.trim()}
            className="font-bold rounded-xl px-6 h-11 flex items-center gap-2 transition disabled:opacity-50"
            style={{ background: t.accent, color: "#fff", border: "none" }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : `Broadcast to ${users.length} Members`}
          </Button>
        </div>
      </div>

      {/* Filter & List */}
      <div className="border rounded-2xl overflow-hidden shadow-sm" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-3" style={{ borderColor: t.border }}>
          <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>Recent Notifications</h3>
          <div className="flex gap-1">
            {["all","system","like","follow","milestone"].map(type => (
              <button key={type} onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition`}
                style={filter === type ? { background: t.accentSoft, color: t.accent, border: `1px solid ${t.borderStrong}` } : { color: t.textSecondary, background: "transparent", border: "1px solid transparent" }}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: t.accent }} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: t.textMuted }}>No notifications found.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: t.border }}>
            {filtered.map(n => (
              <div key={n.id} className={`flex items-start gap-3 px-5 py-3 transition hover:opacity-80 ${n.read ? "opacity-60" : ""}`} style={{ background: isDark ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? (isDark ? "bg-[#00CFFF]" : "bg-[#0B3FD9]") : (isDark ? "bg-gray-600" : "bg-gray-300")}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: t.textPrimary }}>{n.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase ${typeColor[n.type] || t.textSecondary}`}>{n.type}</span>
                    <span className="text-[10px]" style={{ color: t.textMuted }}>→ {n.user_email}</span>
                    {n.created_date && <span className="text-[10px]" style={{ color: t.textMuted }}>{new Date(n.created_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read && (
                    <button onClick={() => markReadMutation.mutate(n.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ color: t.textSecondary, background: t.surfaceMuted }}>
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(n.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ color: "#ef4444", background: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2" }}>
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