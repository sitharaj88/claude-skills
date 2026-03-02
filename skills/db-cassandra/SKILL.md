---
name: db-cassandra
description: Generate Apache Cassandra data models, CQL queries, partition strategies, and cluster configurations. Use when the user wants to design or optimize Cassandra/ScyllaDB databases.
argument-hint: "[model|query|optimize|setup] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(cqlsh *), Bash(nodetool *)
user-invocable: true
---

## Instructions

You are an Apache Cassandra expert. Generate production-ready data models and configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: data modeling, query writing, optimization, cluster setup
- **Driver**: cassandra-driver (Python), DataStax Node.js/Java driver
- **Scale**: expected data volume, read/write ratio, regions

### Step 2: Data modeling (query-first design)

Cassandra requires query-first design:

1. **List all queries** the application needs
2. **Design a table for each query** (denormalization is expected)
3. **Choose partition key** for even data distribution
4. **Choose clustering columns** for sort order within partitions
5. **Keep partitions small** (< 100MB, < 100K rows)

```sql
-- Query: Get orders by user, sorted by date (newest first)
CREATE TABLE orders_by_user (
    user_id uuid,
    order_date timestamp,
    order_id uuid,
    total decimal,
    status text,
    items list<frozen<order_item>>,
    PRIMARY KEY ((user_id), order_date, order_id)
) WITH CLUSTERING ORDER BY (order_date DESC, order_id ASC);
```

### Step 3: Data types and patterns

- Use UUIDs (uuid, timeuuid) for unique IDs
- Use frozen UDTs for nested structures
- Collections: list, set, map (keep small, < 64KB)
- Counter tables for aggregated counts
- Static columns for partition-level data
- Materialized views (use cautiously)
- ALLOW FILTERING — avoid in production

### Step 4: Write and read patterns

**Writes:**
- Use batch statements ONLY for atomicity within a partition
- Use lightweight transactions (IF NOT EXISTS) sparingly
- TTL for auto-expiring data
- Unlogged batches across partitions if needed

**Reads:**
- Always query by partition key
- Use IN clause on partition key sparingly
- Pagination with paging state
- Use token-based range queries for full scans

### Step 5: Configuration and operations

- Replication strategy: NetworkTopologyStrategy
- Consistency levels: LOCAL_QUORUM for most operations
- Compaction strategy: STCS (write-heavy), LCS (read-heavy), TWCS (time-series)
- nodetool commands for cluster management
- Repair scheduling
- Backup with snapshots

### Best practices:
- Design tables around queries (one table per query pattern)
- Keep partitions under 100MB
- Use LOCAL_QUORUM consistency for most reads/writes
- Avoid ALLOW FILTERING and secondary indexes in production
- Use TTL for time-bounded data
- Monitor partition sizes and hotspots
- Use prepared statements for all queries
- Run regular repairs on all nodes
