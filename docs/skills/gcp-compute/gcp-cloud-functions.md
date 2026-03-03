# GCP Cloud Functions

Generate Cloud Functions with HTTP triggers, event-driven triggers, IAM bindings, and deployment configurations across multiple runtimes.

## Usage

```bash
/gcp-cloud-functions <description of your Cloud Function>
```

## What It Does

1. Analyzes your requirements and selects the appropriate runtime (Node.js, Python, Go)
2. Generates the function entry point code with proper error handling and logging
3. Creates IAM bindings with least-privilege permissions for the function's service account
4. Configures event triggers (HTTP, Cloud Storage, Pub/Sub, Firestore, Eventarc)
5. Produces Terraform or gcloud deployment scripts with environment variables and secrets
6. Adds retry policies, timeout settings, and concurrency configuration

## Examples

```bash
/gcp-cloud-functions Create a Node.js function triggered by Cloud Storage uploads that generates thumbnails

/gcp-cloud-functions Build a Python HTTP function with Firestore access and API key authentication

/gcp-cloud-functions Create a Go function that processes Pub/Sub messages for order notifications
```

## What It Covers

- **1st Gen and 2nd Gen** Cloud Functions configuration
- **Event triggers** including HTTP, Cloud Storage, Pub/Sub, Firestore, and Eventarc
- **IAM and security** with service accounts and invoker permissions
- **Environment variables** and Secret Manager integration
- **VPC connectors** for accessing private resources
- **Deployment** via Terraform, gcloud CLI, or Cloud Build

<div class="badge-row">
  <span class="badge">GCP</span>
  <span class="badge">Serverless</span>
  <span class="badge">Cloud Functions</span>
</div>

## Allowed Tools

- `Read` - Read existing project files for context
- `Write` - Create function handlers, templates, and config files
- `Edit` - Modify existing Cloud Functions configurations
- `Bash` - Run gcloud CLI commands for local testing and deployment
- `Glob` - Search for related project files
- `Grep` - Find references and dependencies
