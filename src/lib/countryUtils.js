const COUNTRY_ALIASES = {
  "usa": "United States",
  "u.s.a.": "United States",
  "us": "United States",
  "united states of america": "United States",
  "uk": "United Kingdom",
  "great britain": "United Kingdom",
  "england": "United Kingdom",
  "southafrica": "South Africa",
  "united republic of tanzania": "Tanzania",
  "tanzanie": "Tanzania",
  "kenia": "Kenya",
  "ouganda": "Uganda",
  "ethiopie": "Ethiopia",
  "éthiopie": "Ethiopia",
  "drc": "Democratic Republic of the Congo",
  "rdc": "Democratic Republic of the Congo",
  "dr congo": "Democratic Republic of the Congo",
  "rd congo": "Democratic Republic of the Congo",
  "congo dr": "Democratic Republic of the Congo",
  "congo, democratic republic": "Democratic Republic of the Congo",
  "république démocratique du congo": "Democratic Republic of the Congo",
  "republique democratique du congo": "Democratic Republic of the Congo",
  "rep. dem. du congo": "Democratic Republic of the Congo",
  "democratic republic of congo": "Democratic Republic of the Congo",
  "s. sudan": "South Sudan",
  "ivory coast": "Côte d'Ivoire",
};

export function normalizeCountryName(country) {
  if (!country) return "";
  const cleaned = String(country).trim().replace(/\s+/g, " ");
  const key = cleaned.toLowerCase();
  return COUNTRY_ALIASES[key] || cleaned;
}

export function getUserCountry(user) {
  return normalizeCountryName(user?.country);
}