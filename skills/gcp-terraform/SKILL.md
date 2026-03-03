---
name: gcp-terraform
description: Generate Terraform configurations for GCP resources with state management, modules, and best practices. Use when the user wants to use Terraform for GCP infrastructure.
argument-hint: "[resources]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(terraform *), Bash(tflint *), Bash(tfsec *), Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a Terraform for GCP expert. Generate production-ready Terraform configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Resources**: what GCP infrastructure to provision
- **State backend**: GCS (recommended), Terraform Cloud, local
- **Structure**: flat, module-based, or Terragrunt
- **Environments**: dev, staging, prod separation strategy

### Step 2: Generate project structure

**Standard module structure:**
```
terraform/
├── main.tf              # Root module, provider config
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── versions.tf          # Required providers and versions
├── backend.tf           # State backend configuration
├── locals.tf            # Local values and computed vars
├── data.tf              # Data sources
├── apis.tf              # google_project_service resources
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
└── modules/
    ├── networking/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── gke/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── cloud-run/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

### Step 3: Generate provider and backend

**versions.tf:**
```hcl
terraform {
  required_version = ">= 1.7"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}
```

**backend.tf:**
```hcl
terraform {
  backend "gcs" {
    bucket = "my-project-terraform-state"
    prefix = "terraform/state"
  }
}
```

**Create state bucket (bootstrap):**
```bash
# Create GCS bucket for Terraform state
gsutil mb -p $PROJECT_ID -l us-central1 -b on gs://$PROJECT_ID-terraform-state

# Enable versioning for state recovery
gsutil versioning set on gs://$PROJECT_ID-terraform-state

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://$PROJECT_ID-terraform-state
```

**main.tf:**
```hcl
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}
```

**locals.tf:**
```hcl
locals {
  project_id  = var.project_id
  region      = var.region
  environment = var.environment

  labels = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
    team        = var.team
  }
}
```

### Step 4: Enable required APIs

```hcl
# apis.tf
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
  ])

  project                    = var.project_id
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}
```

### Step 5: Generate VPC and networking

```hcl
# modules/networking/main.tf
resource "google_compute_network" "vpc" {
  name                    = "${var.name}-vpc"
  auto_create_subnetworks = false
  project                 = var.project_id
}

resource "google_compute_subnetwork" "subnet" {
  for_each = var.subnets

  name          = each.key
  ip_cidr_range = each.value.cidr
  region        = each.value.region
  network       = google_compute_network.vpc.id
  project       = var.project_id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = each.value.pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = each.value.services_cidr
  }

  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_router" "router" {
  name    = "${var.name}-router"
  region  = var.region
  network = google_compute_network.vpc.id
  project = var.project_id
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.name}-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  project                            = var.project_id
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

resource "google_compute_firewall" "allow_internal" {
  name    = "${var.name}-allow-internal"
  network = google_compute_network.vpc.id
  project = var.project_id

  allow {
    protocol = "tcp"
  }
  allow {
    protocol = "udp"
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = [for s in google_compute_subnetwork.subnet : s.ip_cidr_range]
}

# Private Service Connection for Cloud SQL, Memorystore, etc.
resource "google_compute_global_address" "private_ip" {
  name          = "${var.name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
  project       = var.project_id
}

resource "google_service_networking_connection" "private" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]
}
```

### Step 6: Generate GKE cluster

```hcl
# modules/gke/main.tf
resource "google_container_cluster" "primary" {
  name     = "${var.name}-cluster"
  location = var.region
  project  = var.project_id

  # Use a separately managed node pool
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = var.network_id
  subnetwork = var.subnetwork_id

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  release_channel {
    channel = "REGULAR"
  }

  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
    managed_prometheus {
      enabled = true
    }
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  maintenance_policy {
    recurring_window {
      start_time = "2024-01-01T04:00:00Z"
      end_time   = "2024-01-01T08:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA,SU"
    }
  }

  resource_labels = var.labels
}

resource "google_container_node_pool" "primary" {
  name       = "${var.name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  project    = var.project_id

  initial_node_count = var.min_node_count

  autoscaling {
    min_node_count  = var.min_node_count
    max_node_count  = var.max_node_count
    location_policy = "BALANCED"
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type = var.machine_type
    disk_size_gb = var.disk_size_gb
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = var.labels
    tags   = var.network_tags
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
    strategy        = "SURGE"
  }
}
```

### Step 7: Generate Cloud Run service

```hcl
resource "google_cloud_run_v2_service" "default" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  template {
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "ENV"
        value = var.environment
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        period_seconds = 30
      }
    }

    service_account = google_service_account.cloud_run_sa.email

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  labels = var.labels
}

# Allow unauthenticated access (public API)
resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.allow_unauthenticated ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

### Step 8: Generate Cloud SQL instance

```hcl
resource "google_sql_database_instance" "primary" {
  name             = "${var.name}-db"
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier              = var.tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_size         = var.disk_size
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.network_id
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
      }
    }

    maintenance_window {
      day          = 7  # Sunday
      hour         = 4
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = false
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }

    user_labels = var.labels
  }

  deletion_protection = var.environment == "production" ? true : false

  depends_on = [google_service_networking_connection.private]
}

resource "google_sql_database" "default" {
  name     = var.database_name
  instance = google_sql_database_instance.primary.name
  project  = var.project_id
}

resource "google_sql_user" "default" {
  name     = var.db_user
  instance = google_sql_database_instance.primary.name
  password = random_password.db_password.result
  project  = var.project_id
}
```

### Step 9: Generate IAM bindings

```hcl
# Service account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.name}-run-sa"
  display_name = "Cloud Run Service Account for ${var.name}"
  project      = var.project_id
}

# Grant specific permissions (not project-wide roles)
resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer",
    "roles/cloudtrace.agent",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Workload Identity binding for GKE
resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.cloud_run_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.namespace}/${var.ksa_name}]"
}
```

### Step 10: Use official Google Terraform modules

```hcl
# Cloud Foundation Toolkit modules
module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"

  project_id   = var.project_id
  network_name = "${var.name}-vpc"
  routing_mode = "REGIONAL"

  subnets = [
    {
      subnet_name           = "primary"
      subnet_ip             = "10.0.0.0/20"
      subnet_region         = var.region
      subnet_private_access = true
    }
  ]

  secondary_ranges = {
    primary = [
      { range_name = "pods",     ip_cidr_range = "10.4.0.0/14" },
      { range_name = "services", ip_cidr_range = "10.8.0.0/20" },
    ]
  }
}

module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version = "~> 33.0"

  project_id         = var.project_id
  name               = "${var.name}-cluster"
  region             = var.region
  network            = module.vpc.network_name
  subnetwork         = module.vpc.subnets_names[0]
  ip_range_pods      = "pods"
  ip_range_services  = "services"
  enable_private_nodes = true
  master_ipv4_cidr_block = "172.16.0.0/28"

  node_pools = [
    {
      name         = "default-pool"
      machine_type = "e2-standard-4"
      min_count    = 1
      max_count    = 10
      disk_size_gb = 100
      disk_type    = "pd-ssd"
      auto_repair  = true
      auto_upgrade = true
    }
  ]
}
```

### Step 11: Import existing resources

```bash
# Import an existing GCS bucket
terraform import google_storage_bucket.my_bucket my-project/my-bucket

# Import an existing Cloud Run service
terraform import google_cloud_run_v2_service.default projects/my-project/locations/us-central1/services/my-service

# Import an existing GKE cluster
terraform import google_container_cluster.primary projects/my-project/locations/us-central1/clusters/my-cluster

# Generate configuration from existing resources
gcloud resource-config bulk-export \
  --resource-format=terraform \
  --project=$PROJECT_ID \
  --resource-types=ComputeInstance,ComputeNetwork
```

### Step 12: CI/CD with Cloud Build

```yaml
# cloudbuild-terraform.yaml
steps:
  - name: 'hashicorp/terraform:1.7'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        terraform init -backend-config="prefix=terraform/${_ENV}"
        terraform validate
        terraform plan -var-file=environments/${_ENV}.tfvars -out=tfplan
    id: 'plan'

  - name: 'hashicorp/terraform:1.7'
    entrypoint: 'sh'
    args:
      - '-c'
      - 'terraform apply -auto-approve tfplan'
    id: 'apply'
    waitFor: ['plan']

substitutions:
  _ENV: 'dev'
```

## Best Practices

- Pin provider versions with `~> major.minor` constraint
- Use GCS backend with versioning for state management
- Use `for_each` instead of `count` for named resource collections
- Use official `terraform-google-modules` for common patterns
- Always enable `google_project_service` for required APIs before creating resources
- Use `moved` blocks for refactoring without resource recreation
- Run `terraform fmt` and `terraform validate` in CI
- Use data sources to reference existing infrastructure
- Never hardcode project IDs, regions, or credentials
- Use `lifecycle { prevent_destroy = true }` for stateful resources (databases, buckets)

## Anti-Patterns

- Do not use `google_project_iam_binding` (replaces all members); use `google_project_iam_member`
- Do not store state locally for team projects; use GCS backend
- Do not use `count` for resources with meaningful identifiers; use `for_each`
- Do not embed secrets in Terraform files; use Secret Manager or variable files excluded from version control
- Do not use the default compute service account; create dedicated service accounts
- Do not skip `depends_on` for google_project_service; APIs must be enabled before resource creation

## Security Considerations

- Encrypt state bucket with CMEK (Customer-Managed Encryption Keys)
- Use Workload Identity Federation for CI/CD instead of service account keys
- Apply least-privilege IAM to the Terraform service account
- Use VPC Service Controls to restrict Terraform API access
- Review `terraform plan` output before applying, especially for destructive changes
- Use policy-as-code (OPA/Sentinel) to enforce security guardrails
- Never commit `.tfvars` files with secrets to version control

## Cost Optimization

- Use `google_billing_budget` to set budget alerts
- Use committed use discounts for predictable workloads
- Use preemptible/spot VMs for non-critical workloads
- Right-size machine types using Cloud Monitoring recommendations
- Use autoscaling for GKE node pools and Cloud Run services
- Use `lifecycle { ignore_changes }` to avoid drift on auto-scaled resources
- Destroy dev/staging environments outside business hours with automation
