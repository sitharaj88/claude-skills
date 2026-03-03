# GCP BigQuery

Generate BigQuery datasets, tables, and queries with partitioning, clustering, materialized views, scheduled queries, and access controls for large-scale analytics.

## Usage

```bash
/gcp-bigquery <description of your analytics requirements>
```

## What It Does

1. Creates BigQuery dataset and table configurations with appropriate schemas and descriptions
2. Configures time-based and range-based partitioning with clustering for query performance
3. Generates SQL queries with cost optimization using partition pruning and column selection
4. Sets up materialized views, scheduled queries, and data transfer configurations
5. Produces external table definitions for Cloud Storage, Bigtable, and Google Sheets sources
6. Adds dataset-level and table-level IAM access controls, row-level security, and column-level masking

## Examples

```bash
/gcp-bigquery Design a partitioned and clustered table schema for web analytics event data with date partitioning and user-based clustering

/gcp-bigquery Create scheduled queries that aggregate daily sales data into summary tables with cost controls and alerting

/gcp-bigquery Configure a BigQuery dataset with row-level security policies and external tables reading from Cloud Storage parquet files
```

## Allowed Tools

- `Read` - Read existing BigQuery schemas and SQL files
- `Write` - Create table definitions, SQL queries, and scheduled query configs
- `Edit` - Modify existing BigQuery configurations
- `Bash` - Run bq CLI commands for validation
- `Glob` - Search for BigQuery-related templates
- `Grep` - Find BigQuery references across the project
