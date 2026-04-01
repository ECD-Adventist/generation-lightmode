import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Loader2, Building2, MapPin, Users, BarChart3, ShieldCheck, LayoutDashboard, FileText, Globe, ChevronDown } from "lucide-react";
import { createPageUrl } from "@/utils";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import TerritoryAnalytics from "@/components/institution/TerritoryAnalytics";
import TerritoryVerificationQueue from "@/components/institution/TerritoryVerificationQueue";
import TerritoryMapManager from "@/components/institution/TerritoryMapManager";
import InstitutionUsersTab from "@/components/institution/InstitutionUsersTab";
import InstitutionDropsTab from "@/components/institution/InstitutionDropsTab";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_NAME_TO_ISO = {
  "Ethiopia": "231", "Kenya": "404", "Tanzania": "834", "Uganda": "800",
  "Rwanda": "646", "Burundi": "108", "Democratic Republic of Congo": "180",
  "DRC": "180", "Congo": "180", "Sudan": "729", "South Sudan": "728",
  "Somalia": "706", "Eritrea": "232", "Djibouti": "262", "Zambia": "894",
  "Zimbabwe": "716", "Malawi": "454", "Mozambique": "508", "Angola": "024",
  "Madagascar": "450", "Nigeria": "566", "Ghana": "288", "Cameroon": "120",
  "Egypt": "818", "Libya": "434", "Algeria": "012", "Morocco": "504",
  "Tunisia": "788", "South Africa": "710", "Botswana": "072", "Namibia": "516",
  "Chad": "148", "Niger": "562", "Mali": "466", "Senegal": "686",
  "Ivory Coast": "384", "Côte d'Ivoire": "384", "Gabon": "266",
  "Central African Republic": "140", "CAR": "140",
};

const navItems = [
  { key: "dashboard", label: "Overview" },
  { key: "verification", label: "Evangelism" },
  { key: "analytics", label: "Analytics" },
];

const sideItems = [
  { key: "map", label: "Map & Territories", icon: MapPin },
  { key: "users", label: "Members", icon: Users },
  { key: "drops", label: "Glow Drops", icon: FileText },
  { key: "analytics_full", label: "Territory Analytics", icon: BarChart3 },
];

function CommandMapBackground({ territories }) {
  const highlightedIsoCodes = useMemo(() => {
    const codes = new Set();
    territories.forEach(t => {
      const code = COUNTRY_NAME_TO_ISO[t.country || ""];
      if (code) codes.add(code);
    });
    return codes;
  }, [territories]);

  const centerMarker = useMemo(() => {
    if (highlightedIsoCodes.has("834")) return [34.8, -6.4];
    if (highlightedIsoCodes.has("404")) return [37.9, 0.02];
    if (highlightedIsoCodes.has("180")) return [23.5, -2.5];
    return null;
  }, [highlightedIsoCodes]);

  return (
    <div className="absolute inset-0 z-0">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 180, center: [20, 10] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const isoId = String(geo.id);
              const isHighlighted = highlightedIsoCodes.has(isoId);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: isHighlighted ? "#6B1111" : "#161B28",
                      stroke: isHighlighted ? "#8B2020" : "#1e2536",
                      strokeWidth: isHighlighted ? 0.8 : 0.3,
                      outline: "none",
                    },
                    hover: {
                      fill: isHighlighted ? "#8B1A1A" : "#1a2030",
                      stroke: isHighlighted ? "#c0392b" : "#1e2536",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
        {centerMarker && (
          <Marker coordinates={centerMarker}>
            <circle r={6} fill="#c0392b" stroke="#fff" strokeWidth={1.5} />
            <circle r={14} fill="rgba(192,57,43,0.15)" />
          </Marker>
        )}
      </ComposableMap>
      {/* Dark overlay so text is readable */}
      <div className="absolute inset-0 bg-[#0B0F1A]/30" />
    </div>
  );
}

export default function InstitutionControlCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "dashboard";

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: institutionApps = [], isLoading } = useQuery({
    queryKey: ["myApprovedInstitutions", user?.email],
    queryFn: () => base44.entities.InstitutionApplication.filter({ user_email: user.email, status: "approved" }),
    enabled: !!user,
  });

  const { data: institutionPages = [] } = useQuery({
    queryKey: ["allInstitutionPages"],
    queryFn: () => base44.entities.InstitutionPage.list("-created_date", 100),
    enabled: !!user,
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["territoryClaims", user?.email],
    queryFn: () => base44.entities.TerritoryMemberClaim.filter({ institution_owner_email: user.email }),
    enabled: !!user,
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["allGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
    enabled: !!user,
  });

  const primaryPage = institutionPages.find(p => p.owner_email === user?.email);
  const activeApp = institutionApps[0];

  const extractedTerritories = useMemo(() => {
    try { return activeApp?.extracted_territories ? JSON.parse(activeApp.extracted_territories) : []; }
    catch { return []; }
  }, [activeApp]);

  const approvedClaims = claims.filter(c => c.status === "approved");
  const pendingClaims = claims.filter(c => c.status === "pending");
  const approvedEmails = new Set(approvedClaims.map(c => c.member_email));
  const memberDrops = drops.filter(d => approvedEmails.has(d.user_email));
  const activeCountriesSet = new Set(approvedClaims.map(c => c.member_country).filter(Boolean));
  const territories = extractedTerritories;
  const regions = [...new Set(territories.map(t => t.region).filter(Boolean))];

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
      </div>
    );
  }

  if (institutionApps.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Institution Access</h2>
          <p className="text-gray-500 mb-6">You need an approved institution to access the Control Center.</p>
          <Link to="/ClaimInstitutionDashboard" className="text-[#00CFFF] font-bold hover:underline">Apply for an Institution →</Link>
        </div>
      </div>
    );
  }

  const isDashboard = activeTab === "dashboard";

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>

      {/* TOP NAV */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 h-[68px] border-b border-white/5"
        style={{ background: "rgba(11,15,26,0.85)", backdropFilter: "blur(16px)" }}>

        {/* Left: Logo + title */}
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#8B1A1A] border border-[#c0392b]/40 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c0392b]">Command Center</div>
            <div className="text-[12px] font-bold text-gray-300 leading-tight">{activeApp?.institution_name || "Institution"}</div>
          </div>
        </div>

        {/* Center: nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === item.key
                  ? "text-white bg-white/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* More dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(v => !v)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              More <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {moreMenuOpen && (
              <div className="absolute top-full left-0 mt-2 bg-[#0c1020] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px] z-50">
                {sideItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setActiveTab(item.key); setMoreMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition text-left"
                    >
                      <Icon className="w-4 h-4 text-gray-500" /> {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Globe + Dashboard button */}
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
            <Globe className="w-4 h-4 text-gray-400" />
          </button>
          {primaryPage && (
            <Link
              to={`/InstitutionDashboard?id=${primaryPage.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white border border-[#c0392b]/60 bg-[#8B1A1A]/60 hover:bg-[#8B1A1A] transition"
            >
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      {/* DASHBOARD TAB — full screen map layout */}
      {isDashboard && (
        <div className="relative flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 68px)" }}>

          {/* Full-screen map background */}
          <CommandMapBackground territories={territories} />

          {/* Stats overlay — right side */}
          <div className="absolute right-0 top-0 bottom-0 z-10 flex flex-col justify-center px-10 md:px-16"
            style={{ minWidth: 260 }}>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FFD000] mb-3">
              Evangelism
            </div>
            <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Statistics
            </div>

            {/* Big member count */}
            <div className="flex items-center gap-3 mt-4 mb-8">
              <span className="text-5xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {approvedClaims.length >= 1000000
                  ? `${(approvedClaims.length / 1000000).toFixed(1)}M`
                  : approvedClaims.length >= 1000
                  ? `${(approvedClaims.length / 1000).toFixed(1)}K`
                  : approvedClaims.length}
              </span>
              <div className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center border border-[#c0392b]/40">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 -mt-7 mb-8">Total Members</div>

            {/* Vertical stat list */}
            <div className="space-y-0 divide-y divide-white/5">
              {[
                { label: "Countries", value: activeCountriesSet.size || territories.length > 0 ? [...new Set(territories.map(t => t.country).filter(Boolean))].length : 0, color: "#00CFFF" },
                { label: "Regions", value: regions.length, color: "#00CFFF" },
                { label: "Territories", value: territories.length, color: "#00CFFF" },
                { label: "Pending", value: pendingClaims.length, color: "#FFD000" },
                { label: "Glow Drops", value: memberDrops.length, color: "#8A5CFF" },
                { label: "Members", value: approvedClaims.length, color: "#00CFFF" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-3 group cursor-default">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black" style={{ color, fontFamily: "Space Grotesk, sans-serif" }}>{value}</span>
                    <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 6px ${color}60` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom subtitle */}
          <div className="absolute bottom-8 left-0 right-0 z-10 text-center px-6">
            <p className="text-sm text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Unified platform for managing <strong className="text-white">{activeApp?.institution_name || "your institution"}'s</strong> territory data and statistics, strategic operations, Evangelism and many more.
            </p>
          </div>

          {/* Bottom footer bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/5 px-10 py-3 flex items-center justify-center gap-6"
            style={{ background: "rgba(11,15,26,0.7)", backdropFilter: "blur(10px)" }}>
            <span className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer transition">Help & Support</span>
            <span className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer transition">Privacy</span>
            <span className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer transition">Terms</span>
            <span className="text-[11px] text-gray-600 ml-4">© 2026 {activeApp?.institution_name}. All rights reserved.</span>
          </div>
        </div>
      )}

      {/* OTHER TABS — standard scrollable layout */}
      {!isDashboard && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Mobile nav for extra tabs */}
            <div className="flex flex-wrap gap-2 mb-6 md:hidden">
              {[...navItems, ...sideItems.map(s => ({ key: s.key, label: s.label }))].map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === item.key ? "bg-[#00CFFF]/10 text-[#00CFFF]" : "bg-white/5 text-gray-400"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {activeTab === "verification" && (
              <TerritoryVerificationQueue institutionApps={institutionApps} ownerEmail={user.email} />
            )}
            {activeTab === "analytics" || activeTab === "analytics_full" ? (
              <TerritoryAnalytics page={primaryPage || {}} institutionApps={institutionApps} />
            ) : null}
            {activeTab === "map" && (
              <TerritoryMapManager institutionApps={institutionApps} primaryApp={institutionApps[0]} />
            )}
            {activeTab === "users" && (
              <InstitutionUsersTab ownerEmail={user.email} />
            )}
            {activeTab === "drops" && (
              <InstitutionDropsTab ownerEmail={user.email} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}