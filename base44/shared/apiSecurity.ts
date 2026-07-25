const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WINDOW_MS = 60_000;

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function enforceApiRateLimit(base44, req, user = null) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
  const identity = user?.id ? `user:${user.id}` : `ip:${ip}`;
  const endpoint = new URL(req.url).pathname;
  const subjectHash = await sha256(`${endpoint}|${identity}`);
  const limit = user?.id ? 120 : 60;
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const windowIso = new Date(windowStart).toISOString();
  const retryAfter = Math.max(1, Math.ceil((windowStart + WINDOW_MS - now) / 1000));

  const records = await base44.asServiceRole.entities.ApiRateLimit.filter({ subject_hash: subjectHash }, '-updated_date', 1);
  const record = records[0];
  if (record?.window_started_at === windowIso && Number(record.request_count || 0) >= limit) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  if (record) {
    await base44.asServiceRole.entities.ApiRateLimit.update(record.id, {
      window_started_at: windowIso,
      request_count: record.window_started_at === windowIso ? Number(record.request_count || 0) + 1 : 1,
    });
  } else {
    await base44.asServiceRole.entities.ApiRateLimit.create({
      subject_hash: subjectHash,
      window_started_at: windowIso,
      request_count: 1,
    });
  }
  return null;
}

function validateValue(name, value, rule) {
  if (value === undefined) return rule.required ? `${name} is required` : null;
  if (rule.type === 'string') {
    if (typeof value !== 'string') return `${name} must be a string`;
    if (rule.minLength !== undefined && value.length < rule.minLength) return `${name} is too short`;
    if (rule.maxLength !== undefined && value.length > rule.maxLength) return `${name} must be at most ${rule.maxLength} characters`;
    if (rule.format === 'uuid' && !UUID_PATTERN.test(value)) return `${name} must be a valid UUID`;
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
  }
  return null;
}

export async function readValidatedJson(req, rules) {
  let data;
  try {
    data = await req.json();
  } catch {
    return { response: Response.json({ error: 'Request body must be valid JSON' }, { status: 400 }) };
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