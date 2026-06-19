import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  ChevronRight, Bell, LayoutDashboard, Users, Flag, BarChart3,
  ShieldCheck, LogOut, User, Zap, Info, Globe2, Bot,
} from "lucide-react";

function MenuCard({ to, onClick, leading, label, badge, danger }) {
  const inner = (
    <>
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-base" style={{ background: danger ? "rgba(239,68,68,0.12)" : "rgba(0,207,255,0.1)" }}>
          {leading}
        </span>
        <span className="text-[15px] font-semibold truncate" style={{ color: danger ? "#ef4444" : "#E6ECF5" }}>{label}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {badge ? (
          <span className="text-[11px] font-bold rounded-full min-w-[20px] h-[18px] flex items-center justify-center px-1.5" style={{ background: "#ef4444", color: "#fff" }}>{badge}</span>
        ) : null}
        {!danger && <ChevronRight className="w-4 h-4" style={{ color: "#5A6A85" }} />}
      </span>
    </>
  );

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
  };

  if (to) {
    return (
      <Link to={to} onClick={onClick} className="flex items-center justify-between px-3.5 py-3.5 transition active:scale-[0.98]" style={cardStyle}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-3.5 py-3.5 transition active:scale-[0.98]" style={cardStyle}>
      {inner}
    </button>
  );
}

function SectionLabel({ children, color }) {
  return (
    <p className="px-1 pt-2 pb-1 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: color || "#7A8AA5" }}>{children}</p>
  );
}

export default function PublicMobileMenu({ t, userEmail, userRole, notifications = [], onClose, onSwitchItOn }) {
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  return (
    <div
      className="overflow-y-auto"
      style={{
        background: "rgba(13,18,30,0.99)",
        backdropFilter: "blur(20px)",
        padding: "16px 18px 28px",
        borderTop: "1px solid rgba(0,207,255,0.12)",
        maxHeight: "calc(100dvh - 76px)",
      }}
    >
      {/* Primary nav */}
      <SectionLabel color="#00CFFF">Menu</SectionLabel>
      <div className="flex flex-col gap-2.5">
        <MenuCard to={createPageUrl("About")} onClick={onClose} leading={<Info className="w-4 h-4" style={{ color: "#00CFFF" }} />} label={t("about") || "About"} />
        <MenuCard to={createPageUrl("Impact")} onClick={onClose} leading={<BarChart3 className="w-4 h-4" style={{ color: "#00CFFF" }} />} label={t("impact") || "Impact"} />
        <MenuCard to={createPageUrl("Assistant")} onClick={onClose} leading={<Bot className="w-4 h-4" style={{ color: "#00CFFF" }} />} label={t("assistant") || "Assistant"} />
        <MenuCard to={createPageUrl("KeepIt100")} onClick={onClose} leading={<span>💯</span>} label="Keep It 100" />
        <MenuCard to={createPageUrl("CodesOfTruth")} onClick={onClose} leading={<span>🔐</span>} label="Codes of Truth" />
        <MenuCard to={createPageUrl("Resources")} onClick={onClose} leading={<Globe2 className="w-4 h-4" style={{ color: "#00CFFF" }} />} label="Resources" />
      </div>

      {userEmail ? (
        <>
          {/* My Account */}
          <SectionLabel>My Account</SectionLabel>
          <div className="flex flex-col gap-2.5">
            <MenuCard to={createPageUrl("Profile")} onClick={onClose} leading={<User className="w-4 h-4" style={{ color: "#00CFFF" }} />} label="My Profile" />
            <MenuCard to={createPageUrl("Feed")} onClick={onClose} leading={<Zap className="w-4 h-4" style={{ color: "#00CFFF" }} />} label="Feed" />
            <MenuCard to={createPageUrl("Notifications")} onClick={onClose} leading={<Bell className="w-4 h-4" style={{ color: "#00CFFF" }} />} label="Notifications" badge={notifications.length > 0 ? notifications.length : null} />
          </div>

          {/* Admin Panel */}
          {isAdmin && (
            <>
              <SectionLabel color="#FFD000">Admin Panel</SectionLabel>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: <LayoutDashboard className="w-4 h-4" style={{ color: "#FFD000" }} />, label: "Control Center", tab: "dashboard" },
                  { icon: <Users className="w-4 h-4" style={{ color: "#FFD000" }} />, label: "User Management", tab: "users" },
                  { icon: <Flag className="w-4 h-4" style={{ color: "#FFD000" }} />, label: "Moderation", tab: "drops" },
                  { icon: <BarChart3 className="w-4 h-4" style={{ color: "#FFD000" }} />, label: "Analytics", tab: "analytics" },
                  { icon: <ShieldCheck className="w-4 h-4" style={{ color: "#FFD000" }} />, label: "Settings", tab: "settings" },
                ].map(item => (
                  <MenuCard key={item.label} to={`${createPageUrl("AdminCenter")}?tab=${item.tab}`} onClick={onClose} leading={item.icon} label={item.label} />
                ))}
              </div>
            </>
          )}

          {/* Switch It On */}
          <button onClick={() => { onClose(); onSwitchItOn("Feed"); }} className="glm-btn-primary w-full mt-5" style={{ cursor: "pointer" }}>
            ⚡ Switch It On
          </button>

          <div className="mt-3">
            <MenuCard onClick={() => { onClose(); base44.auth.logout(); }} leading={<LogOut className="w-4 h-4" style={{ color: "#ef4444" }} />} label="Sign Out" danger />
          </div>
        </>
      ) : (
        <button onClick={() => { onClose(); onSwitchItOn("Feed"); }} className="glm-btn-primary w-full mt-5" style={{ cursor: "pointer" }}>
          Switch It On ⚡
        </button>
      )}
    </div>
  );
}