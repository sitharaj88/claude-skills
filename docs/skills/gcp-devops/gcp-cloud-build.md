# GCP Cloud Build

Generate Cloud Build configurations with multi-step pipelines, build triggers, caching strategies, and CI/CD workflows for Google Cloud.

## Usage

```bash
/gcp-cloud-build <description of your CI/CD pipeline>
```

## What It Does

1. Generates `cloudbuild.yaml` configurations with multi-step build pipelines
2. Configures build triggers for GitHub push, pull request, manual, Pub/Sub, and webhook events
3. Sets up Kaniko-based container builds with layer caching for Artifact Registry
4. Integrates Secret Manager for secure credential access during builds
5. Configures parallel and conditional build steps with `waitFor` dependencies
6. Sets up private worker pools for VPC-accessible builds and approval gates

## Examples

```bash
/gcp-cloud-build Create a CI/CD pipeline that builds a Node.js app, runs tests, and deploys to Cloud Run

/gcp-cloud-build Set up a multi-environment pipeline with dev, staging, and production stages

/gcp-cloud-build Configure a GitHub PR trigger with linting, testing, and Kaniko container builds
```

## What It Covers

- **Build configuration** - cloudbuild.yaml with steps, substitutions, options, and timeouts
- **Trigger types** - GitHub push, pull request, manual, Pub/Sub, and webhook triggers
- **Container builds** - Kaniko executor with caching, Artifact Registry integration
- **Secrets management** - Secret Manager integration for build-time credentials
- **Caching** - Cloud Storage dependency caching and Kaniko layer caching
- **Private pools** - VPC-peered worker pools for accessing private resources
- **Parallelism** - Parallel step execution with `waitFor` and conditional branching
- **Notifications** - Pub/Sub build notifications and Cloud Functions handlers
- **Service accounts** - Dedicated service accounts with least-privilege IAM roles

<div class="badge-row">
  <span class="badge">CI/CD</span>
  <span class="badge">Pipelines</span>
  <span class="badge">GCP</span>
</div>

## Allowed Tools

- `Read` - Read existing Cloud Build configurations and Dockerfiles
- `Write` - Create cloudbuild.yaml, trigger configs, and build scripts
- `Edit` - Modify existing Cloud Build configurations
- `Bash` - Run gcloud builds commands for trigger management and build inspection
- `Glob` - Search for cloudbuild.yaml and Dockerfile files
- `Grep` - Find build step references and substitution variables
