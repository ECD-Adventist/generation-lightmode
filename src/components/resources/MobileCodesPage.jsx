import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, Search, Menu, X, Bell, Zap, SlidersHorizontal, Sparkles } from "lucide-react";
import CodeCard from "@/components/resources/CodeCard";
import MobileSiteFooter from "@/components/site/MobileSiteFooter";

/**
 * Shared mobile-only page for Keep It 100 and Codes of Truth.
 * Hero + sticky search + filter chip tray + responsive card grid.
 *
 * Props:
 *   - theme: "gold" (Keep It 100) or "cyan" (Codes of Truth)
 *   - eyebrow, emoji, title, titleHighlight, tagline
 *   - codes, categories, isLoading, user
 *   - activeCategory, setActiveCategory, search, setSearch
 */
export default function MobileCodesPage({
  theme = "cyan",
  eyebrow,
  emoji,
  title,
  titleHighlight,
  tagline,
  codes,
  filteredCodes,
  categories,
  isLoading,
  user,
  activeCategory,
  setActiveCategory,
  search,
  setSearch,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const T = theme === "gold"
    ? { accent: "#FFD000", accent2: "#FFA500", eyebrowBg: "rgba(255,208,0,0.1)", eyebrowBorder: "rgba(255,208,0,0.35)", gradient: "linear-gradient(90deg, #FFD000, #FFA500)", glow: "rgba(255,208,0,0.45)", statB: "#00CFFF" }
    : { accent: "#00CFFF", accent2: "#8A5CFF", eyebrowBg: "rgba(0,207,255,0.1)", eyebrowBorder: "rgba(0,207,255,0.35)", gradient: "linear-gradient(90deg, #00CFFF, #8A5CFF)", glow: "rgba(0,207,255,0.45)", statB: "#8A5CFF" };

  const activeFiltersCount = (activeCategory !== "All" ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="min-h-[100dvh] font-['Inter']" style={{ background: "#0B0F1A", color: "#FFFFFF" }}>
      <style>{`
        @keyframes mc-pulse-dot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.6 } }
        @keyframes mc-float { 0%,100% { transform: translateY(0); opacity: 0.2 } 50% { transform: translateY(-20px); opacity: 0.4 } }
        .mc-hide-sb::-webkit-scrollbar { display: none; }
        .mc-hide-sb { scrollbar-width: none; }
      `}</style>

      {/* TOP BAR */}
      <div className="sticky top-0 z-50 safe-pt px-4 pb-2 backdrop-blur-xl" style={{ background: "rgba(11,15,26,0.88)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
      <section className="relative overflow-hidden px-5 pt-8 pb-7">
        <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full blur-3xl pointer-events-none" style={{ background: T.accent, opacity: 0.16, animation: "mc-float 9s ease-in-out infinite" }} />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full blur-3xl pointer-events-none" style={{ background: T.accent2, opacity: 0.12, animation: "mc-float 12s ease-in-out infinite 1.5s" }} />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: T.eyebrowBg, border: `1px solid ${T.eyebrowBorder}`, backdropFilter: "blur(10px)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent, animation: "mc-pulse-dot 2s ease-in-out infinite" }} />
            <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: T.accent }}>{emoji} {eyebrow}</span>
          </div>

          <h1 className="font-['Space_Grotesk'] font-black text-[30px] leading-[1.05] tracking-tight mb-3">
            {title}{" "}
            <span style={{ background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {titleHighlight}
            </span>
          </h1>
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "#C8D0E0" }}>{tagline}</p>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl p-3.5" style={{ background: "rgba(18,24,38,0.7)", border: `1px solid ${T.accent}25` }}>
              <div className="font-['Space_Grotesk'] font-black text-[22px] leading-none mb-1 h-[22px] flex items-center" style={{ color: T.accent }}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : codes.length}
              </div>
              <div className="text-[9.5px] font-black uppercase tracking-[0.1em]" style={{ color: "#8A9BB0" }}>{theme === "gold" ? "Truth Slogans" : "Truth Codes"}</div>
            </div>
            <div className="rounded-2xl p-3.5" style={{ background: "rgba(18,24,38,0.7)", border: `1px solid ${T.statB}25` }}>
              <div className="font-['Space_Grotesk'] font-black text-[22px] leading-none mb-1" style={{ color: T.statB }}>{categories.length}</div>
              <div className="text-[9.5px] font-black uppercase tracking-[0.1em]" style={{ color: "#8A9BB0" }}>{theme === "gold" ? "Life Topics" : "Categories"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH + FILTER TOGGLE (sticky) */}
      <div className="sticky z-40 px-4 py-3 backdrop-blur-xl" style={{ top: "calc(env(safe-area-inset-top) + 56px)", background: "rgba(11,15,26,0.9)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.accent }} />
            <input
              type="text"
              placeholder={theme === "gold" ? "Search slogans..." : "Search codes..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full py-2.5 pl-10 pr-9 text-[13.5px] outline-none"
              style={{ background: "#121826", border: `1px solid ${T.accent}30`, color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "#8A9BB0" }}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen(true)}
            className="relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ background: activeFiltersCount ? T.accent : "#121826", border: `1px solid ${activeFiltersCount ? T.accent : "rgba(255,255,255,0.1)"}`, color: activeFiltersCount ? "#0B0F1A" : T.accent }}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black" style={{ background: "#FF3366", color: "#FFFFFF", border: "2px solid #0B0F1A" }}>{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* Active category pill under search (if any) */}
        {activeCategory !== "All" && (
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#8A9BB0" }}>Filter</span>
            <button
              onClick={() => setActiveCategory("All")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold active:scale-95"
              style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}40` }}
            >
              {activeCategory} <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="px-4 pt-4 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl" style={{ background: "rgba(255,255,255,0.05)", height: 220, border: "1px solid rgba(255,255,255,0.05)" }}></div>
            ))}
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-16 px-5 rounded-3xl" style={{ background: "rgba(18,24,38,0.6)", border: `1px dashed ${T.accent}25` }}>
            <div className="text-5xl mb-3" style={{ filter: `drop-shadow(0 0 12px ${T.glow})` }}>{emoji}</div>
            <h3 className="font-['Space_Grotesk'] font-black text-[16px] mb-1.5 text-white">No matches</h3>
            <p className="text-[12.5px]" style={{ color: "#8A9BB0" }}>
              Try a different category or clear your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCodes.map(code => (
              <CodeCard key={code.id} code={code} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <MobileSiteFooter />

      {/* FILTER BOTTOM SHEET */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[110] flex items-end" onClick={() => setFiltersOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(11,15,26,0.7)" }} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full rounded-t-[28px] max-h-[78dvh] flex flex-col overflow-hidden safe-pb"
            style={{ background: "linear-gradient(180deg, #121826 0%, #0B0F1A 100%)", borderTop: `1.5px solid ${T.accent}40`, boxShadow: `0 -24px 60px ${T.glow}` }}
          >
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-11 h-1.5 rounded-full" style={{ background: `${T.accent}35` }} />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: T.accent }} />
                <h3 className="font-['Space_Grotesk'] font-black text-[17px] text-white">Filter by topic</h3>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "#FFFFFF" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <div className="grid grid-cols-2 gap-2.5">
                {["All", ...categories].map(cat => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setFiltersOpen(false); }}
                      className="px-3.5 py-3 rounded-2xl text-[12.5px] font-bold text-left leading-tight active:scale-[0.97] transition"
                      style={{
                        background: active ? `${T.accent}18` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? T.accent : "rgba(255,255,255,0.08)"}`,
                        color: active ? T.accent : "#E0E8F0",
                        boxShadow: active ? `0 4px 16px ${T.accent}30` : "none",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 pt-3 pb-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => { setActiveCategory("All"); setSearch(""); setFiltersOpen(false); }}
                className="w-full py-3 rounded-full font-bold text-[13px] active:scale-95 transition"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#C8D0E0" }}
              >
                Clear all filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU DRAWER */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(11,15,26,0.7)" }} />
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-[82%] max-w-[340px] p-5 safe-pt safe-pb overflow-y-auto" style={{ background: "linear-gradient(180deg, #0D1220 0%, #0B0F1A 100%)", borderLeft: `1px solid ${T.accent}25` }}>
            <div className="flex items-center justify-between mb-6">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" className="h-8 w-auto object-contain" />
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {[["Home", "Home"], ["About", "About"], ["Impact", "Impact"], ["Assistant", "Assistant"], ["Keep It 100", "KeepIt100"], ["Codes of Truth", "CodesOfTruth"], ["Resources", "Resources"]].map(([l, to]) => (
                <Link key={to} to={createPageUrl(to)} onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-[14px] font-semibold no-underline active:scale-95 transition" style={{ color: "#E0E8F0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>{l}</Link>
              ))}
            </nav>
            <div className="mt-6">
              <Link to={createPageUrl(user ? "Feed" : "Dashboard")} onClick={() => setMenuOpen(false)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-[13.5px] font-['Space_Grotesk'] no-underline active:scale-95 transition" style={{ background: T.gradient, color: "#0B0F1A", boxShadow: `0 6px 24px ${T.glow}` }}>
                <Zap className="w-4 h-4" /> {user ? "Go to Feed" : "Join Now"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}