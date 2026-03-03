---
name: azure-bicep
description: Generate Bicep templates for Azure infrastructure with modules, parameter files, and deployment best practices. Use when the user wants to define Azure infrastructure as code with Bicep.
argument-hint: "[resource types] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *), Bash(bicep *)
user-invocable: true
---

## Instructions

You are an Azure Bicep infrastructure-as-code expert. Generate production-ready Bicep templates with modules, parameters, and deployment configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Resources**: what Azure resources to provision
- **Scope**: resource group, subscription, management group, or tenant deployment
- **Structure**: single file, modular, or registry-based modules
- **Environments**: dev, staging, prod parameterization
- **Deployment**: Azure CLI, Azure DevOps, GitHub Actions

### Step 2: Generate project structure

**Standard Bicep project layout:**
```
infra/
├── main.bicep              # Root template (entry point)
├── main.bicepparam         # Parameter file
├── parameters/
│   ├── dev.bicepparam
│   ├── staging.bicepparam
│   └── prod.bicepparam
├── modules/
│   ├── networking.bicep
│   ├── compute.bicep
│   ├── storage.bicep
│   ├── database.bicep
│   ├── monitoring.bicep
│   └── security.bicep
└── bicepconfig.json        # Bicep linter configuration
```

### Step 3: Generate Bicep configuration

**bicepconfig.json:**
```json
{
  "analyzers": {
    "core": {
      "enabled": true,
      "rules": {
        "no-hardcoded-env-urls": { "level": "error" },
        "no-unused-params": { "level": "warning" },
        "no-unused-vars": { "level": "warning" },
        "prefer-interpolation": { "level": "warning" },
        "secure-parameter-default": { "level": "error" },
        "simplify-interpolation": { "level": "warning" },
        "use-recent-api-versions": { "level": "warning" },
        "use-resource-id-functions": { "level": "warning" },
        "use-stable-vm-image": { "level": "warning" },
        "explicit-values-for-loc-params": { "level": "warning" },
        "protect-commandtoexecute-secrets": { "level": "error" },
        "use-safe-access": { "level": "warning" },
        "no-unnecessary-dependson": { "level": "warning" },
        "use-resource-symbol-reference": { "level": "warning" },
        "use-secure-value-for-secure-inputs": { "level": "error" }
      }
    }
  },
  "moduleAliases": {
    "br": {
      "myregistry": {
        "registry": "myacr.azurecr.io",
        "modulePath": "bicep/modules"
      },
      "public": {
        "registry": "mcr.microsoft.com",
        "modulePath": "bicep"
      }
    }
  }
}
```

### Step 4: Generate main Bicep template

**main.bicep:**
```bicep
targetScope = 'subscription'

// ============================================================================
// Parameters
// ============================================================================

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Azure region for resource deployment')
param location string = 'eastus2'

@description('Project name used for resource naming')
@minLength(3)
@maxLength(20)
param projectName string

@description('Tags applied to all resources')
param tags object = {}

// ============================================================================
// Variables
// ============================================================================

var defaultTags = union(tags, {
  Environment: environment
  Project: projectName
  ManagedBy: 'bicep'
  DeployedAt: utcNow('yyyy-MM-dd')
})

var resourceGroupName = '${projectName}-${environment}-rg'

// ============================================================================
// Resource Group
// ============================================================================

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: defaultTags
}

// ============================================================================
// Modules
// ============================================================================

module networking 'modules/networking.bicep' = {
  scope: rg
  name: 'networking-${uniqueString(rg.id)}'
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: defaultTags
  }
}

module compute 'modules/compute.bicep' = {
  scope: rg
  name: 'compute-${uniqueString(rg.id)}'
  params: {
    location: location
    projectName: projectName
    environment: environment
    subnetId: networking.outputs.appSubnetId
    tags: defaultTags
  }
}

module monitoring 'modules/monitoring.bicep' = {
  scope: rg
  name: 'monitoring-${uniqueString(rg.id)}'
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: defaultTags
  }
}

// ============================================================================
// Outputs
// ============================================================================

output resourceGroupName string = rg.name
output appServiceUrl string = compute.outputs.appServiceUrl
output logAnalyticsWorkspaceId string = monitoring.outputs.workspaceId
```

### Step 5: Generate parameter files

**parameters/dev.bicepparam:**
```bicep
using '../main.bicep'

param environment = 'dev'
param location = 'eastus2'
param projectName = 'myapp'
param tags = {
  CostCenter: 'development'
  Owner: 'dev-team'
}
```

**parameters/prod.bicepparam:**
```bicep
using '../main.bicep'

param environment = 'prod'
param location = 'eastus2'
param projectName = 'myapp'
param tags = {
  CostCenter: 'production'
  Owner: 'platform-team'
  Compliance: 'SOC2'
}
```

### Step 6: Generate Bicep modules

**modules/networking.bicep:**
```bicep
@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('VNet address space')
param vnetAddressSpace string = '10.0.0.0/16'

var subnets = [
  { name: 'app-subnet', prefix: '10.0.1.0/24', delegation: 'Microsoft.Web/serverFarms' }
  { name: 'db-subnet', prefix: '10.0.2.0/24', delegation: null }
  { name: 'pe-subnet', prefix: '10.0.3.0/24', delegation: null }
]

resource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: '${projectName}-${environment}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [vnetAddressSpace]
    }
    subnets: [
      for subnet in subnets: {
        name: subnet.name
        properties: {
          addressPrefix: subnet.prefix
          privateEndpointNetworkPolicies: 'Enabled'
          delegation: subnet.delegation != null
            ? [
                {
                  name: '${subnet.name}-delegation'
                  properties: {
                    serviceName: subnet.delegation!
                  }
                }
              ]
            : []
        }
      }
    ]
  }
}

resource nsgs 'Microsoft.Network/networkSecurityGroups@2024-01-01' = [
  for subnet in subnets: {
    name: '${subnet.name}-nsg'
    location: location
    tags: tags
    properties: {
      securityRules: []
    }
  }
]

output vnetId string = vnet.id
output appSubnetId string = vnet.properties.subnets[0].id
output dbSubnetId string = vnet.properties.subnets[1].id
output peSubnetId string = vnet.properties.subnets[2].id
```

**modules/compute.bicep:**
```bicep
@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Subnet ID for VNet integration')
param subnetId string

@description('Resource tags')
param tags object

var appServicePlanSku = environment == 'prod' ? 'P1v3' : 'B1'
var alwaysOn = environment == 'prod'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${projectName}-${environment}-plan'
  location: location
  tags: tags
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: '${projectName}-${environment}-app'
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    virtualNetworkSubnetId: subnetId
    siteConfig: {
      alwaysOn: alwaysOn
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      linuxFxVersion: 'NODE|20-lts'
      healthCheckPath: '/health'
      vnetRouteAllEnabled: true
    }
  }
}

output appServiceId string = appService.id
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output principalId string = appService.identity.principalId
```

### Step 7: Generate conditional deployments and loops

**Conditional deployment:**
```bicep
@description('Enable Redis cache')
param enableRedis bool = false

resource redisCache 'Microsoft.Cache/redis@2024-03-01' = if (enableRedis) {
  name: '${projectName}-${environment}-redis'
  location: location
  properties: {
    sku: {
      name: environment == 'prod' ? 'Standard' : 'Basic'
      family: 'C'
      capacity: environment == 'prod' ? 1 : 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
  }
}
```

**Loops with for:**
```bicep
@description('Storage accounts to create')
param storageAccounts array = [
  { name: 'data', sku: 'Standard_LRS', kind: 'StorageV2' }
  { name: 'logs', sku: 'Standard_GRS', kind: 'StorageV2' }
  { name: 'backup', sku: 'Standard_RAGRS', kind: 'BlobStorage' }
]

resource storageAccountsResource 'Microsoft.Storage/storageAccounts@2023-05-01' = [
  for sa in storageAccounts: {
    name: '${projectName}${environment}${sa.name}'
    location: location
    tags: tags
    sku: { name: sa.sku }
    kind: sa.kind
    properties: {
      minimumTlsVersion: 'TLS1_2'
      supportsHttpsTrafficOnly: true
      allowBlobPublicAccess: false
      networkAcls: {
        defaultAction: 'Deny'
        bypass: 'AzureServices'
      }
    }
  }
]
```

**Loop with index and filtered loop:**
```bicep
// Using index
resource subnetsWithIndex 'Microsoft.Network/virtualNetworks/subnets@2024-01-01' = [
  for (subnet, i) in subnetConfigs: {
    name: subnet.name
    parent: vnet
    properties: {
      addressPrefix: subnet.prefix
    }
  }
]

// Filtered loop
var prodOnlyResources = filter(allResources, r => r.environment == 'prod')
```

### Step 8: Generate user-defined types and functions

**User-defined types:**
```bicep
@export()
type subnetConfig = {
  @description('Subnet name')
  name: string

  @description('Address prefix in CIDR notation')
  @minLength(9)
  addressPrefix: string

  @description('Service delegation')
  delegation: string?

  @description('Enable private endpoint policies')
  privateEndpointNetworkPolicies: ('Disabled' | 'Enabled')?
}

@export()
type appServiceConfig = {
  name: string
  sku: ('B1' | 'B2' | 'P1v3' | 'P2v3' | 'P3v3')
  alwaysOn: bool
  autoScale: {
    minInstances: int
    maxInstances: int
  }?
}

param subnets subnetConfig[]
param appConfig appServiceConfig
```

**User-defined functions:**
```bicep
@export()
func generateResourceName(projectName string, environment string, resourceType string) string =>
  '${projectName}-${environment}-${resourceType}'

@export()
func isProduction(environment string) bool =>
  environment == 'prod'

// Usage
var appName = generateResourceName(projectName, environment, 'app')
var enableHA = isProduction(environment)
```

### Step 9: Reference existing resources

```bicep
// Reference existing resource in the same resource group
resource existingVnet 'Microsoft.Network/virtualNetworks@2024-01-01' existing = {
  name: 'existing-vnet-name'
}

// Reference existing resource in a different resource group
resource existingKeyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: 'existing-kv-name'
  scope: resourceGroup('other-rg')
}

// Reference existing resource in a different subscription
resource existingLogAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: 'central-log-analytics'
  scope: resourceGroup('00000000-0000-0000-0000-000000000000', 'central-monitoring-rg')
}

// Use the existing resource
output kvUri string = existingKeyVault.properties.vaultUri
```

### Step 10: Generate deployment scripts

```bicep
resource deploymentScript 'Microsoft.Resources/deploymentScripts@2023-08-01' = {
  name: 'seed-database'
  location: location
  kind: 'AzureCLI'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    azCliVersion: '2.60.0'
    retentionInterval: 'P1D'
    timeout: 'PT30M'
    cleanupPreference: 'OnSuccess'
    environmentVariables: [
      { name: 'SQL_SERVER', value: sqlServer.properties.fullyQualifiedDomainName }
      { name: 'DB_NAME', value: sqlDatabase.name }
    ]
    scriptContent: '''
      az sql db execute \
        --resource-group $RESOURCE_GROUP \
        --server $SQL_SERVER \
        --database $DB_NAME \
        --query "CREATE TABLE IF NOT EXISTS..."
      echo "Database seeded successfully"
    '''
  }
}
```

### Step 11: Generate module registry and template specs

**Publish to Bicep registry:**
```bash
# Publish module to Azure Container Registry
az bicep publish \
  --file modules/networking.bicep \
  --target br:myacr.azurecr.io/bicep/modules/networking:v1.0.0

# Publish to template spec
az ts create \
  --name NetworkingModule \
  --version 1.0.0 \
  --resource-group shared-templates-rg \
  --location eastus2 \
  --template-file modules/networking.bicep
```

**Reference registry modules:**
```bicep
// From private registry
module networking 'br:myacr.azurecr.io/bicep/modules/networking:v1.0.0' = {
  name: 'networking'
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: defaultTags
  }
}

// Using alias from bicepconfig.json
module compute 'br/myregistry:compute:v2.0.0' = {
  name: 'compute'
  params: { /* ... */ }
}

// Azure Verified Modules from MCR
module appService 'br/public:avm/res/web/site:0.6.0' = {
  name: 'app-service'
  params: {
    name: '${projectName}-${environment}-app'
    location: location
    kind: 'app,linux'
    serverFarmResourceId: appServicePlan.id
  }
}

// From template spec
module fromSpec 'ts/subscriptionAlias:NetworkingModule:1.0.0' = {
  name: 'networking-from-spec'
  params: { /* ... */ }
}
```

### Step 12: Generate deployment commands

**Azure CLI deployment:**
```bash
# Resource group scope deployment
az deployment group create \
  --resource-group myResourceGroup \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam \
  --name "deploy-$(date +%Y%m%d-%H%M%S)"

# Subscription scope deployment
az deployment sub create \
  --location eastus2 \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam

# What-if deployment (preview changes)
az deployment group what-if \
  --resource-group myResourceGroup \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam

# Management group scope
az deployment mg create \
  --management-group-id myManagementGroup \
  --location eastus2 \
  --template-file policy.bicep

# Tenant scope
az deployment tenant create \
  --location eastus2 \
  --template-file management-groups.bicep
```

**Deployment stacks (prevent orphaned resources):**
```bash
# Create deployment stack at resource group scope
az stack group create \
  --name myStack \
  --resource-group myResourceGroup \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam \
  --action-on-unmanage detachAll \
  --deny-settings-mode none

# Update stack (removes resources no longer in template)
az stack group create \
  --name myStack \
  --resource-group myResourceGroup \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam \
  --action-on-unmanage deleteAll
```

### Step 13: Decompile ARM to Bicep

```bash
# Decompile ARM JSON template to Bicep
az bicep decompile --file azuredeploy.json

# Decompile and output to specific file
az bicep decompile --file azuredeploy.json --force

# Export existing resource group to ARM, then decompile
az group export --name myResourceGroup --output-file exported.json
az bicep decompile --file exported.json
```

### Step 14: Generate Azure DevOps pipeline for Bicep

```yaml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - infra/**

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Validate
    jobs:
      - job: ValidateBicep
        steps:
          - task: AzureCLI@2
            displayName: 'Bicep build (lint)'
            inputs:
              azureSubscription: 'my-service-connection'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                az bicep build --file infra/main.bicep
                echo "Bicep validation passed"

          - task: AzureCLI@2
            displayName: 'What-if deployment'
            inputs:
              azureSubscription: 'my-service-connection'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                az deployment sub what-if \
                  --location eastus2 \
                  --template-file infra/main.bicep \
                  --parameters infra/parameters/$(environment).bicepparam

  - stage: Deploy
    dependsOn: Validate
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployInfra
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureCLI@2
                  displayName: 'Deploy Bicep template'
                  inputs:
                    azureSubscription: 'my-service-connection'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      az deployment sub create \
                        --location eastus2 \
                        --template-file infra/main.bicep \
                        --parameters infra/parameters/$(environment).bicepparam \
                        --name "deploy-$(Build.BuildId)"
```

### Best practices:
- Use `.bicepparam` files (not JSON parameter files) for type safety and IntelliSense
- Use modules to encapsulate resource groups and promote reusability
- Use `targetScope` explicitly for non-resource-group deployments
- Add parameter decorators (`@description`, `@allowed`, `@minLength`, `@secure`)
- Use `existing` keyword to reference pre-existing resources
- Run `az bicep build` in CI to catch linting errors early
- Use What-if deployments to preview changes before applying
- Publish shared modules to a Bicep registry (ACR) for cross-team reuse
- Use Azure Verified Modules for standardized, well-tested resources
- Use user-defined types for complex parameter validation
- Use deployment stacks to manage resource lifecycle and prevent drift

### Anti-patterns to avoid:
- Do NOT use ARM JSON templates for new projects (use Bicep)
- Do NOT hardcode resource names (use parameters and naming conventions)
- Do NOT use `dependsOn` when Bicep can infer dependencies automatically
- Do NOT put secrets as default values in parameters (use `@secure()`)
- Do NOT deploy at too broad a scope (use resource group scope when possible)
- Do NOT skip What-if before production deployments
- Do NOT create monolithic templates (split into modules by concern)
- Do NOT ignore linter warnings (configure bicepconfig.json rules)
- Do NOT use outdated API versions (enable `use-recent-api-versions` rule)

### Security considerations:
- Use `@secure()` decorator for parameters containing secrets
- Reference Key Vault secrets in parameter files instead of plain text
- Enable `disableLocalAuth` on resources that support Azure AD authentication
- Set `publicNetworkAccess: 'Disabled'` and use private endpoints for PaaS
- Configure `networkAcls` with `defaultAction: 'Deny'` on storage and Key Vault
- Set minimum TLS version to 1.2 on all resources
- Disable FTP access (`ftpsState: 'Disabled'`) on App Services
- Use managed identities for service-to-service authentication
- Enable purge protection on Key Vault and soft delete

### Cost optimization tips:
- Use conditional deployment (`if`) to skip expensive resources in dev
- Parameterize SKUs to use lower tiers in non-production environments
- Deploy auto-scaling with appropriate min/max to avoid over-provisioning
- Use `dev/test` pricing tiers where available (Azure SQL, App Service)
- Tag resources with cost center for chargeback and tracking
- Use deployment stacks to ensure orphaned resources are cleaned up
- Review What-if output to understand cost implications before deploying
- Use Azure Pricing Calculator to estimate costs for new infrastructure
