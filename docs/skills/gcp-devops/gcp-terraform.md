# GCP Terraform

Generate Terraform configurations for GCP infrastructure with state management, reusable modules, workspaces, and best practices.

## Usage

```bash
/gcp-terraform <description of your infrastructure>
```

## What It Does

1. Generates Terraform configurations with Google and Google Beta providers
2. Creates reusable modules for networking, GKE, Cloud Run, Cloud SQL, and IAM
3. Configures GCS remote state backends with versioning and state locking
4. Sets up environment-specific variable files for dev, staging, and production
5. Enables required GCP APIs with `google_project_service` resources
6. Integrates Cloud Foundation Toolkit modules for common infrastructure patterns

## Examples

```bash
/gcp-terraform Create a VPC with private subnets, Cloud NAT, and firewall rules

/gcp-terraform Set up a GKE private cluster with Workload Identity and autoscaling node pools

/gcp-terraform Build a Cloud Run service with Cloud SQL, Secret Manager, and VPC connector
```

## What It Covers

- **Project structure** - Standard module layout with main.tf, variables.tf, outputs.tf, and backend.tf
- **Provider configuration** - Google and Google Beta providers with version pinning
- **State management** - GCS backend with versioning, uniform bucket-level access, and bootstrapping
- **VPC networking** - Custom VPCs, subnets, Cloud NAT, firewall rules, and private service connections
- **GKE clusters** - Private clusters with Workload Identity, autoscaling, and monitoring
- **Cloud Run services** - v2 service definitions with probes, VPC access, and Secret Manager
- **Cloud SQL** - PostgreSQL instances with private networking, backups, and query insights
- **IAM bindings** - Service accounts with least-privilege roles and Workload Identity
- **Official modules** - Cloud Foundation Toolkit modules for network, GKE, and more
- **CI/CD integration** - Cloud Build pipelines for terraform plan and apply

<div class="badge-row">
  <span class="badge">HCL</span>
  <span class="badge">IaC</span>
  <span class="badge">GCP</span>
</div>

## Allowed Tools

- `Read` - Read existing Terraform configurations and modules
- `Write` - Create Terraform files, modules, and variable definitions
- `Edit` - Modify existing Terraform configurations
- `Bash` - Run terraform init, plan, validate, fmt, and gcloud commands
- `Glob` - Search for .tf and .tfvars files
- `Grep` - Find resource references and module sources
