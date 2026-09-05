import { logSecurityEvent } from './securityEvents.ts';

// Base44 records currently use 24-character hexadecimal ids; imported records
// may use UUIDs. Accept both canonical identifier formats without accepting
// arbitrary query/operator strings.
const UUID_PATTERN = /^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
// Record ids as they actually appear in Follow.following_id: Base44 ids, UUIDs, and the synthetic
// official-account id ('official-generation-lightmode'). Still rejects operators and query syntax.
const RECORD_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,63}$/i;
const WINDOW_MS = 60_000;

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Rate limiting.
//
// Previous design did 2 reads + 1–2 writes on the ApiRateLimit entity for EVERY function call —
// 3–4 database operations before any request did its work. That cost more than most of the
// requests it protected.
//
// New design:
//   1. An in-memory fixed-window counter per isolate (Map<identity+endpoint, {window, count}>)
//      answers every call with zero database operations.
//   2. The ApiRateLimit ledger is only touched for GUEST (IP-identified) traffic: every
//      LEDGER_SAMPLE-th call, and every call once a guest is past half its limit. Each sync writes
//      the exact number of calls seen since the previous sync (not a constant), so the ledger stays
//      accurate and abuse spread across isolates is still caught.
//   Authenticated users never touch the ledger; their identity is already verified.
//
// Trade-offs (documented on purpose):
//   - Each Base44 function is its own deployment, so the in-memory counters are per function and
//     per isolate. A verified user hitting several isolates at once could exceed 120/min on one
//     endpoint by that factor, and the "abuse" flag below is per endpoint, not app-wide. That is
//     acceptable for a verified account and far cheaper than 3–4 database operations per call.
//     Move the counter to Redis (one atomic INCR) when the backend moves off Base44.

const memoryWindows = new Map();
const MEMORY_MAX_KEYS = 20_000;
const LEDGER_SAMPLE = 5;

function bumpMemory(key, windowStart) {
  const entry = memoryWindows.get(key);
  if (entry && entry.window === windowStart) {
    entry.count += 1;
    return entry;
  }
  if (memoryWindows.size >= MEMORY_MAX_KEYS) {
    // Cheap eviction: drop everything from previous windows.
    for (const [k, v] of memoryWindows) if (v.window !== windowStart) memoryWindows.delete(k);
    if (memoryWindows.size >= MEMORY_MAX_KEYS) memoryWindows.clear();
  }
  const fresh = { window: windowStart, count: 1, synced: 0 };
  memoryWindows.set(key, fresh);
  return fresh;
}

// Never let the rate-limit bookkeeping itself break a request. Under heavy traffic
// the counter reads/writes can be rejected by the database; when that happens we log
// and allow the request through. Real limit breaches still return 429 below.
export async function enforceApiRateLimit(base44, req, user = null) {
  try {
    return await applyApiRateLimit(base44, req, user);
  } catch (error) {
    console.error('enforceApiRateLimit: limiter unavailable, allowing request:', error?.message);
    return null;
  }
}

async function applyApiRateLimit(base44, req, user = null) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
  const identity = user?.id ? `user:${user.id}` : `ip:${ip}`;
  const endpoint = new URL(req.url).pathname;
  const limit = user?.id ? 120 : 60;
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const retryAfter = Math.max(1, Math.ceil((windowStart + WINDOW_MS - now) / 1000));
  const tooMany = () => Response.json({ error: 'Too many requests. Please try again shortly.' }, {
    status: 429,
    headers: { 'Retry-After': String(retryAfter) },
  });

  // 1. In-memory counter — no database work.
  const entry = bumpMemory(`${identity}|${endpoint}`, windowStart);
  const endpointCount = entry.count;
  if (endpointCount === 101) {
    logSecurityEvent(base44, req, {
      event_type: 'api_abuse_flagged', severity: 'critical', user_id: user?.id || '',
      resource: endpoint, action: req.method, request_count: endpointCount,
      details: 'More than 100 calls to one endpoint in one minute (in-memory counter)',
    }).catch(() => {});
  }
  if (endpointCount > limit) return tooMany();

  // 2. Guests only: sampled ledger, written as a delta so it never over-counts.
  if (!user?.id && (endpointCount % LEDGER_SAMPLE === 0 || endpointCount > limit / 2)) {
    const delta = endpointCount - entry.synced;
    entry.synced = endpointCount;
    const subjectHash = await sha256(`${endpoint}|${identity}`);
    const windowIso = new Date(windowStart).toISOString();
    const records = await base44.asServiceRole.entities.ApiRateLimit.filter({ subject_hash: subjectHash }, '-updated_date', 1);
    const record = records[0];
    const ledgerCount = (record?.window_started_at === windowIso ? Number(record.request_count || 0) : 0) + delta;
    if (record) {
      await base44.asServiceRole.entities.ApiRateLimit.update(record.id, { window_started_at: windowIso, request_count: ledgerCount });
    } else {
      await base44.asServiceRole.entities.ApiRateLimit.create({ subject_hash: subjectHash, window_started_at: windowIso, request_count: ledgerCount });
    }
    if (ledgerCount > limit) return tooMany();
  }
  return null;
}

function validateValue(name, value, rule) {
  // `null` means "not provided" — clients legitimately send null for optional fields
  // (e.g. a repost with no image), which must not be treated as a type mismatch.
  if (value === undefined || value === null) return rule.required ? `${name} is required` : null;
  if (rule.type === 'string') {
    if (typeof value !== 'string') return `${name} must be a string`;
    if (rule.minLength !== undefined && value.length < rule.minLength) return `${name} is too short`;
    if (rule.maxLength !== undefined && value.length > rule.maxLength) return `${name} must be at most ${rule.maxLength} characters`;
    if (rule.format === 'uuid' && !UUID_PATTERN.test(value)) return `${name} must be a valid identifier`;
    if (rule.format === 'record-id' && !(UUID_PATTERN.test(value) || RECORD_ID_PATTERN.test(value))) return `${name} must be a valid identifier`;
    if (rule.enum && !rule.enum.includes(value)) return `${name} has an invalid value`;
  } else if (rule.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return `${name} must be a number`;
    if (rule.integer && !Number.isInteger(value)) return `${name} must be an integer`;
    if (rule.min !== undefined && value < rule.min) return `${name} is below the minimum`;
    if (rule.max !== undefined && value > rule.max) return `${name} exceeds the maximum`;
  } else if (rule.type === 'boolean') {
    if (typeof value !== 'boolean') return `${name} must be a boolean`;
  } else if (rule.type === 'array') {
    if (!Array.isArray(value)) return `${name} must be an array`;
    if (rule.maxItems !== undefined && value.length > rule.maxItems) return `${name} has too many items`;
    for (const item of value) {
      const itemError = validateValue(`${name} item`, item, rule.items);
      if (itemError) return itemError;
    }
  } else if (rule.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return `${name} must be an object`;
    const properties = rule.properties || {};
    const unexpected = Object.keys(value).find((key) => !Object.prototype.hasOwnProperty.call(properties, key));
    if (unexpected) return `Unexpected field: ${name}.${unexpected}`;
    for (const [key, childRule] of Object.entries(properties)) {
      const childError = validateValue(`${name}.${key}`, value[key], childRule);
      if (childError) return childError;
    }
  }
  return null;
}

export async function readValidatedJson(req, rules, { allowEmpty = false } = {}) {
  let data;
  try {
    data = await req.json();
  } catch {
    if (allowEmpty) data = {};
    else return { response: Response.json({ error: 'Request body must be valid JSON' }, { status: 400 }) };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { response: Response.json({ error: 'Request body must be an object' }, { status: 400 }) };
  }
  const unexpected = Object.keys(data).find((key) => !Object.prototype.hasOwnProperty.call(rules, key));
  if (unexpected) {
    return { response: Response.json({ error: `Unexpected field: ${unexpected}` }, { status: 400 }) };
  }
  for (const [name, rule] of Object.entries(rules)) {
    const error = validateValue(name, data[name], rule);
    if (error) return { response: Response.json({ error }, { status: 400 }) };
  }
  return { data };
}