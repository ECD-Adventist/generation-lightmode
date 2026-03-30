import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, Bell, Shield, LogOut, Home, ChevronRight, Moon, Globe, BookOpen } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    async function load() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { base44.auth.redirectToLogin("/Settings"); return; }
        const me = await base44.auth.me();
        setUser(me);
        const saved = {};
        NOTIF_KEYS.forEach(({ key }) => {
          saved[key] = me[key] !== false; // default ON
        });
        setPrefs(saved);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const savePrefs = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(prefs);
      toast.success("Preferences saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => base44.auth.logout(createPageUrl("Home"));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-20">
      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <Link to={createPageUrl("Feed")} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <Home className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-white font-bold text-sm">Settings</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black font-['Space_Grotesk']">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your account preferences and notifications.</p>
        </div>

        {/* Account Info */}
        <div className="bg-[#121826] rounded-2xl border border-white/5 p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#00CFFF] mb-4 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Account
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <img
              src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
              alt="Profile"
            />
            <div>
              <p className="font-bold text-white">{user?.full_name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <p className="text-gray-500 text-xs mt-0.5">{user?.country || "No country set"}</p>
            </div>
          </div>
          <Link
            to={createPageUrl("Profile")}
            className="inline-flex items-center gap-2 text-[#00CFFF] text-sm font-bold hover:underline"
          >
            Edit Profile <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Notifications */}
        <div className="bg-[#121826] rounded-2xl border border-white/5 p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#FFD000] mb-4 flex items-center gap-2">
            <Bell className="w-3.5 h-3.5" /> Notification Preferences
          </h2>
          <div className="space-y-3">
            {NOTIF_KEYS.map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm text-gray-200">{label}</span>
                </div>
                <button
                  onClick={() => togglePref(key)}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${prefs[key] ? "bg-[#00CFFF]" : "bg-gray-700"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${prefs[key] ? "left-6" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={savePrefs}
            disabled={saving}
            className="mt-5 px-6 py-2.5 bg-[#00CFFF] text-black font-bold rounded-xl text-sm hover:bg-[#00CFFF]/80 transition flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Preferences
          </button>
        </div>

        {/* Daily Code Widget */}
        <div className="bg-[#121826] rounded-2xl border border-white/5 p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#8A5CFF] mb-4 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Daily Truth
          </h2>
          <p className="text-gray-400 text-sm mb-4">Access today's featured Code of Truth and daily devotional.</p>
          <Link
            to="/DailyTruthFeed"
            className="inline-flex items-center gap-2 text-[#8A5CFF] text-sm font-bold hover:underline"
          >
            View Daily Truth Feed <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Privacy */}
        <div className="bg-[#121826] rounded-2xl border border-white/5 p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Privacy & Legal
          </h2>
          <Link
            to="/Privacy"
            className="flex items-center justify-between py-2 text-sm text-gray-300 hover:text-white transition"
          >
            Privacy Policy <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          </Link>
          <div className="h-px bg-white/5 my-1" />
          <a
            href="mailto:privacy@generationlightmode.org"
            className="flex items-center justify-between py-2 text-sm text-gray-300 hover:text-white transition"
          >
            Contact Support <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          </a>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition font-bold text-sm"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}