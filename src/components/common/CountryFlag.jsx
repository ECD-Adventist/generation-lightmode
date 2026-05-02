import React from "react";
import { Globe } from "lucide-react";

/**
 * Maps a country display name (as stored on User.country) to an ISO 3166-1 alpha-2 code.
 * Covers all countries used in the app + common spelling/locale variants.
 * Lowercase keys for case-insensitive lookup.
 */
const COUNTRY_TO_ISO = {
  // East-Central Africa Division (primary user base)
  "kenya": "ke",
  "tanzania": "tz",
  "uganda": "ug",
  "rwanda": "rw",
  "burundi": "bi",
  "ethiopia": "et",
  "somalia": "so",
  "djibouti": "dj",
  "eritrea": "er",
  "sudan": "sd",
  "south sudan": "ss",
  "democratic republic of the congo": "cd",
  "dr congo": "cd",
  "drc": "cd",
  "république démocratique du congo": "cd",
  "republique democratique du congo": "cd",
  "congo": "cd",

  // Wider Africa
  "nigeria": "ng",
  "ghana": "gh",
  "south africa": "za",
  "southafrica": "za",
  "egypt": "eg",
  "morocco": "ma",
  "algeria": "dz",
  "tunisia": "tn",
  "zimbabwe": "zw",
  "zambia": "zm",
  "malawi": "mw",
  "mozambique": "mz",
  "angola": "ao",
  "cameroon": "cm",
  "ivory coast": "ci",
  "côte d'ivoire": "ci",
  "senegal": "sn",
  "madagascar": "mg",
  "namibia": "na",
  "botswana": "bw",

  // Other common
  "usa": "us",
  "united states": "us",
  "united states of america": "us",
  "canada": "ca",
  "uk": "gb",
  "united kingdom": "gb",
  "england": "gb",
  "brazil": "br",
  "india": "in",
  "philippines": "ph",
  "australia": "au",
  "germany": "de",
  "france": "fr",
  "spain": "es",
  "italy": "it",
  "portugal": "pt",
  "mexico": "mx",
  "argentina": "ar",
  "japan": "jp",
  "china": "cn",
  "south korea": "kr",
  "indonesia": "id",
  "pakistan": "pk",
  "bangladesh": "bd",
  "jamaica": "jm",
  "trinidad and tobago": "tt",
};

function resolveIsoCode(countryName) {
  if (!countryName) return null;
  const normalized = String(countryName).trim().toLowerCase();
  return COUNTRY_TO_ISO[normalized] || null;
}

/**
 * Renders a small rounded country flag for a user's country.
 * Falls back to a globe icon when country is missing or unrecognized.
 *
 * Sizes: "xs" (14px), "sm" (18px), "md" (22px), "lg" (28px).
 */
export default function CountryFlag({ country, size = "sm", showLabel = false, className = "" }) {
  const iso = resolveIsoCode(country);

  const px = { xs: 14, sm: 18, md: 22, lg: 28 }[size] || 18;
  const labelClass = { xs: "text-[10px]", sm: "text-[11px]", md: "text-xs", lg: "text-sm" }[size] || "text-[11px]";

  return (
    <span className={`inline-flex items-center gap-1 align-middle ${className}`} title={country || "Global"}>
      {iso ? (
        <img
          src={`https://flagcdn.com/w40/${iso}.png`}
          srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
          alt={country}
          loading="lazy"
          decoding="async"
          width={px}
          height={Math.round(px * 0.75)}
          className="rounded-[3px] object-cover shrink-0 ring-1 ring-black/5"
          style={{ width: px, height: Math.round(px * 0.75) }}
        />
      ) : (
        <Globe className="shrink-0 text-current opacity-70" style={{ width: px - 2, height: px - 2 }} />
      )}
      {showLabel && (
        <span className={`${labelClass} font-semibold truncate`}>{country || "Global"}</span>
      )}
    </span>
  );
}