---
name: gcp-iam
description: Generate IAM policies, roles, service accounts, and access management configurations with least-privilege principles. Use when the user wants to configure GCP permissions, Workload Identity, or organizational security.
argument-hint: "[role|policy|service-account|workload-identity]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP IAM security expert. Generate least-privilege IAM configurations for projects, folders, organizations, and workload identity federation.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Resource type**: custom role, IAM policy binding, service account, workload identity
- **Principal**: service account, user, group, domain, external identity
- **Scope**: project, folder, organization, resource-level
- **Access pattern**: GCP service, external workload (AWS, Azure, GitHub Actions, CI/CD)

### Step 2: Understand IAM hierarchy

```
Organization (org-level policies)
  └── Folders (department/team policies)
       └── Projects (project-level policies)
            └── Resources (resource-level policies)
```

**Policy inheritance:**
- Policies are inherited from parent to child
- A binding at the organization level applies to all projects
- Child policies can grant additional permissions, not restrict parent grants
- Use deny policies to explicitly block permissions that would otherwise be inherited

### Step 3: Generate IAM policy bindings

**Project-level binding:**
```bash
# Grant a role to a service account
gcloud projects add-iam-policy-binding my-project \
  --member="serviceAccount:my-sa@my-project.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client" \
  --condition='expression=request.time < timestamp("2025-12-31T00:00:00Z"),title=temporary-access,description=Temporary access until end of year'

# Grant a role to a group
gcloud projects add-iam-policy-binding my-project \
  --member="group:dev-team@company.com" \
  --role="roles/viewer"

# Grant a role to a domain
gcloud projects add-iam-policy-binding my-project \
  --member="domain:company.com" \
  --role="roles/browser"
```

**Resource-level binding (e.g., Cloud Storage bucket):**
```bash
gcloud storage buckets add-iam-policy-binding gs://my-bucket \
  --member="serviceAccount:my-sa@my-project.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

**Terraform IAM bindings:**
```hcl
# Authoritative binding (replaces all members for this role)
resource "google_project_iam_binding" "viewer" {
  project = var.project_id
  role    = "roles/viewer"

  members = [
    "group:dev-team@company.com",
    "serviceAccount:${google_service_account.app.email}",
  ]
}

# Non-authoritative member (adds without removing others)
resource "google_project_iam_member" "cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app.email}"
}

# Resource-level IAM
resource "google_storage_bucket_iam_member" "viewer" {
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.app.email}"
}

# Conditional IAM binding
resource "google_project_iam_member" "conditional" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "group:ops-team@company.com"

  condition {
    title       = "only_dev_instances"
    description = "Only manage instances tagged with env=dev"
    expression  = "resource.matchTag('env', 'dev')"
  }
}
```

### Step 4: Generate custom roles

```bash
# Create a custom role
gcloud iam roles create customStorageReader \
  --project=my-project \
  --title="Custom Storage Reader" \
  --description="Read-only access to specific storage operations" \
  --permissions=storage.objects.get,storage.objects.list,storage.buckets.get \
  --stage=GA
```

**Terraform custom role:**
```hcl
resource "google_project_iam_custom_role" "app_deployer" {
  role_id     = "appDeployer"
  title       = "Application Deployer"
  description = "Deploy applications to Cloud Run and manage Cloud SQL"
  project     = var.project_id
  stage       = "GA"

  permissions = [
    # Cloud Run deployment
    "run.services.get",
    "run.services.list",
    "run.services.create",
    "run.services.update",
    "run.services.delete",
    "run.revisions.get",
    "run.revisions.list",
    "run.revisions.delete",

    # Artifact Registry (container images)
    "artifactregistry.repositories.get",
    "artifactregistry.repositories.list",
    "artifactregistry.dockerimages.get",
    "artifactregistry.dockerimages.list",

    # Cloud SQL (read-only for connection)
    "cloudsql.instances.get",
    "cloudsql.instances.list",
    "cloudsql.instances.connect",

    # Service account usage
    "iam.serviceAccounts.actAs",
  ]
}

# Organization-level custom role
resource "google_organization_iam_custom_role" "security_auditor" {
  role_id     = "securityAuditor"
  org_id      = var.org_id
  title       = "Security Auditor"
  description = "View security configurations across the organization"
  stage       = "GA"

  permissions = [
    "iam.roles.get",
    "iam.roles.list",
    "iam.serviceAccounts.get",
    "iam.serviceAccounts.list",
    "resourcemanager.projects.get",
    "resourcemanager.projects.list",
    "securitycenter.findings.list",
    "securitycenter.findings.get",
    "logging.logEntries.list",
  ]
}
```

### Step 5: Generate service accounts

```bash
# Create a service account
gcloud iam service-accounts create my-app-sa \
  --display-name="My Application Service Account" \
  --description="Used by the order processing application"

# Grant roles to the service account
gcloud projects add-iam-policy-binding my-project \
  --member="serviceAccount:my-app-sa@my-project.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant another service account permission to impersonate this one
gcloud iam service-accounts add-iam-policy-binding \
  my-app-sa@my-project.iam.gserviceaccount.com \
  --member="serviceAccount:ci-cd@my-project.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

**Terraform service account with roles:**
```hcl
resource "google_service_account" "app" {
  account_id   = "my-app-sa"
  display_name = "My Application Service Account"
  description  = "Used by the order processing application"
  project      = var.project_id
}

# Grant specific roles
resource "google_project_iam_member" "app_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/pubsub.publisher",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/cloudtrace.agent",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.app.email}"
}

# Disable service account key creation (enforce Workload Identity)
resource "google_project_organization_policy" "disable_sa_keys" {
  project    = var.project_id
  constraint = "iam.disableServiceAccountKeyCreation"

  boolean_policy {
    enforced = true
  }
}
```

### Step 6: Generate Workload Identity Federation

**For GitHub Actions:**
```hcl
# Create Workload Identity Pool
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
  description               = "Identity pool for GitHub Actions CI/CD"
  project                   = var.project_id
}

# Create Workload Identity Provider
resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"
  project                            = var.project_id

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  attribute_condition = "assertion.repository_owner == '${var.github_org}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Allow GitHub Actions to impersonate service account
resource "google_service_account_iam_member" "github_impersonation" {
  service_account_id = google_service_account.deployer.id
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}
```

**GitHub Actions workflow usage:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: "projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
          service_account: "deployer@my-project.iam.gserviceaccount.com"

      - uses: google-github-actions/setup-gcloud@v2

      - run: gcloud run deploy my-service --image=...
```

**For AWS workloads:**
```hcl
resource "google_iam_workload_identity_pool_provider" "aws" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.external.workload_identity_pool_id
  workload_identity_pool_provider_id = "aws-provider"
  display_name                       = "AWS Provider"
  project                            = var.project_id

  attribute_mapping = {
    "google.subject"     = "assertion.arn"
    "attribute.account"  = "assertion.account"
    "attribute.role"     = "assertion.arn.extract('/assumed-role/{role}/')"
  }

  attribute_condition = "assertion.account == '${var.aws_account_id}'"

  aws {
    account_id = var.aws_account_id
  }
}
```

**For Azure workloads:**
```hcl
resource "google_iam_workload_identity_pool_provider" "azure" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.external.workload_identity_pool_id
  workload_identity_pool_provider_id = "azure-provider"
  display_name                       = "Azure Provider"
  project                            = var.project_id

  attribute_mapping = {
    "google.subject" = "assertion.sub"
    "attribute.tid"  = "assertion.tid"
  }

  attribute_condition = "assertion.tid == '${var.azure_tenant_id}'"

  oidc {
    issuer_uri = "https://login.microsoftonline.com/${var.azure_tenant_id}/v2.0"
  }
}
```

### Step 7: Generate IAM conditions

```hcl
# Time-based condition (temporary access)
resource "google_project_iam_member" "temporary" {
  project = var.project_id
  role    = "roles/editor"
  member  = "user:contractor@company.com"

  condition {
    title       = "temporary_access"
    description = "Access expires at end of Q1 2025"
    expression  = "request.time < timestamp('2025-03-31T23:59:59Z')"
  }
}

# Resource-based condition (tag-based access)
resource "google_project_iam_member" "dev_only" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "group:developers@company.com"

  condition {
    title       = "dev_instances_only"
    description = "Only manage dev-tagged instances"
    expression  = "resource.matchTag('env', 'dev')"
  }
}

# Resource name condition
resource "google_project_iam_member" "prefix_access" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.app.email}"

  condition {
    title      = "prefix_restricted"
    expression = "resource.name.startsWith('projects/_/buckets/my-bucket/objects/public/')"
  }
}

# IP-based condition with Access Context Manager
resource "google_access_context_manager_access_level" "corporate_network" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/accessLevels/corporate"
  title  = "Corporate Network"

  basic {
    conditions {
      ip_subnetworks = [
        "203.0.113.0/24",
        "198.51.100.0/24",
      ]
    }
  }
}
```

### Step 8: Generate deny policies

```hcl
# Deny policy to prevent specific actions
resource "google_iam_deny_policy" "prevent_public_access" {
  parent       = urlencode("cloudresourcemanager.googleapis.com/projects/${var.project_id}")
  name         = "prevent-public-storage"
  display_name = "Prevent Public Storage Access"

  rules {
    description = "Deny making storage buckets or objects public"

    deny_rule {
      denied_principals = ["principalSet://goog/public:all"]

      denied_permissions = [
        "storage.googleapis.com/buckets.setIamPolicy",
        "storage.googleapis.com/objects.setIamPolicy",
      ]

      denial_condition {
        title      = "deny_public_iam"
        expression = "true" # Always deny
      }
    }
  }
}
```

### Step 9: Generate organization policies

```hcl
# Restrict which regions resources can be created in
resource "google_org_policy_policy" "restrict_locations" {
  name   = "projects/${var.project_id}/policies/gcp.resourceLocations"
  parent = "projects/${var.project_id}"

  spec {
    rules {
      values {
        allowed_values = [
          "in:us-locations",
          "in:eu-locations",
        ]
      }
    }
  }
}

# Require uniform bucket-level access
resource "google_org_policy_policy" "uniform_bucket_access" {
  name   = "projects/${var.project_id}/policies/storage.uniformBucketLevelAccess"
  parent = "projects/${var.project_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}

# Disable service account key creation
resource "google_org_policy_policy" "disable_sa_keys" {
  name   = "projects/${var.project_id}/policies/iam.disableServiceAccountKeyCreation"
  parent = "projects/${var.project_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}

# Domain-restricted sharing
resource "google_org_policy_policy" "domain_restricted" {
  name   = "organizations/${var.org_id}/policies/iam.allowedPolicyMemberDomains"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      values {
        allowed_values = [
          "C0xxxxxxx", # Google Workspace customer ID
        ]
      }
    }
  }
}
```

### Step 10: Generate VPC Service Controls

```hcl
# Service perimeter to restrict data exfiltration
resource "google_access_context_manager_service_perimeter" "data_perimeter" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/servicePerimeters/data_perimeter"
  title  = "Data Perimeter"

  status {
    restricted_services = [
      "bigquery.googleapis.com",
      "storage.googleapis.com",
      "secretmanager.googleapis.com",
    ]

    resources = [
      "projects/${data.google_project.current.number}",
    ]

    access_levels = [
      google_access_context_manager_access_level.corporate_network.name,
    ]

    ingress_policies {
      ingress_from {
        identity_type = "ANY_IDENTITY"
        sources {
          access_level = google_access_context_manager_access_level.corporate_network.name
        }
      }
      ingress_to {
        resources = ["*"]
        operations {
          service_name = "storage.googleapis.com"
          method_selectors {
            method = "google.storage.objects.get"
          }
        }
      }
    }

    egress_policies {
      egress_from {
        identity_type = "ANY_IDENTITY"
      }
      egress_to {
        resources = ["projects/${var.external_project_number}"]
        operations {
          service_name = "bigquery.googleapis.com"
          method_selectors {
            method = "*"
          }
        }
      }
    }
  }
}
```

### Step 11: Service account impersonation

```bash
# Generate short-lived access token via impersonation
gcloud auth print-access-token \
  --impersonate-service-account=target-sa@my-project.iam.gserviceaccount.com

# Use impersonation in gcloud commands
gcloud storage ls gs://my-bucket \
  --impersonate-service-account=target-sa@my-project.iam.gserviceaccount.com
```

**Python impersonation:**
```python
from google.auth import impersonated_credentials
import google.auth

# Get default credentials (source credentials)
source_credentials, project = google.auth.default()

# Create impersonated credentials
target_credentials = impersonated_credentials.Credentials(
    source_credentials=source_credentials,
    target_principal="target-sa@my-project.iam.gserviceaccount.com",
    target_scopes=["https://www.googleapis.com/auth/cloud-platform"],
    lifetime=3600,  # 1 hour
)

# Use impersonated credentials with any client library
from google.cloud import storage
client = storage.Client(credentials=target_credentials)
```

### Step 12: IAM Recommender and Policy Analyzer

```bash
# List IAM recommendations (unused permissions)
gcloud recommender recommendations list \
  --project=my-project \
  --recommender=google.iam.policy.Recommender \
  --location=global

# Analyze IAM policies (who has access to what)
gcloud asset analyze-iam-policy \
  --organization=ORG_ID \
  --identity="user:admin@company.com" \
  --full-resource-name="//storage.googleapis.com/projects/_/buckets/my-bucket"

# Check what permissions a member has
gcloud projects get-iam-policy my-project \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:my-sa@my-project.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

## Best practices

- **Use Workload Identity Federation** instead of service account keys for external workloads
- **Follow least privilege** -- start with zero permissions and add only what is needed
- **Use predefined roles** over primitive roles (viewer, editor, owner)
- **Create custom roles** for fine-grained access when predefined roles are too broad
- **Use IAM conditions** for temporary access, resource-based restrictions, and time-based expiry
- **Disable service account key creation** via organization policy
- **Use impersonation** for short-lived credentials instead of long-lived keys
- **Apply organization policies** for guardrails (region restrictions, domain-restricted sharing)
- **Enable VPC Service Controls** for sensitive data perimeters
- **Audit regularly** with IAM Recommender, Policy Analyzer, and Cloud Audit Logs
- **Use groups** for human access (never bind roles to individual users)
- **Prefer google_project_iam_member** over google_project_iam_binding in Terraform (non-authoritative)

## Anti-patterns

- Granting `roles/editor` or `roles/owner` to service accounts
- Using service account keys instead of Workload Identity Federation
- Binding roles to individual users instead of groups
- Not using conditions for temporary or scoped access
- Granting project-level roles when resource-level bindings suffice
- Sharing service accounts across multiple applications
- Not rotating service account keys (if keys must be used)
- Ignoring IAM Recommender suggestions for unused permissions

## Cost optimization

- IAM itself is free, but overly broad permissions can lead to accidental resource usage
- Use IAM Recommender to identify and remove unused permissions
- Enforce organization policies to prevent unauthorized resource creation
- Use budget alerts alongside IAM to prevent cost overruns
- Regularly review and clean up unused service accounts

## Security considerations

- Enable Cloud Audit Logs for all IAM changes (Admin Activity is on by default)
- Use deny policies to create guardrails that override allow policies
- Implement domain-restricted sharing to prevent external access
- Use VPC Service Controls to prevent data exfiltration
- Enforce MFA for human users via Google Workspace
- Monitor for anomalous IAM activity with Security Command Center
- Rotate service account keys if keys are absolutely necessary (prefer WIF)
- Use attribute conditions in Workload Identity providers to restrict external access
