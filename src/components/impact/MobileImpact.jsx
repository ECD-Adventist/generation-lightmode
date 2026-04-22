import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Users, Globe, MapPin, Target, Menu, X, Bell, Zap, ArrowRight, Heart, TrendingUp } from "lucide-react";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";
import { countryCoordinates } from "@/lib/countryCoordinates";
import { base44 } from "@/api/base44Client";
import MobileSiteFooter from "@/components/site/MobileSiteFooter";

/**
 * Mobile-only Impact page — LightMode branded (dark cyan/gold).
 * Hero + stats grid + interactive map + country list + top groups + recent drops + CTA.
 */
export default function MobileImpact() {
  const { data: snapshot } = usePublicCommunitySnapshot();
  const countryStats = snapshot?.countryStats || [];
  const topGroups = snapshot?.topGroups || [];
  const recentDrops = snapshot?.recentDrops || [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser).catch(() => {});
    });
  }, []);

  const stats = [
    { value: snapshot?.totalUsers || 0, label: "Members", color: "#00CFFF", icon: Users },
    { value: snapshot?.totalGroups || 0, label: "GlowGroups", color: "#8A5CFF", icon: Globe },
    { value: snapshot?.totalCountries || 0, label: "Countries", color: "#FFD000", icon: MapPin },
    { value: snapshot?.totalChallenges || 0, label: "Challenges", color: "#1DA1FF", icon: Target },
  ];

  return (
    <div className="min-h-[100dvh] font-['Inter']" style={{ background: "#0B0F1A", color: "#FFFFFF" }}>
      <style>{`
        @keyframes mi-pulse-dot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.6 } }
        @keyframes mi-float { 0%,100% { transform: translateY(0); opacity: 0.2 } 50% { transform: translateY(-18px); opacity: 0.4 } }
        .mi-map-wrap .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
        .mi-map-wrap .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
        .mi-map-wrap .leaflet-control-attribution { display: none !important; }
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
      <section className="relative overflow-hidden px-5 pt-10 pb-12">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "#00CFFF", opacity: 0.18, animation: "mi-float 9s ease-in-out infinite" }} />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full blur-3xl pointer-events-none" style={{ background: "#FFD000", opacity: 0.14, animation: "mi-float 12s ease-in-out infinite 2s" }} />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", backdropFilter: "blur(10px)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CFFF", animation: "mi-pulse-dot 2s ease-in-out infinite" }} />
            <span className="text-[9.5px] font-black uppercase tracking-[0.18em]" style={{ color: "#00CFFF" }}>Live Community Snapshot</span>
          </div>

          <h1 className="font-['Space_Grotesk'] font-black text-[30px] leading-[1.05] tracking-tight mb-3">
            Real Impact Across{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              The Movement
            </span>
          </h1>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "#C8D0E0" }}>
            Live numbers from the app right now — no placeholder counts.
          </p>
        </div>
      </section>

      {/* STATS GRID */}
      <section className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(18,24,38,0.75)", border: `1px solid ${s.color}25`, backdropFilter: "blur(10px)" }}>
                <Icon className="w-5 h-5 mb-3" style={{ color: s.color, filter: `drop-shadow(0 0 8px ${s.color})` }} />
                <div className="font-['Space_Grotesk'] font-black text-[28px] leading-none mb-1.5" style={{ color: s.color }}>{(s.value || 0).toLocaleString()}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.08em]" style={{ color: "#8A9BB0" }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MAP */}
      <section className="pt-10 pb-4">
        <div className="px-5 mb-4">
          <h2 className="font-['Space_Grotesk'] font-black text-[24px] leading-tight mb-1.5" style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Live Country Map
          </h2>
          <p className="text-[12.5px]" style={{ color: "#8A9BB0" }}>Circle size reflects member + group activity.</p>
        </div>
        <div className="mi-map-wrap relative" style={{ height: "55vh", minHeight: 380, width: "100%", background: "#080C14", borderTop: "1px solid rgba(0,207,255,0.15)", borderBottom: "1px solid rgba(0,207,255,0.15)" }}>
          <MapContainer center={[5, 25]} zoom={3} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%", background: "#0B0F1A" }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />
            {countryStats.map((country) => {
              const coords = countryCoordinates[country.country] || countryCoordinates.Global;
              const radius = Math.max(8, Math.min(32, country.users * 2 + country.groups * 3 + country.drops));
              return (
                <CircleMarker key={country.country} center={coords} radius={radius} pathOptions={{ color: "#00CFFF", fillColor: "#00CFFF", fillOpacity: 0.2, weight: 2 }}>
                  <Popup>
                    <div style={{ background: "rgba(18,24,38,0.96)", padding: 12, borderRadius: 10, border: "1px solid rgba(0,207,255,0.4)", color: "#FFF", minWidth: 160 }}>
                      <h4 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, color: "#00CFFF", marginBottom: 8, fontWeight: 700 }}>{country.country}</h4>
                      <div style={{ display: "grid", gap: 5, fontSize: 11 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8A9BB0" }}>Members</span><strong>{country.users}</strong></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8A9BB0" }}>Groups</span><strong>{country.groups}</strong></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8A9BB0" }}>Drops</span><strong>{country.drops}</strong></div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </section>

      {/* COUNTRIES LIST */}
      {countryStats.length > 0 && (
        <section className="px-5 pt-6 pb-4">
          <div className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#8A9BB0" }}>Top Countries</div>
          <div className="space-y-2.5">
            {countryStats.slice(0, 6).map((country, i) => {
              const color = i % 3 === 0 ? "#00CFFF" : i % 3 === 1 ? "#FFD000" : "#8A5CFF";
              return (
                <div key={country.country} className="rounded-2xl p-4" style={{ background: "rgba(18,24,38,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[12px] font-['Space_Grotesk']" style={{ background: `${color}15`, color, border: `1px solid ${color}35` }}>{i + 1}</div>
                    <div className="flex-1 font-['Space_Grotesk'] font-black text-[15px] text-white truncate">{country.country}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[["Members", country.users], ["Groups", country.groups], ["Drops", country.drops]].map(([lbl, v]) => (
                      <div key={lbl} className="rounded-lg py-2" style={{ background: "rgba(11,15,26,0.5)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="text-[9px] font-black uppercase tracking-wider mb-0.5" style={{ color: "#8A9BB0" }}>{lbl}</div>
                        <div className="font-['Space_Grotesk'] font-black text-[14px]" style={{ color }}>{v || 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TOP GROUPS */}
      <section className="px-5 pt-8 pb-4">
        <h2 className="font-['Space_Grotesk'] font-black text-[22px] leading-tight mb-4">
          <span style={{ background: "linear-gradient(90deg, #FFD000, #FF9F1A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Leading</span> GlowGroups
        </h2>
        {topGroups.length === 0 ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(18,24,38,0.6)", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <p className="text-[13px]" style={{ color: "#8A9BB0" }}>No live group data yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topGroups.map((g, idx) => (
              <div key={g.id} className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: "rgba(18,24,38,0.7)", border: "1px solid rgba(255,208,0,0.15)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-['Space_Grotesk'] font-black" style={{ background: "rgba(255,208,0,0.12)", color: "#FFD000", border: "1px solid rgba(255,208,0,0.3)" }}>#{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-['Space_Grotesk'] font-black text-[14px] text-white truncate">{g.name}</div>
                  <div className="text-[11px]" style={{ color: "#8A9BB0" }}>{g.country}</div>
                </div>
                <div className="text-[11px] font-black shrink-0 flex items-center gap-1" style={{ color: "#FFD000" }}>
                  <Users className="w-3 h-3" />
                  {g.membersCount}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RECENT DROPS */}
      <section className="px-5 pt-8 pb-4">
        <h2 className="font-['Space_Grotesk'] font-black text-[22px] leading-tight mb-4">
          <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Recent</span> Glow Drops
        </h2>
        {recentDrops.length === 0 ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(18,24,38,0.6)", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <p className="text-[13px]" style={{ color: "#8A9BB0" }}>No live drops yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDrops.map((d) => (
              <div key={d.id} className="rounded-2xl p-4" style={{ background: "rgba(18,24,38,0.7)", border: "1px solid rgba(0,207,255,0.15)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#00CFFF" }}>{d.country}</span>
                  <span className="text-[10px] font-black flex items-center gap-1" style={{ color: "#FFD000" }}>
                    <Heart className="w-3 h-3" fill="currentColor" /> {d.likes_count}
                  </span>
                </div>
                {d.verse && <h3 className="font-['Space_Grotesk'] font-black text-[14px] text-white mb-1.5 leading-snug">{d.verse}</h3>}
                {d.reflection && <p className="text-[12.5px] leading-[1.6]" style={{ color: "#B0BAC8" }}>{d.reflection.length > 140 ? d.reflection.slice(0, 140) + "…" : d.reflection}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-5 py-14 mt-6">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,207,255,0.1) 0%, transparent 60%)" }} />
        <div className="relative text-center">
          <div className="text-[42px] mb-3" style={{ filter: "drop-shadow(0 0 20px rgba(0,207,255,0.5))" }}>⚡</div>
          <h2 className="font-['Space_Grotesk'] font-black text-[26px] leading-tight tracking-tight mb-3">
            Be Part Of The{" "}
            <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Live Story</span>
          </h2>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: "#C8D0E0" }}>Every real post, group, and challenge adds to the movement.</p>

          <Link to={createPageUrl("Dashboard")} className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full font-black text-[15px] font-['Space_Grotesk'] no-underline active:scale-[0.98] transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 10px 40px rgba(255,208,0,0.5)" }}>
            <Zap className="w-4 h-4" /> Join the movement
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <MobileSiteFooter />

      {/* MENU DRAWER */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(11,15,26,0.7)" }} />
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-[82%] max-w-[340px] p-5 safe-pt safe-pb overflow-y-auto" style={{ background: "linear-gradient(180deg, #0D1220 0%, #0B0F1A 100%)", borderLeft: "1px solid rgba(0,207,255,0.15)" }}>
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
              <Link to={createPageUrl(user ? "Feed" : "Dashboard")} onClick={() => setMenuOpen(false)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-[13.5px] font-['Space_Grotesk'] no-underline active:scale-95 transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 6px 24px rgba(255,208,0,0.35)" }}>
                <Zap className="w-4 h-4" /> {user ? "Go to Feed" : "Join Now"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}