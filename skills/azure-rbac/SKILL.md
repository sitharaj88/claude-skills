---
name: azure-rbac
description: Generate RBAC assignments, custom roles, and managed identity configurations
invocation: /azure-rbac [type]
arguments:
  - name: type
    description: "Type (role-assignment, custom-role, managed-identity, policy)"
    required: false
allowed_tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
---

## Instructions

You are an Azure RBAC and governance expert. Generate production-ready role-based access control, managed identity, and Azure Policy configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Type**: role assignment, custom role definition, managed identity, Azure Policy
- **Scope**: management group, subscription, resource group, individual resource
- **Principal**: user, group, service principal, managed identity
- **Access level**: built-in role or custom role with specific actions
- **Governance**: policy enforcement, compliance, guardrails

### Step 2: Generate role assignments

**Common built-in roles:**

| Role | Description | Scope |
|------|-------------|-------|
| Owner | Full access + assign roles | Subscription/RG |
| Contributor | Full access, no role assignment | Subscription/RG |
| Reader | View-only access | Subscription/RG |
| User Access Administrator | Manage role assignments only | Subscription/RG |
| Storage Blob Data Contributor | Read/write/delete blobs | Storage Account |
| Key Vault Secrets Officer | Manage secrets | Key Vault |
| Azure Service Bus Data Sender | Send messages | Service Bus |
| Azure Service Bus Data Receiver | Receive messages | Service Bus |
| AcrPush | Push images to ACR | Container Registry |
| AcrPull | Pull images from ACR | Container Registry |
| Monitoring Contributor | Read/write monitoring data | Subscription/RG |
| Cosmos DB Account Reader | Read Cosmos DB data | Cosmos DB |

```bicep
// Role assignment at resource group scope
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, principalId, roleDefinitionId)
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      roleDefinitionId
    )
    principalId: principalId
    principalType: 'ServicePrincipal'  // User, Group, ServicePrincipal
    description: 'Allow app service to read blobs'
    condition: null
    conditionVersion: null
  }
}

// Common role definition IDs
var builtInRoles = {
  Owner: 'b24988ac-6180-42a0-ab88-20f7382dd24c'
  Contributor: 'b24988ac-6180-42a0-ab88-20f7382dd24c'
  Reader: 'acdd72a7-3385-48ef-bd42-f606fba81ae7'
  StorageBlobDataContributor: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
  StorageBlobDataReader: '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1'
  KeyVaultSecretsOfficer: 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'
  KeyVaultSecretsUser: '4633458b-17de-408a-b874-0445c86b69e6'
  ServiceBusDataSender: '69a216fc-b8fb-44d8-bc22-1f3c2cd27a39'
  ServiceBusDataReceiver: '4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0'
  AcrPush: '8311e382-0749-4cb8-b61a-304f252e45ec'
  AcrPull: '7f951dda-4ed3-4680-a7ca-43fe172d538d'
  MonitoringContributor: '749f88d5-cbae-40b8-bcfc-e573ddc772fa'
}

// Role assignment for managed identity to access storage
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, managedIdentity.properties.principalId, builtInRoles.StorageBlobDataContributor)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      builtInRoles.StorageBlobDataContributor
    )
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Role assignment with conditions (ABAC)
resource conditionalRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, principalId, 'conditional-blob-reader')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      builtInRoles.StorageBlobDataReader
    )
    principalId: principalId
    principalType: 'ServicePrincipal'
    condition: '((!(ActionMatches{\'Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read\'} AND NOT SubOperationMatches{\'Blob.List\'})) OR (@Resource[Microsoft.Storage/storageAccounts/blobServices/containers:name] StringEquals \'allowed-container\'))'
    conditionVersion: '2.0'
  }
}
```

### Step 3: Generate custom role definitions

```bicep
// Custom role at subscription scope
resource customRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: guid(subscription().id, 'custom-app-operator')
  properties: {
    roleName: 'Application Operator'
    description: 'Can manage application resources but not networking or IAM'
    type: 'CustomRole'
    assignableScopes: [
      subscription().id
    ]
    permissions: [
      {
        actions: [
          // App Service
          'Microsoft.Web/sites/read'
          'Microsoft.Web/sites/write'
          'Microsoft.Web/sites/restart/action'
          'Microsoft.Web/sites/stop/action'
          'Microsoft.Web/sites/start/action'
          'Microsoft.Web/sites/slots/*'
          'Microsoft.Web/sites/config/*'
          'Microsoft.Web/sites/deployments/*'

          // Function Apps
          'Microsoft.Web/sites/functions/read'
          'Microsoft.Web/sites/functions/write'

          // Storage (data plane via dataActions)
          'Microsoft.Storage/storageAccounts/read'
          'Microsoft.Storage/storageAccounts/listKeys/action'

          // Monitoring
          'Microsoft.Insights/metrics/read'
          'Microsoft.Insights/diagnosticSettings/read'
          'Microsoft.Insights/alertRules/read'
          'Microsoft.OperationalInsights/workspaces/query/read'

          // Resource health
          'Microsoft.ResourceHealth/availabilityStatuses/read'
        ]
        notActions: [
          // Prevent destructive operations
          'Microsoft.Web/sites/delete'
          'Microsoft.Web/sites/config/snapshots/read'  // Prevent snapshot access
        ]
        dataActions: [
          // Blob storage data access
          'Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read'
          'Microsoft.Storage/storageAccounts/blobServices/containers/blobs/write'

          // Key Vault secrets (read only)
          'Microsoft.KeyVault/vaults/secrets/getSecret/action'
        ]
        notDataActions: [
          // Prevent secret deletion
          'Microsoft.KeyVault/vaults/secrets/delete'
          'Microsoft.KeyVault/vaults/secrets/purge/action'
        ]
      }
    ]
  }
}
```

**Terraform custom role:**

```hcl
resource "azurerm_role_definition" "app_operator" {
  name        = "Application Operator"
  scope       = data.azurerm_subscription.current.id
  description = "Can manage application resources but not networking or IAM"

  permissions {
    actions = [
      "Microsoft.Web/sites/read",
      "Microsoft.Web/sites/write",
      "Microsoft.Web/sites/restart/action",
      "Microsoft.Web/sites/stop/action",
      "Microsoft.Web/sites/start/action",
      "Microsoft.Web/sites/slots/*",
      "Microsoft.Web/sites/config/*",
      "Microsoft.Web/sites/deployments/*",
      "Microsoft.Storage/storageAccounts/read",
      "Microsoft.Insights/metrics/read",
      "Microsoft.Insights/diagnosticSettings/read",
      "Microsoft.ResourceHealth/availabilityStatuses/read",
    ]

    not_actions = [
      "Microsoft.Web/sites/delete",
    ]

    data_actions = [
      "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read",
      "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/write",
      "Microsoft.KeyVault/vaults/secrets/getSecret/action",
    ]

    not_data_actions = [
      "Microsoft.KeyVault/vaults/secrets/delete",
      "Microsoft.KeyVault/vaults/secrets/purge/action",
    ]
  }

  assignable_scopes = [
    data.azurerm_subscription.current.id,
  ]
}
```

### Step 4: Generate managed identity configurations

```bicep
// User-assigned managed identity
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${appName}-${environment}'
  location: location
  tags: commonTags
}

// System-assigned identity on App Service
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: 'app-${appName}-${environment}'
  location: location
  identity: {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    // ...
  }
}

// Grant managed identity access to Key Vault
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, managedIdentity.properties.principalId, 'kv-secrets-user')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'  // Key Vault Secrets User
    )
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Grant managed identity access to SQL Database
resource sqlRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(sqlServer.id, managedIdentity.properties.principalId, 'sql-contributor')
  scope: sqlServer
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '9b7fa17d-e63e-47b0-bb0a-15c516ac86ec'  // SQL DB Contributor
    )
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Federated credential for GitHub Actions
resource federatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: managedIdentity
  name: 'github-actions-main'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubOrg}/${githubRepo}:ref:refs/heads/main'
    audiences: ['api://AzureADTokenExchange']
  }
}

resource federatedCredentialPR 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: managedIdentity
  name: 'github-actions-pr'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubOrg}/${githubRepo}:pull_request'
    audiences: ['api://AzureADTokenExchange']
  }
}

// Federated credential for Kubernetes (AKS workload identity)
resource federatedCredentialAKS 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: managedIdentity
  name: 'aks-workload'
  properties: {
    issuer: aksCluster.properties.oidcIssuerProfile.issuerURL
    subject: 'system:serviceaccount:${kubeNamespace}:${serviceAccountName}'
    audiences: ['api://AzureADTokenExchange']
  }
}
```

**Using managed identity in code:**

```csharp
using Azure.Identity;

// DefaultAzureCredential tries multiple sources:
// 1. Environment variables (AZURE_CLIENT_ID, etc.)
// 2. Workload identity (AKS)
// 3. Managed identity
// 4. Azure CLI / Azure PowerShell / VS Code (dev)
var credential = new DefaultAzureCredential();

// Explicit managed identity (faster, no fallback chain)
var credential = new ManagedIdentityCredential();  // System-assigned
var credential = new ManagedIdentityCredential("CLIENT_ID");  // User-assigned

// Use with Azure SDK clients
var blobClient = new BlobServiceClient(
    new Uri("https://mystorageaccount.blob.core.windows.net"),
    credential);

var secretClient = new SecretClient(
    new Uri("https://mykeyvault.vault.azure.net"),
    credential);

var serviceBusClient = new ServiceBusClient(
    "mynamespace.servicebus.windows.net",
    credential);
```

### Step 5: Generate Azure Policy configurations

```bicep
// Custom policy definition: Require tags on resources
resource tagPolicy 'Microsoft.Authorization/policyDefinitions@2023-04-01' = {
  name: 'require-cost-center-tag'
  properties: {
    displayName: 'Require CostCenter tag on resources'
    description: 'Enforces the presence of a CostCenter tag on all resources'
    policyType: 'Custom'
    mode: 'Indexed'  // Indexed (tags/location), All (all resources)
    metadata: {
      category: 'Tags'
      version: '1.0.0'
    }
    parameters: {
      tagName: {
        type: 'String'
        metadata: {
          displayName: 'Tag Name'
          description: 'Name of the required tag'
        }
        defaultValue: 'CostCenter'
      }
      effect: {
        type: 'String'
        metadata: {
          displayName: 'Effect'
          description: 'Policy effect'
        }
        allowedValues: ['Audit', 'Deny', 'Disabled']
        defaultValue: 'Deny'
      }
    }
    policyRule: {
      if: {
        field: '[concat(\'tags[\', parameters(\'tagName\'), \']\')]'
        exists: 'false'
      }
      then: {
        effect: '[parameters(\'effect\')]'
      }
    }
  }
}

// Policy to enforce HTTPS on storage accounts
resource httpsPolicy 'Microsoft.Authorization/policyDefinitions@2023-04-01' = {
  name: 'enforce-storage-https'
  properties: {
    displayName: 'Storage accounts must use HTTPS'
    policyType: 'Custom'
    mode: 'Indexed'
    parameters: {}
    policyRule: {
      if: {
        allOf: [
          {
            field: 'type'
            equals: 'Microsoft.Storage/storageAccounts'
          }
          {
            field: 'Microsoft.Storage/storageAccounts/supportsHttpsTrafficOnly'
            notEquals: true
          }
        ]
      }
      then: {
        effect: 'Deny'
      }
    }
  }
}

// Policy assignment
resource policyAssignment 'Microsoft.Authorization/policyAssignments@2023-04-01' = {
  name: 'assign-require-tags'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    displayName: 'Require CostCenter tag'
    policyDefinitionId: tagPolicy.id
    parameters: {
      tagName: { value: 'CostCenter' }
      effect: { value: 'Deny' }
    }
    enforcementMode: 'Default'  // Default (enforce) or DoNotEnforce (audit)
    nonComplianceMessages: [
      {
        message: 'All resources must have a CostCenter tag. Contact platform-team@company.com for help.'
      }
    ]
  }
}

// Policy initiative (group of policies)
resource initiative 'Microsoft.Authorization/policySetDefinitions@2023-04-01' = {
  name: 'security-baseline'
  properties: {
    displayName: 'Security Baseline Initiative'
    description: 'Collection of security policies for production workloads'
    policyType: 'Custom'
    metadata: {
      category: 'Security'
      version: '1.0.0'
    }
    parameters: {
      effect: {
        type: 'String'
        defaultValue: 'Deny'
        allowedValues: ['Audit', 'Deny', 'Disabled']
      }
    }
    policyDefinitions: [
      {
        policyDefinitionId: tagPolicy.id
        parameters: {
          effect: { value: '[parameters(\'effect\')]' }
        }
      }
      {
        policyDefinitionId: httpsPolicy.id
        parameters: {}
      }
      {
        // Built-in: Require TLS 1.2
        policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/fe83a0eb-a853-422d-abc7-2f71ee183a09'
        parameters: {}
      }
    ]
  }
}
```

**Terraform Azure Policy:**

```hcl
resource "azurerm_policy_definition" "require_tags" {
  name         = "require-cost-center-tag"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Require CostCenter tag on resources"

  metadata = jsonencode({
    category = "Tags"
    version  = "1.0.0"
  })

  parameters = jsonencode({
    tagName = {
      type         = "String"
      defaultValue = "CostCenter"
      metadata = {
        displayName = "Tag Name"
      }
    }
    effect = {
      type         = "String"
      defaultValue = "Deny"
      allowedValues = ["Audit", "Deny", "Disabled"]
    }
  })

  policy_rule = jsonencode({
    if = {
      field  = "[concat('tags[', parameters('tagName'), ']')]"
      exists = "false"
    }
    then = {
      effect = "[parameters('effect')]"
    }
  })
}

resource "azurerm_subscription_policy_assignment" "require_tags" {
  name                 = "assign-require-tags"
  subscription_id      = data.azurerm_subscription.current.id
  policy_definition_id = azurerm_policy_definition.require_tags.id

  parameters = jsonencode({
    tagName = { value = "CostCenter" }
    effect  = { value = "Deny" }
  })

  non_compliance_message {
    content = "All resources must have a CostCenter tag."
  }

  identity {
    type = "SystemAssigned"
  }

  location = var.location
}

# Policy exemption
resource "azurerm_resource_policy_exemption" "sandbox" {
  name                 = "sandbox-exemption"
  resource_id          = azurerm_resource_group.sandbox.id
  policy_assignment_id = azurerm_subscription_policy_assignment.require_tags.id
  exemption_category   = "Waiver"
  expires_on           = "2025-12-31T23:59:59Z"
  description          = "Sandbox environment exempt from tagging requirements"
}

# Policy remediation (for DeployIfNotExists / Modify effects)
resource "azurerm_subscription_policy_remediation" "tags" {
  name                 = "remediate-tags"
  subscription_id      = data.azurerm_subscription.current.id
  policy_assignment_id = azurerm_subscription_policy_assignment.require_tags.id
}
```

### Step 6: Management group hierarchy

```bicep
// Management group hierarchy
targetScope = 'tenant'

resource rootMG 'Microsoft.Management/managementGroups@2021-04-01' = {
  name: 'mg-${organizationName}'
  properties: {
    displayName: organizationName
  }
}

resource platformMG 'Microsoft.Management/managementGroups@2021-04-01' = {
  name: 'mg-platform'
  properties: {
    displayName: 'Platform'
    details: {
      parent: {
        id: rootMG.id
      }
    }
  }
}

resource landingZonesMG 'Microsoft.Management/managementGroups@2021-04-01' = {
  name: 'mg-landing-zones'
  properties: {
    displayName: 'Landing Zones'
    details: {
      parent: {
        id: rootMG.id
      }
    }
  }
}

resource prodMG 'Microsoft.Management/managementGroups@2021-04-01' = {
  name: 'mg-production'
  properties: {
    displayName: 'Production'
    details: {
      parent: {
        id: landingZonesMG.id
      }
    }
  }
}

resource devMG 'Microsoft.Management/managementGroups@2021-04-01' = {
  name: 'mg-development'
  properties: {
    displayName: 'Development'
    details: {
      parent: {
        id: landingZonesMG.id
      }
    }
  }
}

resource sandboxMG 'Microsoft.Management/managementGroups@2021-04-01' = {
  name: 'mg-sandbox'
  properties: {
    displayName: 'Sandbox'
    details: {
      parent: {
        id: rootMG.id
      }
    }
  }
}
```

### Step 7: Privileged Identity Management (PIM)

```bash
# Enable PIM for a role (Azure CLI)
# List eligible role assignments
az rest --method GET \
  --url "https://management.azure.com/subscriptions/{sub-id}/providers/Microsoft.Authorization/roleEligibilityScheduleInstances?api-version=2020-10-01"

# Create eligible role assignment (time-bound)
az rest --method PUT \
  --url "https://management.azure.com/subscriptions/{sub-id}/providers/Microsoft.Authorization/roleEligibilityScheduleRequests/{request-id}?api-version=2020-10-01" \
  --body '{
    "properties": {
      "principalId": "{user-object-id}",
      "roleDefinitionId": "/subscriptions/{sub-id}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c",
      "requestType": "AdminAssign",
      "scheduleInfo": {
        "startDateTime": "2024-01-01T00:00:00Z",
        "expiration": {
          "type": "AfterDuration",
          "duration": "P365D"
        }
      },
      "justification": "Required for production operations"
    }
  }'

# Activate eligible role (JIT)
az rest --method PUT \
  --url "https://management.azure.com/subscriptions/{sub-id}/providers/Microsoft.Authorization/roleAssignmentScheduleRequests/{request-id}?api-version=2020-10-01" \
  --body '{
    "properties": {
      "principalId": "{user-object-id}",
      "roleDefinitionId": "/subscriptions/{sub-id}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c",
      "requestType": "SelfActivate",
      "linkedRoleEligibilityScheduleId": "{eligibility-schedule-id}",
      "scheduleInfo": {
        "startDateTime": null,
        "expiration": {
          "type": "AfterDuration",
          "duration": "PT8H"
        }
      },
      "justification": "Deploying hotfix to production",
      "ticketInfo": {
        "ticketNumber": "INC-12345",
        "ticketSystem": "ServiceNow"
      }
    }
  }'
```

### RBAC scope hierarchy

```
Management Group (broadest)
  └── Subscription
        └── Resource Group
              └── Resource (most specific)
```

Role assignments are **inherited** down the hierarchy. Always assign at the narrowest scope possible.

### Best practices

- **Assign roles to groups, not individual users** - Easier to manage at scale
- **Use built-in roles first** - Custom roles add management overhead
- **Assign at the narrowest scope** - Resource > Resource Group > Subscription
- **Use PIM for privileged roles** - Just-in-time access reduces standing permissions
- **Implement management group hierarchy** - Organize subscriptions for governance
- **Use Azure Policy for guardrails** - Prevent non-compliant resource creation
- **Prefer managed identity over service principals** - No secrets to manage
- **Use user-assigned MI for shared identity** - Lifecycle independent of resources
- **Audit with access reviews** - Regularly review role assignments (Entra ID P2)
- **Use conditions (ABAC)** - Fine-grained access control on data operations

### Anti-patterns

- **Granting Owner at subscription scope** - Use Contributor + specific data roles
- **Using personal accounts for service access** - Use managed identity or service principal
- **Not using groups for role assignments** - Individual assignments do not scale
- **Ignoring PIM for production** - Standing admin access is a security risk
- **Creating overly broad custom roles** - Be specific with actions and scopes
- **Policy in Audit-only mode forever** - Transition to Deny after validation
- **Not setting policy exemption expiry** - Exemptions should be time-bound
- **Using classic administrators** - Migrate to Azure RBAC

### Security considerations

- Enable PIM for all Owner and Contributor assignments
- Require MFA and justification for PIM activation
- Use deny assignments to protect critical resources from modification
- Configure Azure Policy to enforce security baselines (encryption, TLS, network rules)
- Use management groups to apply policies across all subscriptions
- Monitor role assignments with Azure Monitor activity logs
- Set up alerts for sensitive role assignment changes
- Use access reviews to periodically verify role assignments are still needed
- Implement break-glass accounts with monitoring for emergency access
- Use ABAC (attribute-based access control) conditions for storage data operations

### Cost optimization

- **Azure RBAC is free** - No cost for role assignments and custom role definitions
- **Azure Policy is free** - No cost for Audit and Deny effects
- **DeployIfNotExists/Modify** - Remediation may create resources (incurs resource costs)
- **Entra ID P2 for PIM** - Required for PIM, access reviews, and Identity Protection
- **Minimize custom roles** - Custom roles require ongoing maintenance and testing
- **Use management groups** - Reduce duplicate policy assignments across subscriptions
- **Right-size access** - Less access means less blast radius and audit overhead
