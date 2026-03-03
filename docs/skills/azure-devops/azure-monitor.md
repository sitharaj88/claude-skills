# Azure Monitor

Generate Azure Monitor dashboards, alert rules, log analytics queries, and Application Insights configurations for comprehensive observability.

## Usage

```bash
/azure-monitor <description of your monitoring setup>
```

## What It Does

1. Generates Azure Monitor alert rules with action groups and severity levels
2. Creates Log Analytics workspace queries using Kusto Query Language (KQL)
3. Configures Application Insights with custom telemetry, availability tests, and live metrics
4. Sets up Azure Dashboards with metric charts, log queries, and resource health tiles
5. Defines autoscale rules based on metrics, schedules, and predictive scaling
6. Integrates diagnostic settings for resource logs, metrics, and activity log forwarding

## Examples

```bash
/azure-monitor Create alert rules for App Service response time, failure rate, and CPU with an email and Teams action group

/azure-monitor Set up a Log Analytics workspace with KQL queries for tracking API latency percentiles and error trends

/azure-monitor Build a dashboard with Application Insights metrics, resource health, and cost analysis tiles
```

## What It Covers

- **Alert rules** - Metric alerts, log alerts, activity log alerts, and smart detection
- **Action groups** - Email, SMS, webhook, Azure Function, Logic App, and ITSM notifications
- **Log Analytics** - Workspace configuration, KQL queries, saved searches, and functions
- **Application Insights** - Instrumentation, custom events, dependencies, and availability tests
- **Dashboards** - Shared dashboards with metric tiles, log query visualizations, and markdown
- **Diagnostic settings** - Resource log collection, metric streaming, and archive policies
- **Autoscale** - Metric-based rules, schedule-based scaling, and predictive autoscale
- **Workbooks** - Interactive reports with parameters, queries, and conditional formatting
- **Service health** - Health alerts, planned maintenance, and resource health monitoring
- **Cost management** - Log Analytics commitment tiers, data retention, and ingestion limits

<div class="badge-row">
  <span class="badge">Monitoring</span>
  <span class="badge">Observability</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing monitoring configurations and alert definitions
- `Write` - Create alert rules, dashboards, and diagnostic settings
- `Edit` - Modify existing monitoring configurations
- `Bash` - Run az monitor, az grafana, and az resource CLI commands
- `Glob` - Search for monitoring configuration and ARM template files
- `Grep` - Find metric references, KQL queries, and resource IDs
