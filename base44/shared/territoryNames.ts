// Canonical territory (country) names. Users type their country freely, so the
// same country arrives in several spellings and languages — normalize before
// aggregating so one country is never split across leaderboard rows.
const ALIASES: Record<string, string> = {
  'dr congo': 'DR Congo',
  'drc': 'DR Congo',
  'rdc': 'DR Congo',
  'rd congo': 'DR Congo',
  'r.d. congo': 'DR Congo',
  'rd. congo': 'DR Congo',
  'congo (drc)': 'DR Congo',
  'congo drc': 'DR Congo',
  'democratic republic of congo': 'DR Congo',
  'democratic republic of the congo': 'DR Congo',
  'republique democratique du congo': 'DR Congo',
  'république démocratique du congo': 'DR Congo',
};

export function normalizeTerritoryName(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Unspecified';
  const key = raw.toLowerCase().replace(/\s+/g, ' ');
  return ALIASES[key] || raw;
}