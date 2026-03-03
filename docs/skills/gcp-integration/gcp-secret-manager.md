# GCP Secret Manager

Generate secret storage configurations, versioning strategies, automatic rotation policies, and secure access patterns for managing sensitive data on Google Cloud.

## Usage

```bash
/gcp-secret-manager <description of the secret management setup you need>
```

## What It Does

1. Analyzes secret storage requirements and generates Secret Manager configurations
2. Creates secrets with versioning, labels, and replication policies across regions
3. Generates automatic rotation schedules with Cloud Functions and Pub/Sub notifications
4. Configures fine-grained IAM access controls for secret versions and accessor roles
5. Produces application integration patterns for Cloud Run, GKE, and Cloud Functions
6. Adds customer-managed encryption keys (CMEK) and audit logging configurations

## Examples

```bash
/gcp-secret-manager Create a secret with automatic rotation every 30 days using a Cloud Function

/gcp-secret-manager Design a multi-region secret replication strategy for a globally distributed app

/gcp-secret-manager Generate a Kubernetes workload setup that mounts secrets from Secret Manager
```

## Allowed Tools

- `Read` - Read existing secret configurations and rotation policies
- `Write` - Create secret definitions, rotation functions, and access patterns
- `Edit` - Modify existing Secret Manager configurations
- `Bash` - Run gcloud CLI commands for secret management operations
- `Glob` - Search for secret-related configuration files
- `Grep` - Find secret references and accessor patterns across the project

<div class="badge-row">
  <span class="badge">Secrets</span>
  <span class="badge">Encryption</span>
  <span class="badge">GCP</span>
</div>
