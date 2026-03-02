# AWS RDS / Aurora

Generate RDS and Aurora database configurations with multi-AZ deployments, read replicas, automated backups, and parameter groups.

## Usage

```bash
/aws-rds <description of your database requirements>
```

## What It Does

1. Selects the appropriate engine (PostgreSQL, MySQL, Aurora) and instance class
2. Generates RDS or Aurora cluster configurations with networking and security
3. Configures multi-AZ deployments for high availability
4. Sets up read replicas for read scaling and cross-region redundancy
5. Produces parameter groups and option groups for engine tuning
6. Adds automated backups, encryption, IAM authentication, and monitoring

## Examples

```bash
/aws-rds Create an Aurora PostgreSQL cluster with multi-AZ and 2 read replicas

/aws-rds Set up an RDS MySQL instance with automated backups and KMS encryption

/aws-rds Configure Aurora Serverless v2 with auto-scaling from 0.5 to 16 ACUs
```

## Allowed Tools

- `Read` - Read existing database configurations and schemas
- `Write` - Create RDS templates, parameter groups, and connection configs
- `Edit` - Modify existing database configurations
- `Bash` - Run AWS CLI RDS commands for validation
- `Glob` - Search for database-related files
- `Grep` - Find connection string and database references
