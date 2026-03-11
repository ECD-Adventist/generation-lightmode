import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, X, Zap, Bell } from "lucide-react";
import LanguageSelector from "./components/LanguageSelector";
import { useAppLanguage } from "./components/i18n/useAppLanguage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const navLinks = [
  { key: "home", page: "Home" },
  { key: "feed", page: "Feed" },
  { key: "about", page: "About" },
  { key: "challenges", page: "Challenges" },
  { key: "glowGroups", page: "GlowGroups" },
  { key: "impact", page: "Impact" },
  { key: "assistant", page: "Assistant" },
];

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const { t, isRTL } = useAppLanguage("layout");
  const location = useLocation();
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) {
        base44.auth.me().then(me => {
          setUserEmail(me?.email);
          setUserRole(me?.role);
        });
      }
    });
  }, []);

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
    <div dir={isRTL ? "rtl" : "ltr"} style={{ background: "#0B0F1A", minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
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

        body { background: #0B0F1A; color: #FFFFFF; }

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
      `}</style>

      {/* NAVBAR — hide on app pages when user is logged in */}
      {/* App pages have their own left sidebar navigation */}
      {(() => {
        const appPages = ["Feed", "Dashboard", "Profile", "Notifications", "Saved", "GlowGroups", "AdminReports"];
        const isAppPage = appPages.includes(currentPageName);
        if (isAppPage && userEmail) return null;
        if (currentPageName === "Feed") return null;
        return (
        <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "rgba(11,15,26,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,207,255,0.1)" : "none",
        transition: "all 0.4s ease",
        padding: "0 24px",
      }}>
        <div style={{
          position: "absolute", inset: 0, zIndex: -1,
          background: scrolled ? "none" : "linear-gradient(180deg, rgba(0,207,255,0.15) 0%, transparent 100%)",
          transition: "opacity 0.4s ease",
          opacity: scrolled ? 0 : 1,
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          {/* Logo */}
          <Link to={createPageUrl("Home")} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_692b64307296ee339e64b660/c20e0f05a_GENERATIONLIGHTMODE-LOGO.png"
              alt="Generation LightMode"
              style={{ height: 48, width: "auto", filter: "drop-shadow(0 0 12px rgba(0,207,255,0.6))" }}
            />
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="desktop-nav">
            {navLinks.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className={`nav-link ${currentPageName === link.page ? "active" : ""}`}
              >
                {t(link.key) || link.page}
              </Link>
            ))}
            {/* Resources Dropdown */}
            <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <Link to={createPageUrl("Resources")} className={`nav-link ${["Media","Resources"].includes(currentPageName) ? "active" : ""}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {t("resources")} <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
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
                    <Link to={createPageUrl("Resources")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, color: "#C8D0E0", textDecoration: "none", fontFamily: "Inter, sans-serif", fontSize: 14, transition: "all 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.color = "#00CFFF"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C8D0E0"; }}
                    >
                      📺 {t("mediaContent") }
                    </Link>
                    <Link to={createPageUrl("Resources") + "?tab=downloads"} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, color: "#C8D0E0", textDecoration: "none", fontFamily: "Inter, sans-serif", fontSize: 14, transition: "all 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.color = "#00CFFF"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C8D0E0"; }}
                    >
                      📥 {t("downloads") }
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <LanguageSelector />
            {!userEmail ? (
              <a href={createPageUrl("Feed")} className="glm-btn-primary" style={{ padding: "10px 24px", fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>
                {t("joinNow")}
              </a>
            ) : (
              <div className="flex items-center gap-4">
                {userRole === 'admin' && (
                  <Link to={createPageUrl("AdminReports")} className="nav-link text-red-400" style={{ whiteSpace: "nowrap" }}>
                    Moderation
                  </Link>
                )}
                <Link to={createPageUrl("Dashboard")} className="nav-link" style={{ whiteSpace: "nowrap" }}>
                  {t("dashboard") || "Dashboard"}
                </Link>
                <Link to={createPageUrl("Notifications")} className="relative w-10 h-10 rounded-full bg-[#121826] border border-white/10 flex items-center justify-center hover:bg-white/5 transition">
                  <Bell className="w-5 h-5 text-gray-300" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0B0F1A] rounded-full"></span>
                  )}
                </Link>
                <Link to={createPageUrl("Profile")} className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00CFFF] to-[#8A5CFF] p-[2px]" title="Profile">
                   <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center text-xs font-bold uppercase overflow-hidden text-white">
                     {userEmail.charAt(0)}
                   </div>
                </Link>
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
            <Link to={createPageUrl("Resources")} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
              📺 {t("mediaContent")}
            </Link>
            <Link to={createPageUrl("Resources") + "?tab=downloads"} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
              📥 {t("downloads")}
            </Link>
            
            {userEmail ? (
              <>
                {userRole === 'admin' && (
                  <Link to={createPageUrl("AdminReports")} className="nav-link text-red-400" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
                    🛡️ Moderation
                  </Link>
                )}
                <Link to={createPageUrl("Dashboard")} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
                  📊 {t("dashboard") || "Dashboard"}
                </Link>
                <Link to={createPageUrl("Profile")} className="nav-link" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 17 }} onClick={() => setMenuOpen(false)}>
                  👤 {t("profile") || "Profile"}
                </Link>
              </>
            ) : (
              <a href={createPageUrl("Feed")} className="glm-btn-primary" style={{ display: "block", textAlign: "center", marginTop: 20 }}>
                {t("joinNow")}
              </a>
            )}
          </div>
        )}
      </nav>
      )}

      {/* Page Content */}
      <main style={{ paddingTop: currentPageName === "Feed" ? 0 : 72 }}>
        {children}
      </main>

      {/* FOOTER */}
      {currentPageName !== "Feed" && (
      <footer style={{ background: "#080C14", borderTop: "1px solid rgba(0,207,255,0.1)", padding: "60px 24px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 48, marginBottom: 48 }}>
            <div>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_692b64307296ee339e64b660/c20e0f05a_GENERATIONLIGHTMODE-LOGO.png"
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
              <Link to={createPageUrl("Resources")} style={{ display: "block", color: "#C8D0E0", textDecoration: "none", marginBottom: 10, fontSize: 14, transition: "color 0.2s" }}
                onMouseOver={e => e.target.style.color = "#00CFFF"}
                onMouseOut={e => e.target.style.color = "#C8D0E0"}
              >{t("mediaContent")}</Link>
              <Link to={createPageUrl("Resources") + "?tab=downloads"} style={{ display: "block", color: "#C8D0E0", textDecoration: "none", marginBottom: 10, fontSize: 14, transition: "color 0.2s" }}
                onMouseOver={e => e.target.style.color = "#00CFFF"}
                onMouseOut={e => e.target.style.color = "#C8D0E0"}
              >{t("downloads")}</Link>
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
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}