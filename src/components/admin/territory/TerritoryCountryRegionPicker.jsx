import React from "react";
import { X, Globe } from "lucide-react";
import { ECD_COUNTRIES, ECD_REGIONS } from "./ecdRegions";

// Dropdown-based territory picker: select ECD countries, then optionally
// narrow each country down to specific regions. No regions = entire country.
export default function TerritoryCountryRegionPicker({ value, onChange, tokens: t }) {
  const selection = value || {};
  const availableCountries = ECD_COUNTRIES.filter((c) => !(c in selection));

  const addCountry = (country) => {
    if (!country) return;
    onChange({ ...selection, [country]: [] });
  };

  const removeCountry = (country) => {
    const next = { ...selection };
    delete next[country];
    onChange(next);
  };

  const addRegion = (country, region) => {
    if (!region || (selection[country] || []).includes(region)) return;
    onChange({ ...selection, [country]: [...(selection[country] || []), region] });
  };

  const removeRegion = (country, region) => {
    onChange({ ...selection, [country]: (selection[country] || []).filter((r) => r !== region) });
  };

  return (
    <div className="space-y-3">
      <select
        value=""
        onChange={(e) => addCountry(e.target.value)}
        className="w-full h-10 rounded-xl border px-3 text-sm focus:outline-none transition"
        style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
      >
        <option value="">+ Add a country (ECD — 12 countries)</option>
        {availableCountries.map((country) => (
          <option key={country} value={country}>{country}</option>
        ))}
      </select>

      {Object.keys(selection).length === 0 && (
        <p className="text-xs" style={{ color: t.textMuted }}>
          No countries selected yet. Pick one or more countries from the dropdown above.
        </p>
      )}

      {Object.entries(selection).map(([country, regions]) => (
        <div key={country} className="border rounded-xl p-3 space-y-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: t.textPrimary }}>
              <Globe className="w-3.5 h-3.5" style={{ color: t.accent }} /> {country}
            </div>
            <button type="button" onClick={() => removeCountry(country)} className="p-1 rounded-lg transition hover:opacity-70" title={`Remove ${country}`} style={{ color: t.textMuted }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <select
            value=""
            onChange={(e) => addRegion(country, e.target.value)}
            className="w-full h-9 rounded-lg border px-2.5 text-xs focus:outline-none transition"
            style={{ background: t.surface, borderColor: t.border, color: t.textPrimary }}
          >
            <option value="">+ Add region (optional — leave empty for entire country)</option>
            {(ECD_REGIONS[country] || []).filter((r) => !regions.includes(r)).map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          {regions.length === 0 ? (
            <p className="text-[11px]" style={{ color: t.textMuted }}>No regions specified — the <strong>entire country</strong> is covered.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {regions.map((region) => (
                <span key={region} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-semibold" style={{ background: t.accentSoft, borderColor: t.borderStrong, color: t.accent }}>
                  {region}
                  <button type="button" onClick={() => removeRegion(country, region)} className="transition hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}