import React, { useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Globe, Building2 } from "lucide-react";

function groupTerritories(territories) {
  // Group by region, then by country within each region
  const tree = {};
  territories.forEach(t => {
    const region = t.region || "Other";
    const country = t.country || "Unknown";
    if (!tree[region]) tree[region] = {};
    if (!tree[region][country]) tree[region][country] = [];
    tree[region][country].push(t.name);
  });
  return tree;
}

function TerritoryNode({ name }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-3">
      <div className="w-1.5 h-1.5 rounded-full bg-[#00CFFF] shrink-0" />
      <span className="text-xs text-gray-300 font-medium">{name}</span>
    </div>
  );
}

function CountryNode({ country, territories }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="ml-4 mt-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs font-bold text-gray-200 hover:text-white transition py-1 w-full text-left"
      >
        {open ? <ChevronDown className="w-3 h-3 text-[#FFD000]" /> : <ChevronRight className="w-3 h-3 text-[#FFD000]" />}
        <MapPin className="w-3 h-3 text-[#FFD000]" />
        {country}
        <span className="ml-1 text-[10px] font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-full">{territories.length}</span>
      </button>
      {open && (
        <div className="ml-3 border-l border-white/10 pl-2">
          {territories.map((name, i) => (
            <TerritoryNode key={i} name={name} />
          ))}
        </div>
      )}
    </div>
  );
}

function RegionNode({ region, countries }) {
  const [open, setOpen] = useState(true);
  const totalTerritories = Object.values(countries).reduce((sum, arr) => sum + arr.length, 0);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-xl hover:bg-white/5 transition group"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-[#00CFFF]" />
          : <ChevronRight className="w-4 h-4 text-[#00CFFF]" />
        }
        <Globe className="w-4 h-4 text-[#00CFFF]" />
        <span className="text-sm font-black text-white tracking-wide">{region}</span>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,207,255,0.12)", color: "#00CFFF" }}>
          {totalTerritories} territories
        </span>
      </button>
      {open && (
        <div className="ml-2">
          {Object.entries(countries).map(([country, territories]) => (
            <CountryNode key={country} country={country} territories={territories} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TerritoryOrgChart({ territories }) {
  if (!territories || territories.length === 0) return null;

  const tree = groupTerritories(territories);
  const totalRegions = Object.keys(tree).length;
  const totalCountries = Object.values(tree).reduce((sum, c) => sum + Object.keys(c).length, 0);

  return (
    <div className="bg-[#0c1020] rounded-2xl border border-[#00CFFF]/15 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <Building2 className="w-4 h-4 text-[#FFD000]" />
        <span className="text-[11px] font-black text-[#FFD000] uppercase tracking-[0.18em]">Territory Structure</span>
        <div className="ml-auto flex gap-3">
          <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{totalRegions} regions</span>
          <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{totalCountries} countries</span>
          <span className="text-[10px] font-bold text-[#00CFFF] bg-[#00CFFF]/10 px-2 py-0.5 rounded-full">{territories.length} total</span>
        </div>
      </div>

      {/* Tree */}
      <div className="px-4 py-4 max-h-[400px] overflow-y-auto">
        {Object.entries(tree).map(([region, countries]) => (
          <RegionNode key={region} region={region} countries={countries} />
        ))}
      </div>
    </div>
  );
}