# Azure Cosmos DB

Generate Azure Cosmos DB configurations with multi-region writes, tunable consistency levels, partition key strategies, stored procedures, and multiple API models.

## Usage

```bash
/azure-cosmos-db <description of your database requirements>
```

## What It Does

1. Creates Cosmos DB account configurations with SQL, MongoDB, Cassandra, Gremlin, or Table APIs
2. Generates multi-region write configurations with automatic failover and conflict resolution
3. Configures consistency levels from Strong to Eventual with session and bounded staleness options
4. Sets up partition key strategies for optimal query performance and even data distribution
5. Produces throughput configurations with autoscale RU/s, serverless mode, or provisioned capacity
6. Adds stored procedures, triggers, change feed processors, and Azure Synapse Link integration

## Examples

```bash
/azure-cosmos-db Create a multi-region Cosmos DB account with SQL API, session consistency, autoscale throughput, and automatic failover

/azure-cosmos-db Set up a Cosmos DB container with hierarchical partition keys, change feed processor, and Synapse Link enabled

/azure-cosmos-db Configure a Cosmos DB account with MongoDB API, bounded staleness consistency, and private endpoint access
```

## What It Covers

- **API models** - SQL (Core), MongoDB, Cassandra, Gremlin (Graph), and Table API configurations
- **Global distribution** - Multi-region writes, automatic failover priority, and service-managed failover
- **Consistency levels** - Strong, Bounded Staleness, Session, Consistent Prefix, and Eventual consistency
- **Partitioning** - Partition key selection, hierarchical partition keys, and cross-partition queries
- **Throughput** - Provisioned RU/s, autoscale, serverless mode, and database-level shared throughput
- **Change feed** - Change feed processor, Azure Functions triggers, and event-driven architectures
- **Stored procedures** - Server-side JavaScript execution, triggers, and user-defined functions
- **Synapse Link** - Analytical store with Azure Synapse Analytics integration for HTAP workloads
- **Security** - Private endpoints, RBAC, managed identity, customer-managed keys, and IP filtering

<div class="badge-row">
  <span class="badge">NoSQL</span>
  <span class="badge">Globally Distributed</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Cosmos DB configurations and stored procedures
- `Write` - Create database templates, partition strategies, and ARM/Bicep templates
- `Edit` - Modify existing Cosmos DB account and container configurations
- `Bash` - Run az cosmosdb commands for validation and resource management
- `Glob` - Search for Cosmos DB-related configuration and template files
- `Grep` - Find Cosmos DB connection references and SDK usage across the project
