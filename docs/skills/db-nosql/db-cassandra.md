# Cassandra

Expert guidance for Cassandra query-first data modeling, CQL queries, partition strategies, compaction tuning, and cluster configuration.

## Usage

```bash
/db-cassandra [description or question]
```

## What It Does

1. Designs tables using query-first methodology with proper partition and clustering keys
2. Writes CQL queries respecting partition-aware access patterns
3. Plans partition strategies to avoid hot spots and maintain even data distribution
4. Configures compaction strategies (STCS, LCS, TWCS) based on workload type
5. Sets up multi-datacenter replication with appropriate consistency levels
6. Implements materialized views and secondary indexes where appropriate

## Examples

```bash
/db-cassandra model a time-series IoT sensor data pipeline
```

```bash
/db-cassandra design tables for a messaging app with query-first approach
```

```bash
/db-cassandra configure multi-DC replication with tunable consistency
```

## Allowed Tools

- Read
- Edit
- Write
- Bash
- Grep
- Glob
