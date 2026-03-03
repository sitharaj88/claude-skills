---
name: gcp-cloud-monitoring
description: Generate Cloud Monitoring dashboards, alerting policies, SLOs, and logging configurations. Use when the user wants to set up observability on Google Cloud.
argument-hint: "[type]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Cloud Monitoring and Logging expert. Generate production-ready observability configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Type**: dashboard, alert, slo, logging, uptime
- **Services to monitor**: GKE, Cloud Run, Cloud SQL, Compute Engine, Cloud Functions, etc.
- **Notification channels**: email, Slack, PagerDuty, webhooks, SMS
- **SLO targets**: availability, latency percentiles
- **Log analysis needs**: structured logs, sinks, metrics

### Step 2: Generate alerting policies

**Metric-based alerting policy (Terraform):**
```hcl
resource "google_monitoring_alert_policy" "high_cpu" {
  display_name = "High CPU Utilization"
  combiner     = "OR"

  conditions {
    display_name = "CPU utilization > 80%"
    condition_threshold {
      filter          = "resource.type = \"gce_instance\" AND metric.type = \"compute.googleapis.com/instance/cpu/utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.name]

  alert_strategy {
    auto_close = "1800s"
    notification_rate_limit {
      period = "300s"
    }
  }

  documentation {
    content   = "CPU utilization has exceeded 80% for more than 5 minutes. Check for runaway processes or scale up."
    mime_type = "text/markdown"
  }
}
```

**Cloud Run alerting:**
```hcl
resource "google_monitoring_alert_policy" "cloud_run_errors" {
  display_name = "Cloud Run - High Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "5xx error rate > 1%"
    condition_threshold {
      filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND resource.labels.service_name = "my-service"
        AND metric.type = "run.googleapis.com/request_count"
        AND metric.labels.response_code_class = "5xx"
      EOT
      comparison      = "COMPARISON_GT"
      threshold_value = 10
      duration        = "60s"
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.pagerduty.name]
}
```

**GKE alerting:**
```hcl
resource "google_monitoring_alert_policy" "gke_pod_restart" {
  display_name = "GKE - Pod Restart Loop"
  combiner     = "OR"

  conditions {
    display_name = "Pod restart count > 5 in 10 minutes"
    condition_threshold {
      filter          = "resource.type = \"k8s_container\" AND metric.type = \"kubernetes.io/container/restart_count\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      duration        = "0s"
      aggregations {
        alignment_period   = "600s"
        per_series_aligner = "ALIGN_DELTA"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.name]
}
```

**Cloud SQL alerting:**
```hcl
resource "google_monitoring_alert_policy" "cloudsql_cpu" {
  display_name = "Cloud SQL - High CPU"
  combiner     = "AND"

  conditions {
    display_name = "CPU > 80%"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/cpu/utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  conditions {
    display_name = "Disk > 90%"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/disk/utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.9
      duration        = "0s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.pagerduty.name]
}
```

**Log-based alerting:**
```hcl
resource "google_monitoring_alert_policy" "log_error_alert" {
  display_name = "Application Error Logs"
  combiner     = "OR"

  conditions {
    display_name = "Error log entries > 10 per minute"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND metric.type = \"logging.googleapis.com/user/error_count\""
      comparison      = "COMPARISON_GT"
      threshold_value = 10
      duration        = "60s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.name]
}
```

### Step 3: Generate notification channels

```hcl
resource "google_monitoring_notification_channel" "slack" {
  display_name = "Slack - #ops-alerts"
  type         = "slack"
  labels = {
    channel_name = "#ops-alerts"
  }
  sensitive_labels {
    auth_token = var.slack_oauth_token
  }
}

resource "google_monitoring_notification_channel" "pagerduty" {
  display_name = "PagerDuty - Critical"
  type         = "pagerduty"
  labels = {
    service_key = var.pagerduty_integration_key
  }
}

resource "google_monitoring_notification_channel" "email" {
  display_name = "Email - On-Call Team"
  type         = "email"
  labels = {
    email_address = "oncall@company.com"
  }
}

resource "google_monitoring_notification_channel" "webhook" {
  display_name = "Custom Webhook"
  type         = "webhook_tokenauth"
  labels = {
    url = "https://hooks.company.com/monitoring"
  }
  sensitive_labels {
    password = var.webhook_token
  }
}
```

### Step 4: Generate uptime checks

```hcl
resource "google_monitoring_uptime_check_config" "https_check" {
  display_name = "HTTPS Uptime Check - api.example.com"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path           = "/health"
    port           = 443
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"
    accepted_response_status_codes {
      status_class = "STATUS_CLASS_2XX"
    }
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = "api.example.com"
    }
  }

  content_matchers {
    content = "\"status\":\"healthy\""
    matcher = "CONTAINS_STRING"
  }

  checker_type = "STATIC_IP_CHECKERS"
  selected_regions = ["USA", "EUROPE", "ASIA_PACIFIC"]
}

# Alert on uptime check failure
resource "google_monitoring_alert_policy" "uptime_alert" {
  display_name = "Uptime Check Failed"
  combiner     = "OR"

  conditions {
    display_name = "Uptime check failing"
    condition_threshold {
      filter          = "metric.type = \"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type = \"uptime_url\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "300s"
      aggregations {
        alignment_period     = "1200s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.*"]
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.pagerduty.name]
}
```

### Step 5: Generate SLO monitoring

**SLO with error budgets:**
```hcl
resource "google_monitoring_slo" "availability_slo" {
  service      = google_monitoring_custom_service.my_service.service_id
  display_name = "99.9% Availability SLO"
  goal         = 0.999

  rolling_period_days = 28

  request_based_sli {
    good_total_ratio {
      good_service_filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND resource.labels.service_name = "my-service"
        AND metric.type = "run.googleapis.com/request_count"
        AND metric.labels.response_code_class != "5xx"
      EOT
      total_service_filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND resource.labels.service_name = "my-service"
        AND metric.type = "run.googleapis.com/request_count"
      EOT
    }
  }
}

resource "google_monitoring_slo" "latency_slo" {
  service      = google_monitoring_custom_service.my_service.service_id
  display_name = "p99 Latency < 500ms SLO"
  goal         = 0.99

  rolling_period_days = 28

  request_based_sli {
    distribution_cut {
      distribution_filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND resource.labels.service_name = "my-service"
        AND metric.type = "run.googleapis.com/request_latencies"
      EOT
      range {
        max = 500
      }
    }
  }
}

# Alert on SLO burn rate
resource "google_monitoring_alert_policy" "slo_burn_rate" {
  display_name = "SLO Burn Rate Alert"
  combiner     = "OR"

  conditions {
    display_name = "Fast burn rate (1h window)"
    condition_threshold {
      filter          = "select_slo_burn_rate(\"${google_monitoring_slo.availability_slo.id}\", \"3600s\")"
      comparison      = "COMPARISON_GT"
      threshold_value = 10
      duration        = "0s"
    }
  }

  conditions {
    display_name = "Slow burn rate (6h window)"
    condition_threshold {
      filter          = "select_slo_burn_rate(\"${google_monitoring_slo.availability_slo.id}\", \"21600s\")"
      comparison      = "COMPARISON_GT"
      threshold_value = 2
      duration        = "0s"
    }
  }

  notification_channels = [google_monitoring_notification_channel.pagerduty.name]
}

resource "google_monitoring_custom_service" "my_service" {
  service_id   = "my-service"
  display_name = "My Application Service"
}
```

### Step 6: Generate custom dashboards

**Dashboard JSON (gcloud or API):**
```json
{
  "displayName": "Application Overview",
  "mosaicLayout": {
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["resource.label.service_name"]
                  }
                }
              }
            }]
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilterRatio": {
                  "numerator": {
                    "filter": "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  },
                  "denominator": {
                    "filter": "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                }
              }
            }]
          }
        }
      },
      {
        "yPos": 4,
        "width": 12,
        "height": 4,
        "widget": {
          "title": "Request Latency (p50, p95, p99)",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "prometheusQuery": "histogram_quantile(0.99, sum(rate(request_duration_seconds_bucket[5m])) by (le))"
              },
              "plotType": "LINE"
            }]
          }
        }
      }
    ]
  }
}
```

**MQL (Monitoring Query Language) examples:**
```
# Request rate by service
fetch cloud_run_revision
| metric 'run.googleapis.com/request_count'
| align rate(1m)
| group_by [resource.service_name], [value_request_count_aggregate: aggregate(value.request_count)]

# Error ratio
fetch cloud_run_revision
| metric 'run.googleapis.com/request_count'
| align rate(1m)
| group_by [metric.response_code_class], [count: aggregate(value.request_count)]
| ratio

# P99 latency
fetch cloud_run_revision
| metric 'run.googleapis.com/request_latencies'
| align delta(1m)
| group_by [], [value_request_latencies_percentile: percentile(value.request_latencies, 99)]
```

### Step 7: Configure Cloud Logging

**Structured logging (application code):**
```python
import google.cloud.logging
import logging
import json

client = google.cloud.logging.Client()
client.setup_logging()

# Structured log entry
logging.info(json.dumps({
    "message": "Request processed",
    "severity": "INFO",
    "httpRequest": {
        "requestMethod": "GET",
        "requestUrl": "/api/users",
        "status": 200,
        "latency": "0.125s"
    },
    "labels": {
        "user_id": "12345",
        "trace_id": "abc-def-ghi"
    }
}))
```

**Log-based metrics:**
```hcl
resource "google_logging_metric" "error_count" {
  name   = "error_count"
  filter = "resource.type = \"cloud_run_revision\" AND severity >= ERROR"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    labels {
      key         = "service_name"
      value_type  = "STRING"
      description = "Cloud Run service name"
    }
  }

  label_extractors = {
    "service_name" = "EXTRACT(resource.labels.service_name)"
  }
}
```

**Log sinks (export to BigQuery/GCS/Pub/Sub):**
```hcl
resource "google_logging_project_sink" "bigquery_sink" {
  name                   = "audit-logs-to-bigquery"
  destination            = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.audit_logs.dataset_id}"
  filter                 = "logName:\"cloudaudit.googleapis.com\""
  unique_writer_identity = true
  bigquery_options {
    use_partitioned_tables = true
  }
}

resource "google_logging_project_sink" "gcs_sink" {
  name        = "all-logs-to-gcs"
  destination = "storage.googleapis.com/${google_storage_bucket.log_archive.name}"
  filter      = "severity >= WARNING"
  unique_writer_identity = true
}
```

**Log router exclusion filters:**
```hcl
resource "google_logging_project_exclusion" "exclude_healthchecks" {
  name        = "exclude-healthcheck-logs"
  description = "Exclude load balancer health check logs"
  filter      = "resource.type = \"http_load_balancer\" AND httpRequest.requestUrl = \"/health\""
}
```

### Step 8: Configure Cloud Trace and Profiler

**Cloud Trace integration (Node.js):**
```javascript
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new BatchSpanProcessor(new TraceExporter()));
provider.register();
```

**Cloud Profiler:**
```python
import googlecloudprofiler

googlecloudprofiler.start(
    service='my-service',
    service_version='1.0.0',
    verbose=0,
)
```

### Step 9: Configure Managed Prometheus

```yaml
# PodMonitoring for GKE
apiVersion: monitoring.googleapis.com/v1
kind: PodMonitoring
metadata:
  name: my-app-metrics
  namespace: default
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

**PromQL queries in dashboards:**
```
# Request rate
sum(rate(http_requests_total[5m])) by (status_code)

# P99 latency
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Error rate percentage
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

### Step 10: Configure Error Reporting

```python
from google.cloud import error_reporting

client = error_reporting.Client()

try:
    risky_operation()
except Exception:
    client.report_exception()
```

## Best Practices

- Alert on symptoms (latency, error rate) not causes (CPU, memory)
- Use SLOs and error budgets to drive alerting rather than static thresholds
- Use multi-window, multi-burn-rate alerting for SLO-based alerts
- Structure application logs as JSON for better querying and metrics extraction
- Set log retention periods based on compliance requirements and cost
- Use log exclusion filters to remove noisy, low-value log entries
- Use notification rate limiting to prevent alert fatigue
- Add runbook links in alert documentation for faster incident response
- Use metric scopes to monitor resources across multiple projects

## Anti-Patterns

- Do not alert on every metric; focus on user-facing symptoms
- Do not set alert thresholds too low (causes alert fatigue)
- Do not retain all logs indefinitely; use sinks to archive to cheaper storage
- Do not create dashboards without corresponding alerts
- Do not use unstructured log messages; structured JSON enables log-based metrics
- Do not ignore error budgets; they indicate when to slow down releases

## Security Considerations

- Use IAM to restrict who can modify alerting policies and dashboards
- Export audit logs to a separate project for tamper-proof storage
- Use VPC Service Controls to restrict monitoring API access
- Encrypt log sinks at rest with CMEK (Customer-Managed Encryption Keys)
- Monitor IAM policy changes with log-based alerts
- Use Data Access audit logs for sensitive resources

## Cost Optimization

- Use log exclusion filters to reduce ingestion costs for noisy logs
- Export logs to Cloud Storage (cheapest) instead of retaining in Cloud Logging
- Use log sampling for high-volume, low-value logs
- Set appropriate metric alignment periods (longer = fewer data points = lower cost)
- Use summary metrics instead of high-cardinality labels
- Archive logs older than 30 days to Cloud Storage with lifecycle policies
- Use PromQL recording rules to pre-aggregate expensive queries
