---
name: gcp-bigtable
description: Generate Cloud Bigtable schemas, row key designs, column family configurations, and cluster setups for high-throughput workloads. Use when the user wants to design or configure Bigtable tables.
argument-hint: "[use-case]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(cbt *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a GCP Cloud Bigtable expert. Generate production-ready Bigtable schemas and configurations optimized for high-throughput, low-latency workloads.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Use case**: time-series, IoT telemetry, analytics, user data, financial data, ad tech
- **Data model**: entities, relationships, access patterns
- **Scale**: expected rows, data size, read/write throughput (QPS)
- **Latency**: single-digit millisecond reads required?
- **Retention**: how long data must be kept, garbage collection needs

### Step 2: Design row keys

Row key design is the most critical decision in Bigtable. The row key determines data distribution across nodes and query performance.

**Row key design principles:**

| Principle | Description |
|-----------|-------------|
| Distribute writes evenly | Avoid monotonically increasing keys (timestamps alone) |
| Support access patterns | Row key prefix must match your primary query |
| Keep keys short | Shorter keys = less storage and faster comparisons |
| Use human-readable delimiters | Use `#` to separate components |

**Time-series row key patterns:**

```
# ANTI-PATTERN: Monotonic timestamp causes hotspotting
timestamp                          # BAD - all writes go to one node

# PATTERN 1: Reverse timestamp (recent data first)
sensor_id#reverse_timestamp        # e.g., "sensor42#9999999999-1704067200"

# PATTERN 2: Salted key (even distribution)
salt#sensor_id#timestamp           # e.g., "03#sensor42#2024-01-01T00:00:00"
                                   # salt = hash(sensor_id) % NUM_BUCKETS

# PATTERN 3: Field promotion (avoid full table scan)
metric_type#sensor_id#timestamp    # e.g., "temperature#sensor42#20240101"
```

**IoT telemetry design:**

```
# Row key: device_type#device_id#reverse_timestamp
# Column family: "metrics"
# Column qualifiers: temperature, humidity, pressure, battery

Row key: thermostat#device001#7999999999999
  metrics:temperature = "72.5"
  metrics:humidity = "45.2"
  metrics:battery = "0.85"
```

**User data design:**

```
# Row key: user_id (UUID recommended for even distribution)
# Column families: "profile", "activity", "preferences"

Row key: 550e8400-e29b-41d4-a716-446655440000
  profile:name = "Jane Doe"
  profile:email = "jane@example.com"
  activity:last_login = "2024-01-15T10:30:00Z"
  activity:login_count = "142"
  preferences:theme = "dark"
  preferences:language = "en"
```

**Analytics/ad tech design:**

```
# Row key: advertiser_id#campaign_id#date#hour
# Column family: "metrics"

Row key: adv123#camp456#20240115#14
  metrics:impressions = "15234"
  metrics:clicks = "342"
  metrics:spend = "125.67"
  metrics:conversions = "28"
```

### Step 3: Generate instance and cluster configuration

```hcl
resource "google_bigtable_instance" "main" {
  name                = "${var.project_id}-bigtable"
  deletion_protection = true

  # Production cluster
  cluster {
    cluster_id   = "primary-cluster"
    zone         = "${var.region}-a"
    storage_type = "SSD"  # SSD for low latency, HDD for cost-effective analytics

    autoscaling_config {
      min_nodes      = 3    # Minimum 3 nodes for production
      max_nodes      = 10
      cpu_target     = 70   # Scale up when CPU > 70%
      storage_target = 2560 # GB per node target (SSD max: 5TB/node)
    }
  }

  # Replication cluster (for HA and read scaling)
  cluster {
    cluster_id   = "replica-cluster"
    zone         = "${var.region}-b"
    storage_type = "SSD"

    autoscaling_config {
      min_nodes      = 3
      max_nodes      = 10
      cpu_target     = 70
      storage_target = 2560
    }
  }

  labels = {
    environment = var.environment
    team        = var.team
  }
}
```

### Step 4: Configure tables and column families

```hcl
resource "google_bigtable_table" "timeseries" {
  name          = "timeseries"
  instance_name = google_bigtable_instance.main.name

  # Split keys for pre-splitting the table
  split_keys = ["device_a", "device_m", "device_z"]

  column_family {
    family = "metrics"
  }

  column_family {
    family = "metadata"
  }

  # TTL-based garbage collection (delete data older than 90 days)
  column_family {
    family = "raw_events"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Garbage collection policies
resource "google_bigtable_gc_policy" "metrics_gc" {
  instance_name = google_bigtable_instance.main.name
  table         = google_bigtable_table.timeseries.name
  column_family = "metrics"

  max_age {
    duration = "2160h"  # 90 days
  }
}

resource "google_bigtable_gc_policy" "raw_gc" {
  instance_name = google_bigtable_instance.main.name
  table         = google_bigtable_table.timeseries.name
  column_family = "raw_events"

  # Keep max 1 version OR data older than 30 days (union policy)
  gc_rules = <<EOF
  {
    "mode": "union",
    "rules": [
      { "max_age": "720h" },
      { "max_version": 1 }
    ]
  }
  EOF
}

# Intersection policy: delete only when BOTH conditions are met
resource "google_bigtable_gc_policy" "metadata_gc" {
  instance_name = google_bigtable_instance.main.name
  table         = google_bigtable_table.timeseries.name
  column_family = "metadata"

  gc_rules = <<EOF
  {
    "mode": "intersection",
    "rules": [
      { "max_age": "8760h" },
      { "max_version": 3 }
    ]
  }
  EOF
}
```

### Step 5: Configure app profiles

```hcl
# Multi-cluster routing (default - HA with automatic failover)
resource "google_bigtable_app_profile" "default" {
  instance       = google_bigtable_instance.main.name
  app_profile_id = "default-multi-cluster"

  multi_cluster_routing_use_any = true

  # Optional: restrict to specific clusters
  # multi_cluster_routing_cluster_ids = ["primary-cluster", "replica-cluster"]
}

# Single-cluster routing (for consistent reads or batch processing)
resource "google_bigtable_app_profile" "batch" {
  instance       = google_bigtable_instance.main.name
  app_profile_id = "batch-processing"

  single_cluster_routing {
    cluster_id                 = "primary-cluster"
    allow_transactional_writes = true
  }
}

# Read-only routing to replica
resource "google_bigtable_app_profile" "read_replica" {
  instance       = google_bigtable_instance.main.name
  app_profile_id = "read-from-replica"

  single_cluster_routing {
    cluster_id                 = "replica-cluster"
    allow_transactional_writes = false
  }
}
```

### Step 6: Client library patterns

**Python client with best practices:**

```python
from google.cloud import bigtable
from google.cloud.bigtable import column_family, row_filters
import datetime
import struct

# Connection setup
client = bigtable.Client(project="my-project", admin=True)
instance = client.instance("my-bigtable-instance")
table = instance.table("timeseries")

# Write data
def write_metric(device_id, metric_name, value, timestamp=None):
    """Write a single metric data point."""
    if timestamp is None:
        timestamp = datetime.datetime.utcnow()

    # Reverse timestamp for descending order
    reverse_ts = int((datetime.datetime(9999, 12, 31) - timestamp).total_seconds())
    row_key = f"{device_id}#{reverse_ts}".encode()

    row = table.direct_row(row_key)
    row.set_cell(
        "metrics",
        metric_name.encode(),
        str(value).encode(),
        timestamp=timestamp,
    )
    row.commit()

# Batch write for high throughput
def write_metrics_batch(data_points):
    """Write multiple data points using MutateRows for efficiency."""
    rows = []
    for point in data_points:
        reverse_ts = int(
            (datetime.datetime(9999, 12, 31) - point["timestamp"]).total_seconds()
        )
        row_key = f"{point['device_id']}#{reverse_ts}".encode()

        row = table.direct_row(row_key)
        for metric, value in point["metrics"].items():
            row.set_cell("metrics", metric.encode(), str(value).encode(),
                        timestamp=point["timestamp"])
        rows.append(row)

    # MutateRows sends in batches of up to 100,000 mutations
    table.mutate_rows(rows)

# Read data with filters
def read_latest_metrics(device_id, num_readings=10):
    """Read the latest N metrics for a device."""
    prefix = f"{device_id}#".encode()

    # CellsColumnLimitFilter returns only the latest N cells per column
    row_filter = row_filters.CellsColumnLimitFilter(1)

    partial_rows = table.read_rows(
        row_set=bigtable.row_set.RowSet(),
        filter_=row_filter,
    )
    # Use prefix-based scan
    rows = table.read_rows(
        start_key=prefix,
        end_key=prefix + b"\xff",
        limit=num_readings,
        filter_=row_filter,
    )
    rows.consume_all()

    results = []
    for row_key, row_data in rows.rows.items():
        metrics = {}
        for family, columns in row_data.cells.items():
            for col, cells in columns.items():
                metrics[col.decode()] = cells[0].value.decode()
        results.append({
            "row_key": row_key.decode(),
            "metrics": metrics,
        })
    return results

# Read with complex filters
def read_filtered(device_id, start_time, end_time, metric_name):
    """Read specific metric within a time range."""
    reverse_end = int(
        (datetime.datetime(9999, 12, 31) - start_time).total_seconds()
    )
    reverse_start = int(
        (datetime.datetime(9999, 12, 31) - end_time).total_seconds()
    )

    start_key = f"{device_id}#{reverse_start}".encode()
    end_key = f"{device_id}#{reverse_end}".encode()

    # Chain filters: family filter AND column filter AND cells limit
    chain_filter = row_filters.RowFilterChain(filters=[
        row_filters.FamilyNameRegexFilter("metrics"),
        row_filters.ColumnQualifierRegexFilter(metric_name.encode()),
        row_filters.CellsColumnLimitFilter(1),
    ])

    rows = table.read_rows(
        start_key=start_key,
        end_key=end_key,
        filter_=chain_filter,
    )
    rows.consume_all()
    return rows.rows
```

**Java client (high-throughput pattern):**

```java
import com.google.cloud.bigtable.data.v2.*;
import com.google.cloud.bigtable.data.v2.models.*;

// Efficient bulk read using BigtableDataClient
try (BigtableDataClient dataClient = BigtableDataClient.create(
    BigtableDataSettings.newBuilder()
        .setProjectId("my-project")
        .setInstanceId("my-instance")
        .setAppProfileId("default-multi-cluster")
        .build())) {

    Query query = Query.create("timeseries")
        .prefix("device42#")
        .filter(FILTERS.limit().cellsPerColumn(1));

    ServerStream<Row> rows = dataClient.readRows(query);
    for (Row row : rows) {
        // Process row
    }
}
```

### Step 7: Use the cbt tool for administration

```bash
# Configure cbt
echo "project = my-project" > ~/.cbtrc
echo "instance = my-bigtable-instance" >> ~/.cbtrc

# List tables
cbt ls

# Read rows
cbt read timeseries prefix=device42# count=10

# Write a cell
cbt set timeseries "device42#9999999999" metrics:temperature=72.5

# Count rows (expensive - scans entire table)
cbt count timeseries

# Create table with column families
cbt createtable newtable families="metrics:maxage=90d,metadata:maxversions=3"

# Set garbage collection policy
cbt setgcpolicy timeseries metrics maxage=90d
cbt setgcpolicy timeseries raw_events "maxage=30d or maxversions=1"
```

### Step 8: Monitor with Key Visualizer

Key Visualizer helps identify hotspots in your row key design.

```bash
# Enable Key Visualizer (requires generating some load first)
# Key Visualizer automatically activates when a table has enough data

# Check cluster metrics
gcloud bigtable clusters describe primary-cluster \
  --instance=my-bigtable-instance

# Set up alerting for hot tablets
gcloud monitoring alert-policies create \
  --display-name="Bigtable Hot Tablet Alert" \
  --condition-filter='resource.type="bigtable_table" AND metric.type="bigtable.googleapis.com/server/latencies"' \
  --condition-threshold-value=100 \
  --condition-threshold-duration=300s
```

### Step 9: Data import and export

```bash
# Export to Cloud Storage (via Dataflow)
gcloud dataflow jobs run bigtable-export \
  --gcs-location gs://dataflow-templates/latest/Cloud_Bigtable_to_GCS_Avro \
  --parameters \
    bigtableProjectId=my-project,\
    bigtableInstanceId=my-instance,\
    bigtableTableId=timeseries,\
    destinationPath=gs://my-bucket/exports/

# Import from Cloud Storage
gcloud dataflow jobs run bigtable-import \
  --gcs-location gs://dataflow-templates/latest/GCS_Avro_to_Cloud_Bigtable \
  --parameters \
    bigtableProjectId=my-project,\
    bigtableInstanceId=my-instance,\
    bigtableTableId=timeseries,\
    inputFilePattern=gs://my-bucket/exports/*

# Import from HBase sequence files
gcloud dataflow jobs run hbase-import \
  --gcs-location gs://dataflow-templates/latest/GCS_SequenceFile_to_Cloud_Bigtable \
  --parameters \
    bigtableProject=my-project,\
    bigtableInstanceId=my-instance,\
    bigtableTableId=timeseries,\
    sourcePattern=gs://my-bucket/hbase-export/*
```

### Best practices

- **Design row keys for your primary access pattern** first; everything else is secondary
- **Avoid row key hotspots** by never using monotonically increasing values (timestamps, sequential IDs) as the row key prefix
- **Use salting or field promotion** to distribute writes across nodes
- **Keep row keys short** (under 4KB, ideally under 100 bytes)
- **Use column families sparingly** (1-3 per table); columns within families are unlimited
- **Set garbage collection policies** on every column family to prevent unbounded storage growth
- **Use multi-cluster routing** for production HA; single-cluster routing for batch jobs
- **Pre-split tables** for known key distributions to avoid initial hotspotting
- **Monitor with Key Visualizer** to detect and fix hotspot patterns
- **Batch mutations** using MutateRows for write throughput

### Anti-patterns to avoid

- Using timestamps alone as row keys (creates write hotspots on a single node)
- Storing large values (> 10MB cells) that cause read amplification
- Creating too many column families (each family stored separately on disk)
- Reading entire rows when you only need specific columns (use column filters)
- Not setting GC policies, causing unbounded storage and cell version accumulation
- Using Bigtable for small datasets (< 1TB) where Cloud SQL or Firestore is more appropriate
- Performing full table scans in production queries

### Cost optimization

- **Use HDD storage** instead of SSD for analytical workloads with relaxed latency requirements
- **Enable autoscaling** to match cluster size to actual workload demand
- **Set GC policies** to automatically clean up old data and reduce storage costs
- **Use single-cluster routing for batch** workloads to avoid unnecessary replication
- **Right-size clusters**: each node handles approximately 10,000 QPS for reads and writes
- **Minimum production cluster**: 3 nodes per cluster (recommended minimum for SLA)
- **Monitor per-node throughput** and scale down if consistently under-utilized
- **Use Bigtable only when data exceeds 1TB** or throughput exceeds what Cloud SQL can handle
