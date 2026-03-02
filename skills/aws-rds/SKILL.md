---
name: aws-rds
description: Generate AWS RDS/Aurora database configurations with instance sizing, multi-AZ, read replicas, parameter groups, and backup strategies. Use when the user wants to set up relational databases on AWS.
argument-hint: "[engine] [purpose] [size]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS RDS/Aurora expert. Generate production-ready relational database configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Engine**: PostgreSQL, MySQL, MariaDB, Oracle, SQL Server, or Aurora (PostgreSQL/MySQL compatible)
- **Purpose**: transactional (OLTP), analytical, mixed workload
- **Size**: expected data size, connections, IOPS
- **Availability**: single-AZ (dev), multi-AZ (production), Aurora global

### Step 2: Choose engine and edition

**Recommend Aurora for production:**
- 5x throughput of standard MySQL, 3x of PostgreSQL
- Auto-scaling storage (10GB to 128TB)
- Up to 15 read replicas with < 10ms lag
- Serverless v2 for variable workloads

**Standard RDS for:**
- Specific engine version requirements
- Lower cost for small workloads
- Oracle/SQL Server (Aurora doesn't support)

### Step 3: Generate database configuration

Create RDS/Aurora (CloudFormation/Terraform) with:
- Engine version (latest stable)
- Instance class (db.r6g for memory, db.m6g for general, db.t4g for dev)
- Storage: gp3 (balanced), io2 (high IOPS), or Aurora auto-scaling
- Multi-AZ deployment for production
- DB subnet group (isolated/private subnets)
- Security group (app tier access only)
- Parameter group with tuned settings
- Option group (engine-specific features)
- Master credentials in Secrets Manager (auto-rotation)
- Encryption at rest with KMS
- Enhanced monitoring (1-60 second intervals)
- Performance Insights enabled
- CloudWatch alarms

### Step 4: Configure backups and recovery

- Automated backups with retention period (7-35 days)
- Backup window during low-traffic period
- Point-in-time recovery capability
- Manual snapshots before major changes
- Cross-region snapshot copy for DR
- Aurora: backtrack for quick point-in-time recovery

### Step 5: Configure high availability

**Multi-AZ:**
- Synchronous standby replica
- Automatic failover (60-120 seconds)
- No read traffic on standby (RDS) vs readable (Aurora)

**Read replicas:**
- Async replication for read scaling
- Cross-region replicas for DR
- Promote to standalone for disaster recovery

**Aurora-specific:**
- Aurora Serverless v2 (0.5 to 128 ACUs)
- Aurora Global Database (< 1 second cross-region replication)
- Aurora Auto Scaling for replicas

### Step 6: Connection management

- RDS Proxy for connection pooling (Lambda + RDS)
- IAM database authentication
- SSL/TLS enforcement
- Generate connection code with proper pooling

### Best practices:
- Use Aurora for production PostgreSQL/MySQL workloads
- Store credentials in Secrets Manager with rotation
- Use RDS Proxy for serverless (Lambda) connections
- Enable Performance Insights and Enhanced Monitoring
- Use gp3 storage (better price-performance than gp2)
- Set maintenance window separate from backup window
- Test failover regularly
- Use IAM authentication for application access
