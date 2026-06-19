import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, X, Bell, Zap, Download, BookOpen, Sparkles, Play, FileText, Image as ImageIcon, ChevronRight, ArrowRight, Hash, LogOut, User, LayoutDashboard, Flag, BarChart3, ShieldCheck, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { downloads } from "@/components/resources/resourcesData";
import MobileSiteFooter from "@/components/site/MobileSiteFooter";

const TABS = [
  { key: "media", label: "Media", icon: Play, color: "#00CFFF", desc: "Videos & podcasts" },
  { key: "downloads", label: "Downloads", icon: Download, color: "#FFD000", desc: "Graphics & guides" },
  { key: "keeping-it-100", label: "Keep It 100", icon: Sparkles, color: "#FF9F1A", desc: "Truth slogans" },
  { key: "codes-of-truth", label: "Codes", icon: BookOpen, color: "#8A5CFF", desc: "Fundamental truths" },
];

/**
 * Mobile-only Resources page — LightMode branded hub for Media, Downloads, Keep It 100, and Codes of Truth.
 */
export default function MobileResources({ activeTab, onTabChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser).catch(() => {});
    });
  }, []);

  return (
    <div className="min-h-[100dvh] font-['Inter']" style={{ background: "#0B0F1A", color: "#FFFFFF" }}>
      <style>{`
        @keyframes mr-float { 0%,100% { transform: translateY(0); opacity: 0.2 } 50% { transform: translateY(-18px); opacity: 0.4 } }
        @keyframes mr-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.6 } }
      `}</style>

      {/* TOP BAR */}
      <div className="sticky top-0 z-50 safe-pt px-4 pb-2 backdrop-blur-xl" style={{ background: "rgba(11,15,26,0.85)", borderBottom: "1px solid rgba(0,207,255,0.08)" }}>
        <div className="flex items-center justify-between pt-2">
          <Link to={createPageUrl("Home")} className="active:scale-95 transition">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" className="h-8 w-auto object-contain" style={{ filter: "drop-shadow(0 0 10px rgba(0,207,255,0.5))" }} />
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <Link to={createPageUrl("Notifications")} className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.06)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Bell className="w-[18px] h-[18px]" />
              </Link>
            )}
            <button onClick={() => setMenuOpen(true)} className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.06)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pt-8 pb-6">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "#FFD000", opacity: 0.14, animation: "mr-float 9s ease-in-out infinite" }} />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full blur-3xl pointer-events-none" style={{ background: "#00CFFF", opacity: 0.14, animation: "mr-float 11s ease-in-out infinite 1s" }} />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)", backdropFilter: "blur(10px)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFD000", animation: "mr-pulse 2s ease-in-out infinite" }} />
            <span className="text-[9.5px] font-black uppercase tracking-[0.18em]" style={{ color: "#FFD000" }}>Resource Hub</span>
          </div>
          <h1 className="font-['Space_Grotesk'] font-black text-[30px] leading-[1.05] tracking-tight mb-3">
            Everything You Need to{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Shine Brighter
            </span>
          </h1>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "#C8D0E0" }}>
            Media, downloads, truth slogans, and fundamental codes — all in one place.
          </p>
        </div>
      </section>

      {/* TAB SWITCHER */}
      <section className="px-5 pb-2">
        <div className="grid grid-cols-2 gap-2.5">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className="relative rounded-2xl p-3.5 text-left active:scale-[0.97] transition"
                style={{
                  background: active ? `${t.color}15` : "rgba(18,24,38,0.6)",
                  border: active ? `1.5px solid ${t.color}` : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: active ? `0 8px 24px ${t.color}30` : "none",
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: `${t.color}20`, border: `1px solid ${t.color}35`, boxShadow: active ? `0 0 12px ${t.color}40` : "none" }}>
                  <Icon className="w-[16px] h-[16px]" style={{ color: t.color }} />
                </div>
                <div className="font-['Space_Grotesk'] font-black text-[13px] text-white leading-tight mb-0.5">{t.label}</div>
                <div className="text-[10px]" style={{ color: "#8A9BB0" }}>{t.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* CONTENT */}
      <section className="px-5 pt-4 pb-8">
        {activeTab === "media" && <MediaTab />}
        {activeTab === "downloads" && <DownloadsTab />}
        {activeTab === "keeping-it-100" && <CodesTabLink tab="keeping-it-100" color="#FF9F1A" title="Keep It 100" description="Short truth slogans to share on social media daily. Stand out, don't blend in." emoji="💯" />}
        {activeTab === "codes-of-truth" && <CodesTabLink tab="codes-of-truth" color="#8A5CFF" title="Key Codes of Truth" description="Fundamental truths to guide your daily walk. Share the light." emoji="🔐" />}
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-5 py-12">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,208,0,0.1) 0%, transparent 60%)" }} />
        <div className="relative text-center">
          <div className="text-[42px] mb-3" style={{ filter: "drop-shadow(0 0 20px rgba(255,208,0,0.5))" }}>⚡</div>
          <h2 className="font-['Space_Grotesk'] font-black text-[24px] leading-tight mb-3">
            Ready to join the{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>movement?</span>
          </h2>
          <Link to={createPageUrl(user ? "Feed" : "Dashboard")} className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-[14px] font-['Space_Grotesk'] no-underline active:scale-[0.98] transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 10px 40px rgba(255,208,0,0.5)" }}>
            <Zap className="w-4 h-4" /> {user ? "Go to Feed" : "Switch It On"}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <MobileSiteFooter />

      {/* MENU DRAWER */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[5000] overflow-y-auto safe-pb"
          style={{
            background: "linear-gradient(135deg, rgba(10,15,28,0.99) 0%, rgba(18,24,38,0.98) 50%, rgba(7,11,22,0.99) 100%)",
            backdropFilter: "blur(40px) saturate(1.8)",
            paddingTop: "env(safe-area-inset-top)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,207,255,0.08) 0%, transparent 100%)" }} />

          <div className="relative z-10 px-5 pt-6 pb-8">
            <div className="flex items-center justify-between mb-8">
              <p style={{ color: "#00CFFF", fontSize: 12, fontWeight: 900, letterSpacing: "0.2em", margin: 0 }}>MENU</p>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition hover:bg-white/20 active:scale-90"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFFFFF" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2.5 mb-7">
              {[
                { label: "About", page: "About" },
                { label: "Impact", page: "Impact" },
                { label: "Assistant", page: "Assistant" },
              ].map(item => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)",
                    border: "1px solid rgba(0,207,255,0.15)",
                    color: "#E8EEF8",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
                  }}
                >
                  <span>{item.label}</span>
                  <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
                </Link>
              ))}

              <Link to={createPageUrl("KeepIt100")} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)", border: "1px solid rgba(0,207,255,0.15)", color: "#E8EEF8", boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <span className="flex items-center gap-2.5"><span style={{ fontSize: 20 }}>💯</span> Keep It 100</span>
                <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
              </Link>
              <Link to={createPageUrl("CodesOfTruth")} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)", border: "1px solid rgba(0,207,255,0.15)", color: "#E8EEF8", boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <span className="flex items-center gap-2.5"><span style={{ fontSize: 20 }}>🔐</span> Codes of Truth</span>
                <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
              </Link>
              <Link to={createPageUrl("Resources")} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)", border: "1px solid rgba(0,207,255,0.15)", color: "#E8EEF8", boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <span className="flex items-center gap-2.5"><span style={{ fontSize: 20 }}>🌍</span> Resources</span>
                <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
              </Link>
            </div>

            {user ? (
              <div className="space-y-4">
                <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, rgba(18,24,38,0.95) 0%, rgba(12,17,30,0.98) 100%)", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0,207,255,0.1)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #00CFFF, #5AC8FF)" }} />
                    <p style={{ color: "#8EA0B8", fontSize: 11, fontWeight: 900, letterSpacing: "0.16em", margin: 0 }}>MY ACCOUNT</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: <User size={16} />, label: "My Profile", to: createPageUrl("Profile") },
                      { icon: <Zap size={16} />, label: "Feed", to: createPageUrl("Feed") },
                      { icon: <Bell size={16} />, label: "Notifications", to: createPageUrl("Notifications") }
                    ].map(item => (
                      <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:bg-white/10" style={{ color: "#E8EEF8" }}>
                        <span className="flex items-center gap-3">
                          <span style={{ color: "#00CFFF" }}>{item.icon}</span> {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {(user?.role === "admin" || user?.role === "super_admin" || ["ecd_admin", "country_admin", "union_admin", "conference_field_admin", "church_admin", "moderator"].includes(user?.role)) && (
                  <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,208,0,0.06) 0%, rgba(255,160,0,0.04) 100%)", border: "1px solid rgba(255,208,0,0.2)", boxShadow: "0 8px 32px rgba(255,208,0,0.1), inset 0 1px 0 rgba(255,208,0,0.12)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #FFD000, #FFA300)" }} />
                      <p style={{ color: "#FFDB58", fontSize: 11, fontWeight: 900, letterSpacing: "0.16em", margin: 0 }}>ADMIN PANEL</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { icon: <LayoutDashboard size={16} />, label: "Control Center", tab: "dashboard" },
                        { icon: <Users size={16} />, label: "User Management", tab: "users" },
                        { icon: <Flag size={16} />, label: "Moderation", tab: "drops" },
                        { icon: <BarChart3 size={16} />, label: "Analytics", tab: "analytics" },
                        { icon: <ShieldCheck size={16} />, label: "Settings", tab: "settings" },
                      ].map(item => (
                        <Link key={item.label} to={`${createPageUrl("AdminCenter")}?tab=${item.tab}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/10" style={{ color: "#E8EEF8" }}>
                          <span style={{ color: "#FFD000" }}>{item.icon}</span> {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => { setMenuOpen(false); base44.auth.logout(); }} className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ff6b6b", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); window.location.href = createPageUrl("Feed"); }}
                className="w-full rounded-full py-4 font-black flex items-center justify-center gap-2.5 active:scale-[0.96] transition"
                style={{
                  background: "linear-gradient(135deg, #FFD000 0%, #FFA300 50%, #FF9F1A 100%)",
                  color: "#0B0F1A",
                  boxShadow: "0 12px 32px rgba(255,208,0,0.4), 0 0 24px rgba(255,208,0,0.2)",
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: "0.05em"
                }}
              >
                <Zap size={18} style={{ strokeWidth: 2.5 }} /> SWITCH IT ON
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MediaTab() {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(18,24,38,0.6)", border: "1px dashed rgba(0,207,255,0.2)" }}>
      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)" }}>
        <Play className="w-5 h-5" style={{ color: "#00CFFF" }} />
      </div>
      <h3 className="font-['Space_Grotesk'] font-black text-[16px] mb-1.5" style={{ color: "#FFFFFF" }}>Media Library</h3>
      <p className="text-[12.5px] leading-relaxed" style={{ color: "#8A9BB0" }}>Videos, podcasts, and devotionals coming soon. Stay tuned ⚡</p>
    </div>
  );
}

function DownloadsTab() {
  return (
    <div className="space-y-5">
      {downloads.map(section => (
        <div key={section.category}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[20px]">{section.icon}</span>
            <h3 className="font-['Space_Grotesk'] font-black text-[15px] uppercase tracking-[0.08em]" style={{ color: section.color }}>{section.category}</h3>
          </div>
          <div className="space-y-2.5">
            {section.items.map(item => {
              const available = !!item.url;
              const Card = available ? "a" : "div";
              return (
                <Card
                  key={item.title}
                  {...(available ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="block rounded-2xl p-4 no-underline active:scale-[0.98] transition"
                  style={{ background: "rgba(18,24,38,0.7)", border: `1px solid ${section.color}20`, opacity: available ? 1 : 0.65 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${section.color}15`, border: `1px solid ${section.color}35` }}>
                      {available ? <Download className="w-4 h-4" style={{ color: section.color }} /> : <FileText className="w-4 h-4" style={{ color: section.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-['Space_Grotesk'] font-black text-[13.5px] leading-snug mb-1" style={{ color: "#FFFFFF" }}>{item.title}</div>
                      <p className="text-[11.5px] leading-[1.55] mb-2" style={{ color: "#8A9BB0" }}>{item.desc}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${section.color}15`, color: section.color, border: `1px solid ${section.color}35` }}>{item.type}</span>
                        {item.size && <span className="text-[10px]" style={{ color: "#8A9BB0" }}>{item.size}</span>}
                      </div>
                    </div>
                    {available && <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: section.color }} />}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CodesTabLink({ tab, color, title, description, emoji }) {
  const dest = tab === "keeping-it-100" ? "KeepIt100" : "CodesOfTruth";
  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${color}12, rgba(18,24,38,0.7))`, border: `1px solid ${color}25` }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-[24px]" style={{ background: `${color}15`, border: `1px solid ${color}35`, boxShadow: `0 0 16px ${color}25` }}>{emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-['Space_Grotesk'] font-black text-[17px] leading-tight mb-1" style={{ color: "#FFFFFF" }}>{title}</h3>
            <p className="text-[12.5px] leading-[1.55]" style={{ color: "#B0BAC8" }}>{description}</p>
          </div>
        </div>
        <Link to={createPageUrl(dest)} className="w-full flex items-center justify-center gap-1.5 py-3 rounded-full font-black text-[12.5px] font-['Space_Grotesk'] no-underline active:scale-95 transition" style={{ background: color, color: "#0B0F1A", boxShadow: `0 4px 16px ${color}40` }}>
          Open {title} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(18,24,38,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <Hash className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#8A9BB0" }} />
        <p className="text-[11.5px] leading-[1.55]" style={{ color: "#8A9BB0" }}>
          Browse categories, save your favorites, and share directly to social media from the dedicated page.
        </p>
      </div>
    </div>
  );
}