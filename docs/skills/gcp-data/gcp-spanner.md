# GCP Spanner

Generate Cloud Spanner instance and database configurations with schemas, interleaved tables, secondary indexes, and global distribution for mission-critical workloads.

## Usage

```bash
/gcp-spanner <description of your Spanner requirements>
```

## What It Does

1. Creates Spanner instance configurations with appropriate compute capacity and regional or multi-regional placement
2. Designs database schemas with primary keys, interleaved tables, and foreign key relationships
3. Generates secondary indexes including storing indexes and null-filtered indexes
4. Configures read-write transactions, read-only transactions, and partitioned DML operations
5. Produces client connection code with session pooling and retry logic
6. Adds change streams, backup schedules, and point-in-time recovery configurations

## Examples

```bash
/gcp-spanner Design a globally distributed database schema for a financial transactions system with interleaved tables and change streams

/gcp-spanner Create a multi-regional Spanner instance with automated backups and a schema for an e-commerce order management system

/gcp-spanner Generate Spanner query and transaction code with session pooling for a high-throughput inventory tracking service
```

## Allowed Tools

- `Read` - Read existing Spanner schemas and migration files
- `Write` - Create instance templates, DDL schemas, and client connection code
- `Edit` - Modify existing Spanner configurations
- `Bash` - Run gcloud spanner commands for validation
- `Glob` - Search for Spanner-related templates
- `Grep` - Find Spanner references across the project
