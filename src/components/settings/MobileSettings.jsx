import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, Bell, Shield, LogOut, ChevronRight, Globe, BookOpen, Trash2 } from "lucide-react";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";

export default function MobileSettings({ user, prefs, togglePref, savePrefs, saving, handleLogout, handleDeleteAccount, notifKeys }) {
  return (
    <div className="min-h-screen pb-24 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader title="Settings" subtitle="Preferences & account" />

      <div className="px-4 py-5 space-y-4">
        {/* Account */}
        <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11,63,217,0.04)" }}>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#0B3FD9" }}>
            <Globe className="w-3 h-3" /> Account
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-14 h-14 rounded-full object-cover" style={{ border: "2px solid #E6ECF5" }} alt="Profile" />
            <div className="min-w-0">
              <p className="font-bold truncate" style={{ color: "#0B1B3D" }}>{user?.full_name}</p>
              <p className="text-[12px] truncate" style={{ color: "#6B7FA0" }}>{user?.email}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8A97B5" }}>{user?.country || "No country set"}</p>
            </div>
          </div>
          <Link to={createPageUrl("Profile")} className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>
            Edit Profile <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#CC7A00" }}>
            <Bell className="w-3 h-3" /> Notifications
          </h2>
          <div className="space-y-1">
            {notifKeys.map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg shrink-0">{icon}</span>
                  <span className="text-[13px] truncate" style={{ color: "#0B1B3D" }}>{label}</span>
                </div>
                <button onClick={() => togglePref(key)} className="w-12 h-7 rounded-full transition-colors relative shrink-0" style={{ background: prefs[key] ? "#0B3FD9" : "#E2E8F0" }}>
                  <span className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: prefs[key] ? 26 : 4 }} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={savePrefs} disabled={saving} className="mt-3 w-full py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11,63,217,0.25)" }}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Preferences
          </button>
        </div>

        {/* Daily Truth */}
        <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: "#0B3FD9" }}>
            <BookOpen className="w-3 h-3" /> Daily Truth
          </h2>
          <p className="text-[13px] mb-3" style={{ color: "#6B7FA0" }}>Access today's Code of Truth and devotional.</p>
          <Link to="/DailyTruthFeed" className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>
            View Daily Truth <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Privacy */}
        <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: "#8A97B5" }}>
            <Shield className="w-3 h-3" /> Privacy & Legal
          </h2>
          <Link to="/Privacy" className="flex items-center justify-between py-3 text-sm border-b" style={{ color: "#0B1B3D", borderColor: "#F0F4FA" }}>
            Privacy Policy <ChevronRight className="w-4 h-4" style={{ color: "#8A97B5" }} />
          </Link>
          <a href="mailto:privacy@generationlightmode.org" className="flex items-center justify-between py-3 text-sm" style={{ color: "#0B1B3D" }}>
            Contact Support <ChevronRight className="w-4 h-4" style={{ color: "#8A97B5" }} />
          </a>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm min-h-[52px]" style={{ background: "#FFFFFF", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}>
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

        {/* Danger zone */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: "#EF4444" }}>
            <Trash2 className="w-3 h-3" /> Danger Zone
          </h2>
          <p className="text-[12px] mb-3" style={{ color: "#B91C1C" }}>
            Permanently delete your account and all content. Cannot be undone.
          </p>
          <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm min-h-[48px]" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Trash2 className="w-4 h-4" /> Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
}