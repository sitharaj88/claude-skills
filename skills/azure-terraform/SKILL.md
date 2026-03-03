---
name: azure-terraform
description: Generate Terraform configurations for Azure resources with best practices, modules, and state management. Use when the user wants to use Terraform for Azure infrastructure.
argument-hint: "[resource types] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(terraform *), Bash(tflint *), Bash(tfsec *), Bash(az *)
user-invocable: true
---

## Instructions

You are a Terraform for Azure expert. Generate production-ready Terraform configurations using the AzureRM provider.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Resources**: what Azure infrastructure to provision
- **Authentication**: Azure CLI, managed identity, service principal, OIDC
- **State backend**: Azure Storage (recommended), Terraform Cloud, local
- **Structure**: flat, module-based, or landing zone pattern
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
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
└── modules/
    ├── networking/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── aks/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── app-service/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

### Step 3: Generate provider and backend configuration

**versions.tf:**
```hcl
terraform {
  required_version = ">= 1.7"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
  }
}
```

**backend.tf (Azure Storage):**
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "tfstate<unique>"
    container_name       = "tfstate"
    key                  = "project/terraform.tfstate"
    use_oidc             = true  # For workload identity federation
  }
}
```

**Provider configuration with authentication methods:**

```hcl
# Azure CLI authentication (local development)
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
  subscription_id = var.subscription_id
}

# Service principal authentication (CI/CD)
provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
}

# Managed identity authentication (Azure-hosted runners)
provider "azurerm" {
  features {}
  subscription_id     = var.subscription_id
  use_msi             = true
}

# OIDC / Workload identity federation (recommended for CI/CD)
provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  use_oidc        = true
}
```

### Step 4: Bootstrap state backend

```hcl
# bootstrap/main.tf - Run once to create state backend
resource "azurerm_resource_group" "tfstate" {
  name     = "tfstate-rg"
  location = var.location
}

resource "azurerm_storage_account" "tfstate" {
  name                          = "tfstate${var.unique_suffix}"
  resource_group_name           = azurerm_resource_group.tfstate.name
  location                      = azurerm_resource_group.tfstate.location
  account_tier                  = "Standard"
  account_replication_type      = "GRS"
  min_tls_version               = "TLS1_2"
  public_network_access_enabled = false

  blob_properties {
    versioning_enabled = true
    delete_retention_policy {
      days = 30
    }
  }
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}
```

### Step 5: Generate networking module

**modules/networking/main.tf:**
```hcl
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-${var.environment}-vnet"
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = [var.vnet_address_space]

  tags = var.tags
}

resource "azurerm_subnet" "subnets" {
  for_each = var.subnets

  name                                          = each.key
  resource_group_name                           = var.resource_group_name
  virtual_network_name                          = azurerm_virtual_network.main.name
  address_prefixes                              = [each.value.address_prefix]
  private_endpoint_network_policies             = each.value.private_endpoint_network_policies
  private_link_service_network_policies_enabled = each.value.private_link_service_network_policies

  dynamic "delegation" {
    for_each = each.value.delegation != null ? [each.value.delegation] : []
    content {
      name = delegation.value.name
      service_delegation {
        name    = delegation.value.service_name
        actions = delegation.value.actions
      }
    }
  }
}

resource "azurerm_network_security_group" "main" {
  for_each = var.subnets

  name                = "${each.key}-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_subnet_network_security_group_association" "main" {
  for_each = var.subnets

  subnet_id                 = azurerm_subnet.subnets[each.key].id
  network_security_group_id = azurerm_network_security_group.main[each.key].id
}
```

**modules/networking/variables.tf:**
```hcl
variable "project_name" {
  type        = string
  description = "Project name for resource naming"
}

variable "environment" {
  type        = string
  description = "Environment (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "vnet_address_space" {
  type        = string
  description = "VNet address space CIDR"
  default     = "10.0.0.0/16"
}

variable "subnets" {
  type = map(object({
    address_prefix                          = string
    private_endpoint_network_policies       = optional(string, "Enabled")
    private_link_service_network_policies   = optional(bool, true)
    delegation = optional(object({
      name         = string
      service_name = string
      actions      = list(string)
    }))
  }))
  description = "Map of subnet configurations"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Resource tags"
}
```

### Step 6: Generate AKS cluster module

```hcl
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.project_name}-${var.environment}-aks"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.project_name}-${var.environment}"
  kubernetes_version  = var.kubernetes_version
  sku_tier            = var.environment == "prod" ? "Standard" : "Free"

  default_node_pool {
    name                 = "system"
    vm_size              = var.system_node_vm_size
    vnet_subnet_id       = var.subnet_id
    min_count            = var.system_node_min_count
    max_count            = var.system_node_max_count
    auto_scaling_enabled = true
    os_disk_type         = "Ephemeral"
    os_disk_size_gb      = 128
    max_pods             = 50

    upgrade_settings {
      max_surge                     = "10%"
      drain_timeout_in_minutes      = 0
      node_soak_duration_in_minutes = 0
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
    service_cidr      = "10.1.0.0/16"
    dns_service_ip    = "10.1.0.10"
  }

  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  azure_active_directory_role_based_access_control {
    azure_rbac_enabled = true
    tenant_id          = var.tenant_id
  }

  maintenance_window_auto_upgrade {
    frequency   = "Weekly"
    interval    = 1
    day_of_week = "Sunday"
    start_time  = "02:00"
    utc_offset  = "+00:00"
    duration    = 4
  }

  tags = var.tags
}

resource "azurerm_kubernetes_cluster_node_pool" "workload" {
  name                  = "workload"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.workload_node_vm_size
  vnet_subnet_id        = var.subnet_id
  min_count             = var.workload_node_min_count
  max_count             = var.workload_node_max_count
  auto_scaling_enabled  = true
  os_disk_type          = "Ephemeral"
  max_pods              = 50

  node_labels = {
    "workload" = "application"
  }

  tags = var.tags
}
```

### Step 7: Generate App Service / Container Apps module

**App Service:**
```hcl
resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-${var.environment}-plan"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = var.environment == "prod" ? "P1v3" : "B1"

  tags = var.tags
}

resource "azurerm_linux_web_app" "main" {
  name                = "${var.project_name}-${var.environment}-app"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                         = var.environment == "prod"
    ftps_state                        = "Disabled"
    minimum_tls_version               = "1.2"
    vnet_route_all_enabled            = true
    health_check_path                 = "/health"
    health_check_eviction_time_in_min = 5

    application_stack {
      node_version = "20-lts"
    }
  }

  app_settings = merge(var.app_settings, {
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.app_insights_connection_string
    "WEBSITE_RUN_FROM_PACKAGE"              = "1"
  })

  sticky_settings {
    app_setting_names = ["APPLICATIONINSIGHTS_CONNECTION_STRING"]
  }

  tags = var.tags
}
```

**Container Apps:**
```hcl
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.project_name}-${var.environment}-cae"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  infrastructure_subnet_id   = var.subnet_id

  tags = var.tags
}

resource "azurerm_container_app" "main" {
  name                         = "${var.project_name}-${var.environment}-ca"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Multiple"

  identity {
    type = "SystemAssigned"
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = var.environment == "prod" ? 2 : 0
    max_replicas = 10

    container {
      name   = "app"
      image  = "${var.acr_login_server}/${var.image_name}:${var.image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = var.environment
      }

      env {
        name        = "ConnectionString"
        secret_name = "db-connection"
      }

      liveness_probe {
        transport = "HTTP"
        path      = "/health"
        port      = 3000
      }

      readiness_probe {
        transport = "HTTP"
        path      = "/ready"
        port      = 3000
      }
    }
  }

  secret {
    name  = "db-connection"
    value = var.db_connection_string
  }

  tags = var.tags
}
```

### Step 8: Generate Azure SQL and Key Vault

**Azure SQL:**
```hcl
resource "azurerm_mssql_server" "main" {
  name                          = "${var.project_name}-${var.environment}-sql"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = "12.0"
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false

  azuread_administrator {
    login_username              = var.sql_admin_group_name
    object_id                   = var.sql_admin_group_object_id
    azuread_authentication_only = true
  }

  tags = var.tags
}

resource "azurerm_mssql_database" "main" {
  name                        = "${var.project_name}-db"
  server_id                   = azurerm_mssql_server.main.id
  sku_name                    = var.environment == "prod" ? "S1" : "Basic"
  max_size_gb                 = var.environment == "prod" ? 50 : 2
  zone_redundant              = var.environment == "prod"
  geo_backup_enabled          = true
  storage_account_type        = var.environment == "prod" ? "Geo" : "Local"

  short_term_retention_policy {
    retention_days = 7
  }

  long_term_retention_policy {
    weekly_retention  = "P4W"
    monthly_retention = "P12M"
  }

  tags = var.tags
}
```

**Key Vault:**
```hcl
resource "azurerm_key_vault" "main" {
  name                          = "${var.project_name}-${var.environment}-kv"
  location                      = var.location
  resource_group_name           = var.resource_group_name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  purge_protection_enabled      = true
  soft_delete_retention_days    = 90
  public_network_access_enabled = false
  enable_rbac_authorization     = true

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }

  tags = var.tags
}

resource "azurerm_role_assignment" "kv_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.main.identity[0].principal_id
}
```

### Step 9: Use Azure Verified Modules

```hcl
# Use Azure Verified Modules from the Terraform Registry
module "avm_vnet" {
  source  = "Azure/avm-res-network-virtualnetwork/azurerm"
  version = "~> 0.4"

  name                = "${var.project_name}-vnet"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  address_space       = ["10.0.0.0/16"]

  subnets = {
    app = {
      name             = "app-subnet"
      address_prefixes = ["10.0.1.0/24"]
    }
    db = {
      name             = "db-subnet"
      address_prefixes = ["10.0.2.0/24"]
    }
  }
}
```

### Step 10: Generate CI/CD for Terraform

**Azure DevOps pipeline:**
```yaml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - terraform/**

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: 'terraform-secrets'
  - name: tfWorkingDir
    value: 'terraform'

stages:
  - stage: Validate
    jobs:
      - job: Validate
        steps:
          - task: TerraformInstaller@1
            inputs:
              terraformVersion: 'latest'
          - task: TerraformCLI@1
            inputs:
              command: 'init'
              workingDirectory: $(tfWorkingDir)
              backendType: 'azurerm'
          - task: TerraformCLI@1
            inputs:
              command: 'validate'
              workingDirectory: $(tfWorkingDir)
          - task: TerraformCLI@1
            inputs:
              command: 'plan'
              workingDirectory: $(tfWorkingDir)
              commandOptions: '-var-file=environments/$(environment).tfvars -out=tfplan'
          - task: PublishPipelineArtifact@1
            inputs:
              targetPath: '$(tfWorkingDir)/tfplan'
              artifact: 'tfplan'

  - stage: Apply
    dependsOn: Validate
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: Apply
        environment: 'terraform-production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: TerraformCLI@1
                  inputs:
                    command: 'apply'
                    workingDirectory: $(tfWorkingDir)
                    commandOptions: 'tfplan'
```

**GitHub Actions workflow:**
```yaml
name: 'Terraform'
on:
  push:
    branches: [main]
    paths: ['terraform/**']
  pull_request:
    branches: [main]
    paths: ['terraform/**']

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  terraform:
    runs-on: ubuntu-latest
    environment: production
    defaults:
      run:
        working-directory: terraform
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - run: terraform init
      - run: terraform plan -out=tfplan
      - run: terraform apply tfplan
        if: github.ref == 'refs/heads/main'
```

### Step 11: Import existing resources

```bash
# Import an existing resource into Terraform state
terraform import azurerm_resource_group.main /subscriptions/{sub}/resourceGroups/{rg}

# Generate import blocks (Terraform 1.5+)
terraform plan -generate-config-out=generated.tf
```

**Import block syntax:**
```hcl
import {
  to = azurerm_resource_group.main
  id = "/subscriptions/{sub}/resourceGroups/{rg}"
}
```

### Step 12: Bicep vs Terraform comparison

| Feature | Terraform | Bicep |
|---------|-----------|-------|
| State management | External state file required | No state (ARM handles it) |
| Multi-cloud | Yes (AWS, GCP, Azure) | Azure only |
| Drift detection | `terraform plan` | What-if deployment |
| Module ecosystem | Terraform Registry | Azure Verified Modules |
| Learning curve | HCL syntax | ARM-like, Azure-native |
| Destroy support | `terraform destroy` | Deployment stacks (preview) |
| Import existing | `terraform import` | `az bicep decompile` |

### Best practices:
- Pin provider versions with `~>` constraint (e.g., `~> 4.0`)
- Use Azure Storage backend with OIDC authentication for state management
- Use `for_each` instead of `count` for named resource instances
- Use `moved` blocks for refactoring without resource recreation
- Run `terraform fmt`, `terraform validate`, and `tflint` in CI
- Use data sources to reference existing infrastructure
- Never hardcode subscription IDs, tenant IDs, or regions in code
- Use Azure Verified Modules for standardized, tested resource configurations
- Separate environments with `.tfvars` files or workspaces
- Use `prevent_destroy` lifecycle rule on critical resources (databases, Key Vaults)
- Tag all resources with project, environment, and managed-by metadata

### Anti-patterns to avoid:
- Do NOT store state locally for team projects (use remote backend)
- Do NOT use `count` for resources that need stable identifiers (use `for_each`)
- Do NOT embed secrets in `.tfvars` files (use Key Vault or environment variables)
- Do NOT use `terraform apply` without reviewing a plan first
- Do NOT create monolithic configurations (split into modules by concern)
- Do NOT ignore provider version constraints (breaking changes between versions)
- Do NOT use `-target` in production workflows (it skips dependency checks)
- Do NOT disable state locking in shared environments

### Security considerations:
- Use OIDC / workload identity federation for CI/CD authentication (no secrets)
- Encrypt state files at rest (Azure Storage encryption is default)
- Enable state locking with Azure Storage blob leases
- Restrict state backend access with Azure RBAC and network rules
- Use `sensitive = true` for variables containing secrets
- Run `tfsec` or `checkov` for security scanning in CI
- Enable Azure AD-only authentication for SQL databases
- Use private endpoints and disable public access for PaaS resources
- Enable Key Vault purge protection and soft delete

### Cost optimization tips:
- Use `azurerm_cost_management_export` to track infrastructure costs
- Right-size VM SKUs per environment (B-series for dev, D-series for prod)
- Use spot instances for non-critical AKS node pools
- Enable auto-scaling with appropriate min/max counts
- Use reserved instances for predictable workloads (1-year or 3-year)
- Use consumption-based SKUs for dev/test (serverless SQL, Consumption Functions)
- Destroy non-production environments during off-hours with automation
- Use `lifecycle { prevent_destroy = true }` to avoid accidental deletion of costly resources
