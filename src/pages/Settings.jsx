import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, Bell, Shield, LogOut, Home, ChevronRight, Globe, BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteAccountModal from "@/components/settings/DeleteAccountModal";

const NOTIF_KEYS = [
  { key: "notif_likes", label: "Likes on your Glow Drops", icon: "❤️" },
  { key: "notif_comments", label: "Comments on your posts", icon: "💬" },
  { key: "notif_follows", label: "New followers", icon: "👤" },
  { key: "notif_prayer", label: "Prayer support updates", icon: "🙏" },
  { key: "notif_challenges", label: "Challenge reminders", icon: "🎯" },
  { key: "notif_system", label: "Platform announcements", icon: "📢" },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { base44.auth.redirectToLogin("/Settings"); return; }
        const me = await base44.auth.me();
        setUser(me);
        const saved = {};
        NOTIF_KEYS.forEach(({ key }) => { saved[key] = me[key] !== false; });
        setPrefs(saved);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const savePrefs = async () => {
    setSaving(true);
    try { await base44.auth.updateMe(prefs); toast.success("Preferences saved!"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLogout = () => base44.auth.logout(createPageUrl("Home"));

  const handleDeleteAccount = () => setDeleteOpen(true);

  // Simulated account deletion — integrate with a backend function when ready.
  const submitDeletion = async () => {
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Your deletion request has been submitted. Signing you out…");
    setTimeout(() => base44.auth.logout(createPageUrl("Home")), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Nav */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b px-6 py-3 flex items-center gap-4" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <Link to={createPageUrl("Feed")} className="flex items-center gap-2 transition" style={{ color: "#4A5878" }}>
          <Home className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: "#8A97B5" }} />
        <span className="font-bold text-sm" style={{ color: "#0B1B3D" }}>Settings</span>
        <div className="flex-1" />
        <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 text-sm font-bold transition" style={{ color: "#0B3FD9" }}>
          ← Back to Feed
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Manage your account preferences and notifications.</p>
        </div>

        {/* Account Info */}
        <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#0B3FD9" }}>
            <Globe className="w-3.5 h-3.5" /> Account
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor: "#E6ECF5" }} alt="Profile" />
            <div>
              <p className="font-bold" style={{ color: "#0B1B3D" }}>{user?.full_name}</p>
              <p className="text-sm" style={{ color: "#6B7FA0" }}>{user?.email}</p>
              <p className="text-sm mt-0.5" style={{ color: "#8A97B5" }}>{user?.country || "No country set"}</p>
            </div>
          </div>
          <Link to={createPageUrl("Profile")} className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: "#0B3FD9" }}>
            Edit Profile <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#CC7A00" }}>
            <Bell className="w-3.5 h-3.5" /> Notification Preferences
          </h2>
          <div className="space-y-3">
            {NOTIF_KEYS.map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#E6ECF5" }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm" style={{ color: "#3A4A6B" }}>{label}</span>
                </div>
                <button onClick={() => togglePref(key)} className="w-11 h-6 rounded-full transition-colors duration-200 relative" style={{ background: prefs[key] ? "#1FB8FF" : "#D6E4FF" }}>
                  <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200" style={{ left: prefs[key] ? 24 : 4 }} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={savePrefs} disabled={saving} className="mt-5 px-6 py-2.5 font-bold rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-60" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Preferences
          </button>
        </div>

        {/* Daily Code Widget */}
        <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#0B3FD9" }}>
            <BookOpen className="w-3.5 h-3.5" /> Daily Truth
          </h2>
          <p className="text-sm mb-4" style={{ color: "#6B7FA0" }}>Access today's featured Code of Truth and daily devotional.</p>
          <Link to="/DailyTruthFeed" className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: "#0B3FD9" }}>
            View Daily Truth Feed <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Privacy */}
        <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#6B7FA0" }}>
            <Shield className="w-3.5 h-3.5" /> Privacy & Legal
          </h2>
          <Link to="/Privacy" className="flex items-center justify-between py-2 text-sm transition" style={{ color: "#4A5878" }}>
            Privacy Policy <ChevronRight className="w-3.5 h-3.5" style={{ color: "#8A97B5" }} />
          </Link>
          <div className="h-px my-1" style={{ background: "#E6ECF5" }} />
          <a href="mailto:privacy@generationlightmode.org" className="flex items-center justify-between py-2 text-sm transition" style={{ color: "#4A5878" }}>
            Contact Support <ChevronRight className="w-3.5 h-3.5" style={{ color: "#8A97B5" }} />
          </a>
        </div>

        {/* Sign Out */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border transition font-bold text-sm" style={{ minHeight: 44, borderColor: "rgba(239, 68, 68, 0.2)", color: "#EF4444" }}>
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

        {/* Delete Account */}
        <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #FECACA" }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: "#DC2626" }}>
            <Trash2 className="w-3.5 h-3.5" /> Danger Zone
          </h2>
          <p className="text-sm mb-4" style={{ color: "#6B7FA0" }}>
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition"
            style={{ minHeight: 44, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }}
          >
            <Trash2 className="w-4 h-4" /> Delete My Account
          </button>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        userEmail={user?.email}
        onConfirm={submitDeletion}
      />
    </div>
  );
}