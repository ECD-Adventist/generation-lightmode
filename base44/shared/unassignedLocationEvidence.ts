import { validatedRegistrationCountry } from './registrationCountries.ts';

// Exact location evidence only. No names, phone prefixes, IPs or language guesses.
const cities = {
  mpeketoni: 'Kenya', ikonge: 'Kenya', nairobi: 'Kenya', mombasa: 'Kenya',
  kisumu: 'Kenya', kisii: 'Kenya', malindi: 'Kenya', webuye: 'Kenya',
  'dar es salaam': 'Tanzania', 'dar es saalam': 'Tanzania',
  kampala: 'Uganda', arua: 'Uganda', kinshasa: 'Democratic Republic of the Congo',
  goma: 'Democratic Republic of the Congo', bukavu: 'Democratic Republic of the Congo',
  lubumbashi: 'Democratic Republic of the Congo', kasindi: 'Democratic Republic of the Congo',
};
export function resolveUnassignedLocation(account) {
  const fields = ['city', 'location', 'region', 'address'];
  const notes = [], candidates = [];
  for (const field of fields) {
    const value = String(account[field] || '').trim().replace(/\s+/g, ' ');
    if (!value) continue;
    notes.push(`${field}: ${value}`);
    const country = validatedRegistrationCountry(value) || cities[value.toLowerCase()];
    if (country) candidates.push({ country, field });
  }
  const countries = [...new Set(candidates.map(item => item.country))];
  const conflict = countries.length > 1;
  const suggestion = countries.length === 1 ? countries[0] : '';
  return {
    stored: String(account.country || '').trim(),
    city: String(account.city || '').trim(),
    suggestion, source: suggestion ? candidates[0].field : '',
    confidence: suggestion ? 'high' : 'none',
    evidence: notes.join(' | ').slice(0, 1000),
    reason: conflict ? 'Conflicting saved locations; member confirmation required.' : suggestion
      ? 'Country identified from an exact saved location; signup origin is not known.'
      : notes.length ? 'Saved location text is insufficient to assign a country.' : 'No saved location evidence; ask the member for country and city.',
  };
}