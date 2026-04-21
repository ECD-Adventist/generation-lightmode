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

  const submitDeletion = async () => {
    const res = await base44.functions.invoke("deleteMyAccount", {});
    if (res?.data?.error) throw new Error(res.data.error);
    toast.success("Your account has been deleted. Signing you out…");
    setTimeout(() => base44.auth.logout(createPageUrl("Home")), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const cardClass = "bg-card border border-border shadow-sm rounded-2xl p-6";

  return (
    <div className="min-h-screen pb-20 font-['Inter'] bg-background text-foreground">
      {/* Nav */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b bg-background/95 border-border px-6 py-3 flex items-center gap-4">
        <Link to={createPageUrl("Feed")} className="flex items-center gap-2 transition text-muted-foreground hover:text-foreground">
          <Home className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-bold text-sm text-foreground">Settings</span>
        <div className="flex-1" />
        <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 text-sm font-bold transition text-blue-600 dark:text-blue-400">
          ← Back to Feed
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black font-['Space_Grotesk'] text-foreground">Settings</h1>
          <p className="text-sm mt-1 text-muted-foreground">Manage your account preferences and notifications.</p>
        </div>

        {/* Account Info */}
        <div className={cardClass}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Globe className="w-3.5 h-3.5" /> Account
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-14 h-14 rounded-full object-cover border-2 border-border bg-muted" alt="Profile" />
            <div>
              <p className="font-bold text-foreground">{user?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm mt-0.5 text-muted-foreground">{user?.country || "No country set"}</p>
            </div>
          </div>
          <Link to={createPageUrl("Profile")} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Edit Profile <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Notifications */}
        <div className={cardClass}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Bell className="w-3.5 h-3.5" /> Notification Preferences
          </h2>
          <div className="space-y-3">
            {NOTIF_KEYS.map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b last:border-0 border-border">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm text-foreground">{label}</span>
                </div>
                <button onClick={() => togglePref(key)} className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${prefs[key] ? "bg-blue-500" : "bg-muted border border-border"}`}>
                  <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200" style={{ left: prefs[key] ? 24 : 4 }} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={savePrefs} disabled={saving} className="mt-5 px-6 py-2.5 font-bold rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-60 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Preferences
          </button>
        </div>

        {/* Daily Code Widget */}
        <div className={cardClass}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-3.5 h-3.5" /> Daily Truth
          </h2>
          <p className="text-sm mb-4 text-muted-foreground">Access today's featured Code of Truth and daily devotional.</p>
          <Link to="/DailyTruthFeed" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
            View Daily Truth Feed <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Privacy */}
        <div className={cardClass}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-muted-foreground">
            <Shield className="w-3.5 h-3.5" /> Privacy & Legal
          </h2>
          <Link to="/Privacy" className="flex items-center justify-between py-2 text-sm transition text-foreground hover:opacity-80">
            Privacy Policy <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>
          <div className="h-px my-1 bg-border" />
          <a href="mailto:privacy@generationlightmode.org" className="flex items-center justify-between py-2 text-sm transition text-foreground hover:opacity-80">
            Contact Support <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>

        {/* Sign Out */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border transition font-bold text-sm min-h-[44px] border-red-500/20 text-red-500 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

        {/* Delete Account */}
        <div className="rounded-2xl p-6 bg-red-500/5 border border-red-500/20">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-red-500">
            <Trash2 className="w-3.5 h-3.5" /> Danger Zone
          </h2>
          <p className="text-sm mb-4 text-red-600/80 dark:text-red-400/80">
            Permanently delete your account. This removes <strong>all your Glow Drops, comments, prayer requests, follows, and group memberships</strong>. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition min-h-[44px] bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 dark:text-red-400"
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