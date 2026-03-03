# Azure SQL Database

Generate Azure SQL Database configurations with elastic pools, geo-replication, automated backups, failover groups, and advanced threat protection.

## Usage

```bash
/azure-sql <description of your database requirements>
```

## What It Does

1. Creates Azure SQL Database and Managed Instance configurations with appropriate service tiers
2. Generates elastic pool configurations for multi-tenant and cost-optimized database workloads
3. Configures active geo-replication and auto-failover groups for disaster recovery
4. Sets up automated backups with long-term retention policies and point-in-time restore
5. Produces firewall rules, private endpoints, and virtual network service endpoints
6. Adds auditing, Advanced Threat Protection, Transparent Data Encryption, and AAD authentication

## Examples

```bash
/azure-sql Create a Business Critical tier database with active geo-replication, auto-failover group, and zone redundancy

/azure-sql Set up an elastic pool with 5 databases, DTU-based pricing, and automated backups with 35-day retention

/azure-sql Configure an Azure SQL database with private endpoint, AAD-only authentication, and Advanced Threat Protection enabled
```

## What It Covers

- **Service tiers** - Basic, Standard, Premium DTU-based and General Purpose, Business Critical, Hyperscale vCore-based
- **Elastic pools** - Shared resource pools with per-database min/max settings for cost optimization
- **Geo-replication** - Active geo-replication with readable secondaries across Azure regions
- **Failover groups** - Automatic failover with grace period and read-write listener endpoints
- **Backup and restore** - Automated backups, PITR, long-term retention, and geo-restore
- **Network security** - Firewall rules, private endpoints, and VNet service endpoints
- **Authentication** - Azure AD authentication, contained database users, and managed identity access
- **Threat protection** - Advanced Threat Protection, auditing, vulnerability assessments, and data masking
- **Performance tuning** - Automatic tuning, Query Performance Insight, and intelligent recommendations

<div class="badge-row">
  <span class="badge">Relational</span>
  <span class="badge">Managed SQL</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing database configurations and migration scripts
- `Write` - Create SQL database templates, failover configs, and ARM/Bicep templates
- `Edit` - Modify existing Azure SQL configurations and firewall rules
- `Bash` - Run az sql commands for validation and database management
- `Glob` - Search for database-related templates and migration files
- `Grep` - Find database connection string references across the project
