---
name: azure-cosmos-db
description: Generate Azure Cosmos DB configurations with multi-model APIs, partitioning strategies, global distribution, and consistency tuning. Use when the user wants to set up or configure Cosmos DB databases and containers.
argument-hint: "[api] [operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Cosmos DB expert. Generate production-ready configurations for globally distributed, multi-model databases.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **API**: NoSQL (core), MongoDB, Cassandra, Gremlin, Table, PostgreSQL
- **Operation**: data modeling, query optimization, indexing, throughput planning
- **Distribution**: single region or multi-region with write preferences
- **Consistency**: latency vs consistency trade-offs
- **Scale**: expected RU/s, data size, partition count

### Step 2: Choose the right API

| API | Use Case | Query Language |
|-----|----------|---------------|
| NoSQL (Core) | New applications, JSON documents | SQL-like syntax |
| MongoDB | Existing MongoDB apps, migration | MongoDB query API |
| Cassandra | Existing Cassandra apps, wide-column | CQL |
| Gremlin | Graph databases, relationship queries | Gremlin traversal |
| Table | Key-value, migration from Table Storage | OData / LINQ |
| PostgreSQL | Distributed relational (Citus) | PostgreSQL SQL |

### Step 3: Design partition strategy

**Partition key selection (critical for performance):**
- Must have high cardinality (many distinct values)
- Must distribute data and requests evenly
- Should align with most frequent query filter
- Cannot be changed after container creation

**Good partition keys by scenario:**
| Scenario | Partition Key | Reason |
|----------|--------------|--------|
| E-commerce orders | `/customerId` | Queries per customer |
| IoT telemetry | `/deviceId` | Data per device |
| Multi-tenant SaaS | `/tenantId` | Isolation per tenant |
| Social media posts | `/userId` | Posts per user |
| Event logging | `/category` | Events by category |

**Hierarchical partition keys (preview):**
```json
{
  "partitionKey": {
    "paths": ["/tenantId", "/userId", "/sessionId"],
    "kind": "MultiHash",
    "version": 2
  }
}
```
- Up to 3 levels of partition hierarchy
- Enables efficient fan-out queries at each level
- Ideal for multi-tenant with sub-partitioning needs

### Step 4: Generate Cosmos DB configuration

**Bicep (API for NoSQL):**
```bicep
param location string = resourceGroup().location
param accountName string
param databaseName string

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: true
      }
      {
        locationName: 'westus'
        failoverPriority: 1
        isZoneRedundant: true
      }
    ]
    enableMultipleWriteLocations: false
    enableAutomaticFailover: true
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: {
        tier: 'Continuous7Days'
      }
    }
    capabilities: []
    disableLocalAuth: true
    publicNetworkAccess: 'Disabled'
    networkAclBypass: 'AzureServices'
    minimalTlsVersion: 'Tls12'
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'orders'
  properties: {
    resource: {
      id: 'orders'
      partitionKey: {
        paths: ['/customerId']
        kind: 'Hash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/customerId/?' }
          { path: '/orderDate/?' }
          { path: '/status/?' }
        ]
        excludedPaths: [
          { path: '/*' }
        ]
        compositeIndexes: [
          [
            { path: '/customerId', order: 'ascending' }
            { path: '/orderDate', order: 'descending' }
          ]
        ]
      }
      defaultTtl: -1
      uniqueKeyPolicy: {
        uniqueKeys: [
          { paths: ['/customerId', '/orderNumber'] }
        ]
      }
    }
    options: {
      autoscaleSettings: {
        maxThroughput: 4000
      }
    }
  }
}
```

**Terraform:**
```hcl
resource "azurerm_cosmosdb_account" "main" {
  name                          = var.account_name
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  offer_type                    = "Standard"
  kind                          = "GlobalDocumentDB"
  automatic_failover_enabled    = true
  multiple_write_locations_enabled = false
  local_authentication_disabled = true
  public_network_access_enabled = false
  minimal_tls_version           = "Tls12"

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
    zone_redundant    = true
  }

  geo_location {
    location          = "westus"
    failover_priority = 1
    zone_redundant    = true
  }

  backup {
    type                = "Continuous"
    tier                = "Continuous7Days"
  }

  tags = var.tags
}

resource "azurerm_cosmosdb_sql_database" "main" {
  name                = var.database_name
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_sql_container" "orders" {
  name                = "orders"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_paths = ["/customerId"]
  partition_key_version = 2
  default_ttl         = -1

  autoscale_settings {
    max_throughput = 4000
  }

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/customerId/?"
    }
    included_path {
      path = "/orderDate/?"
    }
    included_path {
      path = "/status/?"
    }
    excluded_path {
      path = "/*"
    }

    composite_index {
      index {
        path  = "/customerId"
        order = "ascending"
      }
      index {
        path  = "/orderDate"
        order = "descending"
      }
    }
  }

  unique_key {
    paths = ["/customerId", "/orderNumber"]
  }
}
```

### Step 5: Configure indexing policies

**Default indexing (all paths):**
```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [{ "path": "/*" }],
  "excludedPaths": [{ "path": "/\"_etag\"/?" }]
}
```

**Optimized indexing (exclude by default, include selectively):**
```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    { "path": "/customerId/?" },
    { "path": "/orderDate/?" }
  ],
  "excludedPaths": [
    { "path": "/*" }
  ]
}
```

**Composite indexes (for ORDER BY on multiple fields):**
```json
{
  "compositeIndexes": [
    [
      { "path": "/status", "order": "ascending" },
      { "path": "/orderDate", "order": "descending" }
    ]
  ]
}
```

**Spatial indexes (for geospatial queries):**
```json
{
  "spatialIndexes": [
    {
      "path": "/location/*",
      "types": ["Point", "Polygon"]
    }
  ]
}
```

### Step 6: Configure throughput

**Provisioned throughput:**
- Fixed RU/s allocated to container or database
- Manual scaling or autoscale (100-max RU/s)
- Best for predictable, steady workloads

**Autoscale throughput:**
```json
{
  "autoscaleSettings": {
    "maxThroughput": 4000
  }
}
```
- Scales between 10% and 100% of max RU/s
- Best for variable traffic patterns
- Costs ~1.5x the minimum provisioned rate

**Serverless:**
- Pay per RU consumed, no provisioning
- Max 5000 RU/s per container
- Single region only
- Best for dev/test and low-traffic apps

### Step 7: Configure consistency levels

| Level | Latency | Throughput | Guarantee |
|-------|---------|-----------|-----------|
| Strong | Highest | Lowest | Linearizable reads |
| Bounded Staleness | High | Lower | Reads lag by K versions or T time |
| Session | Medium | Medium | Read-your-writes within session |
| Consistent Prefix | Low | Higher | Reads never see out-of-order writes |
| Eventual | Lowest | Highest | No ordering guarantee |

**Recommendation:** Use Session consistency (default) for most applications. Override per-request when needed:
```javascript
const { resource } = await container.item(id, partitionKey).read({
  consistencyLevel: "Strong"
});
```

### Step 8: Configure change feed

**Azure Functions binding:**
```javascript
// function.json
{
  "bindings": [
    {
      "type": "cosmosDBTrigger",
      "name": "documents",
      "direction": "in",
      "connectionStringSetting": "CosmosDBConnection",
      "databaseName": "mydb",
      "containerName": "orders",
      "leaseContainerName": "leases",
      "createLeaseContainerIfNotExists": true,
      "startFromBeginning": false
    }
  ]
}

// index.js
module.exports = async function (context, documents) {
  for (const doc of documents) {
    context.log(`Processing change for order: ${doc.id}`);
    // Materialize view, send notification, sync to search index
  }
};
```

**Change feed processor (SDK):**
```csharp
Container leaseContainer = database.GetContainer("leases");
ChangeFeedProcessor processor = container
    .GetChangeFeedProcessorBuilder<Order>("orderProcessor", HandleChangesAsync)
    .WithInstanceName("host-1")
    .WithLeaseContainer(leaseContainer)
    .WithStartTime(DateTime.UtcNow)
    .Build();

await processor.StartAsync();

static async Task HandleChangesAsync(
    ChangeFeedProcessorContext context,
    IReadOnlyCollection<Order> changes,
    CancellationToken cancellationToken)
{
    foreach (Order order in changes)
    {
        // Process each changed document
    }
}
```

### Step 9: Stored procedures, triggers, and UDFs

**Stored procedure (transactional, single partition):**
```javascript
function bulkInsert(items) {
  var context = getContext();
  var container = context.getCollection();
  var response = context.getResponse();
  var count = 0;

  if (!items || items.length === 0) {
    response.setBody({ count: 0 });
    return;
  }

  tryCreate(items[count], callback);

  function tryCreate(item, cb) {
    var accepted = container.createDocument(container.getSelfLink(), item, cb);
    if (!accepted) {
      response.setBody({ count: count });
    }
  }

  function callback(err, item) {
    if (err) throw err;
    count++;
    if (count < items.length) {
      tryCreate(items[count], callback);
    } else {
      response.setBody({ count: count });
    }
  }
}
```

### Step 10: Global distribution and multi-region writes

**Enable multi-region writes:**
```bicep
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  properties: {
    enableMultipleWriteLocations: true
    locations: [
      { locationName: 'eastus', failoverPriority: 0, isZoneRedundant: true }
      { locationName: 'westeurope', failoverPriority: 1, isZoneRedundant: true }
      { locationName: 'southeastasia', failoverPriority: 2, isZoneRedundant: true }
    ]
  }
}
```

**Conflict resolution:**
- **Last Writer Wins (LWW)**: default, based on `_ts` or custom path
- **Custom**: stored procedure for merge logic
- **Manual**: write to conflict feed for manual resolution

### Best practices

- **Choose partition key carefully**: it cannot be changed later; optimize for query patterns
- **Use autoscale throughput**: for variable or unpredictable workloads
- **Disable local auth**: use Azure AD RBAC with managed identities
- **Optimize indexing**: exclude unnecessary paths to reduce RU cost and write latency
- **Use point reads**: `ReadItem(id, partitionKey)` is cheapest at 1 RU
- **Include partition key in queries**: avoid cross-partition queries
- **Enable continuous backup**: for point-in-time restore capability
- **Use Session consistency**: unless you specifically need stronger guarantees
- **Denormalize data**: embed related data in same document to reduce joins

### Anti-patterns to avoid

- Using a low-cardinality partition key (e.g., status, country code)
- Selecting a partition key that creates hot partitions
- Running cross-partition queries for frequent operations
- Using provisioned throughput for unpredictable dev workloads (use serverless)
- Indexing all paths when most are never queried (wastes RUs on writes)
- Using strong consistency globally when session consistency suffices
- Treating Cosmos DB like a relational database with heavy normalization
- Not monitoring 429 (throttled) responses and RU consumption
- Using large documents (>100 KB) that inflate RU costs for reads

### Security considerations

- Disable local authentication; use Azure AD RBAC exclusively
- Configure private endpoints; disable public network access
- Enable customer-managed keys for encryption at rest
- Use role-based access control (data plane RBAC) for granular permissions
- Enable diagnostic logging to Log Analytics
- Use Azure Policy to enforce security standards across accounts
- Implement IP firewall rules as an additional layer (if public access is needed)
- Enable Microsoft Defender for Cosmos DB for threat detection

### Cost optimization

- Use autoscale to avoid over-provisioning (scales down to 10% of max)
- Use serverless for dev/test and infrequent workloads
- Optimize indexing policies (fewer indexed paths = lower write cost)
- Use point reads instead of queries when possible (1 RU for 1 KB item)
- Minimize cross-partition queries (higher RU cost)
- Set TTL to auto-delete expired documents (saves storage)
- Monitor RU consumption per operation with diagnostics
- Use reserved capacity (1-year or 3-year) for predictable production workloads
- Share throughput at database level for small containers with similar patterns
- Evaluate multi-region vs single-region based on actual latency requirements
