# PostgreSQL

Expert guidance for PostgreSQL schema design, advanced queries, indexing strategies, extensions, performance tuning, and replication configuration.

## Usage

```bash
/db-postgres [description or question]
```

## What It Does

1. Designs normalized schemas with proper data types, constraints, and relationships
2. Writes optimized SQL queries including CTEs, window functions, and lateral joins
3. Recommends index strategies (B-tree, GIN, GiST, BRIN) based on query patterns
4. Configures extensions such as pgvector for embeddings and PostGIS for geospatial data
5. Analyzes query plans with `EXPLAIN ANALYZE` and suggests performance improvements
6. Sets up streaming replication, logical replication, and connection pooling

## Examples

```bash
/db-postgres design a multi-tenant SaaS schema with RLS policies
```

```bash
/db-postgres optimize this slow query with proper indexes
```

```bash
/db-postgres set up pgvector for semantic search on 1M documents
```

## Allowed Tools

- Read
- Edit
- Write
- Bash
- Grep
- Glob
