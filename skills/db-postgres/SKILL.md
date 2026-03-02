---
name: db-postgres
description: Generate PostgreSQL database schemas, queries, indexes, extensions, migrations, performance tuning, and replication configs. Use when the user wants to set up, design, or optimize PostgreSQL databases.
argument-hint: "[schema|query|optimize|setup] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(psql *), Bash(pg_dump *), Bash(pg_restore *)
user-invocable: true
---

## Instructions

You are a PostgreSQL expert. Generate production-ready database configurations, schemas, and queries.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: schema design, query writing, optimization, setup, migration, replication
- **Context**: new database, existing schema modification, performance issue
- **Scale**: expected data size, connections, read/write ratio

### Step 2: Schema design

When designing schemas:
- Use proper data types (uuid, timestamptz, jsonb, text[], inet, cidr)
- Define constraints: PRIMARY KEY, UNIQUE, NOT NULL, CHECK, FOREIGN KEY
- Use SERIAL/BIGSERIAL or gen_random_uuid() for IDs
- Add created_at/updated_at with DEFAULT and triggers
- Create appropriate indexes (B-tree, GIN, GiST, BRIN)
- Use ENUM types or lookup tables for fixed values
- Implement table partitioning for large tables (range, list, hash)
- Add comments on tables and columns for documentation

```sql
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_metadata ON users USING gin (metadata);
```

### Step 3: Query optimization

When writing or optimizing queries:
- Use EXPLAIN ANALYZE to analyze query plans
- Create covering indexes for frequent queries
- Use CTEs for readability, but materialize when needed
- Use window functions instead of self-joins
- Use LATERAL joins for correlated subqueries
- Avoid SELECT * — specify columns
- Use parameterized queries (never string interpolation)
- Use batch operations (INSERT ... ON CONFLICT, COPY)
- Implement cursor-based pagination (WHERE id > $1 LIMIT $2)

### Step 4: Extensions and advanced features

Recommend and configure extensions:
- **pg_trgm** — fuzzy text search
- **pgcrypto** — encryption functions
- **uuid-ossp** or gen_random_uuid() — UUID generation
- **pg_stat_statements** — query performance monitoring
- **PostGIS** — geospatial data
- **pg_partman** — partition management
- **TimescaleDB** — time-series data
- **pgvector** — vector similarity search (AI/ML embeddings)
- Full-text search with tsvector/tsquery

### Step 5: Performance tuning

Generate postgresql.conf recommendations:
- shared_buffers (25% of RAM)
- effective_cache_size (75% of RAM)
- work_mem (RAM / max_connections / 4)
- maintenance_work_mem (RAM / 8)
- wal_buffers, checkpoint_completion_target
- Connection pooling with PgBouncer config
- Vacuum and autovacuum tuning
- Monitoring queries for slow query detection

### Step 6: High availability and backup

- Streaming replication (primary/standby)
- Logical replication for selective sync
- pg_dump/pg_restore scripts
- Point-in-time recovery with WAL archiving
- Connection pooling with PgBouncer
- Patroni for automatic failover

### Best practices:
- Always use timestamptz (not timestamp)
- Use uuid for primary keys in distributed systems
- Create indexes based on query patterns, not guesses
- Use jsonb (not json) for structured JSON data
- Enable pg_stat_statements for query monitoring
- Use connection pooling in production
- Run VACUUM ANALYZE regularly
- Use row-level security (RLS) for multi-tenant apps
