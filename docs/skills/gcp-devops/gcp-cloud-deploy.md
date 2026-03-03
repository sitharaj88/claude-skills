# GCP Cloud Deploy

Generate Cloud Deploy delivery pipelines with progressive delivery, canary deployments, rollback strategies, and multi-environment promotion for Google Cloud.

## Usage

```bash
/gcp-cloud-deploy <description of your delivery pipeline>
```

## What It Does

1. Generates delivery pipeline definitions with serial stages for dev, staging, and production
2. Configures target environments for Cloud Run, GKE, and Anthos runtimes
3. Sets up canary deployment strategies with traffic splitting and verification phases
4. Creates Skaffold configurations with environment-specific profiles
5. Configures automation rules for auto-promotion and canary phase advancement
6. Implements rollback strategies with manual and automatic compensation

## Examples

```bash
/gcp-cloud-deploy Create a delivery pipeline with dev, staging, and production targets for Cloud Run

/gcp-cloud-deploy Set up canary deployments with 10%, 25%, 50% traffic splitting and verification

/gcp-cloud-deploy Configure auto-promotion from dev to staging with approval gates for production
```

## What It Covers

- **Delivery pipelines** - Serial stage definitions with deploy parameters and strategies
- **Target configuration** - Cloud Run, GKE, and multi-target (multi-region) setups
- **Canary deployments** - Progressive traffic splitting with verification at each phase
- **Skaffold integration** - Environment profiles, Cloud Run manifests, and Kustomize overlays
- **Deployment verification** - Smoke tests and integration tests using container-based verify steps
- **Deploy hooks** - Pre-deploy and post-deploy actions for migrations and health checks
- **Rollback strategies** - Automatic rollback on verification failure and manual rollback commands
- **Automation rules** - Auto-promote releases and auto-advance canary phases
- **Approval gates** - Manual approval requirements for production targets with IAM controls

<div class="badge-row">
  <span class="badge">Delivery</span>
  <span class="badge">Canary</span>
  <span class="badge">GCP</span>
</div>

## Allowed Tools

- `Read` - Read existing delivery pipeline and Skaffold configurations
- `Write` - Create pipeline definitions, target configs, and Skaffold profiles
- `Edit` - Modify existing Cloud Deploy configurations
- `Bash` - Run gcloud deploy commands for releases, promotions, and rollouts
- `Glob` - Search for delivery pipeline and Skaffold YAML files
- `Grep` - Find target references and deploy parameter usage
