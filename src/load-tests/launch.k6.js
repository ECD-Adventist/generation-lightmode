import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL || 'https://light-mode.base44.app';
const token = __ENV.AUTH_TOKEN || '';
const target = Number(__ENV.CONCURRENCY || 100);
const failedChecks = new Rate('failed_checks');
const rateLimited = new Rate('http_429_rate');
const serverErrors = new Rate('http_5xx_rate');

export const options = {
  scenarios: {
    cold_sessions: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target },
        { duration: '2m', target },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    failed_checks: ['rate<0.02'],
    http_429_rate: ['rate<0.05'],
    http_5xx_rate: ['rate<0.01'],
    http_req_duration: ['p(50)<1500', 'p(95)<5000', 'p(99)<9000'],
  },
};

const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
function record(response, expected = 200) {
  const ok = check(response, { [`status ${expected}`]: (value) => value.status === expected });
  failedChecks.add(!ok);
  rateLimited.add(response.status === 429);
  serverErrors.add(response.status >= 500);
}

export default function () {
  ['/Home', '/Feed', '/GlowGroups', '/Profile'].forEach((path) => record(http.get(`${baseUrl}${path}`)));
  if (token) {
    record(http.post(`${baseUrl}/functions/listPublicUsers`, JSON.stringify({ limit: 40, skip: 0 }), { headers }));
    record(http.post(`${baseUrl}/functions/requestGroupJoin`, JSON.stringify({ group_id: '000000000000000000000000' }), { headers }), 404);
    record(http.post(`${baseUrl}/functions/handleGroupJoinRequest`, JSON.stringify({ request_id: '000000000000000000000000', action: 'approve' }), { headers }), 404);
  }
  sleep(1);
}