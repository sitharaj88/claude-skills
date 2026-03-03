---
name: gcp-spanner
description: Generate Cloud Spanner schemas with interleaved tables, secondary indexes, and globally distributed configurations. Use when the user wants to design or configure Spanner databases.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a GCP Cloud Spanner expert. Generate production-ready Spanner schemas and configurations for globally distributed, strongly consistent relational databases.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: schema (design), queries (SQL patterns), migration (from other databases)
- **Distribution**: regional (single region) or multi-region (global)
- **Dialect**: GoogleSQL (default) or PostgreSQL
- **Scale**: expected data volume, read/write QPS, number of regions
- **Consistency**: need for strong consistency across regions
- **Existing schema**: migration from MySQL, PostgreSQL, or other databases

### Step 2: Choose instance configuration

**Regional instances (lower cost, lower latency):**

```hcl
resource "google_spanner_instance" "regional" {
  name             = "${var.project_id}-spanner"
  config           = "regional-${var.region}"  # e.g., "regional-us-central1"
  display_name     = "Production Spanner"
  processing_units = 1000  # 1 node = 1000 PU

  # Or use autoscaling
  autoscaling_config {
    autoscaling_limits {
      min_processing_units = 1000
      max_processing_units = 5000
    }
    autoscaling_targets {
      high_priority_cpu_utilization_percent = 65
      storage_utilization_percent           = 90
    }
  }

  labels = {
    environment = var.environment
  }
}
```

**Multi-region instances (global, highest availability):**

```hcl
resource "google_spanner_instance" "global" {
  name         = "${var.project_id}-spanner-global"
  config       = "nam-eur-asia1"  # Replicas across North America, Europe, Asia
  display_name = "Global Spanner"

  autoscaling_config {
    autoscaling_limits {
      min_nodes = 3
      max_nodes = 10
    }
    autoscaling_targets {
      high_priority_cpu_utilization_percent = 65
      storage_utilization_percent           = 90
    }
  }
}
```

| Config | Regions | SLA | Use Case |
|--------|---------|-----|----------|
| regional-* | 1 | 99.999% | Single-region apps |
| nam3 | 3 (NA) | 99.999% | North America multi-region |
| nam-eur-asia1 | 5 (global) | 99.999% | Global apps |
| eur3 | 3 (EU) | 99.999% | European multi-region |

### Step 3: Create database with dialect selection

```hcl
resource "google_spanner_database" "main" {
  instance = google_spanner_instance.regional.name
  name     = "app-database"

  database_dialect = "GOOGLE_STANDARD_SQL"  # or "POSTGRESQL"

  # Prevent accidental deletion
  deletion_protection = true

  # DDL statements for schema
  ddl = [
    <<-EOT
      CREATE TABLE Users (
        UserId     STRING(36) NOT NULL,
        Email      STRING(320) NOT NULL,
        Name       STRING(200) NOT NULL,
        CreatedAt  TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
        UpdatedAt  TIMESTAMP OPTIONS (allow_commit_timestamp = true),
        Status     STRING(20) NOT NULL DEFAULT ('active'),
      ) PRIMARY KEY (UserId)
    EOT
    ,
    <<-EOT
      CREATE UNIQUE INDEX UsersByEmail ON Users(Email)
    EOT
  ]
}
```

### Step 4: Design schema with interleaved tables

Interleaving physically co-locates child rows with their parent for efficient joins:

```sql
-- Parent table
CREATE TABLE Customers (
  CustomerId   STRING(36) NOT NULL,
  Name         STRING(200) NOT NULL,
  Email        STRING(320) NOT NULL,
  Region       STRING(50),
  CreatedAt    TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (CustomerId);

-- Interleaved child table (co-located with parent)
CREATE TABLE Orders (
  CustomerId   STRING(36) NOT NULL,
  OrderId      STRING(36) NOT NULL,
  Status       STRING(20) NOT NULL,
  TotalAmount  NUMERIC NOT NULL,
  CreatedAt    TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (CustomerId, OrderId),
  INTERLEAVE IN PARENT Customers ON DELETE CASCADE;

-- Deeply interleaved grandchild
CREATE TABLE OrderItems (
  CustomerId   STRING(36) NOT NULL,
  OrderId      STRING(36) NOT NULL,
  ItemId       STRING(36) NOT NULL,
  ProductId    STRING(36) NOT NULL,
  Quantity     INT64 NOT NULL,
  UnitPrice    NUMERIC NOT NULL,
) PRIMARY KEY (CustomerId, OrderId, ItemId),
  INTERLEAVE IN PARENT Orders ON DELETE CASCADE;

-- Non-interleaved table (standalone)
CREATE TABLE Products (
  ProductId    STRING(36) NOT NULL,
  Name         STRING(500) NOT NULL,
  Description  STRING(MAX),
  Price        NUMERIC NOT NULL,
  Category     STRING(100),
  InStock      BOOL NOT NULL DEFAULT (true),
  Tags         ARRAY<STRING(100)>,
  Metadata     JSON,
  UpdatedAt    TIMESTAMP OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (ProductId);
```

**Primary key selection guide:**

| Key Type | Pros | Cons | When to Use |
|----------|------|------|-------------|
| UUID (STRING(36)) | Even distribution | Longer key, no ordering | Default choice |
| GENERATE_UUID() | Auto-generated, even distribution | No ordering | Spanner-managed IDs |
| Sequential INT64 | Compact, sortable | Hotspot risk | Only with bit-reversal |
| Composite | Natural grouping | Complex queries | Interleaved tables |

```sql
-- Use GENERATE_UUID() for automatic UUID generation
CREATE TABLE Events (
  EventId    STRING(36) NOT NULL DEFAULT (GENERATE_UUID()),
  EventType  STRING(100) NOT NULL,
  Payload    JSON,
  CreatedAt  TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (EventId);
```

### Step 5: Configure secondary indexes

```sql
-- Standard index
CREATE INDEX OrdersByStatus ON Orders(Status);

-- Storing index (includes additional columns for index-only reads)
CREATE INDEX OrdersByDate ON Orders(CreatedAt DESC)
  STORING (Status, TotalAmount);

-- NULL_FILTERED index (excludes NULL values, saves space)
CREATE NULL_FILTERED INDEX ProductsByCategory ON Products(Category)
  STORING (Name, Price);

-- Interleaved index (scoped to parent)
CREATE INDEX OrdersByCustomerDate ON Orders(CustomerId, CreatedAt DESC)
  STORING (Status, TotalAmount),
  INTERLEAVE IN Customers;

-- Unique index
CREATE UNIQUE INDEX CustomersByEmail ON Customers(Email);

-- Index on generated column
ALTER TABLE Orders ADD COLUMN OrderMonth STRING(7)
  AS (FORMAT_TIMESTAMP('%Y-%m', CreatedAt)) STORED;

CREATE INDEX OrdersByMonth ON Orders(OrderMonth);
```

### Step 6: Query patterns

**Read-write transactions:**

```python
from google.cloud import spanner

client = spanner.Client()
instance = client.instance("my-instance")
database = instance.database("app-database")

def create_order(customer_id, order_id, items):
    """Create order with items in a single transaction."""
    def transaction_fn(transaction):
        # Verify customer exists
        result = transaction.execute_sql(
            "SELECT CustomerId FROM Customers WHERE CustomerId = @cid",
            params={"cid": customer_id},
            param_types={"cid": spanner.param_types.STRING},
        )
        if not list(result):
            raise ValueError(f"Customer {customer_id} not found")

        # Calculate total
        total = sum(item["quantity"] * item["unit_price"] for item in items)

        # Insert order
        transaction.insert(
            "Orders",
            columns=["CustomerId", "OrderId", "Status", "TotalAmount", "CreatedAt"],
            values=[(customer_id, order_id, "pending", total,
                     spanner.COMMIT_TIMESTAMP)],
        )

        # Insert items
        item_rows = [
            (customer_id, order_id, item["item_id"], item["product_id"],
             item["quantity"], item["unit_price"])
            for item in items
        ]
        transaction.insert(
            "OrderItems",
            columns=["CustomerId", "OrderId", "ItemId", "ProductId",
                     "Quantity", "UnitPrice"],
            values=item_rows,
        )

    database.run_in_transaction(transaction_fn)

# Read-only transaction (strong consistency)
def get_customer_orders(customer_id):
    """Read customer with all orders using strong read."""
    with database.snapshot() as snapshot:
        # Efficient: reads interleaved data co-located on same split
        results = snapshot.execute_sql(
            """
            SELECT c.Name, o.OrderId, o.Status, o.TotalAmount, o.CreatedAt
            FROM Customers c
            JOIN Orders o ON c.CustomerId = o.CustomerId
            WHERE c.CustomerId = @cid
            ORDER BY o.CreatedAt DESC
            LIMIT 100
            """,
            params={"cid": customer_id},
            param_types={"cid": spanner.param_types.STRING},
        )
        return list(results)

# Stale read (lower latency, especially for multi-region)
def get_products_stale(category):
    """Read products with 15-second staleness for lower latency."""
    import datetime
    staleness = datetime.timedelta(seconds=15)

    with database.snapshot(exact_staleness=staleness) as snapshot:
        results = snapshot.execute_sql(
            """
            SELECT ProductId, Name, Price
            FROM Products@{FORCE_INDEX=ProductsByCategory}
            WHERE Category = @cat
            ORDER BY Price ASC
            """,
            params={"cat": category},
            param_types={"cat": spanner.param_types.STRING},
        )
        return list(results)
```

**Partitioned DML (for large-scale updates):**

```python
def archive_old_orders():
    """Update millions of rows without transaction limits."""
    row_count = database.execute_partitioned_dml(
        """
        UPDATE Orders
        SET Status = 'archived'
        WHERE Status = 'completed'
        AND CreatedAt < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY)
        """
    )
    print(f"Archived {row_count} orders")
```

### Step 7: Query plans and optimization

```sql
-- Analyze query execution plan
EXPLAIN
SELECT c.Name, o.OrderId, o.TotalAmount
FROM Customers c
JOIN Orders o ON c.CustomerId = o.CustomerId
WHERE c.Region = 'US'
AND o.Status = 'pending'
ORDER BY o.CreatedAt DESC
LIMIT 50;

-- Use TABLESAMPLE for approximate counts
SELECT COUNT(*) AS approximate_count
FROM Orders TABLESAMPLE RESERVOIR (1000 ROWS);

-- Batch read with key set (more efficient than WHERE IN)
-- In client library:
-- database.read("Products", columns, keyset=KeySet(keys=[...]))
```

### Step 8: Change streams

```sql
-- Create a change stream to capture data changes
CREATE CHANGE STREAM OrderChanges
  FOR Orders, OrderItems
  OPTIONS (
    retention_period = '7d',
    value_capture_type = 'NEW_AND_OLD_VALUES'
  );

-- Watch all tables
CREATE CHANGE STREAM AllChanges
  FOR ALL
  OPTIONS (retention_period = '3d');
```

```python
# Read change stream records
def process_changes():
    """Process change stream records for CDC pipeline."""
    from google.cloud.spanner_v1 import DirectedReadOptions

    change_stream_records = database.execute_sql(
        """
        SELECT * FROM READ_OrderChanges(
          start_timestamp => @start,
          end_timestamp => NULL,
          partition_token => NULL,
          heartbeat_milliseconds => 10000
        )
        """,
        params={"start": "2024-01-01T00:00:00Z"},
        param_types={"start": spanner.param_types.STRING},
    )
    for record in change_stream_records:
        process_record(record)
```

### Step 9: Backup and restore

```hcl
resource "google_spanner_backup" "daily" {
  instance = google_spanner_instance.regional.name
  database = google_spanner_database.main.name
  name     = "daily-backup"

  retention_period = "72h"  # Keep for 3 days

  # Backups can also be scheduled via Cloud Scheduler + Cloud Functions
}
```

```bash
# Create on-demand backup
gcloud spanner backups create my-backup \
  --instance=my-instance \
  --database=app-database \
  --retention-period=7d \
  --async

# Restore from backup
gcloud spanner databases restore \
  --instance=my-instance \
  --destination-database=restored-db \
  --source-backup=my-backup

# Point-in-time recovery (with version retention)
gcloud spanner databases restore \
  --instance=my-instance \
  --destination-database=pit-restored-db \
  --source-database=app-database \
  --version-time="2024-01-15T10:00:00Z"
```

### Step 10: Local development with emulator

```bash
# Start Spanner emulator
gcloud emulators spanner start

# Set environment for emulator
export SPANNER_EMULATOR_HOST=localhost:9010

# Create instance on emulator
gcloud spanner instances create test-instance \
  --config=emulator-config \
  --nodes=1 \
  --description="Local test instance"

# Create database with schema
gcloud spanner databases create test-db \
  --instance=test-instance \
  --ddl-file=schema.sql
```

```python
# Connect to emulator in tests
import os
os.environ["SPANNER_EMULATOR_HOST"] = "localhost:9010"

from google.cloud import spanner

client = spanner.Client(project="test-project")
instance = client.instance("test-instance")
database = instance.database("test-db")
```

### Step 11: Schema changes without downtime

```sql
-- Spanner supports online schema changes
-- Add column (backfill runs in the background)
ALTER TABLE Products ADD COLUMN DiscountPrice NUMERIC;

-- Add generated column
ALTER TABLE Orders ADD COLUMN OrderYear INT64
  AS (EXTRACT(YEAR FROM CreatedAt)) STORED;

-- Create index (builds in background, does not block reads/writes)
CREATE INDEX ProductsByPrice ON Products(Price ASC)
  STORING (Name, Category);

-- Add foreign key
ALTER TABLE Orders ADD CONSTRAINT FK_OrderProduct
  FOREIGN KEY (ProductId) REFERENCES Products(ProductId);

-- Drop column (safe, reclaims space asynchronously)
ALTER TABLE Products DROP COLUMN DeprecatedField;
```

### Best practices

- **Use interleaved tables** for parent-child relationships with frequent joins
- **Choose UUIDs** (GENERATE_UUID()) over sequential integers for primary keys to avoid hotspots
- **Use STORING indexes** to enable index-only reads and avoid base table lookups
- **Use commit timestamps** (allow_commit_timestamp = true) for audit trails
- **Prefer stale reads** for read-heavy multi-region workloads (15-second staleness dramatically reduces latency)
- **Use partitioned DML** for bulk operations that would exceed transaction limits
- **Design for data locality**: interleave related tables under a common ancestor
- **Enable autoscaling** to handle variable workloads without manual intervention
- **Test with the emulator** before deploying schema changes to production

### Anti-patterns to avoid

- Using monotonically increasing integers as primary keys (causes hotspots)
- Creating too many secondary indexes (each index doubles write cost)
- Not using interleaved tables for strongly related parent-child data
- Running large analytical queries on OLTP instances (use Spanner federated queries or export to BigQuery)
- Not using parameterized queries (prevents query plan caching)
- Performing full table scans in transactions
- Over-provisioning nodes instead of using autoscaling

### Cost optimization

- **Use autoscaling** to scale down during off-peak hours
- **Choose regional instances** unless global distribution is truly needed (multi-region is 3x more expensive)
- **Use stale reads** to reduce cross-region latency and read amplification
- **Limit secondary indexes** to those actually used in queries (each index costs additional writes)
- **Use committed use discounts** (1-year: ~25% savings, 3-year: ~52% savings)
- **Monitor query statistics** in the Spanner dashboard to identify expensive queries
- **Use processing units** (100 PU increments) for fine-grained sizing below 1 node (1000 PU)
- **Export historical data** to BigQuery for analytics instead of querying Spanner directly
