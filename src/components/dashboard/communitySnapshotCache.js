const CACHE_KEY = "lightmode:community-snapshot:v2";
const MAX_AGE = 24 * 60 * 60 * 1000;

export function readCommunitySnapshot() {
  try {
    const data = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    const age = Date.now() - Date.parse(data?.generated_at);
    return data && Number.isFinite(age) && age >= 0 && age < MAX_AGE &&
      typeof data.totalUsers === "number" && Array.isArray(data.countryStats) ? data : undefined;
  } catch {
    return undefined; // Browser storage is optional, never a prerequisite for loading totals.
  }
}

export function saveCommunitySnapshot(data) {
  if (!data.generated_at) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be disabled or full; the live result is still usable.
  }
}