# GCP Cloud Tasks

Generate task queues, HTTP targets, retry policies, rate limiting configurations, and deferred processing workflows on Google Cloud.

## Usage

```bash
/gcp-cloud-tasks <description of the task queue setup you need>
```

## What It Does

1. Analyzes asynchronous processing requirements and generates Cloud Tasks queue configurations
2. Creates HTTP and App Engine target tasks with appropriate headers and authentication
3. Generates retry policies with exponential backoff, max attempts, and dispatch deadlines
4. Configures rate limiting with max dispatches per second, max concurrent dispatches, and burst size
5. Produces task scheduling patterns with delayed execution and deduplication strategies
6. Adds OIDC/OAuth token configurations for authenticated task delivery

## Examples

```bash
/gcp-cloud-tasks Create a task queue for sending emails with rate limiting of 10 per second

/gcp-cloud-tasks Design a distributed task processing pipeline with retry and dead-letter handling

/gcp-cloud-tasks Generate an HTTP target task queue that calls a Cloud Run endpoint with OIDC auth
```

## Allowed Tools

- `Read` - Read existing Cloud Tasks configurations and queue definitions
- `Write` - Create queue configs, task templates, and handler code
- `Edit` - Modify existing task queue configurations
- `Bash` - Run gcloud CLI commands for Cloud Tasks management
- `Glob` - Search for task-related configuration files
- `Grep` - Find queue and task handler references across the project

<div class="badge-row">
  <span class="badge">Queues</span>
  <span class="badge">Async</span>
  <span class="badge">GCP</span>
</div>
