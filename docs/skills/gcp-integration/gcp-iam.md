# GCP IAM

Generate least-privilege IAM policies, custom roles, service accounts, workload identity bindings, and organizational access controls following Google Cloud security best practices.

## Usage

```bash
/gcp-iam <description of the permissions you need>
```

## What It Does

1. Analyzes required Google Cloud service access and generates least-privilege IAM bindings
2. Creates custom roles with granular permissions scoped to specific resources
3. Generates service accounts with appropriate role assignments and key management
4. Configures workload identity federation for external identity providers
5. Produces organization policies and hierarchical IAM inheritance strategies
6. Adds IAM conditions for time-based, resource-based, and attribute-based access control

## Examples

```bash
/gcp-iam Create a service account with read-only access to Cloud Storage and BigQuery

/gcp-iam Design workload identity federation for GitHub Actions deploying to Cloud Run

/gcp-iam Generate a custom role with fine-grained permissions for a data engineering team
```

## Allowed Tools

- `Read` - Read existing IAM policies and service account configurations
- `Write` - Create IAM policy bindings, custom role definitions, and service account specs
- `Edit` - Modify existing IAM configurations
- `Bash` - Run gcloud CLI commands for IAM policy validation and testing
- `Glob` - Search for IAM-related configuration files
- `Grep` - Find role bindings and service account references across the project

<div class="badge-row">
  <span class="badge">Security</span>
  <span class="badge">Policies</span>
  <span class="badge">GCP</span>
</div>
