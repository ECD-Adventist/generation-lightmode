import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, X, Bell, LayoutDashboard, Users, Flag, BarChart3, MessageSquare, ShieldCheck, LogOut, User, Zap } from "lucide-react";
import LanguageSelector from "./components/LanguageSelector";
import { useAppLanguage } from "./components/i18n/useAppLanguage";
import { useSwitchItOn } from "./components/pledge/SwitchItOnProvider";
import MobileBottomNav from "./components/mobile/MobileBottomNav";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const navLinks = [
  { key: "about", page: "About" },
  { key: "impact", page: "Impact" },
  { key: "assistant", page: "Assistant" },
];

const appShellPages = ["Feed","Dashboard","Profile","Notifications","Saved","GlowGroups","GroupChat","AdminCenter","AdminReports","Messages","PrayerWall","Live","Milestones","GlobalReach","GroupSession","DailyDevotion","Discover","Leaderboard","DailyTruthFeed","InstitutionPage","InstitutionDashboard","InstitutionControlCenter","Settings","Post","GlowFeed","GenerationLightMode","LightReflections","FaithQuiz","TerritoryPhotos"];

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAppShellPage = appShellPages.includes(currentPageName);
  const isMobileViewport = useIsMobile();
  // On mobile, these pages render their own full-bleed mobile shell (with their own nav + footer).
  const mobileOwnedPages = ["Home", "About", "Impact", "Assistant", "Resources", "KeepIt100", "CodesOfTruth", "Challenges", "Media", "Privacy", "GenerationLightMode"];
  const hideDesktopChrome = isMobileViewport && mobileOwnedPages.includes(currentPageName);
  const [scrolled, setScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const { t, isRTL } = useAppLanguage("layout");
  const { trigger: triggerSwitchOn } = useSwitchItOn();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (isAppShellPage) return;
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) {
        base44.auth.me().then(me => {
          setUserEmail(me?.email);
          setUserRole(me?.role);
        });
      }
    });
  }, [isAppShellPage]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail, read: false }),
    enabled: !!userEmail
  });

  useEffect(() => {
    if (!userEmail) return;
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_email === userEmail && !event.data.read) {
        toast(event.data.message, { icon: '🔔' });
        queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] });
      }
    });
    return unsubscribe;
  }, [userEmail, queryClient]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('tab_switch')) {
      sessionStorage.removeItem('tab_switch');
      return;
    }

    if (location.hash) {
      requestAnimationFrame(() => {
        const target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="bg-background min-h-screen text-foreground" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-main: #0B0F1A;
          --bg-section: #121826;
          --cyan: #00CFFF;
          --gold: #FFD000;
          --violet: #8A5CFF;
          --royal: #0033CC;
          --white: #FFFFFF;
          --gray: #C8D0E0;
          --gradient: linear-gradient(90deg, #00CFFF 0%, #8A5CFF 100%);
          --gradient-gold: linear-gradient(90deg, #FFD000 0%, #00CFFF 100%);
        }

        body { @apply bg-background text-foreground; }

        .glm-headline {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .glm-body {
          font-family: 'Inter', sans-serif;
          color: #C8D0E0;
          line-height: 1.7;
        }

        .glm-gradient-text {
          background: linear-gradient(90deg, #00CFFF 0%, #8A5CFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glm-gold-text {
          background: linear-gradient(90deg, #FFD000 0%, #00CFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glm-btn-primary {
          background: #00CFFF;
          color: #0B0F1A;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 800;
          padding: 14px 32px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(0, 207, 255, 0.5);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          white-space: nowrap;
        }

        .glm-btn-primary:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 0 35px rgba(0, 207, 255, 0.8);
          background: #1ae0ff;
        }

        .glm-btn-secondary {
          background: transparent;
          color: #00CFFF;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          padding: 13px 32px;
          border-radius: 50px;
          border: 2px solid #00CFFF;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          display: inline-block;
          text-decoration: none;
        }

        .glm-btn-secondary:hover {
          box-shadow: 0 0 25px rgba(0, 207, 255, 0.5);
          background: rgba(0, 207, 255, 0.08);
        }

        .glm-card {
          background: #121826;
          border: 1px solid rgba(0, 207, 255, 0.15);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.3s ease;
        }

        .glm-card:hover {
          border-color: rgba(0, 207, 255, 0.5);
          box-shadow: 0 0 30px rgba(0, 207, 255, 0.15);
          transform: translateY(-4px);
        }

        .glow-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #00CFFF;
          box-shadow: 0 0 12px #00CFFF;
          display: inline-block;
        }

        .nav-link {
          color: #C8D0E0;
          text-decoration: none;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 15px;
          transition: color 0.2s;
          position: relative;
        }

        .nav-link:hover, .nav-link.active {
          color: #00CFFF;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00CFFF, #8A5CFF);
          border-radius: 2px;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,207,255,0.4); }
          50% { box-shadow: 0 0 40px rgba(0,207,255,0.8), 0 0 60px rgba(138,92,255,0.3); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes count-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }

        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,207,255,0.3), transparent);
          margin: 0;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0B0F1A; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(#00CFFF, #8A5CFF); border-radius: 3px; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* NAVBAR — public-site only */}
      {isAppShellPage || hideDesktopChrome ? null : (
        /* Public nav for non-logged-in users */
        <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, paddingTop: "env(safe-area-inset-top)",
        background: scrolled ? "rgba(11,15,26,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.4)" : "none",
        borderBottom: "none",
        transition: "all 0.4s ease",
        padding: "0 24px",
      }}>
        {/* Branded gradient veil — soft fade only at top, no hard edge at bottom */}
        <div style={{
          position: "absolute", inset: 0, zIndex: -1,
          background: scrolled
            ? "linear-gradient(180deg, rgba(11,15,26,0.92) 0%, rgba(11,15,26,0.85) 100%)"
            : "none",
          transition: "all 0.4s ease",
          pointerEvents: "none",
        }} />
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-[76px] md:h-[76px] lg:h-[86px] w-full">
          {/* Logo */}
          <Link to={createPageUrl("Home")} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
              alt="Generation LightMode"
              style={{ height: 56, width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(0,207,255,0.6))" }}
            />
          </Link>

          {/* Desktop Nav — glassy pill group */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "rgba(11,15,26,0.35)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 999, boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }} className="desktop-nav">
            {navLinks.map(link => {
              const isActive = currentPageName === link.page;
              return (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: isActive ? "#0B0F1A" : "#E0E8F0",
                    background: isActive ? "linear-gradient(135deg, #00CFFF, #8A5CFF)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    boxShadow: isActive ? "0 0 20px rgba(0,207,255,0.4)" : "none",
                    whiteSpace: "nowrap",
                  }}
                  onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#00CFFF"; } }}
                  onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#E0E8F0"; } }}
                >
                  {t(link.key) || link.page}
                </Link>
              );
            })}
            {/* Resources Dropdown */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <Link to={createPageUrl("Resources")}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: ["Media","Resources"].includes(currentPageName) ? "#00CFFF" : "#E0E8F0",
                  background: ["Media","Resources"].includes(currentPageName) ? "rgba(0,207,255,0.1)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#00CFFF"; }}
                onMouseOut={e => {
                  const active = ["Media","Resources"].includes(currentPageName);
                  e.currentTarget.style.background = active ? "rgba(0,207,255,0.1)" : "transparent";
                  e.currentTarget.style.color = active ? "#00CFFF" : "#E0E8F0";
                }}
              >
                {t("resources")} <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
              </Link>
              {resourcesOpen && (
                <div style={{
                  position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                  paddingTop: "8px", zIndex: 2000,
                }}>
                  <div style={{
                    background: "rgba(18,24,38,0.98)", backdropFilter: "blur(20px)",
                    border: "1px solid rgba(0,207,255,0.2)", borderRadius: 14,
                    padding: "8px", minWidth: 200,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}>
                    <Link to={createPageUrl("KeepIt100")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, color: "#C8D0E0", textDecoration: "none", fontFamily: "Inter, sans-serif", fontSize: 14, transition: "all 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.color = "#00CFFF"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C8D0E0"; }}
                    >
                      💯 Keep It 100
                    </Link>
                    <Link to={createPageUrl("CodesOfTruth")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, color: "#C8D0E0", textDecoration: "none", fontFamily: "Inter, sans-serif", fontSize: 14, transition: "all 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.color = "#00CFFF"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C8D0E0"; }}
                    >
                      🔐 Codes of Truth
                    </Link>
                    <Link to={createPageUrl("Resources")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, color: "#C8D0E0", textDecoration: "none", fontFamily: "Inter, sans-serif", fontSize: 14, transition: "all 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.color = "#00CFFF"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C8D0E0"; }}
                    >
                      🌍 Other Resources
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right-side actions — outside the pill group */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "visible" }} className="desktop-nav">
            <LanguageSelector />
            {!userEmail ? (
              <button onClick={() => triggerSwitchOn("Feed")} className="glm-switch-btn">
                <span className="glm-switch-inner"><span className="glm-switch-text">⚡ Switch It On</span></span>
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => triggerSwitchOn("Feed")} className="glm-switch-btn">
                  <span className="glm-switch-orbit p1" aria-hidden="true" />
                  <span className="glm-switch-orbit p2" aria-hidden="true" />
                  <span className="glm-switch-orbit p3" aria-hidden="true" />
                  <span className="glm-switch-inner"><span className="glm-switch-text">⚡ Switch It On</span></span>
                </button>
                <Link to={createPageUrl("Notifications")} className="relative w-10 h-10 rounded-full flex items-center justify-center transition" style={{ background: "linear-gradient(135deg, #0080FE 0%, #0040A0 40%, #1A6B3F 70%, #D4B82E 100%)", boxShadow: "0 0 12px rgba(0,128,254,0.35)" }}>
                  <Bell className="w-5 h-5 text-white" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0B0F1A] rounded-full"></span>
                  )}
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(v => !v)}
                    className="w-10 h-10 rounded-full p-[2px] focus:outline-none"
                    style={{ background: "linear-gradient(135deg, #0080FE 0%, #0040A0 40%, #1A6B3F 70%, #D4B82E 100%)", boxShadow: "0 0 12px rgba(0,128,254,0.35)" }}
                    title="Profile"
                  >
                    <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center overflow-hidden">
                      <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png" className="w-full h-full object-cover" />
                    </div>
                  </button>

                  {profileMenuOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 10px)", right: 0,
                      background: "rgba(18,24,38,0.98)", backdropFilter: "blur(20px)",
                      border: "1px solid rgba(0,207,255,0.2)", borderRadius: 14,
                      padding: "8px", minWidth: 220, zIndex: 3000,
                      boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
                    }}>
                      {/* Profile & Feed */}
                      <div style={{ padding: "6px 10px 4px", fontSize: 10, color: "#8A9BB0", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>My Account</div>
                      {[
                        { icon: <User size={14} />, label: "My Profile", page: "Profile" },
                        { icon: <Zap size={14} />, label: "Feed", page: "Feed" },
                        { icon: <Bell size={14} />, label: "Notifications", page: "Notifications" },
                      ].map(item => (
                        <Link key={item.page} to={createPageUrl(item.page)} onClick={() => setProfileMenuOpen(false)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, color: "#C8D0E0", textDecoration: "none", fontFamily: "Inter, sans-serif", fontSize: 14, transition: "all 0.15s" }}
                          onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
                          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C8D0E0"; }}
                        >
                          <span style={{ color: "#00CFFF" }}>{item.icon}</span> {item.label}
                        </Link>
                      ))}

                      {/* Admin links — only for admin role */}
                      {(userRole === "admin" || userRole === "super_admin") && (
                        <>
                          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 4px" }} />
                          <div style={{ padding: "6px 10px 4px", fontSize: 10, color: "#FFD000", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin Panel</div>
                          {[
                            { icon: <LayoutDashboard size={14} />, label: "Control Center", tab: "dashboard" },
                            { icon: <Users size={14} />, label: "User Management", tab: "users" },
                            { icon: <Flag size={14} />, label: "Moderation", tab: "drops" },
                            { icon: <BarChart3 size={14} />, label: "Analytics", tab: "analytics" },
                            { icon: <ShieldCheck size={14} />, label: "Settings", tab: "settings" },
                          ].map(item => (
                            <Link key={item.label} to={`${createPageUrl("AdminCenter")}?tab=${item.tab}`} onClick={() => setProfileMenuOpen(false)}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, color: "#C8D0E0", textDecoration: "none", fontFamily: "Inter, sans-serif", fontSize: 14, transition: "all 0.15s" }}
                              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,208,0,0.08)"; e.currentTarget.style.color = "#FFD000"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C8D0E0"; }}
                            >
                              <span style={{ color: "#FFD000" }}>{item.icon}</span> {item.label}
                            </Link>
                          ))}
                        </>
                      )}

                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 4px" }} />
                      <button onClick={() => { base44.auth.logout(); setProfileMenuOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 14, width: "100%", transition: "all 0.15s" }}
                        onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#00CFFF", display: "none" }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{
            background: "rgba(18,24,38,0.98)",
            backdropFilter: "blur(20px)",
            padding: "24px",
            borderTop: "1px solid rgba(0,207,255,0.1)",
          }}>
            {navLinks.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className="nav-link"
                style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }}
                onClick={() => setMenuOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
            <Link to={createPageUrl("KeepIt100")} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
              💯 Keep It 100
            </Link>
            <Link to={createPageUrl("CodesOfTruth")} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
              🔐 Codes of Truth
            </Link>
            <Link to={createPageUrl("Resources")} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
              🌍 Other Resources
            </Link>
            
            {userEmail ? (
              <>
                <button onClick={() => { setMenuOpen(false); triggerSwitchOn("Feed"); }} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17, background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}>
                  ⚡ Switch It On
                </button>
                <Link to={createPageUrl("Profile")} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
                  👤 {t("profile") || "Profile"}
                </Link>
              </>
            ) : (
              <button onClick={() => { setMenuOpen(false); triggerSwitchOn("Feed"); }} className="glm-btn-primary" style={{ display: "block", textAlign: "center", marginTop: 20, width: "100%", cursor: "pointer" }}>
                Switch It On ⚡
              </button>
            )}
          </div>
        )}
      </nav>
      )}

      {/* Page Content */}
      <main className={`${isAppShellPage || currentPageName === "Home" || hideDesktopChrome ? "pt-0" : "pt-[70px] md:pt-[72px] lg:pt-[82px]"} ${isAppShellPage ? "has-mobile-bottom-nav" : ""}`}>
        {children}
      </main>

      {/* Mobile bottom nav — app-shell pages only */}
      {isAppShellPage && <MobileBottomNav currentPageName={currentPageName} />}

      {/* FOOTER — public-site only */}
      {!isAppShellPage && !hideDesktopChrome ? (
      <footer style={{ background: "#080C14", borderTop: "1px solid rgba(0,207,255,0.1)", padding: "60px 24px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 48, marginBottom: 48 }}>
            <div>
              <img
                src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
                alt="Generation LightMode"
                style={{ height: 56, marginBottom: 16, filter: "drop-shadow(0 0 10px rgba(0,207,255,0.5))" }}
              />
              <p className="glm-body" style={{ fontSize: 14, maxWidth: 260 }}>
                {t("footerText")} <strong style={{ color: "#FFD000" }}>Faith. Always On.</strong>
              </p>
            </div>
            <div>
              <h4 className="glm-headline" style={{ fontSize: 16, color: "#00CFFF", marginBottom: 16 }}>{t("movement")}</h4>
              {[
               { key: "about", page: "About" },
               { key: "challenges", page: "Challenges" },
               { key: "glowGroups", page: "GlowGroups" },
               { key: "impact", page: "Impact" },
              ].map(p => (
                <Link key={p.page} to={createPageUrl(p.page)} style={{ display: "block", color: "#C8D0E0", textDecoration: "none", marginBottom: 10, fontSize: 14, transition: "color 0.2s" }}
                  onMouseOver={e => e.target.style.color = "#00CFFF"}
                  onMouseOut={e => e.target.style.color = "#C8D0E0"}
                >{t(p.key)}</Link>
              ))}
            </div>
            <div>
              <h4 className="glm-headline" style={{ fontSize: 16, color: "#00CFFF", marginBottom: 16 }}>{t("resources")}</h4>
              <Link to={createPageUrl("KeepIt100")} style={{ display: "block", color: "#C8D0E0", textDecoration: "none", marginBottom: 10, fontSize: 14, transition: "color 0.2s" }}
                onMouseOver={e => e.target.style.color = "#00CFFF"}
                onMouseOut={e => e.target.style.color = "#C8D0E0"}
              >Keep It 100</Link>
              <Link to={createPageUrl("CodesOfTruth")} style={{ display: "block", color: "#C8D0E0", textDecoration: "none", marginBottom: 10, fontSize: 14, transition: "color 0.2s" }}
                onMouseOver={e => e.target.style.color = "#00CFFF"}
                onMouseOut={e => e.target.style.color = "#C8D0E0"}
              >Codes of Truth</Link>
              <Link to={createPageUrl("Resources")} style={{ display: "block", color: "#C8D0E0", textDecoration: "none", marginBottom: 10, fontSize: 14, transition: "color 0.2s" }}
                onMouseOver={e => e.target.style.color = "#00CFFF"}
                onMouseOut={e => e.target.style.color = "#C8D0E0"}
              >Other Resources</Link>
              <Link to={createPageUrl("Assistant")} style={{ display: "block", color: "#C8D0E0", textDecoration: "none", marginBottom: 10, fontSize: 14, transition: "color 0.2s" }}
                onMouseOver={e => e.target.style.color = "#00CFFF"}
                onMouseOut={e => e.target.style.color = "#C8D0E0"}
              >{t("assistant")}</Link>
            </div>
            <div>
              <h4 className="glm-headline" style={{ fontSize: 16, color: "#FFD000", marginBottom: 16 }}>{t("joinMovement")}</h4>
              <p className="glm-body" style={{ fontSize: 14, marginBottom: 16 }}>{t("ready")}</p>
              <a href={createPageUrl("Feed")} className="glm-btn-primary" style={{ fontSize: 14, padding: "12px 24px" }}>
                {t("getStarted")}
              </a>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "#C8D0E0", fontSize: 13 }}>© 2026 Generation LightMode. All rights reserved.</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className="glow-dot"></span>
              <span style={{ color: "#C8D0E0", fontSize: 13 }}>{t("poweredBy")}</span>
            </div>
          </div>
        </div>
      </footer>
      ) : null}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }

        /* Switch It On — premium dark glass pill with rotating gradient border */
        @keyframes glm-sweep-light {
          0%   { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        @keyframes glm-spin-border {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes glm-pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(0,128,254,0.45)) drop-shadow(0 6px 20px rgba(0,0,0,0.45)); }
          50%      { filter: drop-shadow(0 0 14px rgba(0,128,254,0.7)) drop-shadow(0 8px 28px rgba(0,0,0,0.5)); }
        }
        .glm-switch-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          background: #060912;
          white-space: nowrap;
          flex-shrink: 0;
          padding: 1.5px;
          border-radius: 999px;
          overflow: hidden;
          transition: transform 0.25s ease;
          animation: glm-pulse-glow 3s ease-in-out infinite;
        }
        .glm-switch-btn:hover {
          transform: translateY(-1px) scale(1.02);
        }
        .glm-switch-btn:active {
          transform: translateY(0) scale(0.98);
        }
        /* Rotating conic-gradient border light */
        .glm-switch-btn::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          width: 300%; height: 300%;
          background: conic-gradient(from 0deg, transparent 55%, #4DA8FF 70%, #0080FE 82%, #FFD000 93%, transparent 100%);
          animation: glm-spin-border 3s linear infinite;
          z-index: 0;
          pointer-events: none;
        }
        .glm-switch-inner {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, #0080FE 0%, #0040A0 40%, #1A6B3F 70%, #D4B82E 100%);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.02em;
          padding: 9px 20px;
          border-radius: 999px;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }
        /* Subtle sweep shimmer on inner pill */
        .glm-switch-inner::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0; left: 0;
          width: 30%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(255,255,255,0.35), rgba(255,255,255,0.18), transparent);
          animation: glm-sweep-light 3.5s infinite ease-in-out;
          pointer-events: none;
          z-index: 1;
        }
        /* Crisp white text */
        .glm-switch-text {
          position: relative;
          z-index: 2;
          color: #FFFFFF;
          -webkit-text-fill-color: #FFFFFF;
          text-shadow: 0 1px 2px rgba(0,0,0,0.25);
        }
        /* Hide orbit spans (no longer used) */
        .glm-switch-orbit { display: none; }
      `}</style>
    </div>
  );
}