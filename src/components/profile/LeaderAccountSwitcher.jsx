import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Shield, User, Check, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Account switcher shown on the Profile page for managers (or admins) of leader accounts.
 * Lets the user toggle between their personal profile and any ManagedLeaderAccount they
 * are authorized to manage. Selecting a leader rebrands the page to that leader's identity.
 *
 * Props:
 *  - currentUser: the logged-in user
 *  - managedAccounts: array of ManagedLeaderAccount records this user can manage
 *  - activeLeaderEmail: email of the currently active leader, or null for personal profile
 *  - onSwitch: (leaderEmail | null) => void
 */
export default function LeaderAccountSwitcher({ currentUser, managedAccounts = [], activeLeaderEmail, onSwitch }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!managedAccounts || managedAccounts.length === 0) return null;

  const activeLeader = managedAccounts.find(a => a.leader_email === activeLeaderEmail);
  const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

  const currentLabel = activeLeader
    ? activeLeader.leader_name
    : (currentUser?.full_name || "My Profile");
  const currentSubLabel = activeLeader
    ? (activeLeader.leader_title || "Leader Account")
    : "Personal";
  const currentAvatar = activeLeader
    ? (activeLeader.leader_profile_picture_url || defaultAvatar)
    : (currentUser?.profile_picture_url || defaultAvatar);

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition active:scale-[0.99]"
        style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.06)" }}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${activeLeader ? "#FFD000" : "#1FB8FF"}` }}>
          <img src={currentAvatar} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: activeLeader ? "#CC7A00" : "#0B3FD9" }}>
              {activeLeader ? "Posting as Leader" : "Your Profile"}
            </span>
          </div>
          <div className="text-sm font-bold font-['Space_Grotesk'] truncate" style={{ color: "#0B1B3D" }}>{currentLabel}</div>
          <div className="text-[11px] truncate" style={{ color: "#6B7FA0" }}>{currentSubLabel}</div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} style={{ color: "#6B7FA0" }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 12px 32px rgba(11, 63, 217, 0.18)" }}>
          {/* Personal account row */}
          <button
            onClick={() => { onSwitch(null); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 transition text-left"
            style={{ background: !activeLeaderEmail ? "#EEF3FF" : "transparent" }}
            onMouseOver={e => { if (activeLeaderEmail) e.currentTarget.style.background = "#F6F8FC"; }}
            onMouseOut={e => { if (activeLeaderEmail) e.currentTarget.style.background = "transparent"; }}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #1FB8FF" }}>
              <img src={currentUser?.profile_picture_url || defaultAvatar} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3" style={{ color: "#0B3FD9" }} />
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Personal</span>
              </div>
              <div className="text-sm font-bold truncate" style={{ color: "#0B1B3D" }}>{currentUser?.full_name || "My Profile"}</div>
            </div>
            {!activeLeaderEmail && <Check className="w-4 h-4 shrink-0" style={{ color: "#0B3FD9" }} />}
          </button>

          <div style={{ height: 1, background: "#E6ECF5" }} />
          <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider" style={{ color: "#8A97B5", background: "#F6F8FC" }}>
            Leaders You Manage ({managedAccounts.length})
          </div>

          <div className="max-h-72 overflow-y-auto">
            {managedAccounts.map(account => {
              const isActive = activeLeaderEmail === account.leader_email;
              return (
                <button
                  key={account.id}
                  onClick={() => { onSwitch(account.leader_email); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 transition text-left"
                  style={{ background: isActive ? "#FFF8E6" : "transparent" }}
                  onMouseOver={e => { if (!isActive) e.currentTarget.style.background = "#F6F8FC"; }}
                  onMouseOut={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #FFD000" }}>
                    <img src={account.leader_profile_picture_url || defaultAvatar} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3" style={{ color: "#CC7A00" }} />
                      <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#CC7A00" }}>
                        {account.leader_title || "Leader"}
                      </span>
                    </div>
                    <div className="text-sm font-bold truncate" style={{ color: "#0B1B3D" }}>{account.leader_name}</div>
                    {account.leader_country && (
                      <div className="text-[10px] truncate" style={{ color: "#8A97B5" }}>{account.leader_country}</div>
                    )}
                  </div>
                  {isActive && <Check className="w-4 h-4 shrink-0" style={{ color: "#CC7A00" }} />}
                </button>
              );
            })}
          </div>

          {/* Analytics CTA — visible when an active leader is selected */}
          {activeLeader && (
            <>
              <div style={{ height: 1, background: "#E6ECF5" }} />
              <Link
                to={`${createPageUrl("LeaderAnalytics")}?leader=${encodeURIComponent(activeLeader.leader_email)}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 transition no-underline"
                style={{ background: "linear-gradient(90deg, #FFF8E6 0%, #FFFCF0 100%)", color: "#CC7A00" }}
                onMouseOver={e => { e.currentTarget.style.background = "#FFF0CC"; }}
                onMouseOut={e => { e.currentTarget.style.background = "linear-gradient(90deg, #FFF8E6 0%, #FFFCF0 100%)"; }}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">View Leader Analytics</span>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}