# Azure Synapse Analytics

Generate Azure Synapse Analytics configurations with dedicated SQL pools, serverless SQL, Spark pools, data pipelines, and lake database designs.

## Usage

```bash
/azure-synapse <description of your analytics and data warehouse requirements>
```

## What It Does

1. Creates Synapse workspace configurations with managed VNet, data exfiltration protection, and git integration
2. Generates dedicated SQL pool schemas with distribution strategies, indexing, and workload management
3. Configures serverless SQL pools for ad-hoc querying over Data Lake files in Parquet, CSV, and JSON
4. Sets up Apache Spark pools with autoscale, library management, and notebook configurations
5. Produces data integration pipelines with copy activities, data flows, and trigger schedules
6. Adds lake database designs, linked services, managed private endpoints, and Power BI integration

## Examples

```bash
/azure-synapse Create a Synapse workspace with a DW1000c dedicated SQL pool, hash-distributed fact tables, and workload isolation groups

/azure-synapse Set up a serverless SQL pool with external tables over Parquet files in Data Lake and views for Power BI consumption

/azure-synapse Configure Spark pools with autoscale from 3 to 10 nodes, Delta Lake support, and data pipeline orchestration
```

## What It Covers

- **Synapse workspace** - Managed VNet, data exfiltration protection, git integration, and managed identity
- **Dedicated SQL pools** - Hash, round-robin, and replicated table distributions with columnstore indexes
- **Serverless SQL** - OPENROWSET queries, external tables, CETAS, and cost-controlled data exploration
- **Spark pools** - Autoscale configuration, library management, Delta Lake, and notebook orchestration
- **Data pipelines** - Copy activities, mapping data flows, tumbling window and event-based triggers
- **Lake databases** - Schema-on-read designs, external table formats, and database templates
- **Linked services** - Connections to Azure Data Lake, Blob Storage, Cosmos DB, and external sources
- **Security** - Managed private endpoints, column-level security, dynamic data masking, and RBAC
- **Monitoring** - SQL request monitoring, Spark application logs, and pipeline run diagnostics

<div class="badge-row">
  <span class="badge">Analytics</span>
  <span class="badge">Data Warehouse</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Synapse configurations and SQL pool schemas
- `Write` - Create workspace templates, SQL scripts, and ARM/Bicep templates
- `Edit` - Modify existing Synapse pool settings and pipeline configurations
- `Bash` - Run az synapse commands for validation and workspace management
- `Glob` - Search for analytics-related configuration and template files
- `Grep` - Find Synapse connection references and pipeline definitions across the project
