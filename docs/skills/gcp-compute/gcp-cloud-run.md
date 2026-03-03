# GCP Cloud Run

Generate Cloud Run services with Dockerfiles, traffic splitting, IAM policies, revision configurations, and custom domain mappings.

## Usage

```bash
/gcp-cloud-run <description of your Cloud Run service>
```

## What It Does

1. Generates Dockerfiles optimized for Cloud Run with minimal image sizes
2. Creates Cloud Run service configurations with CPU, memory, and concurrency settings
3. Configures traffic splitting between revisions for canary and blue-green deployments
4. Sets up IAM policies for authentication and service-to-service communication
5. Produces Terraform or gcloud deployment scripts with environment variables and secrets
6. Adds custom domain mappings, VPC connectors, and Cloud SQL connections

## Examples

```bash
/gcp-cloud-run Create a Python FastAPI service with Cloud SQL PostgreSQL and automatic scaling to 100 instances

/gcp-cloud-run Set up a Node.js service with traffic splitting 90/10 between stable and canary revisions

/gcp-cloud-run Build a Go microservice with Pub/Sub push subscriptions and private networking via VPC connector
```

## What It Covers

- **Service configuration** with CPU, memory, concurrency, and timeout settings
- **Container builds** with multi-stage Dockerfiles and Cloud Build integration
- **Traffic management** with revision tags, gradual rollouts, and rollback
- **Authentication** with IAM invoker permissions and identity-aware proxy
- **Networking** with VPC connectors, ingress settings, and custom domains
- **Integrations** with Cloud SQL, Secret Manager, Pub/Sub, and Eventarc

<div class="badge-row">
  <span class="badge">GCP</span>
  <span class="badge">Serverless</span>
  <span class="badge">Containers</span>
</div>

## Allowed Tools

- `Read` - Read existing service and container configurations
- `Write` - Create Dockerfiles, service configs, and deployment scripts
- `Edit` - Modify existing Cloud Run service settings
- `Bash` - Run gcloud CLI commands for deployment and traffic management
- `Glob` - Search for container and service-related files
- `Grep` - Find service references and environment configurations
