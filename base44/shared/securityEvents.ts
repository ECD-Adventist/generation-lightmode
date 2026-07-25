function clean(value, max) {
  return typeof value === 'string' ? value.replace(/[\r\n\t]/g, ' ').trim().slice(0, max) : '';
}

export function requestIp(req) {
  return clean(
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown',
    64,
  );
}

export async function logSecurityEvent(base44, req, event) {
  const record = {
    event_type: clean(event.event_type, 80),
    severity: ['info', 'warning', 'critical'].includes(event.severity) ? event.severity : 'info',
    user_id: clean(event.user_id, 64),
    ip_address: requestIp(req),
    resource: clean(event.resource, 160),
    action: clean(event.action, 100),
    status_code: Number.isInteger(event.status_code) ? event.status_code : undefined,
    request_count: Number.isFinite(event.request_count) ? event.request_count : undefined,
    details: clean(event.details, 1000),
    occurred_at: new Date().toISOString(),
  };
  await base44.asServiceRole.entities.SecurityEvent.create(record).catch((error) => {
    console.error('Security event logging failed:', error?.message);
  });
}

export async function logPermissionDenied(base44, req, user, resource, action, statusCode = 403) {
  await logSecurityEvent(base44, req, {
    event_type: 'permission_denied',
    severity: 'warning',
    user_id: user?.id || '',
    resource,
    action,
    status_code: statusCode,
  });
}

export async function logAdminAction(base44, req, user, resource, action, details = '') {
  await logSecurityEvent(base44, req, {
    event_type: 'admin_action',
    severity: 'info',
    user_id: user?.id || '',
    resource,
    action,
    status_code: 200,
    details,
  });
}