import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Mail, Users, Filter, Clock, CheckCircle, ChevronDown, ChevronUp, Globe, Zap, User } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const XP_TIERS = [
  { label: "All XP Levels", min: 0, max: Infinity },
  { label: "Bronze (0–99 XP)", min: 0, max: 99 },
  { label: "Silver (100–499 XP)", min: 100, max: 499 },
  { label: "Gold (500–999 XP)", min: 500, max: 999 },
  { label: "Platinum (1000+ XP)", min: 1000, max: Infinity },
];

export default function AdminAnnouncementsTab() {
  const queryClient = useQueryClient();

  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterXP, setFilterXP] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState("both"); // both | email | notification
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ["ann_users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data || [];
    }
  });

  const { data: history = [] } = useQuery({
    queryKey: ["ann_history"],
    queryFn: () => base44.entities.AdminLog.filter({ action: "announcement" }, "-created_date"),
  });

  // Derived filter options
  const countries = useMemo(() => {
    const set = new Set(users.map(u => u.country).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [users]);

  const roles = useMemo(() => {
    const set = new Set(users.map(u => u.role).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [users]);

  const xpTier = XP_TIERS[filterXP];

  const targetedUsers = useMemo(() => {
    return users.filter(u => {
      if (filterCountry !== "all" && u.country !== filterCountry) return false;
      if (filterRole !== "all" && u.role !== filterRole) return false;
      const score = u.glow_score || 0;
      if (score < xpTier.min || score > xpTier.max) return false;
      return true;
    });
  }, [users, filterCountry, filterRole, xpTier]);

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!body.trim()) { toast.error("Message body is required"); return; }
    if (targetedUsers.length === 0) { toast.error("No users match your filters"); return; }

    setSending(true);
    try {
      const promises = [];

      if (deliveryMode === "email" || deliveryMode === "both") {
        targetedUsers.forEach(u => {
          promises.push(
            base44.integrations.Core.SendEmail({
              to: u.email,
              subject: subject.trim(),
              body: body,
            })
          );
        });
      }

      if (deliveryMode === "notification" || deliveryMode === "both") {
        targetedUsers.forEach(u => {
          promises.push(
            base44.entities.Notification.create({
              user_email: u.email,
              type: "system",
              message: subject.trim(),
            })
          );
        });
      }

      await Promise.all(promises);

      // Log to AdminLog
      await base44.entities.AdminLog.create({
        action: "announcement",
        details: JSON.stringify({
          subject: subject.trim(),
          body: body,
          delivery: deliveryMode,
          filters: { country: filterCountry, role: filterRole, xp: xpTier.label },
          recipient_count: targetedUsers.length,
        }),
        performed_by: "admin",
      });

      toast.success(`✅ Sent to ${targetedUsers.length} members!`);
      setSubject("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["ann_history"] });
    } catch (e) {
      toast.error("Failed to send announcement: " + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Announcements Center</h1>
        <p className="text-gray-400 text-sm mt-1">Compose and send targeted messages to your community via email and/or in-app notifications.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left — Composer */}
        <div className="space-y-5">

          {/* Delivery mode */}
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Delivery Method</h3>
            <div className="flex gap-3 flex-wrap">
              {[
                { key: "both", label: "Email + In-App", icon: "📬" },
                { key: "email", label: "Email Only", icon: "✉️" },
                { key: "notification", label: "In-App Only", icon: "🔔" },
              ].map(d => (
                <button key={d.key} onClick={() => setDeliveryMode(d.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition ${deliveryMode === d.key ? "bg-[#00CFFF]/10 border-[#00CFFF]/40 text-[#00CFFF]" : "bg-[#0B0F1A] border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}>
                  <span>{d.icon}</span> {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Targeting filters */}
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-[#00CFFF]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Target Audience</h3>
              <span className="ml-auto px-3 py-1 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] text-xs font-bold">
                {targetedUsers.length} recipients
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1"><Globe className="w-3 h-3" /> Country</label>
                <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00CFFF]/40">
                  {countries.map(c => <option key={c} value={c}>{c === "all" ? "All Countries" : c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1"><User className="w-3 h-3" /> Role</label>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00CFFF]/40">
                  {roles.map(r => <option key={r} value={r}>{r === "all" ? "All Roles" : r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1"><Zap className="w-3 h-3" /> XP Tier</label>
                <select value={filterXP} onChange={e => setFilterXP(Number(e.target.value))}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00CFFF]/40">
                  {XP_TIERS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {/* Recipient preview */}
            {targetedUsers.length > 0 && targetedUsers.length <= 10 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {targetedUsers.map(u => (
                  <span key={u.email} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                    {u.full_name || u.email.split("@")[0]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Message composer */}
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-[#00CFFF]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Message</h3>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Subject / Title *</label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. New Challenge Launch 🔥"
                className="bg-[#0B0F1A] border-white/10 rounded-xl h-11 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Message Body * (HTML supported)</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                placeholder={`<p>Dear Light Warrior,</p>\n\n<p>We are excited to announce...</p>\n\n<p>God bless,<br/>The Generation LightMode Team</p>`}
                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm font-mono resize-y min-h-[200px]"
              />
              <p className="text-[10px] text-gray-600 mt-1">You can use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;, &lt;ul&gt;, etc.</p>
            </div>

            {/* Preview */}
            {body.trim() && (
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Live Preview</label>
                <div
                  className="bg-[#0B0F1A] border border-white/10 rounded-xl px-5 py-4 text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim() || targetedUsers.length === 0}
            className="w-full h-13 py-3.5 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-black rounded-2xl flex items-center justify-center gap-3 text-base hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(0,207,255,0.25)]"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {sending ? "Sending..." : `Send to ${targetedUsers.length} Members`}
          </button>
        </div>

        {/* Right — History */}
        <div className="space-y-4">
          <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-bold text-white">Announcement History</h3>
            </div>

            {history.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm px-5">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No announcements sent yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {history.map(log => {
                  let parsed = {};
                  try { parsed = JSON.parse(log.details || "{}"); } catch {}
                  const isExpanded = expandedId === log.id;
                  return (
                    <div key={log.id} className="px-5 py-4">
                      <button onClick={() => setExpandedId(isExpanded ? null : log.id)} className="w-full text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{parsed.subject || "Announcement"}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-[#00CFFF] font-bold">{parsed.recipient_count || 0} sent</span>
                              <span className="text-[10px] text-gray-500">•</span>
                              <span className="text-[10px] text-gray-500">{parsed.delivery || "both"}</span>
                              {parsed.filters?.country && parsed.filters.country !== "all" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{parsed.filters.country}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-600 mt-0.5">
                              {log.created_date ? new Date(log.created_date).toLocaleString() : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                          </div>
                        </div>
                      </button>
                      {isExpanded && parsed.body && (
                        <div className="mt-3 bg-[#0B0F1A] rounded-xl px-4 py-3 text-xs text-gray-300 leading-relaxed border border-white/5"
                          dangerouslySetInnerHTML={{ __html: parsed.body }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-[#00CFFF]/5 border border-[#00CFFF]/15 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-[#00CFFF] uppercase tracking-wider">Tips</p>
            <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
              <li>Use <strong className="text-white">Email + In-App</strong> for maximum reach</li>
              <li>Filter by country for regional campaigns</li>
              <li>Target Platinum members for leadership invites</li>
              <li>HTML is fully supported in the message body</li>
              <li>All sent announcements are logged in history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}