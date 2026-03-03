---
name: azure-sql
description: Generate Azure SQL Database configurations with elastic pools, geo-replication, security hardening, and performance tuning. Use when the user wants to set up or configure Azure SQL databases.
argument-hint: "[tier] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure SQL Database expert. Generate production-ready database configurations covering single databases, elastic pools, and managed instances.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Deployment model**: single database, elastic pool, or managed instance
- **Service tier**: Basic, Standard, Premium, General Purpose, Business Critical, Hyperscale
- **Purchasing model**: DTU-based or vCore-based
- **Size**: expected database size, concurrent users, transaction rate
- **Availability**: SLA requirements, geo-replication needs

### Step 2: Choose deployment model

| Model | Use Case | Best For |
|-------|----------|----------|
| Single database | Independent databases with predictable workloads | Most new applications |
| Elastic pool | Multiple databases with variable utilization | SaaS multi-tenant |
| Managed instance | Lift-and-shift from SQL Server on-premises | Migration scenarios |

### Step 3: Choose purchasing model and tier

**DTU model (bundled compute+storage):**
| Tier | DTUs | Storage | Use Case |
|------|------|---------|----------|
| Basic | 5 | 2 GB | Dev/test, low traffic |
| Standard | 10-3000 | 250 GB-1 TB | General workloads |
| Premium | 125-4000 | 500 GB-4 TB | High IO, in-memory OLTP |

**vCore model (independent compute+storage, recommended):**
| Tier | Use Case | Key Features |
|------|----------|--------------|
| General Purpose | Most workloads | Remote storage, zone redundancy |
| Business Critical | Low latency, HA | Local SSD, built-in read replicas |
| Hyperscale | Very large databases (up to 100 TB) | Rapid scale, instant backups |

**Serverless compute tier (vCore General Purpose):**
- Auto-pause after configurable idle period
- Auto-scale vCores within min/max range
- Pay per second of compute used
- Ideal for intermittent, unpredictable workloads

### Step 4: Generate database configuration

**Bicep (single database, vCore):**
```bicep
param location string = resourceGroup().location
param serverName string
param databaseName string
param adminLogin string
@secure()
param adminPassword string

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: serverName
  location: location
  properties: {
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
  }
  identity: {
    type: 'SystemAssigned'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 34359738368 // 32 GB
    autoPauseDelay: 60
    minCapacity: json('0.5')
    zoneRedundant: true
    requestedBackupStorageRedundancy: 'Zone'
    isLedgerOn: false
  }
}

resource auditSettings 'Microsoft.Sql/servers/auditingSettings@2023-05-01-preview' = {
  parent: sqlServer
  name: 'default'
  properties: {
    state: 'Enabled'
    storageEndpoint: storageAccountBlobEndpoint
    storageAccountAccessKey: storageAccountKey
    retentionDays: 90
    auditActionsAndGroups: [
      'SUCCESSFUL_DATABASE_AUTHENTICATION_GROUP'
      'FAILED_DATABASE_AUTHENTICATION_GROUP'
      'BATCH_COMPLETED_GROUP'
    ]
  }
}
```

**Terraform:**
```hcl
resource "azurerm_mssql_server" "main" {
  name                         = var.server_name
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = var.admin_login
  administrator_login_password = var.admin_password
  minimum_tls_version          = "1.2"
  public_network_access_enabled = false

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

resource "azurerm_mssql_database" "main" {
  name         = var.database_name
  server_id    = azurerm_mssql_server.main.id
  collation    = "SQL_Latin1_General_CP1_CI_AS"
  max_size_gb  = 32
  sku_name     = "GP_S_Gen5_2"
  zone_redundant = true

  auto_pause_delay_in_minutes = 60
  min_capacity                = 0.5

  short_term_retention_policy {
    retention_days           = 7
    backup_interval_in_hours = 12
  }

  long_term_retention_policy {
    weekly_retention  = "P4W"
    monthly_retention = "P12M"
    yearly_retention  = "P5Y"
    week_of_year      = 1
  }

  tags = var.tags
}
```

### Step 5: Configure elastic pool

```bicep
resource elasticPool 'Microsoft.Sql/servers/elasticPools@2023-05-01-preview' = {
  parent: sqlServer
  name: 'pool-shared'
  location: location
  sku: {
    name: 'GP_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 4
  }
  properties: {
    perDatabaseSettings: {
      minCapacity: json('0')
      maxCapacity: json('2')
    }
    maxSizeBytes: 107374182400 // 100 GB
    zoneRedundant: true
  }
}

resource pooledDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: 'tenant-db'
  location: location
  sku: {
    name: 'ElasticPool'
  }
  properties: {
    elasticPoolId: elasticPool.id
  }
}
```

### Step 6: Configure Azure AD authentication

```bicep
resource aadAdmin 'Microsoft.Sql/servers/administrators@2023-05-01-preview' = {
  parent: sqlServer
  name: 'ActiveDirectory'
  properties: {
    administratorType: 'ActiveDirectory'
    login: aadAdminGroupName
    sid: aadAdminGroupObjectId
    tenantId: subscription().tenantId
  }
}

// Azure AD-only authentication (recommended)
resource aadOnlyAuth 'Microsoft.Sql/servers/azureADOnlyAuthentications@2023-05-01-preview' = {
  parent: sqlServer
  name: 'Default'
  properties: {
    azureADOnlyAuthentication: true
  }
}
```

**Connect with managed identity:**
```csharp
// C# - DefaultAzureCredential for managed identity
var connectionString = "Server=tcp:myserver.database.windows.net;Database=mydb;Authentication=Active Directory Default;";
using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();
```

### Step 7: Configure geo-replication and failover groups

```bicep
resource failoverGroup 'Microsoft.Sql/servers/failoverGroups@2023-05-01-preview' = {
  parent: sqlServer
  name: 'fog-myapp'
  properties: {
    readWriteEndpoint: {
      failoverPolicy: 'Automatic'
      failoverWithDataLossGracePeriodMinutes: 60
    }
    readOnlyEndpoint: {
      failoverPolicy: 'Enabled'
    }
    partnerServers: [
      {
        id: secondaryServer.id
      }
    ]
    databases: [
      sqlDatabase.id
    ]
  }
}
```

- Use `<fog-name>.database.windows.net` as connection string (auto-routes to primary)
- Read-only endpoint: `<fog-name>.secondary.database.windows.net`
- Automatic failover with configurable grace period

### Step 8: Configure security features

**Transparent Data Encryption (TDE) with CMK:**
```bicep
resource tdeProtector 'Microsoft.Sql/servers/encryptionProtector@2023-05-01-preview' = {
  parent: sqlServer
  name: 'current'
  properties: {
    serverKeyType: 'AzureKeyVault'
    serverKeyName: '${keyVaultName}_${keyName}_${keyVersion}'
    autoRotationEnabled: true
  }
}
```

**Advanced Threat Protection:**
```bicep
resource threatProtection 'Microsoft.Sql/servers/securityAlertPolicies@2023-05-01-preview' = {
  parent: sqlServer
  name: 'Default'
  properties: {
    state: 'Enabled'
    emailAddresses: ['security@company.com']
    emailAccountAdmins: true
  }
}
```

**Dynamic data masking:**
```sql
-- Mask email column
ALTER TABLE Customers
ALTER COLUMN Email ADD MASKED WITH (FUNCTION = 'email()');

-- Mask credit card column
ALTER TABLE Orders
ALTER COLUMN CreditCard ADD MASKED WITH (FUNCTION = 'partial(0,"XXXX-XXXX-XXXX-",4)');

-- Grant unmask permission
GRANT UNMASK ON Customers(Email) TO [DataAnalystRole];
```

**Row-level security:**
```sql
-- Create security policy
CREATE FUNCTION dbo.fn_TenantFilter(@TenantId INT)
RETURNS TABLE WITH SCHEMABINDING AS
RETURN SELECT 1 AS result
WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS INT);

CREATE SECURITY POLICY TenantPolicy
ADD FILTER PREDICATE dbo.fn_TenantFilter(TenantId) ON dbo.Orders;
```

**Always Encrypted:**
```sql
-- Column master key and column encryption key setup
CREATE COLUMN MASTER KEY CMK_Auto1
WITH (KEY_STORE_PROVIDER_NAME = 'AZURE_KEY_VAULT',
      KEY_PATH = 'https://myvault.vault.azure.net/keys/mykey/...');

CREATE COLUMN ENCRYPTION KEY CEK_Auto1
WITH VALUES (COLUMN_MASTER_KEY = CMK_Auto1, ...);

-- Encrypt column
ALTER TABLE Patients
ALTER COLUMN SSN NVARCHAR(11)
ENCRYPTED WITH (ENCRYPTION_TYPE = DETERMINISTIC,
  ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256',
  COLUMN_ENCRYPTION_KEY = CEK_Auto1);
```

### Step 9: Configure backup and retention

**Short-term retention (PITR):**
- 1-35 days (default 7)
- Point-in-time restore to any second within window

**Long-term retention (LTR):**
```bicep
resource ltrPolicy 'Microsoft.Sql/servers/databases/backupLongTermRetentionPolicies@2023-05-01-preview' = {
  parent: sqlDatabase
  name: 'default'
  properties: {
    weeklyRetention: 'P4W'
    monthlyRetention: 'P12M'
    yearlyRetention: 'P5Y'
    weekOfYear: 1
  }
}
```

### Step 10: Performance tuning

**Automatic tuning:**
```bicep
resource autoTuning 'Microsoft.Sql/servers/databases/automaticTuning@2023-05-01-preview' = {
  parent: sqlDatabase
  name: 'current'
  properties: {
    desiredState: 'Auto'
    options: {
      createIndex: { desiredState: 'On' }
      dropIndex: { desiredState: 'On' }
      forceLastGoodPlan: { desiredState: 'On' }
    }
  }
}
```

**Intelligent Insights:**
- Automatic detection of performance issues
- Root cause analysis and remediation recommendations
- Integration with Azure Monitor and Log Analytics

**Query Performance Insight:**
- Identify top resource-consuming queries
- Historical query performance data
- Recommendations for index creation

### Best practices

- **Use vCore model**: more flexibility and cost control than DTU
- **Enable Azure AD-only auth**: disable SQL authentication for production
- **Use serverless tier**: for dev/test and intermittent workloads
- **Configure failover groups**: for business continuity across regions
- **Enable auditing**: route to Log Analytics for centralized monitoring
- **Use private endpoints**: disable public network access
- **Enable automatic tuning**: let Azure manage index and plan optimization
- **Set long-term retention**: for compliance and disaster recovery

### Anti-patterns to avoid

- Using SQL authentication instead of Azure AD with managed identity
- Leaving public network access enabled in production
- Over-provisioning DTUs/vCores without monitoring utilization
- Not configuring long-term backup retention for compliance
- Using single database when elastic pool would reduce costs
- Ignoring Intelligent Insights and automatic tuning recommendations
- Storing connection strings with passwords in application config
- Not testing failover group switchover before an actual disaster

### Security considerations

- Enable Microsoft Defender for SQL for vulnerability assessment and threat detection
- Use Azure AD-only authentication with managed identities
- Configure TDE with customer-managed keys for sensitive data
- Implement row-level security for multi-tenant applications
- Enable Always Encrypted for PII/PHI columns
- Use dynamic data masking for non-privileged users
- Configure IP firewall rules or private endpoints (never both open)
- Enable auditing to Log Analytics or Event Hub

### Cost optimization

- Use serverless compute for intermittent workloads (auto-pause saves compute)
- Right-size vCores using DTU/vCore utilization metrics
- Use elastic pools for databases with complementary usage patterns
- Leverage reserved capacity (1-year or 3-year) for predictable workloads
- Use Hyperscale tier for very large databases (pay only for allocated storage)
- Configure backup storage redundancy (LRS is cheaper than GRS)
- Monitor with Azure Advisor for right-sizing recommendations
- Use read replicas to offload reporting workloads from primary
