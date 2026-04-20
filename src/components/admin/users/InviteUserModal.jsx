import React, { useState } from "react";
import { X, Loader2, Mail, Shield, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "user", label: "User", desc: "Regular community member" },
  { value: "missionary", label: "Missionary", desc: "Active digital missionary" },
  { value: "GlowGroup Leader", label: "GlowGroup Leader", desc: "Can manage groups" },
  { value: "moderator", label: "Moderator", desc: "Can moderate content" },
  { value: "church_admin", label: "Church Admin", desc: "Local church admin" },
  { value: "conference_field_admin", label: "Conference/Field Admin", desc: "Regional field admin" },
  { value: "union_admin", label: "Union Admin", desc: "Union-level admin" },
  { value: "country_admin", label: "Country Admin", desc: "Country-level admin" },
  { value: "ecd_admin", label: "ECD Admin", desc: "East-Central Division" },
  { value: "admin", label: "Admin (platform)", desc: "⚠️ Super admin only", elevated: true },
  { value: "super_admin", label: "Super Admin", desc: "⚠️ Super admin only", elevated: true },
];

export default function InviteUserModal({ onClose, callerRole, t, isDark, onInvited }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = callerRole === "super_admin";
  const availableRoles = ROLE_OPTIONS.filter(r => !r.elevated || isSuperAdmin);

  const handleInvite = async () => {
    if (!email.trim()) { toast.error("Email is required"); return; }
    setLoading(true);
    try {
      await base44.functions.invoke("adminInviteUser", { email: email.trim(), role });
      toast.success(`✅ Invite sent to ${email}`);
      onInvited?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed to invite user.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
      <div className="border rounded-2xl w-full max-w-md shadow-2xl" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.accentSoft }}>
              <Send className="w-5 h-5" style={{ color: t.accent }} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: t.textPrimary }}>Invite New Member</h3>
              <p className="text-xs" style={{ color: t.textMuted }}>They'll receive an email invitation</p>
            </div>
          </div>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: t.textMuted }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSecondary }}>Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none"
                style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSecondary }}>Assign Role</label>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {availableRoles.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition"
                  style={role === r.value
                    ? { background: t.accentSoft, borderColor: t.borderStrong }
                    : { background: "transparent", borderColor: t.border }}
                >
                  <Shield size={14} className="mt-0.5 shrink-0" style={{ color: role === r.value ? t.accent : t.textMuted }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: role === r.value ? t.accent : t.textPrimary }}>{r.label}</p>
                    <p className="text-[11px]" style={{ color: t.textMuted }}>{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t" style={{ borderColor: t.border }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button
            disabled={loading || !email.trim()}
            onClick={handleInvite}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: t.accent, border: "none" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}