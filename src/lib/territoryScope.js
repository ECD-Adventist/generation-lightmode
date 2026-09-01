// Territory scoping for Admin Center panels.
// A regional admin/officer picks countries and (optionally) regions in
// Territory Setup. This module turns that selection into a filter so every
// panel shows only the data inside the chosen scope.
//
// Rules:
// - Country not chosen        -> out of scope.
// - Country chosen, no region -> the entire country is in scope.
// - Country chosen + regions  -> only records whose location matches a region.
import { normalizeCountryName, getUserCountry } from "@/lib/countryUtils";
import { parseTerritorySelection, summarizeTerritorySelection } from "@/components/admin/territory/ecdRegions";

export function buildTerritoryScope({ territoryRestricted, territoryApproved, territoryCountries, territoryRegions } = {}) {
  const selection = parseTerritorySelection({
    territory_regions: territoryRegions,
    territory_countries: territoryCountries,
  });

  const regionsByCountry = new Map();
  Object.entries(selection).forEach(([country, regions]) => {
    const key = normalizeCountryName(country);
    if (!key) return;
    regionsByCountry.set(key, (regions || []).map(r => String(r).trim().toLowerCase()).filter(Boolean));
  });

  return {
    active: !!(territoryRestricted && territoryApproved),
    countries: Array.from(regionsByCountry.keys()),
    regionsByCountry,
    hasRegions: Array.from(regionsByCountry.values()).some(list => list.length > 0),
    summary: summarizeTerritorySelection(selection),
  };
}

function regionMatches(regionList, value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return false;
  return regionList.some(r => v === r || v.includes(r) || r.includes(v));
}

// regionValues: any location-ish strings on the record (region, city, address…).
export function locationInScope(scope, { country, regionValues = [] } = {}) {
  if (!scope?.active) return true;
  const key = normalizeCountryName(country);
  if (!key || !scope.regionsByCountry.has(key)) return false;
  const regionList = scope.regionsByCountry.get(key);
  if (regionList.length === 0) return true;
  return regionValues.some(value => regionMatches(regionList, value));
}

export function userInScope(scope, user) {
  return locationInScope(scope, {
    country: getUserCountry(user),
    regionValues: [user?.region, user?.city, user?.address, user?.postal_code],
  });
}

export function scopeUsers(scope, users = []) {
  if (!scope?.active) return users;
  return users.filter(u => userInScope(scope, u));
}

// Groups only store a country, so region narrowing is resolved through the
// group leader's own location when that user record is available.
export function scopeGroups(scope, groups = [], usersByEmail = null) {
  if (!scope?.active) return groups;
  return groups.filter(g => {
    const leader = usersByEmail?.get?.(g.leader_email) || null;
    return locationInScope(scope, {
      country: normalizeCountryName(g.country),
      regionValues: [g.region, leader?.region, leader?.city, leader?.address],
    });
  });
}

// Drops carry no location — they inherit their author's territory.
export function scopeDropsByAuthor(scope, drops = [], users = []) {
  if (!scope?.active) return drops;
  const byEmail = new Map(users.map(u => [u.email, u]));
  return drops.filter(d => {
    const author = byEmail.get(d.user_email);
    return author ? userInScope(scope, author) : false;
  });
}