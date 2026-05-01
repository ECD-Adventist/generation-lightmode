import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Camera, Plus, X, UserPlus, Search, Mail } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "../AdminThemeContext";

export default function LeaderAccountFormModal({ account, onClose, onSaved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isEditing = !!account;
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    leader_name: account?.leader_name || "",
    leader_email: account?.leader_email || "",
    leader_title: account?.leader_title || "",
    leader_country: account?.leader_country || "",
    leader_bio: account?.leader_bio || "",
    leader_profile_picture_url: account?.leader_profile_picture_url || "",
    manager_emails: account?.manager_emails || [],
    active: account?.active !== false,
    notes: account?.notes || "",
  });
  const [newManager, setNewManager] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced user search by name or email
  useEffect(() => {
    const q = newManager.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("searchUsersForManagerAssignment", { query: q });
        setSearchResults(res.data?.users || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newManager]);

  // Track which managers were already on the account when the modal opened
  // so we only email NEWLY added ones (and only after a successful save).
  const initialManagersRef = useRef(account?.manager_emails || []);
  // Map<email, fullName> for managers we resolved via search — used for email greeting.
  const newManagerNamesRef = useRef({});

  const addManagerByEmail = (email, fullName) => {
    const lower = (email || "").trim().toLowerCase();
    if (!lower) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) {
      toast.error("Enter a valid email");
      return;
    }
    if (form.manager_emails.includes(lower)) {
      toast.error("Already added");
      return;
    }
    if (form.manager_emails.length >= 3) {
      toast.error("Maximum 3 managers per account");
      return;
    }
    setForm(prev => ({ ...prev, manager_emails: [...prev.manager_emails, lower] }));
    if (fullName) newManagerNamesRef.current[lower] = fullName;
    setNewManager("");
    setShowResults(false);
    setSearchResults([]);
    toast.success(`Added ${lower} — welcome email will send when you save.`);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, leader_profile_picture_url: res.file_url }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeManager = (email) => {
    setForm(prev => ({ ...prev, manager_emails: prev.manager_emails.filter(m => m !== email) }));
  };

  const handleSave = async () => {
    if (!form.leader_name.trim()) {
      toast.error("Leader name is required");
      return;
    }
    if (!form.leader_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.leader_email.trim())) {
      toast.error("A valid leader email is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        leader_name: form.leader_name.trim(),
        leader_email: form.leader_email.trim().toLowerCase(),
      };
      if (isEditing) {
        await base44.entities.ManagedLeaderAccount.update(account.id, payload);
        toast.success("Account updated");
      } else {
        await base44.entities.ManagedLeaderAccount.create(payload);
        toast.success("Account created");
      }

      // Send welcome emails ONLY to newly added managers, AFTER successful save.
      const newManagers = form.manager_emails.filter(
        email => !initialManagersRef.current.includes(email)
      );
      if (newManagers.length > 0) {
        const emailResults = await Promise.allSettled(
          newManagers.map(email =>
            base44.functions.invoke("sendLeaderManagerWelcome", {
              manager_email: email,
              manager_name: newManagerNamesRef.current[email] || "",
              leader_name: payload.leader_name,
              leader_title: payload.leader_title,
              leader_email: payload.leader_email,
            })
          )
        );
        const sent = emailResults.filter(r => r.status === "fulfilled").length;
        const failed = emailResults.length - sent;
        if (sent > 0) toast.success(`Welcome email sent to ${sent} manager${sent > 1 ? "s" : ""}`);
        if (failed > 0) {
          toast.error(`${failed} welcome email${failed > 1 ? "s" : ""} failed to send`);
          emailResults.forEach((r, i) => {
            if (r.status === "rejected") console.error(`Welcome email failed for ${newManagers[i]}:`, r.reason);
          });
        }
      }

      onSaved();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto z-[2000] p-0 rounded-3xl" style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.textPrimary }}>
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold font-['Space_Grotesk']">{isEditing ? "Edit Leader Account" : "New Leader Account"}</h2>
          <p className="text-xs mt-1" style={{ color: t.textSecondary }}>
            Posts created by assigned managers will appear under this leader's identity.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: t.accentSoft, border: `1px solid ${t.border}` }}>
              {form.leader_profile_picture_url ? (
                <img src={form.leader_profile_picture_url} className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6" style={{ color: t.textMuted }} />
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 rounded-xl text-xs font-bold transition"
                style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.border}` }}
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : (form.leader_profile_picture_url ? "Change Photo" : "Upload Photo")}
              </button>
              <p className="text-[10px] mt-1" style={{ color: t.textMuted }}>This shows on every post.</p>
            </div>
          </div>

          {/* Leader name */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>Leader Name *</label>
            <Input value={form.leader_name} onChange={(e) => setForm({ ...form, leader_name: e.target.value })} placeholder="e.g. Pr. Blasious Ruguri" style={{ background: t.appBg, border: `1px solid ${t.border}`, color: t.textPrimary }} />
          </div>

          {/* Leader email */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>Leader Email * (used as identity)</label>
            <Input
              type="email"
              value={form.leader_email}
              onChange={(e) => setForm({ ...form, leader_email: e.target.value })}
              placeholder="leader@example.com"
              disabled={isEditing}
              style={{ background: t.appBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
            />
            {isEditing && <p className="text-[10px] mt-1" style={{ color: t.textMuted }}>Email cannot be changed after creation.</p>}
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>Title / Role</label>
            <Input value={form.leader_title} onChange={(e) => setForm({ ...form, leader_title: e.target.value })} placeholder="ECD President" style={{ background: t.appBg, border: `1px solid ${t.border}`, color: t.textPrimary }} />
          </div>

          {/* Country */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>Country</label>
            <Input value={form.leader_country} onChange={(e) => setForm({ ...form, leader_country: e.target.value })} placeholder="Kenya" style={{ background: t.appBg, border: `1px solid ${t.border}`, color: t.textPrimary }} />
          </div>

          {/* Bio */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>Bio</label>
            <Textarea value={form.leader_bio} onChange={(e) => setForm({ ...form, leader_bio: e.target.value })} placeholder="Short description shown on the leader's posts..." rows={3} style={{ background: t.appBg, border: `1px solid ${t.border}`, color: t.textPrimary }} />
          </div>

          {/* Managers */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
              Managers <span style={{ color: t.accent }}>({form.manager_emails.length}/3)</span>
            </label>
            <p className="text-[11px] mb-2" style={{ color: t.textSecondary }}>Add up to 3 admin/user emails. They'll be able to post as this leader from their own login.</p>

            {form.manager_emails.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {form.manager_emails.map((email) => (
                  <div key={email} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg" style={{ background: t.appBg, border: `1px solid ${t.border}` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <UserPlus className="w-3.5 h-3.5 shrink-0" style={{ color: t.accent }} />
                      <span className="text-xs truncate" style={{ color: t.textPrimary }}>{email}</span>
                    </div>
                    <button onClick={() => removeManager(email)} className="w-6 h-6 rounded-md flex items-center justify-center transition" style={{ color: "#EF4444" }} title="Remove">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.manager_emails.length < 3 && (
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: t.textMuted }} />
                    <Input
                      type="text"
                      value={newManager}
                      onChange={(e) => setNewManager(e.target.value)}
                      onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addManagerByEmail(newManager);
                        }
                      }}
                      placeholder="Search by name or email..."
                      className="pl-9"
                      style={{ background: t.appBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => addManagerByEmail(newManager)}
                    className="shrink-0"
                    style={{ background: t.gradient, color: "#FFFFFF" }}
                  >
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>

                {showResults && newManager.trim().length >= 2 && (
                  <div
                    className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto"
                    style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}
                  >
                    {searching ? (
                      <div className="px-3 py-3 flex items-center gap-2 text-xs" style={{ color: t.textMuted }}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching registered users…
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-3 py-3 text-xs" style={{ color: t.textMuted }}>
                        No registered users match. You can still add by typing the full email and clicking Add.
                      </div>
                    ) : (
                      searchResults.map(u => {
                        const already = form.manager_emails.includes(u.email);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            disabled={already}
                            onClick={() => addManagerByEmail(u.email, u.full_name)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 transition text-left"
                            style={{
                              background: "transparent",
                              borderBottom: `1px solid ${t.border}`,
                              opacity: already ? 0.5 : 1,
                              cursor: already ? "not-allowed" : "pointer",
                            }}
                            onMouseOver={e => { if (!already) e.currentTarget.style.background = t.appBg; }}
                            onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: t.accentSoft }}>
                              {u.profile_picture_url ? (
                                <img src={u.profile_picture_url} className="w-full h-full object-cover" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" style={{ color: t.accent }} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>
                                {u.full_name || u.email}
                              </div>
                              <div className="text-[10px] truncate" style={{ color: t.textMuted }}>
                                {u.email}{u.role && u.role !== "user" ? ` · ${u.role}` : ""}{u.country ? ` · ${u.country}` : ""}
                              </div>
                            </div>
                            {already ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Added</span>
                            ) : (
                              <Plus className="w-3.5 h-3.5" style={{ color: t.accent }} />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: t.textMuted }}>
                  <Mail className="w-3 h-3" /> A branded welcome email is sent automatically after you save.
                </p>
              </div>
            )}
          </div>

          {/* Active */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span className="text-sm" style={{ color: t.textPrimary }}>Account active</span>
          </label>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>Internal Notes</label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes for admins..." rows={2} style={{ background: t.appBg, border: `1px solid ${t.border}`, color: t.textPrimary }} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1" style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textSecondary }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving} className="flex-1 font-bold" style={{ background: t.gradient, color: "#FFFFFF" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? "Save Changes" : "Create Account")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}