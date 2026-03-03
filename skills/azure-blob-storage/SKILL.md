---
name: azure-blob-storage
description: Generate Azure Blob Storage configurations with lifecycle management, access tiers, security policies, and data lake integration. Use when the user wants to set up or configure Azure storage accounts and blob containers.
argument-hint: "[purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Blob Storage expert. Generate production-ready storage account and blob container configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Purpose**: data lake, backups, static site hosting, media storage, archival
- **Access pattern**: frequent, infrequent, rare, write-once-read-many
- **Data types**: block blobs (files), append blobs (logs), page blobs (disks)
- **Scale**: expected storage size, request rate, egress bandwidth
- **Compliance**: immutability, legal hold, encryption requirements

### Step 2: Choose storage account type

| Account Type | Use Case | Performance |
|-------------|----------|-------------|
| General-purpose v2 | Most scenarios (recommended default) | Standard or Premium |
| Premium block blobs | Low-latency, high transaction rates | Premium SSD |
| Premium page blobs | Unmanaged VM disks | Premium SSD |
| Premium file shares | Enterprise file shares | Premium SSD |

**Redundancy options:**
- **LRS**: 3 copies in single datacenter (lowest cost)
- **ZRS**: 3 copies across availability zones (recommended for production)
- **GRS**: 6 copies across two regions (disaster recovery)
- **GZRS**: ZRS in primary + LRS in secondary (highest durability)
- **RA-GRS / RA-GZRS**: Read access to secondary region

### Step 3: Generate storage account configuration

**Bicep:**
```bicep
param location string = resourceGroup().location
param storageAccountName string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_ZRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: []
      ipRules: []
    }
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    isVersioningEnabled: true
    changeFeed: {
      enabled: true
      retentionInDays: 90
    }
  }
}
```

**Terraform:**
```hcl
resource "azurerm_storage_account" "main" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  account_kind             = "StorageV2"
  access_tier              = "Hot"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = false

  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]
  }

  blob_properties {
    versioning_enabled       = true
    change_feed_enabled      = true
    change_feed_retention_in_days = 90

    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 30
    }
  }

  tags = var.tags
}
```

### Step 4: Configure access tiers and lifecycle management

**Access tiers (per-blob or default):**
- **Hot**: frequently accessed data, highest storage cost, lowest access cost
- **Cool**: infrequently accessed, stored 30+ days, lower storage cost
- **Cold**: rarely accessed, stored 90+ days, even lower storage cost
- **Archive**: offline, stored 180+ days, lowest cost, hours to rehydrate

**Lifecycle management policy (Bicep):**
```bicep
resource lifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'tierToCool'
          type: 'Lifecycle'
          definition: {
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 30
                }
                tierToCold: {
                  daysAfterModificationGreaterThan: 90
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: 180
                }
                delete: {
                  daysAfterModificationGreaterThan: 365
                }
              }
              snapshot: {
                delete: {
                  daysAfterCreationGreaterThan: 90
                }
              }
              version: {
                delete: {
                  daysAfterCreationGreaterThan: 90
                }
              }
            }
            filters: {
              blobTypes: ['blockBlob']
              prefixMatch: ['logs/', 'backups/']
            }
          }
        }
      ]
    }
  }
}
```

**Lifecycle management policy (Terraform):**
```hcl
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "tier-and-expire"
    enabled = true

    filters {
      prefix_match = ["logs/", "backups/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_cold_after_days_since_modification_greater_than    = 90
        tier_to_archive_after_days_since_modification_greater_than = 180
        delete_after_days_since_modification_greater_than          = 365
      }
      snapshot {
        delete_after_days_since_creation_greater_than = 90
      }
      version {
        delete_after_days_since_creation = 90
      }
    }
  }
}
```

### Step 5: Configure immutable storage (WORM)

For compliance (SEC 17a-4, CFTC, FINRA):
```bicep
resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'compliance-data'
  properties: {
    immutableStorageWithVersioning: {
      enabled: true
    }
  }
}
```

- **Time-based retention**: lock blobs for a fixed period
- **Legal hold**: indefinite hold until explicitly removed
- **Version-level immutability**: granular control per blob version

### Step 6: Configure Azure Data Lake Storage Gen2

Enable hierarchical namespace for data lake workloads:
```bicep
resource dataLakeAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
  properties: {
    isHnsEnabled: true
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
  }
}
```

- ACLs at file and directory level (POSIX-style)
- Integration with Azure Synapse, Databricks, HDInsight
- Optimized for analytics workloads (rename operations are atomic)

### Step 7: Configure SAS tokens and access policies

**Stored access policy (reusable, revocable):**
```bash
az storage container policy create \
  --account-name $STORAGE_ACCOUNT \
  --container-name mycontainer \
  --name read-policy \
  --permissions rl \
  --start $(date -u +%Y-%m-%dT%H:%MZ) \
  --expiry $(date -u -d "+1 year" +%Y-%m-%dT%H:%MZ)
```

**SAS token types:**
- **Account SAS**: access to multiple services/resource types
- **Service SAS**: scoped to single service (blob, queue, table, file)
- **User delegation SAS**: signed with Azure AD credentials (recommended)

**Generate user delegation SAS:**
```bash
az storage blob generate-sas \
  --account-name $STORAGE_ACCOUNT \
  --container-name mycontainer \
  --name myblob.txt \
  --permissions r \
  --expiry $(date -u -d "+1 hour" +%Y-%m-%dT%H:%MZ) \
  --as-user \
  --auth-mode login
```

### Step 8: Static website hosting and CDN

```bash
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --index-document index.html \
  --404-document 404.html
```

**CDN integration:**
- Azure CDN or Azure Front Door for global distribution
- Custom domain with managed HTTPS certificate
- Caching rules and purge capabilities
- Origin configuration pointing to `$web` container

**CORS configuration:**
```bash
az storage cors add \
  --account-name $STORAGE_ACCOUNT \
  --services b \
  --methods GET HEAD OPTIONS \
  --origins "https://example.com" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600
```

### Step 9: Private endpoints and network security

```bicep
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-04-01' = {
  name: '${storageAccountName}-pe'
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${storageAccountName}-plsc'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: ['blob']
        }
      }
    ]
  }
}
```

### Step 10: Customer-managed keys (CMK)

```bicep
resource storageAccountCmk 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    encryption: {
      keySource: 'Microsoft.Keyvault'
      keyvaultproperties: {
        keyname: keyName
        keyvaulturi: keyVaultUri
        keyversion: ''
      }
      identity: {
        userAssignedIdentity: managedIdentityId
      }
    }
  }
}
```

### Step 11: AzCopy patterns

```bash
# Upload directory to blob container
azcopy copy "/local/path/*" "https://${ACCOUNT}.blob.core.windows.net/container/?${SAS}" --recursive

# Sync local to blob (only changed files)
azcopy sync "/local/path" "https://${ACCOUNT}.blob.core.windows.net/container/?${SAS}" --recursive

# Copy between storage accounts
azcopy copy "https://source.blob.core.windows.net/container/?${SAS}" \
  "https://dest.blob.core.windows.net/container/?${SAS}" --recursive

# Archive tier bulk move
azcopy copy "https://${ACCOUNT}.blob.core.windows.net/container/archive/*?${SAS}" \
  "https://${ACCOUNT}.blob.core.windows.net/container/archive/*?${SAS}" \
  --block-blob-tier Archive --recursive
```

### Best practices

- **Default to deny**: disable public blob access, use private endpoints
- **Use Azure AD authentication**: prefer managed identity and RBAC over shared keys
- **Disable shared key access**: set `allowSharedKeyAccess: false` when possible
- **Enable soft delete**: for blobs (30 days) and containers (30 days)
- **Enable versioning**: for critical data to recover from accidental overwrites
- **Set lifecycle policies from day one**: automate tier transitions to reduce costs
- **Use ZRS or GZRS**: for production workloads requiring zone resilience
- **Enforce TLS 1.2 minimum**: reject older protocol versions
- **Enable diagnostic logging**: track read, write, and delete operations
- **Use hierarchical namespace**: for data lake and analytics workloads

### Anti-patterns to avoid

- Enabling public blob access for convenience instead of using SAS or RBAC
- Using account keys in application code instead of managed identities
- Storing all data in Hot tier without lifecycle policies
- Creating separate storage accounts when containers with different policies suffice
- Not enabling soft delete before going to production
- Using GRS without testing failover procedures
- Generating long-lived SAS tokens without stored access policies
- Ignoring CORS configuration for browser-based access patterns

### Security considerations

- Enable Microsoft Defender for Storage for threat detection
- Use Azure Policy to enforce encryption and network rules at scale
- Rotate account keys regularly if shared key access is required
- Configure Azure Monitor alerts for anonymous access attempts
- Use immutable storage for compliance-regulated data
- Enable infrastructure encryption for double encryption at rest
- Restrict storage firewall to specific VNETs, IPs, and Azure services

### Cost optimization

- Use lifecycle management to automatically tier data (Hot -> Cool -> Cold -> Archive)
- Use reserved capacity for predictable workloads (1-year or 3-year)
- Monitor with Azure Storage Analytics and Cost Management
- Use Cool or Cold tier for backups and infrequently accessed data
- Enable last access time tracking for intelligent lifecycle policies
- Delete old snapshots and versions via lifecycle rules
- Use Blob inventory reports to identify optimization opportunities
- Consider Premium block blobs only for latency-sensitive, high-transaction workloads
