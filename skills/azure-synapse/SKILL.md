---
name: azure-synapse
description: Generate Azure Synapse Analytics workspace configurations with SQL pools, Spark pools, data pipelines, and integrated analytics. Use when the user wants to set up data warehousing, big data processing, or analytics pipelines.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Synapse Analytics expert. Generate production-ready data warehousing, big data processing, and analytics pipeline configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: workspace setup, SQL pool creation, Spark pool creation, pipeline design, query optimization
- **Workload type**: data warehousing, ETL/ELT, real-time analytics, data exploration
- **Data sources**: Azure Data Lake, Blob Storage, Cosmos DB, SQL databases, external sources
- **Scale**: data volume (GB/TB/PB), concurrent users, query complexity
- **Integration**: Power BI, Azure ML, Data Lake, external tools

### Step 2: Understand Synapse components

| Component | Use Case | Billing Model |
|-----------|----------|---------------|
| Dedicated SQL Pool | Enterprise data warehouse (structured) | DWU provisioned |
| Serverless SQL Pool | Ad-hoc queries on Data Lake | Per TB scanned |
| Apache Spark Pool | Big data processing, ML, notebooks | Per node-hour |
| Synapse Pipelines | Data integration and orchestration | Per activity run |
| Synapse Link | Real-time analytics on operational data | Per source |

### Step 3: Generate workspace configuration

**Bicep:**
```bicep
param location string = resourceGroup().location
param workspaceName string
param dataLakeAccountName string
param dataLakeFileSystem string

resource synapseWorkspace 'Microsoft.Synapse/workspaces@2021-06-01' = {
  name: workspaceName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    defaultDataLakeStorage: {
      accountUrl: 'https://${dataLakeAccountName}.dfs.core.windows.net'
      filesystem: dataLakeFileSystem
    }
    managedVirtualNetwork: 'default'
    managedResourceGroupName: '${workspaceName}-managed-rg'
    publicNetworkAccess: 'Disabled'
    sqlAdministratorLogin: sqlAdminLogin
    sqlAdministratorLoginPassword: sqlAdminPassword
    managedVirtualNetworkSettings: {
      preventDataExfiltration: true
      allowedAadTenantIdsForLinking: [subscription().tenantId]
    }
    trustedServiceBypassEnabled: true
  }
}

resource firewallRule 'Microsoft.Synapse/workspaces/firewallRules@2021-06-01' = {
  parent: synapseWorkspace
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Azure AD admin
resource aadAdmin 'Microsoft.Synapse/workspaces/administrators@2021-06-01' = {
  parent: synapseWorkspace
  name: 'activeDirectory'
  properties: {
    sid: aadAdminObjectId
    tenantId: subscription().tenantId
    administratorType: 'ActiveDirectory'
    login: aadAdminGroupName
  }
}
```

**Terraform:**
```hcl
resource "azurerm_synapse_workspace" "main" {
  name                                 = var.workspace_name
  resource_group_name                  = azurerm_resource_group.main.name
  location                             = azurerm_resource_group.main.location
  storage_data_lake_gen2_filesystem_id = azurerm_storage_data_lake_gen2_filesystem.main.id
  sql_administrator_login              = var.sql_admin_login
  sql_administrator_login_password     = var.sql_admin_password
  managed_virtual_network_enabled      = true
  public_network_access_enabled        = false
  data_exfiltration_protection_enabled = true

  identity {
    type = "SystemAssigned"
  }

  aad_admin {
    login     = var.aad_admin_group_name
    object_id = var.aad_admin_object_id
    tenant_id = data.azurerm_client_config.current.tenant_id
  }

  tags = var.tags
}

resource "azurerm_synapse_firewall_rule" "azure_services" {
  name                 = "AllowAzureServices"
  synapse_workspace_id = azurerm_synapse_workspace.main.id
  start_ip_address     = "0.0.0.0"
  end_ip_address       = "0.0.0.0"
}
```

### Step 4: Create dedicated SQL pool

**Bicep:**
```bicep
resource dedicatedSqlPool 'Microsoft.Synapse/workspaces/sqlPools@2021-06-01' = {
  parent: synapseWorkspace
  name: 'dwh'
  location: location
  sku: {
    name: 'DW200c'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}
```

**DWU sizing guide:**
| DWU | Compute Nodes | Distributions | Use Case |
|-----|--------------|---------------|----------|
| DW100c | 1 | 60 | Dev/test, small workloads |
| DW200c-DW500c | 1 | 60 | Small-medium warehouses |
| DW1000c-DW2500c | 2-5 | 60 | Medium-large warehouses |
| DW3000c-DW30000c | 6-60 | 60 | Large enterprise warehouses |

**Distribution strategies:**

```sql
-- Hash distributed: for large fact tables (even distribution)
CREATE TABLE dbo.FactSales
(
    SalesKey BIGINT NOT NULL,
    CustomerKey INT NOT NULL,
    ProductKey INT NOT NULL,
    OrderDate DATE NOT NULL,
    SalesAmount DECIMAL(18,2) NOT NULL
)
WITH
(
    DISTRIBUTION = HASH(CustomerKey),
    CLUSTERED COLUMNSTORE INDEX,
    PARTITION (OrderDate RANGE RIGHT FOR VALUES
        ('2024-01-01', '2024-04-01', '2024-07-01', '2024-10-01'))
);

-- Round-robin: for staging/load tables (equal distribution)
CREATE TABLE dbo.StagingSales
(
    SalesKey BIGINT,
    CustomerKey INT,
    ProductKey INT,
    SalesAmount DECIMAL(18,2)
)
WITH
(
    DISTRIBUTION = ROUND_ROBIN,
    HEAP
);

-- Replicated: for small dimension tables (< 2 GB)
CREATE TABLE dbo.DimProduct
(
    ProductKey INT NOT NULL,
    ProductName NVARCHAR(100),
    Category NVARCHAR(50),
    Price DECIMAL(18,2)
)
WITH
(
    DISTRIBUTION = REPLICATE,
    CLUSTERED COLUMNSTORE INDEX
);
```

**Choosing distribution strategy:**
| Strategy | Use Case | Guidelines |
|----------|----------|-----------|
| HASH | Large fact tables, join keys | Choose column with many unique values, used in JOINs |
| ROUND_ROBIN | Staging, temp, no clear join pattern | Default, good for loads |
| REPLICATE | Small dimension tables (< 2 GB) | Eliminates data movement for joins |

### Step 5: Configure serverless SQL pool

Query data in Data Lake without loading:

```sql
-- Query Parquet files directly
SELECT
    CustomerID,
    SUM(Amount) AS TotalAmount,
    COUNT(*) AS OrderCount
FROM OPENROWSET(
    BULK 'https://datalake.dfs.core.windows.net/raw/sales/year=2024/**',
    FORMAT = 'PARQUET'
) AS sales
GROUP BY CustomerID
ORDER BY TotalAmount DESC;

-- Query CSV with schema
SELECT *
FROM OPENROWSET(
    BULK 'https://datalake.dfs.core.windows.net/raw/customers/*.csv',
    FORMAT = 'CSV',
    PARSER_VERSION = '2.0',
    HEADER_ROW = TRUE,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n'
) WITH (
    CustomerID INT,
    Name VARCHAR(100),
    Email VARCHAR(200),
    CreatedDate DATE
) AS customers;

-- Create external table (logical view over Data Lake)
CREATE EXTERNAL DATA SOURCE DataLakeSource
WITH (
    LOCATION = 'https://datalake.dfs.core.windows.net/curated'
);

CREATE EXTERNAL FILE FORMAT ParquetFormat
WITH (
    FORMAT_TYPE = PARQUET,
    DATA_COMPRESSION = 'org.apache.hadoop.io.compress.SnappyCodec'
);

CREATE EXTERNAL TABLE dbo.ExternalSales (
    SalesKey BIGINT,
    CustomerKey INT,
    Amount DECIMAL(18,2),
    SalesDate DATE
)
WITH (
    LOCATION = 'sales/',
    DATA_SOURCE = DataLakeSource,
    FILE_FORMAT = ParquetFormat
);

-- Create database-scoped credential for managed identity
CREATE DATABASE SCOPED CREDENTIAL SynapseIdentity
WITH IDENTITY = 'Managed Identity';

CREATE EXTERNAL DATA SOURCE SecuredDataLake
WITH (
    LOCATION = 'https://datalake.dfs.core.windows.net/sensitive',
    CREDENTIAL = SynapseIdentity
);
```

### Step 6: Create Spark pool

**Bicep:**
```bicep
resource sparkPool 'Microsoft.Synapse/workspaces/bigDataPools@2021-06-01' = {
  parent: synapseWorkspace
  name: 'sparkpool'
  location: location
  properties: {
    autoPause: {
      enabled: true
      delayInMinutes: 15
    }
    autoScale: {
      enabled: true
      minNodeCount: 3
      maxNodeCount: 10
    }
    nodeSize: 'Medium'
    nodeSizeFamily: 'MemoryOptimized'
    sparkVersion: '3.4'
    sessionLevelPackagesEnabled: true
    dynamicExecutorAllocation: {
      enabled: true
      minExecutors: 1
      maxExecutors: 9
    }
  }
}
```

**Spark pool usage (PySpark notebook):**
```python
# Read from Data Lake
df = spark.read.parquet("abfss://raw@datalake.dfs.core.windows.net/sales/")

# Transform
from pyspark.sql.functions import col, sum, count, year, month

monthly_sales = (
    df.withColumn("Year", year(col("OrderDate")))
      .withColumn("Month", month(col("OrderDate")))
      .groupBy("Year", "Month", "Category")
      .agg(
          sum("Amount").alias("TotalSales"),
          count("*").alias("OrderCount")
      )
      .orderBy("Year", "Month")
)

# Write to curated zone
monthly_sales.write \
    .mode("overwrite") \
    .partitionBy("Year", "Month") \
    .parquet("abfss://curated@datalake.dfs.core.windows.net/monthly_sales/")

# Write to dedicated SQL pool
monthly_sales.write \
    .synapsesql("dwh.dbo.MonthlySales") \
    .mode("overwrite") \
    .option("tableType", "INTERNAL") \
    .save()
```

**Read from Cosmos DB via Synapse Link:**
```python
# Read Cosmos DB analytical store (no ETL needed)
orders = spark.read \
    .format("cosmos.olap") \
    .option("spark.synapse.linkedService", "CosmosDbLink") \
    .option("spark.cosmos.container", "orders") \
    .load()

# Query and aggregate
from pyspark.sql.functions import col, window

recent_orders = orders \
    .filter(col("_ts") > (time.time() - 86400)) \
    .groupBy(window(col("orderDate"), "1 hour"), col("region")) \
    .count()
```

### Step 7: Create Synapse Pipelines

**Copy activity (Data Lake to SQL pool):**
```json
{
  "name": "CopyToSQLPool",
  "properties": {
    "activities": [
      {
        "name": "CopyParquetToSQL",
        "type": "Copy",
        "inputs": [
          {
            "referenceName": "DataLakeParquet",
            "type": "DatasetReference"
          }
        ],
        "outputs": [
          {
            "referenceName": "DedicatedSQLTable",
            "type": "DatasetReference"
          }
        ],
        "typeProperties": {
          "source": {
            "type": "ParquetSource"
          },
          "sink": {
            "type": "SqlDWSink",
            "writeBehavior": "Upsert",
            "upsertSettings": {
              "keys": ["SalesKey"],
              "interimSchemaName": "staging"
            },
            "sqlWriterUseTableLock": false,
            "allowCopyCommand": true,
            "copyCommandSettings": {
              "defaultValues": [
                { "columnName": "LoadDate", "defaultValue": "GETDATE()" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

**Data flow (transformation pipeline):**
```json
{
  "name": "TransformSalesData",
  "properties": {
    "type": "MappingDataFlow",
    "typeProperties": {
      "sources": [
        {
          "name": "RawSales",
          "dataset": { "referenceName": "RawSalesCSV" }
        },
        {
          "name": "ProductDimension",
          "dataset": { "referenceName": "ProductTable" }
        }
      ],
      "transformations": [
        {
          "name": "JoinProducts",
          "description": "Join sales with product dimension"
        },
        {
          "name": "AggregateByCategory",
          "description": "Aggregate sales by product category"
        },
        {
          "name": "FilterValidRecords",
          "description": "Remove null/invalid records"
        }
      ],
      "sinks": [
        {
          "name": "CuratedOutput",
          "dataset": { "referenceName": "CuratedParquet" }
        }
      ]
    }
  }
}
```

### Step 8: Configure Synapse Link

**Synapse Link for Cosmos DB:**
```bicep
// Enable analytical store on Cosmos DB container
resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  properties: {
    resource: {
      id: 'orders'
      analyticalStorageTtl: -1 // Enable analytical store, no TTL
    }
  }
}

// Create linked service in Synapse
resource cosmosLinkedService 'Microsoft.Synapse/workspaces/linkedservices@2021-06-01' = {
  parent: synapseWorkspace
  name: 'CosmosDbLink'
  properties: {
    type: 'CosmosDb'
    typeProperties: {
      connectionString: cosmosConnectionString
      database: 'mydb'
    }
  }
}
```

**Synapse Link for SQL (mirror SQL to Data Lake):**
```sql
-- Create link connection to Azure SQL Database
-- Configurable via Synapse Studio UI
-- Continuously replicates transactional data to Data Lake
-- Query with serverless SQL pool for analytics
```

**Synapse Link for Dataverse:**
- Connect Microsoft Dataverse (Dynamics 365) data
- Near real-time replication to Data Lake
- Query operational data without impacting Dataverse performance

### Step 9: Performance optimization

**Materialized views:**
```sql
CREATE MATERIALIZED VIEW dbo.mvMonthlySales
WITH (DISTRIBUTION = HASH(CustomerKey))
AS
SELECT
    CustomerKey,
    YEAR(OrderDate) AS OrderYear,
    MONTH(OrderDate) AS OrderMonth,
    SUM(SalesAmount) AS TotalSales,
    COUNT_BIG(*) AS OrderCount
FROM dbo.FactSales
GROUP BY CustomerKey, YEAR(OrderDate), MONTH(OrderDate);

-- Optimizer automatically uses materialized view when beneficial
SELECT CustomerKey, SUM(SalesAmount)
FROM dbo.FactSales
WHERE YEAR(OrderDate) = 2024
GROUP BY CustomerKey;
```

**Result-set caching:**
```sql
-- Enable result-set caching (database level)
ALTER DATABASE dwh
SET RESULT_SET_CACHING ON;

-- Check if query result was cached
SELECT result_cache_hit FROM sys.dm_pdw_exec_requests
WHERE request_id = 'QID123';
```

**Statistics management:**
```sql
-- Create statistics on key columns
CREATE STATISTICS stat_CustomerKey ON dbo.FactSales(CustomerKey);
CREATE STATISTICS stat_OrderDate ON dbo.FactSales(OrderDate);

-- Update statistics
UPDATE STATISTICS dbo.FactSales;

-- Auto-create statistics
ALTER DATABASE dwh SET AUTO_CREATE_STATISTICS ON;
```

**Workload management:**
```sql
-- Create workload classifier
CREATE WORKLOAD CLASSIFIER HeavyQueries
WITH (
    WORKLOAD_GROUP = 'xlargerc',
    MEMBERNAME = 'analytics_users',
    IMPORTANCE = ABOVE_NORMAL
);

-- Create custom workload group
CREATE WORKLOAD GROUP AnalyticsGroup
WITH (
    MIN_PERCENTAGE_RESOURCE = 25,
    CAP_PERCENTAGE_RESOURCE = 50,
    REQUEST_MIN_RESOURCE_GRANT_PERCENT = 10,
    REQUEST_MAX_RESOURCE_GRANT_PERCENT = 25
);

CREATE WORKLOAD CLASSIFIER AnalyticsClassifier
WITH (
    WORKLOAD_GROUP = 'AnalyticsGroup',
    MEMBERNAME = 'analytics_team',
    IMPORTANCE = HIGH
);
```

### Step 10: Configure security

**Column-level security:**
```sql
-- Grant access to specific columns only
GRANT SELECT ON dbo.Customers(CustomerID, Name, City) TO [AnalystRole];
-- AnalystRole cannot see SSN, Email, Phone columns
```

**Row-level security:**
```sql
CREATE FUNCTION dbo.fn_RegionFilter(@Region NVARCHAR(50))
RETURNS TABLE WITH SCHEMABINDING AS
RETURN SELECT 1 AS result
WHERE @Region = CAST(SESSION_CONTEXT(N'UserRegion') AS NVARCHAR(50))
   OR IS_MEMBER('db_owner') = 1;

CREATE SECURITY POLICY RegionPolicy
ADD FILTER PREDICATE dbo.fn_RegionFilter(Region) ON dbo.FactSales;
```

**Dynamic data masking:**
```sql
ALTER TABLE dbo.Customers
ALTER COLUMN Email ADD MASKED WITH (FUNCTION = 'email()');

ALTER TABLE dbo.Customers
ALTER COLUMN Phone ADD MASKED WITH (FUNCTION = 'partial(0,"XXX-XXX-",4)');
```

**Managed VNET and private endpoints:**
```bicep
resource managedPrivateEndpoint 'Microsoft.Synapse/workspaces/managedVirtualNetworks/managedPrivateEndpoints@2021-06-01' = {
  parent: managedVirtualNetwork
  name: 'datalake-pe'
  properties: {
    privateLinkResourceId: dataLakeAccountId
    groupId: 'dfs'
  }
}
```

### Step 11: Power BI integration

```sql
-- Direct Query from Power BI to dedicated SQL pool
-- Connection string: <workspace>.sql.azuresynapse.net
-- Database: dwh

-- Create views optimized for Power BI
CREATE VIEW dbo.vw_SalesDashboard AS
SELECT
    d.ProductName,
    d.Category,
    c.CustomerName,
    c.Region,
    f.OrderDate,
    f.SalesAmount,
    f.Quantity
FROM dbo.FactSales f
JOIN dbo.DimProduct d ON f.ProductKey = d.ProductKey
JOIN dbo.DimCustomer c ON f.CustomerKey = c.CustomerKey;
```

### Best practices

- **Use dedicated SQL pool for predictable warehouse workloads**: consistent performance
- **Use serverless SQL pool for exploration**: pay per query, no provisioning
- **Choose distribution wisely**: HASH for large facts, REPLICATE for small dimensions
- **Use clustered columnstore indexes**: default and optimal for analytical queries
- **Enable result-set caching**: for frequently repeated dashboard queries
- **Use Synapse Link**: avoid ETL for operational analytics (Cosmos DB, SQL, Dataverse)
- **Partition large tables**: by date for time-series data (improves query pruning)
- **Enable managed VNET**: for network isolation and data exfiltration prevention
- **Use Spark pools with auto-pause**: avoid idle compute costs
- **Organize Data Lake in zones**: raw, enriched, curated layers (medallion architecture)

### Anti-patterns to avoid

- Using round-robin distribution for large fact tables joined frequently (causes data movement)
- Not creating statistics on key columns (query optimizer makes poor choices)
- Running ad-hoc exploration queries on dedicated SQL pool (expensive; use serverless)
- Not partitioning large tables (full table scans on time-range queries)
- Keeping dedicated SQL pool running 24/7 when used only during business hours
- Using too many small DWU levels that bottleneck on concurrent queries
- Not leveraging Synapse Link when Cosmos DB is the source (unnecessary ETL)
- Ignoring workload management (runaway queries affect all users)
- Loading data with row-by-row inserts instead of COPY/PolyBase
- Storing all data formats as CSV instead of Parquet (poor compression and query performance)

### Security considerations

- Enable managed VNET with data exfiltration prevention
- Use managed private endpoints for all data sources
- Disable public network access for production workspaces
- Configure Azure AD authentication; avoid SQL authentication
- Implement column-level and row-level security for multi-tenant data
- Use dynamic data masking for PII columns
- Enable auditing and diagnostic logging
- Use Azure Policy for governance at scale
- Restrict Spark pool network access through managed VNET

### Cost optimization

- **Pause dedicated SQL pool** during off-hours (saves 100% compute when paused)
- **Use serverless SQL pool** for ad-hoc queries (pay per TB scanned)
- **Optimize Parquet file sizes**: 256 MB - 1 GB per file for best scan performance
- **Use auto-pause on Spark pools**: 15-minute idle timeout
- **Right-size DWU**: monitor concurrency and utilization via DMVs
- **Use result-set caching**: eliminates repeated compute for identical queries
- **Leverage materialized views**: pre-compute expensive aggregations
- **Use COPY command**: faster and cheaper than PolyBase for data loading
- **Partition and prune**: partition by date, query with partition filters
- **Archive old data to Data Lake**: query with serverless instead of keeping in dedicated pool
- **Reserved capacity**: commit to 1-year or 3-year for predictable dedicated SQL pool usage
