// Shared analytics helpers for Phase 3 admin features.

// ─── Profile Completeness (#20) ──────────────────────────────
const PROFILE_FIELDS = [
  { key: "full_name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "profile_picture_url", label: "Photo" },
  { key: "bio", label: "Bio" },
  { key: "country", label: "Country" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "gender", label: "Gender" },
  { key: "pledge_signed", label: "Pledge" },
];

export function computeProfileCompleteness(user) {
  if (!user) return { score: 0, filled: 0, total: PROFILE_FIELDS.length, missing: [] };
  const missing = [];
  let filled = 0;
  for (const f of PROFILE_FIELDS) {
    const v = user[f.key];
    const ok = f.key === "pledge_signed" ? !!v : (v !== undefined && v !== null && v !== "");
    if (ok) filled++;
    else missing.push(f.label);
  }
  return {
    score: Math.round((filled / PROFILE_FIELDS.length) * 100),
    filled,
    total: PROFILE_FIELDS.length,
    missing,
  };
}

export function completenessColor(score) {
  if (score >= 85) return "#22c55e";
  if (score >= 60) return "#5AC8FF";
  if (score >= 35) return "#FFD000";
  return "#f87171";
}

// ─── Duplicate Detection (#13) ────────────────────────────────
function normName(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function gmailNormalize(email) {
  if (!email) return "";
  const [local, domain] = email.toLowerCase().split("@");
  if (!domain) return email.toLowerCase();
  const cleanLocal = local.split("+")[0].replace(/\./g, "");
  return `${cleanLocal}@${domain}`;
}
function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// Returns array of duplicate groups: [{ reason, severity, users: [...] }]
export function detectDuplicates(users = []) {
  const groups = [];
  const seenPairs = new Set();
  const pairKey = (a, b) => [a, b].sort().join("|");

  // 1) Email alias collisions (gmail-normalized)
  const emailMap = new Map();
  users.forEach(u => {
    if (!u.email) return;
    const key = gmailNormalize(u.email);
    if (!emailMap.has(key)) emailMap.set(key, []);
    emailMap.get(key).push(u);
  });
  for (const [, list] of emailMap) {
    if (list.length > 1) {
      groups.push({ reason: "Same email (normalized)", severity: "strong", users: list });
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++)
          seenPairs.add(pairKey(list[i].email, list[j].email));
    }
  }

  // 2) Same name + same country
  const nameCountryMap = new Map();
  users.forEach(u => {
    const n = normName(u.full_name);
    if (!n || !u.country) return;
    const key = `${n}|${u.country.toLowerCase()}`;
    if (!nameCountryMap.has(key)) nameCountryMap.set(key, []);
    nameCountryMap.get(key).push(u);
  });
  for (const [, list] of nameCountryMap) {
    if (list.length > 1) {
      const unseen = [];
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const k = pairKey(list[i].email, list[j].email);
          if (!seenPairs.has(k)) { unseen.push(list[i], list[j]); seenPairs.add(k); }
        }
      if (unseen.length) groups.push({ reason: "Same name + country", severity: "medium", users: Array.from(new Set(unseen)) });
    }
  }

  // 3) Same DOB + country + similar name (Levenshtein ≤ 2)
  const dobCountry = new Map();
  users.forEach(u => {
    if (!u.date_of_birth || !u.country) return;
    const key = `${u.date_of_birth}|${u.country.toLowerCase()}`;
    if (!dobCountry.has(key)) dobCountry.set(key, []);
    dobCountry.get(key).push(u);
  });
  for (const [, list] of dobCountry) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = normName(list[i].full_name), b = normName(list[j].full_name);
        if (a && b && levenshtein(a, b) <= 2) {
          const k = pairKey(list[i].email, list[j].email);
          if (!seenPairs.has(k)) {
            groups.push({ reason: "Same DOB + country + similar name", severity: "weak", users: [list[i], list[j]] });
            seenPairs.add(k);
          }
        }
      }
    }
  }

  return groups;
}

// Build a set of suspect user emails for fast row-lookup
export function buildDuplicateSuspectSet(groups) {
  const s = new Set();
  groups.forEach(g => g.users.forEach(u => s.add(u.email)));
  return s;
}

// ─── Cohort Retention (#19) ──────────────────────────────────
// Groups users by signup month, calculates what % are "active" in each subsequent month
// Active = updated_date within that calendar month.
export function buildCohortRetention(users = [], monthsBack = 6) {
  const now = new Date();
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = (d) => d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });

  // Build list of cohort months (oldest → newest)
  const cohorts = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    cohorts.push({ key: monthKey(d), label: monthLabel(d), date: d, users: [] });
  }

  // Bucket users by signup month
  users.forEach(u => {
    if (!u.created_date) return;
    const d = new Date(u.created_date);
    const key = monthKey(d);
    const c = cohorts.find(c => c.key === key);
    if (c) c.users.push(u);
  });

  // For each cohort, compute M0..Mn retention
  return cohorts.map((c, idx) => {
    const cohortSize = c.users.length;
    const periods = [];
    for (let m = 0; m <= monthsBack - 1 - idx; m++) {
      const periodStart = new Date(c.date.getFullYear(), c.date.getMonth() + m, 1);
      const periodEnd = new Date(c.date.getFullYear(), c.date.getMonth() + m + 1, 1);
      if (periodStart > now) break;
      const active = c.users.filter(u => {
        const ts = u.updated_date ? new Date(u.updated_date) : null;
        return ts && ts >= periodStart && ts < periodEnd;
      }).length;
      periods.push({
        month: m,
        active,
        pct: cohortSize > 0 ? Math.round((active / cohortSize) * 100) : 0,
      });
    }
    return { key: c.key, label: c.label, size: cohortSize, periods };
  });
}

// ─── Country density for heatmap (#18) ─────────────────────────
export function buildCountryDensity(users = []) {
  const map = new Map();
  users.forEach(u => {
    if (!u.country) return;
    map.set(u.country, (map.get(u.country) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}