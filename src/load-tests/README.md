# Launch load test

Run against a separately approved environment; the script never creates or changes records.

```bash
k6 run -e BASE_URL=https://light-mode.base44.app -e AUTH_TOKEN='<test-user-token>' -e CONCURRENCY=100 src/load-tests/launch.k6.js
k6 run -e BASE_URL=https://light-mode.base44.app -e AUTH_TOKEN='<test-user-token>' -e CONCURRENCY=500 src/load-tests/launch.k6.js
k6 run -e BASE_URL=https://light-mode.base44.app -e AUTH_TOKEN='<test-user-token>' -e CONCURRENCY=1000 src/load-tests/launch.k6.js
```

k6 prints request throughput, p50/p95/p99 latency, failed checks, HTTP 429 rate, and HTTP 5xx rate. Use a dedicated test account and obtain approval before directing 500 or 1,000 concurrent sessions at production.