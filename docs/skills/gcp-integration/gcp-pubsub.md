# GCP Pub/Sub

Generate topics, subscriptions, dead-letter policies, push/pull configurations, message schemas, and event-driven messaging architectures on Google Cloud.

## Usage

```bash
/gcp-pubsub <description of the messaging setup you need>
```

## What It Does

1. Analyzes messaging requirements and generates Pub/Sub topic and subscription configurations
2. Creates push and pull subscription patterns with appropriate acknowledgment deadlines
3. Generates dead-letter topic policies with retry thresholds and forwarding rules
4. Configures message schemas using Avro or Protocol Buffers for data validation
5. Produces ordering key strategies and exactly-once delivery configurations
6. Adds IAM bindings, filtering expressions, and monitoring/alerting setups

## Examples

```bash
/gcp-pubsub Create a fan-out pattern with one topic and three subscriptions for order processing

/gcp-pubsub Design a dead-letter queue setup with retry policies and exponential backoff

/gcp-pubsub Generate a push subscription to a Cloud Run service with authentication
```

## Allowed Tools

- `Read` - Read existing Pub/Sub configurations and message schemas
- `Write` - Create topic definitions, subscription configs, and schema files
- `Edit` - Modify existing Pub/Sub configurations
- `Bash` - Run gcloud CLI commands for Pub/Sub resource management
- `Glob` - Search for messaging-related configuration files
- `Grep` - Find topic and subscription references across the project

<div class="badge-row">
  <span class="badge">Messaging</span>
  <span class="badge">Streaming</span>
  <span class="badge">GCP</span>
</div>
