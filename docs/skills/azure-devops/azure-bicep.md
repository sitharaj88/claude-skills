# Bicep (IaC)

Generate Bicep templates for Azure infrastructure with modules, parameters, deployment stacks, and what-if previews.

## Usage

```bash
/azure-bicep <description of your infrastructure>
```

## What It Does

1. Generates Bicep templates with resource definitions, parameters, and outputs
2. Creates reusable Bicep modules for networking, compute, storage, and identity
3. Configures deployment stacks for lifecycle management and deny assignments
4. Sets up parameter files with environment-specific values for dev, staging, and production
5. Implements user-defined types and functions for type-safe configurations
6. Integrates Bicep registry modules from Azure Verified Modules and private registries

## Examples

```bash
/azure-bicep Create a VNet with subnets, NSGs, and a Bastion host using modular Bicep files

/azure-bicep Set up an Azure Container Apps environment with Dapr, managed certificates, and Key Vault secrets

/azure-bicep Build a deployment stack with deny settings for a hub-spoke network topology
```

## What It Covers

- **Template structure** - Main templates with parameters, variables, resources, and outputs
- **Modules** - Reusable Bicep modules with typed parameters and conditional deployment
- **Parameters** - Parameter files, decorators, allowed values, and secure parameters
- **User-defined types** - Custom types, discriminated unions, and type validation
- **Deployment stacks** - Stack creation, update behavior, deny assignments, and unmanaged resources
- **Registry modules** - Azure Verified Modules, private registry publishing, and versioning
- **Expressions** - String interpolation, loops, conditions, and resource references
- **Scope functions** - Subscription, management group, and tenant-level deployments
- **What-if** - Deployment previews with change type analysis and confirmation
- **CI/CD integration** - Azure DevOps and GitHub Actions tasks for Bicep build and deploy

<div class="badge-row">
  <span class="badge">Bicep</span>
  <span class="badge">IaC</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Bicep templates, modules, and parameter files
- `Write` - Create Bicep files, modules, and parameter definitions
- `Edit` - Modify existing Bicep templates and configurations
- `Bash` - Run az deployment, az bicep, and az stack CLI commands
- `Glob` - Search for .bicep and .bicepparam files
- `Grep` - Find resource references, module sources, and parameter usage
