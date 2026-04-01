import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, MapPin, Building2, Church, Flag, Globe } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

export default function InteractiveTerritoryMap({ institutionApps, ownerEmail }) {
  const { data: claims = [] } = useQuery({
    queryKey: ["territoryClaims", ownerEmail],
    queryFn: () => base44.entities.TerritoryMemberClaim.filter({ institution_owner_email: ownerEmail }),
    enabled: !!ownerEmail,
  });

  const activeApp = institutionApps[0];

  const extractedTerritories = useMemo(() => {
    try {
      return activeApp?.extracted_territories ? JSON.parse(activeApp.extracted_territories) : [];
    } catch {
      return [];
    }
  }, [activeApp]);

  const approvedClaims = claims.filter(c => c.status === "approved");

  // Highlight countries based on claims
  const activeCountries = useMemo(() => {
    const countries = new Set();
    approvedClaims.forEach(c => {
      if (c.member_country) countries.add(c.member_country.toLowerCase());
    });
    extractedTerritories.forEach(t => {
      if (t.country) countries.add(t.country.toLowerCase());
    });
    return countries;
  }, [approvedClaims, extractedTerritories]);

  // If we only have Africa focus, maybe zoom there. We'll start with full map and let user zoom.
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-[#0c1020] rounded-3xl p-6 border border-white/5">
      {/* Left: Map */}
      <div className="flex-1 bg-[#0A0A0A] rounded-2xl overflow-hidden border border-white/5 relative min-h-[400px] flex items-center justify-center"
           style={{
             backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
             backgroundSize: "40px 40px"
           }}>
        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 200 }}>
          <ZoomableGroup center={[20, 0]} zoom={2}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isHighlighted = activeCountries.has(geo.properties.name.toLowerCase());
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isHighlighted ? "#7F1D1D" : "#111827"}
                      stroke={isHighlighted ? "#FFFFFF" : "#1F2937"}
                      strokeWidth={isHighlighted ? 0.8 : 0.3}
                      style={{
                        default: { outline: "none", transition: "all 250ms" },
                        hover: { fill: isHighlighted ? "#991B1B" : "#1F2937", outline: "none", cursor: isHighlighted ? "pointer" : "default" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
        {/* Overlay Info */}
        <div className="absolute bottom-6 left-6 right-6 text-center pointer-events-none">
          <p className="text-white/80 text-sm font-semibold max-w-2xl mx-auto leading-relaxed">
            Unified platform for managing All {activeApp?.institution_name}'s institution data and statistics, strategic operations, Evangelism and many more.
          </p>
        </div>
      </div>

      {/* Right: Stats Panel */}
      <div className="w-full lg:w-72 shrink-0 space-y-4">
        <div className="text-center mb-8">
          <h3 className="text-red-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Evangelism</h3>
          <h2 className="text-2xl font-bold text-white">Statistics</h2>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
          <div>
            <div className="text-4xl font-black text-white">{approvedClaims.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">Total Members</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Countries</span>
            </div>
            <span className="text-lg font-bold text-white">{activeCountries.size}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Territories</span>
            </div>
            <span className="text-lg font-bold text-white">{extractedTerritories.length}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flag className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Fields</span>
            </div>
            <span className="text-lg font-bold text-white">0</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Institutions</span>
            </div>
            <span className="text-lg font-bold text-white">1</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Church className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Churches</span>
            </div>
            <span className="text-lg font-bold text-white">0</span>
          </div>
        </div>
      </div>
    </div>
  );
}