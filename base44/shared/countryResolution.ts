import { REGISTRATION_COUNTRIES } from './registrationCountries.ts';
import { normalizeCountryName } from './territoryNames.ts';

const EXACT_LOCATIONS = {
  kinshasa: 'Democratic Republic of the Congo', goma: 'Democratic Republic of the Congo',
  kasindi: 'Democratic Republic of the Congo', lubumbashi: 'Democratic Republic of the Congo', bukavu: 'Democratic Republic of the Congo',
  nairobi: 'Kenya', mombasa: 'Kenya', malindi: 'Kenya', kisumu: 'Kenya', webuye: 'Kenya', kisii: 'Kenya',
  kampala: 'Uganda', arua: 'Uganda', 'dar es salaam': 'Tanzania',
};
const EXPLICIT_CODES = { '+243': 'Democratic Republic of the Congo', '+254': 'Kenya', '🇪🇹': 'Ethiopia', 'congo-kinshasa': 'Democratic Republic of the Congo', somali: 'Somalia' };
const canonicalByLower = new Map(REGISTRATION_COUNTRIES.map(country => [country.toLowerCase(), country]));
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whole names/codes only: never infer a country from a substring such as "us".
export function resolveReportingCountry(value) {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  if (EXPLICIT_CODES[raw.toLowerCase()]) return EXPLICIT_CODES[raw.toLowerCase()];
  const cleaned = raw.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
  const direct = canonicalByLower.get(normalizeCountryName(cleaned).toLowerCase());
  if (direct) return direct;
  let remaining = cleaned.toLowerCase();
  const matches = new Set();
  for (const country of [...REGISTRATION_COUNTRIES].sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`(^|[^a-z])${escapeRegex(country.toLowerCase())}(?=$|[^a-z])`, 'g');
    if (pattern.test(remaining)) { matches.add(country); remaining = remaining.replace(pattern, ' '); }
  }
  for (const token of remaining.split(/[,/;\s]+/).filter(Boolean)) {
    const alias = canonicalByLower.get(normalizeCountryName(token).toLowerCase());
    if (alias) matches.add(alias);
  }
  if (matches.size) return matches.size === 1 ? [...matches][0] : '';
  return EXACT_LOCATIONS[cleaned.toLowerCase()] || '';
}

export function resolveLegacyUserCountry(account) {
  const raw = String(account.country || '').trim();
  if (!raw) return ''; // Missing countries are outside this cleanup; never guess.
  const direct = resolveReportingCountry(raw);
  if (direct) return direct;
  if (!['congo', 'other'].includes(raw.toLowerCase())) return '';
  const evidence = [account.city, account.location, account.address].map(resolveReportingCountry).filter(Boolean);
  const candidates = [...new Set(evidence)];
  if (candidates.length !== 1) return '';
  if (raw.toLowerCase() === 'congo' && !['Democratic Republic of the Congo', 'Republic of the Congo'].includes(candidates[0])) return '';
  return candidates[0];
}