// Canonical country names shared by cleanup, assignment, and reporting.
const ALIASES: Record<string, string> = {
  'dr congo': 'Democratic Republic of the Congo',
  'drc': 'Democratic Republic of the Congo',
  'rdc': 'Democratic Republic of the Congo',
  'rd congo': 'Democratic Republic of the Congo',
  'r.d. congo': 'Democratic Republic of the Congo',
  'rd. congo': 'Democratic Republic of the Congo',
  'congo (drc)': 'Democratic Republic of the Congo',
  'congo drc': 'Democratic Republic of the Congo',
  'democratic republic of congo': 'Democratic Republic of the Congo',
  'democratic republic of the congo': 'Democratic Republic of the Congo',
  'republique democratique du congo': 'Democratic Republic of the Congo',
  'république démocratique du congo': 'Democratic Republic of the Congo',
  'kenia': 'Kenya',
  'kenya': 'Kenya',
  'tanzanie': 'Tanzania',
  'united republic of tanzania': 'Tanzania',
  'ouganda': 'Uganda',
  'ethiopie': 'Ethiopia',
  'éthiopie': 'Ethiopia',
  'usa': 'United States',
  'u.s.a.': 'United States',
  'us': 'United States',
  'united states of america': 'United States',
  'uk': 'United Kingdom',
  'great britain': 'United Kingdom',
  's. sudan': 'South Sudan',
  'ivory coast': "Côte d'Ivoire",
};

const LOCATION_COUNTRIES: Array<[RegExp, string]> = [
  [/\b(goma|lubumbashi|kinshasa|bukavu|kisangani)\b/i, 'Democratic Republic of the Congo'],
  [/\b(tabora|dar es salaam|dodoma|arusha|mwanza)\b/i, 'Tanzania'],
  [/\b(oyugis|kisumu|nairobi|mombasa|nakuru|eldoret)\b/i, 'Kenya'],
];

export function normalizeCountryName(value: unknown): string {
  const raw = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  return ALIASES[raw.toLowerCase()] || raw;
}

export function inferCountryFromLocation(user: Record<string, unknown>): string {
  const signal = [user.location, user.city, user.address, user.postal_code].filter(Boolean).join(' ');
  for (const [pattern, country] of LOCATION_COUNTRIES) {
    if (pattern.test(signal)) return country;
  }
  const raw = String(user.country ?? '').trim();
  if (!raw || raw.toLowerCase() === 'other') return '';
  if (raw.toLowerCase() === 'congo') return 'Republic of the Congo';
  return normalizeCountryName(raw);
}

export function normalizeTerritoryName(value: unknown): string {
  return normalizeCountryName(value) || 'Unspecified';
}