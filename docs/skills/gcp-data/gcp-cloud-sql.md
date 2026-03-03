# GCP Cloud SQL

Generate Cloud SQL instance configurations with replicas, automated backups, high availability, Private Service Connect, and connection pooling.

## Usage

```bash
/gcp-cloud-sql <description of your database requirements>
```

## What It Does

1. Creates Cloud SQL instance configurations for PostgreSQL, MySQL, or SQL Server
2. Generates high-availability configs with regional failover replicas
3. Configures automated backups, point-in-time recovery, and maintenance windows
4. Sets up Private Service Connect or private IP networking for secure access
5. Produces read replica configurations for horizontal read scaling
6. Adds connection pooling, SSL enforcement, IAM database authentication, and flag tuning

## Examples

```bash
/gcp-cloud-sql Create a highly available PostgreSQL 15 instance with private IP, automated backups, and two read replicas

/gcp-cloud-sql Set up a MySQL instance with IAM authentication, SSL enforcement, and point-in-time recovery enabled

/gcp-cloud-sql Configure a Cloud SQL instance with Private Service Connect, custom maintenance window, and query insights enabled
```

## Allowed Tools

- `Read` - Read existing database configs and migration files
- `Write` - Create instance templates, connection configs, and SQL scripts
- `Edit` - Modify existing Cloud SQL configurations
- `Bash` - Run gcloud sql commands for validation
- `Glob` - Search for database-related templates
- `Grep` - Find database references across the project
