---
name: setup-monitoring
description: Sets up application monitoring, logging, error tracking, and alerting using tools like Sentry, Datadog, Grafana, Prometheus, OpenTelemetry, PagerDuty, or built-in cloud monitoring. Use when the user wants to add monitoring, set up error tracking, configure logging, add observability, or create alerts for their application.
argument-hint: "[tool: sentry|datadog|grafana|otel|cloudwatch] [scope: errors|metrics|logs|all]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are an observability engineer. Set up comprehensive monitoring for the current project.

### Step 1: Analyze the project

Detect:
- **Runtime**: Node.js, Python, Go, Java, Ruby, .NET
- **Framework**: Express, Next.js, Django, FastAPI, Spring Boot, etc.
- **Existing monitoring**: any existing Sentry, Datadog, or logging setup
- **Infrastructure**: Docker, Kubernetes, serverless, cloud platform
- **Database**: what databases are used (for query monitoring)

### Step 2: Parse arguments

- `$0` = Monitoring tool (optional, recommend based on project):
  - `sentry` — Error tracking + performance (best for most apps)
  - `datadog` — Full observability platform (metrics, logs, APM)
  - `grafana` — Grafana + Prometheus + Loki (self-hosted)
  - `otel` — OpenTelemetry (vendor-neutral instrumentation)
  - `cloudwatch` — AWS CloudWatch (if already on AWS)
- `$1` = Scope (optional):
  - `errors` — Error tracking only
  - `metrics` — Application and system metrics
  - `logs` — Structured logging
  - `all` — Full observability stack (default)

### Step 3: Set up structured logging

Replace or enhance existing logging with structured JSON logs:

**Node.js (pino):**
```typescript
import pino from 'pino';
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});
```

**Python (structlog):**
```python
import structlog
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
)
logger = structlog.get_logger()
```

**Go (slog):**
```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
slog.SetDefault(logger)
```

Add logging to:
- HTTP request/response (method, path, status, duration)
- Database queries (query, duration, error)
- Business events (user actions, transactions)
- Errors (with stack trace and context)

### Step 4: Set up error tracking

**Sentry (most common):**

```typescript
// Node.js
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
    Sentry.prismaIntegration(),
  ],
});
```

Configure:
- Source maps upload for stack trace deobfuscation
- Environment and release tagging
- User context attachment (without PII)
- Performance monitoring sample rate
- Ignored errors (network errors, user-aborted requests)

### Step 5: Set up metrics

**Application metrics to track:**
- Request rate (requests/second by endpoint)
- Error rate (errors/second by type)
- Response time (p50, p95, p99 by endpoint)
- Active connections/sessions
- Queue depth and processing time (if applicable)
- Database query duration and connection pool usage

**System metrics:**
- CPU and memory usage
- Disk I/O and space
- Network throughput

**Prometheus (self-hosted) setup:**
```typescript
import { Registry, Counter, Histogram } from 'prom-client';
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});
```

**OpenTelemetry (vendor-neutral):**
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

### Step 6: Set up health checks

Create standardized health check endpoints:

```typescript
// GET /health — basic liveness
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /health/ready — readiness (check dependencies)
app.get('/health/ready', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
  };
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
});
```

### Step 7: Set up alerting

Define alert rules for critical conditions:

```yaml
# alerts.yml (Prometheus/Grafana format)
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "Error rate above 5% for 5 minutes"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "p95 latency above 2 seconds"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels: { severity: critical }
```

**Recommended alerts:**
| Alert | Condition | Severity |
|-------|-----------|----------|
| Service down | Health check failing > 1min | Critical |
| High error rate | 5xx rate > 5% for 5min | Critical |
| High latency | p95 > 2s for 5min | Warning |
| High memory | Memory > 90% for 10min | Warning |
| Disk space low | Disk > 85% | Warning |
| Certificate expiring | SSL cert < 14 days | Warning |

### Step 8: Dashboard setup

If using Grafana, generate a dashboard JSON:
- Request rate and error rate graphs
- Latency distribution (p50/p95/p99)
- Active users/connections
- Resource usage (CPU, memory)
- Database metrics

### Step 9: Summary

```markdown
## Monitoring configured

### Components
- **Logging**: [pino/structlog/slog] with JSON output
- **Error tracking**: [Sentry/Datadog] with source maps
- **Metrics**: [Prometheus/OpenTelemetry] with [N] custom metrics
- **Health checks**: /health and /health/ready endpoints
- **Alerts**: [N] alert rules configured

### Environment variables needed
- `SENTRY_DSN` — Sentry project DSN
- `LOG_LEVEL` — Logging verbosity (debug/info/warn/error)
- [Other tool-specific vars]

### Files created/modified
- [list of files]

### Next steps
1. Set environment variables for your monitoring service
2. Deploy and verify data flows to your dashboard
3. Tune alert thresholds based on baseline traffic
```

### Guidelines

- Start with error tracking + structured logging — this covers 80% of debugging needs
- Don't over-instrument — monitor what you'll actually look at
- Use sampling for high-traffic production (10% trace sample rate is often enough)
- Never log sensitive data (passwords, tokens, PII)
- Correlate logs with request IDs — generate a unique ID per request and pass it through
- Set up alerts for symptoms (high error rate) not causes (CPU usage) — symptoms are more actionable
- Keep dashboards focused — one dashboard per concern (overview, API, database, infrastructure)
