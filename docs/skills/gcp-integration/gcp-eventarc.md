# GCP Eventarc

Generate event-driven triggers, routing rules, Cloud Audit Log integrations, event filtering, and cross-service event architectures on Google Cloud.

## Usage

```bash
/gcp-eventarc <description of the event-driven setup you need>
```

## What It Does

1. Analyzes event-driven requirements and generates Eventarc trigger configurations
2. Creates Cloud Audit Log triggers for capturing resource state changes across GCP services
3. Generates direct event triggers from Pub/Sub, Cloud Storage, and other supported sources
4. Configures event filtering with path patterns, service names, and method matching
5. Produces event routing to Cloud Run, Cloud Functions, GKE, and Workflows destinations
6. Adds channel configurations for third-party event providers and custom event sources

## Examples

```bash
/gcp-eventarc Create a trigger that routes Cloud Storage upload events to a Cloud Run service

/gcp-eventarc Design an event pipeline using Audit Logs to track BigQuery job completions

/gcp-eventarc Generate cross-project event routing with custom channels and filtering
```

## Allowed Tools

- `Read` - Read existing Eventarc trigger definitions and event schemas
- `Write` - Create trigger configurations, event filters, and routing rules
- `Edit` - Modify existing Eventarc configurations
- `Bash` - Run gcloud CLI commands for Eventarc resource management
- `Glob` - Search for event-related configuration files
- `Grep` - Find trigger and event handler references across the project

<div class="badge-row">
  <span class="badge">Events</span>
  <span class="badge">Triggers</span>
  <span class="badge">GCP</span>
</div>
