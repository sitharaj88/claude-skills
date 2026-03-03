# GCP Cloud Monitoring

Generate Cloud Monitoring dashboards, alerting policies, SLOs, uptime checks, and logging configurations for comprehensive observability on Google Cloud.

## Usage

```bash
/gcp-cloud-monitoring <description of your monitoring requirements>
```

## What It Does

1. Generates alerting policies for Compute Engine, Cloud Run, GKE, and Cloud SQL metrics
2. Creates SLO definitions with error budgets and multi-window burn-rate alerting
3. Configures uptime checks with HTTP/HTTPS health probes and content matchers
4. Produces custom dashboard JSON with charts for request rate, error rate, and latency
5. Sets up log-based metrics, log sinks to BigQuery/GCS, and log exclusion filters
6. Integrates Cloud Trace, Cloud Profiler, Managed Prometheus, and Error Reporting

## Examples

```bash
/gcp-cloud-monitoring Create alerting policies for Cloud Run error rate and latency with PagerDuty notifications

/gcp-cloud-monitoring Set up a 99.9% availability SLO with burn-rate alerts for my API service

/gcp-cloud-monitoring Configure log sinks to export audit logs to BigQuery and warnings to Cloud Storage
```

## What It Covers

- **Alerting policies** - Metric-based, log-based, and SLO burn-rate alerts with notification channels
- **Notification channels** - Slack, PagerDuty, email, and webhook integrations
- **Uptime checks** - HTTPS health probes with SSL validation and content matching
- **SLO monitoring** - Availability and latency SLOs with rolling period error budgets
- **Custom dashboards** - Mosaic layout dashboards with XY charts, MQL, and PromQL queries
- **Cloud Logging** - Structured logging, log-based metrics, sinks, and exclusion filters
- **Cloud Trace** - Distributed tracing with OpenTelemetry integration
- **Managed Prometheus** - PodMonitoring for GKE with PromQL queries in dashboards
- **Error Reporting** - Automatic error grouping and notification for application exceptions

<div class="badge-row">
  <span class="badge">Monitoring</span>
  <span class="badge">Observability</span>
  <span class="badge">GCP</span>
</div>

## Allowed Tools

- `Read` - Read existing monitoring configurations and alert policies
- `Write` - Create dashboard JSON, alert policy definitions, and SLO configs
- `Edit` - Modify existing monitoring and logging configurations
- `Bash` - Run gcloud monitoring commands for policy and dashboard management
- `Glob` - Search for monitoring-related Terraform and configuration files
- `Grep` - Find metric references and notification channel usage
