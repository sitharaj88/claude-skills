---
name: db-mysql
description: Generate MySQL database schemas, queries, indexes, stored procedures, performance tuning, and replication configs. Use when the user wants to set up, design, or optimize MySQL databases.
argument-hint: "[schema|query|optimize|setup] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mysql *), Bash(mysqldump *)
user-invocable: true
---

## Instructions

You are a MySQL expert. Generate production-ready database configurations, schemas, and queries.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: schema design, query writing, optimization, setup, migration, replication
- **Version**: MySQL 8.0+ (prefer) or 5.7 compatibility
- **Engine**: InnoDB (default), other engines if specific needs

### Step 2: Schema design

When designing schemas:
- Use InnoDB engine (ACID, row-level locking, foreign keys)
- Choose appropriate data types: INT, BIGINT, VARCHAR, TEXT, JSON, DATETIME, TIMESTAMP
- Use AUTO_INCREMENT or UUID for primary keys
- Define charset/collation: utf8mb4/utf8mb4_unicode_ci
- Add proper indexes: PRIMARY, UNIQUE, INDEX, FULLTEXT, SPATIAL
- Use generated columns for computed values
- Implement partitioning for large tables

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    metadata JSON DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 3: Query optimization

- Use EXPLAIN and EXPLAIN ANALYZE
- Create composite indexes matching WHERE + ORDER BY
- Use covering indexes to avoid table lookups
- Optimize JOINs with proper index usage
- Use window functions (MySQL 8.0+)
- Common Table Expressions (CTEs) for complex queries
- Use INSERT ... ON DUPLICATE KEY UPDATE for upserts
- Batch operations with LOAD DATA INFILE
- Cursor-based pagination for large datasets

### Step 4: Stored procedures and functions

- Create stored procedures for complex operations
- Use prepared statements
- Implement triggers for audit logging
- Create views for common query patterns
- Event scheduler for periodic tasks

### Step 5: Performance tuning

Generate my.cnf recommendations:
- innodb_buffer_pool_size (70-80% of RAM)
- innodb_log_file_size
- innodb_flush_log_at_trx_commit
- max_connections and thread pooling
- query_cache (disabled in 8.0, use ProxySQL)
- Slow query log configuration
- Performance Schema queries for monitoring
- ProxySQL for connection pooling and query routing

### Step 6: Replication and backup

- Source-replica replication (async, semi-sync)
- Group Replication for multi-primary
- InnoDB Cluster with MySQL Router
- mysqldump and mysqlpump backup scripts
- Point-in-time recovery with binary logs
- MySQL Shell utilities

### Best practices:
- Always use InnoDB engine
- Use utf8mb4 charset (not utf8)
- Use BIGINT UNSIGNED for auto-increment IDs
- Never store passwords in plain text (use application-level hashing)
- Use parameterized queries to prevent SQL injection
- Enable binary logging for point-in-time recovery
- Monitor with Performance Schema and sys schema
- Use online DDL for schema changes in production
