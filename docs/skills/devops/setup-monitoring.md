# Setup Monitoring

Sets up structured logging, error tracking, metrics collection, health checks, and alerting for your application. This skill detects your stack and integrates the monitoring tool of your choice with sensible defaults, dashboards, and alert rules.

## Quick Start

```bash
# Full monitoring setup with Sentry
/setup-monitoring sentry all

# OpenTelemetry metrics only
/setup-monitoring otel metrics

# Datadog error tracking and logging
/setup-monitoring datadog errors,logs
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `tool` | `$0` | Yes | Monitoring tool: `sentry`, `datadog`, `grafana`, `otel`, `cloudwatch` |
| `scope` | `$1` | No | What to set up: `errors`, `metrics`, `logs`, `all` (defaults to `all`) |

::: tip
Use `otel` (OpenTelemetry) if you want a vendor-neutral setup that can export to any backend. This gives you the most flexibility to switch monitoring providers later without changing application code.
:::

## How It Works

1. **Analyze project** -- Detects your language, framework, existing logging libraries, and any monitoring tools already configured.
2. **Parse arguments** -- Identifies the monitoring tool and scope, merging with any existing monitoring setup to avoid duplication.
3. **Structured logging** -- Installs and configures a structured logging library appropriate for your language, with log levels, correlation IDs, and JSON output for production.
4. **Error tracking** -- Integrates the selected error tracking SDK with source maps (for frontend), environment tagging, and user context capture.
5. **Metrics collection** -- Sets up application metrics (request duration, error rate, active connections) and custom business metrics with the chosen tool.
6. **Health checks** -- Creates health check endpoints (`/health`, `/ready`) that verify database connectivity, cache availability, and downstream service status.
7. **Alerting** -- Configures alert rules for critical conditions with appropriate thresholds and notification channels.
8. **Dashboard** -- Generates a dashboard configuration (Grafana JSON or provider-specific) with key application panels.
9. **Summary** -- Outputs a complete summary of what was set up, with verification commands.

## Monitoring Stack by Tool

| Tool | Error Tracking | Metrics | Logging | Dashboards | Alerting |
|------|---------------|---------|---------|------------|----------|
| **Sentry** | Native | Via integrations | Breadcrumbs | Sentry UI | Built-in |
| **Datadog** | APM traces | StatsD / DogStatsD | Log management | Datadog UI | Monitors |
| **Grafana** | Via Loki/Tempo | Prometheus | Loki | Grafana JSON | Alert rules |
| **OpenTelemetry** | Trace export | OTLP metrics | OTLP logs | Backend-dependent | Backend-dependent |
| **CloudWatch** | Via alarms | CloudWatch Metrics | CloudWatch Logs | CloudWatch UI | Alarms |

## Alert Rules

The skill configures the following alert rules by default:

| Alert | Condition | Severity | Default Threshold |
|-------|-----------|----------|-------------------|
| **Service down** | Health check failing | Critical | 3 consecutive failures |
| **High error rate** | Error percentage above threshold | Critical | > 5% of requests over 5 minutes |
| **High latency** | P95 response time above threshold | Warning | > 2 seconds over 5 minutes |
| **High CPU usage** | CPU utilization sustained above limit | Warning | > 85% for 10 minutes |
| **High memory usage** | Memory utilization sustained above limit | Warning | > 90% for 5 minutes |
| **Disk space low** | Available disk below threshold | Warning | < 10% remaining |
| **Spike in 5xx responses** | Sudden increase in server errors | Critical | > 10x baseline over 1 minute |

## Logging Library by Language

| Language | Library | Output Format |
|----------|---------|---------------|
| **Node.js** | `pino` | JSON (structured) |
| **Python** | `structlog` | JSON (structured) |
| **Go** | `slog` (stdlib) | JSON (structured) |
| **Java** | `Logback` + `logstash-encoder` | JSON (structured) |
| **Ruby** | `semantic_logger` | JSON (structured) |
| **Rust** | `tracing` + `tracing-subscriber` | JSON (structured) |

::: warning
Monitoring SDKs often require API keys or DSN values to connect to their backends. The skill generates `.env.example` entries for all required credentials, but you must provide actual values before monitoring will function. Never commit real credentials to your repository.
:::

## Example

Suppose you have a Python FastAPI project and run:

```bash
/setup-monitoring sentry all
```

The skill generates and modifies the following:

```
src/monitoring/
  __init__.py               # Central monitoring initialization
  logging.py                # structlog configuration with JSON output
  metrics.py                # Custom Prometheus metrics (request duration, error count)
  health.py                 # /health and /ready endpoint handlers

src/middleware/
  sentry_middleware.py       # Sentry ASGI middleware with user context

alerting/
  sentry_alerts.json         # Alert rule definitions for import

.env.example                 # Updated with SENTRY_DSN, LOG_LEVEL, ENVIRONMENT
requirements.txt             # Updated with sentry-sdk, structlog, prometheus-client
```

**Health check output:**

```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency_ms": 3 },
    "redis": { "status": "up", "latency_ms": 1 },
    "sentry": { "status": "connected" }
  },
  "version": "1.4.2",
  "uptime_seconds": 84321
}
```

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` -- runs within your current conversation |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Bash` |

This skill has read/write access to your project files and can execute shell commands to install packages and verify the monitoring setup. It modifies existing application files to integrate monitoring and creates new files for monitoring-specific logic.
