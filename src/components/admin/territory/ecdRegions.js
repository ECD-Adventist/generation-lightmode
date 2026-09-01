// The 12 countries of the East-Central Africa Division (ECD) and their
// first-level administrative regions. Used by Territory Setup so leaders and
// officers can pick territories precisely instead of relying on map extraction.
export const ECD_REGIONS = {
  "Burundi": ["Bubanza", "Bujumbura Mairie", "Bujumbura Rural", "Bururi", "Cankuzo", "Cibitoke", "Gitega", "Karuzi", "Kayanza", "Kirundo", "Makamba", "Muramvya", "Muyinga", "Mwaro", "Ngozi", "Rumonge", "Rutana", "Ruyigi"],
  "Democratic Republic of the Congo": ["Bas-Uele", "Équateur", "Haut-Katanga", "Haut-Lomami", "Haut-Uele", "Ituri", "Kasaï", "Kasaï-Central", "Kasaï-Oriental", "Kinshasa", "Kongo Central", "Kwango", "Kwilu", "Lomami", "Lualaba", "Mai-Ndombe", "Maniema", "Mongala", "Nord-Kivu", "Nord-Ubangi", "Sankuru", "Sud-Kivu", "Sud-Ubangi", "Tanganyika", "Tshopo", "Tshuapa"],
  "Djibouti": ["Ali Sabieh", "Arta", "Dikhil", "Djibouti City", "Obock", "Tadjourah"],
  "Eritrea": ["Anseba", "Debub", "Gash-Barka", "Maekel", "Northern Red Sea", "Southern Red Sea"],
  "Ethiopia": ["Addis Ababa", "Afar", "Amhara", "Benishangul-Gumuz", "Central Ethiopia", "Dire Dawa", "Gambela", "Harari", "Oromia", "Sidama", "Somali", "South Ethiopia", "South West Ethiopia", "Tigray"],
  "Kenya": ["Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"],
  "Rwanda": ["Kigali City", "Eastern Province", "Northern Province", "Southern Province", "Western Province"],
  "Somalia": ["Awdal", "Bakool", "Banaadir", "Bari", "Bay", "Galguduud", "Gedo", "Hiiraan", "Jubbada Dhexe", "Jubbada Hoose", "Mudug", "Nugaal", "Sanaag", "Shabeellaha Dhexe", "Shabeellaha Hoose", "Sool", "Togdheer", "Woqooyi Galbeed"],
  "South Sudan": ["Central Equatoria", "Eastern Equatoria", "Jonglei", "Lakes", "Northern Bahr el Ghazal", "Unity", "Upper Nile", "Warrap", "Western Bahr el Ghazal", "Western Equatoria"],
  "Sudan": ["Blue Nile", "Central Darfur", "East Darfur", "Gedaref", "Gezira", "Kassala", "Khartoum", "North Darfur", "North Kordofan", "Northern", "Red Sea", "River Nile", "Sennar", "South Darfur", "South Kordofan", "West Darfur", "West Kordofan", "White Nile"],
  "Tanzania": ["Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi", "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro", "Mtwara", "Mwanza", "Njombe", "Pemba North", "Pemba South", "Pwani", "Rukwa", "Ruvuma", "Shinyanga", "Simiyu", "Singida", "Songwe", "Tabora", "Tanga", "Unguja North", "Unguja South", "Zanzibar Urban/West"],
  "Uganda": ["Kampala", "Central Region", "Eastern Region", "Northern Region", "Western Region"],
};

export const ECD_COUNTRIES = Object.keys(ECD_REGIONS);

// Parse a stored territory_regions JSON string into { country: [regions] }.
export function parseTerritorySelection(user) {
  try {
    const parsed = JSON.parse(user?.territory_regions || "");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch { /* fall through to territory_countries */ }
  const selection = {};
  String(user?.territory_countries || "")
    .split(/[,;]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .forEach((name) => { selection[name] = []; });
  return selection;
}

// Human-readable summary, e.g. "Kenya (Nairobi, Kisumu); Uganda (entire country)".
export function summarizeTerritorySelection(selection) {
  return Object.entries(selection)
    .map(([country, regions]) => regions.length ? `${country} (${regions.join(", ")})` : `${country} (entire country)`)
    .join("; ");
}