# Terraform for Azure

Generate Terraform configurations for Azure infrastructure with state management, reusable modules, workspaces, and best practices.

## Usage

```bash
/azure-terraform <description of your infrastructure>
```

## What It Does

1. Generates Terraform configurations with the AzureRM and AzAPI providers
2. Creates reusable modules for networking, AKS, App Service, SQL Database, and RBAC
3. Configures Azure Storage Account remote state backends with state locking
4. Sets up environment-specific variable files for dev, staging, and production
5. Implements managed identity authentication for provider and backend access
6. Integrates Azure Verified Modules for standardized infrastructure patterns

## Examples

```bash
/azure-terraform Create a hub-spoke VNet topology with Azure Firewall, VPN Gateway, and NSG rules

/azure-terraform Set up an AKS private cluster with Azure CNI, Workload Identity, and Key Vault CSI driver

/azure-terraform Build an App Service with SQL Database, Private Endpoints, and Front Door CDN
```

## What It Covers

- **Project structure** - Standard module layout with main.tf, variables.tf, outputs.tf, and backend.tf
- **Provider configuration** - AzureRM and AzAPI providers with version pinning and features blocks
- **State management** - Azure Storage backend with container, state locking, and encryption
- **VNet networking** - Hub-spoke topologies, subnets, NSGs, Azure Firewall, and Private Endpoints
- **AKS clusters** - Private clusters with Azure CNI, Workload Identity, and node pool autoscaling
- **App Services** - App Service plans, web apps, slots, and deployment configurations
- **SQL databases** - Azure SQL with failover groups, elastic pools, and private connectivity
- **RBAC bindings** - Role assignments with managed identities and custom role definitions
- **Verified modules** - Azure Verified Modules from the Terraform registry
- **CI/CD integration** - Azure DevOps pipelines for terraform plan and apply workflows

<div class="badge-row">
  <span class="badge">HCL</span>
  <span class="badge">IaC</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Terraform configurations and modules
- `Write` - Create Terraform files, modules, and variable definitions
- `Edit` - Modify existing Terraform configurations
- `Bash` - Run terraform init, plan, validate, fmt, and az CLI commands
- `Glob` - Search for .tf and .tfvars files
- `Grep` - Find resource references and module sources
