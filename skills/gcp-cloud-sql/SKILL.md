---
name: gcp-cloud-sql
description: Generate Cloud SQL instance configurations with high availability, read replicas, connection management, and automated backups. Use when the user wants to set up managed relational databases on GCP.
argument-hint: "[engine] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a GCP Cloud SQL expert. Generate production-ready managed relational database configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Engine**: PostgreSQL, MySQL, or SQL Server
- **Purpose**: transactional (OLTP), web application backend, analytics, microservice data store
- **Size**: expected data volume, concurrent connections, IOPS requirements
- **Availability**: development (no HA), production (regional HA), disaster recovery (cross-region)
- **Connectivity**: private IP (VPC), public IP with authorized networks, Cloud SQL Auth Proxy

### Step 2: Choose engine and edition

**PostgreSQL (recommended for most workloads):**
- Versions: 12, 13, 14, 15, 16
- Full PostGIS support for geospatial data
- Rich extension ecosystem (pg_trgm, pgvector, pgcrypto)
- Cloud SQL for PostgreSQL supports IAM authentication

**MySQL:**
- Versions: 5.7, 8.0, 8.4
- Widely compatible with existing applications
- Strong replication support

**SQL Server:**
- Editions: Express, Web, Standard, Enterprise
- Windows-ecosystem integration
- Always On availability (Enterprise)

### Step 3: Generate instance configuration

Create Cloud SQL instance (Terraform) with production defaults:

```hcl
resource "google_sql_database_instance" "primary" {
  name                = "${var.project_id}-${var.environment}-db"
  database_version    = "POSTGRES_16"
  region              = var.region
  deletion_protection = true

  settings {
    tier              = "db-custom-4-16384"  # 4 vCPUs, 16GB RAM
    availability_type = "REGIONAL"           # HA with automatic failover
    disk_type         = "PD_SSD"
    disk_size         = 100                  # GB, auto-resize enabled
    disk_autoresize   = true
    disk_autoresize_limit = 500              # Max GB

    # Backup configuration
    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"  # UTC
      location                       = var.region
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    # Maintenance window
    maintenance_window {
      day          = 7  # Sunday
      hour         = 4  # 4 AM UTC
      update_track = "stable"
    }

    # Network configuration
    ip_configuration {
      ipv4_enabled    = false         # Disable public IP
      private_network = var.vpc_id
      require_ssl     = true

      # If public IP needed, use authorized networks
      # authorized_networks {
      #   name  = "office"
      #   value = "203.0.113.0/24"
      # }
    }

    # Database flags for tuning
    database_flags {
      name  = "max_connections"
      value = "200"
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"  # Log queries > 1 second
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 4096
      record_application_tags = true
      record_client_address   = true
    }

    user_labels = {
      environment = var.environment
      team        = var.team
      managed_by  = "terraform"
    }
  }
}
```

### Step 4: Configure databases and users

```hcl
resource "google_sql_database" "app_db" {
  name     = "app_database"
  instance = google_sql_database_instance.primary.name
  charset  = "UTF8"

  depends_on = [google_sql_database_instance.primary]
}

# Password-based user (store password in Secret Manager)
resource "google_sql_user" "app_user" {
  name     = "app_user"
  instance = google_sql_database_instance.primary.name
  password = var.db_password  # Use google_secret_manager_secret_version
}

# IAM-based user (recommended for GCP services)
resource "google_sql_user" "iam_user" {
  name     = "app-sa@${var.project_id}.iam.gserviceaccount.com"
  instance = google_sql_database_instance.primary.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}
```

### Step 5: Configure read replicas

```hcl
resource "google_sql_database_instance" "read_replica" {
  name                 = "${var.project_id}-${var.environment}-replica"
  master_instance_name = google_sql_database_instance.primary.name
  region               = var.region
  database_version     = "POSTGRES_16"

  replica_configuration {
    failover_target = false
  }

  settings {
    tier              = "db-custom-4-16384"
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_id
      require_ssl     = true
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 4096
      record_application_tags = true
      record_client_address   = true
    }
  }
}

# Cross-region replica for DR
resource "google_sql_database_instance" "cross_region_replica" {
  name                 = "${var.project_id}-${var.environment}-dr-replica"
  master_instance_name = google_sql_database_instance.primary.name
  region               = var.dr_region
  database_version     = "POSTGRES_16"

  replica_configuration {
    failover_target = true
  }

  settings {
    tier              = "db-custom-4-16384"
    availability_type = "REGIONAL"
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.dr_vpc_id
      require_ssl     = true
    }
  }
}
```

### Step 6: Connection management with Cloud SQL Auth Proxy

**Cloud SQL Auth Proxy (recommended connection method):**

```yaml
# Kubernetes sidecar pattern
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  template:
    spec:
      serviceAccountName: app-ksa
      containers:
        - name: app
          image: gcr.io/my-project/app:latest
          env:
            - name: DB_HOST
              value: "127.0.0.1"
            - name: DB_PORT
              value: "5432"
            - name: DB_NAME
              value: "app_database"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: username
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2
          args:
            - "--structured-logs"
            - "--auto-iam-authn"
            - "--port=5432"
            - "my-project:us-central1:my-instance"
          securityContext:
            runAsNonRoot: true
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
```

**Direct connection with Private IP:**

```python
import sqlalchemy
from google.cloud.sql.connector import Connector

def create_connection_pool():
    connector = Connector()

    def getconn():
        conn = connector.connect(
            "my-project:us-central1:my-instance",
            "pg8000",
            user="app_user",
            password="secret",
            db="app_database",
            enable_iam_auth=True,  # Use IAM auth instead of password
        )
        return conn

    pool = sqlalchemy.create_engine(
        "postgresql+pg8000://",
        creator=getconn,
        pool_size=5,
        max_overflow=2,
        pool_timeout=30,
        pool_recycle=1800,
    )
    return pool
```

### Step 7: IAM database authentication

```bash
# Grant Cloud SQL Client role to service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:app-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant IAM database user access
gcloud sql users create app-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --instance=my-instance \
  --type=cloud_iam_service_account

# Connect using IAM auth
gcloud sql connect my-instance --user=app-sa@${PROJECT_ID}.iam.gserviceaccount.com
```

### Step 8: SSL/TLS configuration

```bash
# Create client certificate
gcloud sql ssl client-certs create app-cert \
  --instance=my-instance \
  client-key.pem

# Download server CA certificate
gcloud sql ssl server-ca-certs list \
  --instance=my-instance \
  --format="value(cert)" > server-ca.pem

gcloud sql ssl client-certs describe app-cert \
  --instance=my-instance \
  --format="value(cert)" > client-cert.pem
```

### Step 9: Database Migration Service (DMS)

```bash
# Create a connection profile for the source
gcloud database-migration connection-profiles create source-profile \
  --region=us-central1 \
  --type=POSTGRESQL \
  --host=source-db.example.com \
  --port=5432 \
  --username=migration_user \
  --password=secret

# Create a migration job
gcloud database-migration migration-jobs create my-migration \
  --region=us-central1 \
  --type=CONTINUOUS \
  --source=source-profile \
  --destination=my-cloud-sql-instance
```

### Step 10: Cloud SQL Insights and monitoring

```hcl
# CloudWatch-equivalent alerting
resource "google_monitoring_alert_policy" "cpu_alert" {
  display_name = "Cloud SQL CPU > 80%"

  conditions {
    display_name = "CPU utilization"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/cpu/utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      duration        = "300s"

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [var.notification_channel_id]
}
```

### Best practices

- **Use Private IP** exclusively; disable public IP for production instances
- **Enable regional HA** (availability_type = "REGIONAL") for production databases
- **Use Cloud SQL Auth Proxy** for secure, IAM-authenticated connections
- **Enable Query Insights** to monitor and optimize slow queries
- **Store credentials in Secret Manager** with automatic rotation
- **Set maintenance windows** during low-traffic periods
- **Enable point-in-time recovery** with sufficient transaction log retention
- **Use IAM database authentication** for GCP service accounts instead of passwords
- **Right-size instances** using Cloud SQL Recommender; start with db-custom and adjust
- **Enable disk autoresize** to avoid running out of storage

### Anti-patterns to avoid

- Exposing Cloud SQL instances with public IP without authorized networks
- Using the default `postgres`/`root` user for application connections
- Not enabling automated backups and point-in-time recovery
- Skipping SSL/TLS enforcement (require_ssl = true)
- Over-provisioning instance size instead of using read replicas for read scaling
- Connecting directly from Cloud Functions/Run without Cloud SQL Auth Proxy
- Not setting connection pool limits, exhausting database connections

### Cost optimization

- Use shared-core instances (`db-f1-micro`, `db-g1-small`) for development/testing
- Enable disk autoresize instead of over-provisioning disk from the start
- Use committed use discounts for stable production workloads (1-year or 3-year)
- Stop development instances when not in use (gcloud sql instances patch --activation-policy NEVER)
- Use read replicas to offload reads instead of scaling up the primary
- Monitor and right-size using Cloud SQL Recommender suggestions
- Consider Cloud SQL Enterprise Plus edition for mission-critical workloads (higher SLA, faster failover)

### Machine type reference

| Tier | vCPUs | RAM | Use Case |
|------|-------|-----|----------|
| db-f1-micro | Shared | 0.6 GB | Testing only |
| db-g1-small | Shared | 1.7 GB | Small dev |
| db-custom-1-3840 | 1 | 3.75 GB | Light production |
| db-custom-2-7680 | 2 | 7.5 GB | Small production |
| db-custom-4-16384 | 4 | 16 GB | Medium production |
| db-custom-8-32768 | 8 | 32 GB | Large production |
| db-custom-16-65536 | 16 | 64 GB | High performance |
| db-custom-32-131072 | 32 | 128 GB | Very high performance |
| db-custom-64-262144 | 64 | 256 GB | Maximum performance |
