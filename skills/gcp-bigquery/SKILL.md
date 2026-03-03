---
name: gcp-bigquery
description: Generate BigQuery datasets, table schemas, SQL queries, ML models, and analytics pipelines. Use when the user wants to design or configure BigQuery for data warehousing and analytics.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bq *), Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a GCP BigQuery expert. Generate production-ready BigQuery configurations for data warehousing, analytics, and machine learning.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: schema (table design), query (SQL patterns), pipeline (ETL/ELT), ml (BigQuery ML)
- **Data sources**: Cloud Storage, Pub/Sub, streaming, external (Drive, Bigtable)
- **Scale**: expected data volume, query frequency, concurrent users
- **Use case**: data warehouse, real-time analytics, ML/AI, BI reporting, log analytics
- **Cost model**: on-demand queries vs flat-rate slot reservations

### Step 2: Create dataset and configure access

```hcl
resource "google_bigquery_dataset" "main" {
  dataset_id    = "analytics"
  friendly_name = "Analytics Dataset"
  description   = "Production analytics data warehouse"
  location      = "US"  # Must match data source region

  # Default table expiration (optional)
  default_table_expiration_ms = null  # No expiration for permanent tables

  # Default partition expiration
  default_partition_expiration_ms = 7776000000  # 90 days in ms

  # Labels for cost tracking
  labels = {
    environment = var.environment
    team        = "data-engineering"
  }

  # Access control
  access {
    role          = "OWNER"
    special_group = "projectOwners"
  }

  access {
    role          = "READER"
    group_by_email = "data-analysts@example.com"
  }

  access {
    role           = "WRITER"
    user_by_email  = "etl-service@${var.project_id}.iam.gserviceaccount.com"
  }

  # Authorized views from other datasets
  access {
    view {
      project_id = var.project_id
      dataset_id = "reporting"
      table_id   = "customer_summary"
    }
  }
}
```

### Step 3: Design table schemas

**Partitioned and clustered table (recommended for large datasets):**

```hcl
resource "google_bigquery_table" "events" {
  dataset_id          = google_bigquery_dataset.main.dataset_id
  table_id            = "events"
  deletion_protection = true

  # Time-based partitioning
  time_partitioning {
    type          = "DAY"
    field         = "event_timestamp"
    expiration_ms = 7776000000  # 90 days

    # Require partition filter to prevent full table scans
    require_partition_filter = true
  }

  # Clustering for further query optimization (up to 4 columns)
  clustering = ["event_type", "user_id", "country"]

  schema = jsonencode([
    {
      name = "event_id"
      type = "STRING"
      mode = "REQUIRED"
      description = "Unique event identifier"
    },
    {
      name = "event_timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
      description = "When the event occurred"
    },
    {
      name = "event_type"
      type = "STRING"
      mode = "REQUIRED"
      description = "Type of event (page_view, click, purchase)"
    },
    {
      name = "user_id"
      type = "STRING"
      mode = "NULLABLE"
      description = "User identifier"
    },
    {
      name = "country"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "device"
      type = "RECORD"
      mode = "NULLABLE"
      description = "Device information"
      fields = [
        { name = "type", type = "STRING", mode = "NULLABLE" },
        { name = "os", type = "STRING", mode = "NULLABLE" },
        { name = "browser", type = "STRING", mode = "NULLABLE" }
      ]
    },
    {
      name = "properties"
      type = "JSON"
      mode = "NULLABLE"
      description = "Event-specific properties"
    },
    {
      name = "tags"
      type = "STRING"
      mode = "REPEATED"
      description = "Event tags"
    }
  ])

  labels = {
    data_classification = "internal"
  }
}
```

**Integer-range partitioning:**

```sql
CREATE TABLE analytics.user_scores (
  user_id STRING NOT NULL,
  score INT64 NOT NULL,
  category STRING,
  updated_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(score, GENERATE_ARRAY(0, 10000, 100))
CLUSTER BY category;
```

**Ingestion-time partitioning:**

```sql
CREATE TABLE analytics.raw_logs (
  log_message STRING,
  severity STRING,
  source STRING,
  metadata JSON
)
PARTITION BY _PARTITIONDATE
CLUSTER BY severity, source;
```

### Step 4: Standard SQL query patterns

**Analytical queries with window functions:**

```sql
-- Daily active users with rolling 7-day average
WITH daily_users AS (
  SELECT
    DATE(event_timestamp) AS event_date,
    COUNT(DISTINCT user_id) AS dau
  FROM `project.analytics.events`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
    AND event_type = 'page_view'
  GROUP BY event_date
)
SELECT
  event_date,
  dau,
  AVG(dau) OVER (ORDER BY event_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7d_avg,
  SUM(dau) OVER (ORDER BY event_date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) AS mau_approx
FROM daily_users
ORDER BY event_date DESC;

-- Funnel analysis
WITH funnel AS (
  SELECT
    user_id,
    MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS viewed,
    MAX(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) AS added_to_cart,
    MAX(CASE WHEN event_type = 'checkout_start' THEN 1 ELSE 0 END) AS started_checkout,
    MAX(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) AS purchased
  FROM `project.analytics.events`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  GROUP BY user_id
)
SELECT
  COUNTIF(viewed = 1) AS total_viewers,
  COUNTIF(added_to_cart = 1) AS added_to_cart,
  COUNTIF(started_checkout = 1) AS started_checkout,
  COUNTIF(purchased = 1) AS purchased,
  ROUND(COUNTIF(purchased = 1) / COUNTIF(viewed = 1) * 100, 2) AS conversion_rate
FROM funnel;

-- Sessionization using TIMESTAMP_DIFF
WITH events_with_gaps AS (
  SELECT
    user_id,
    event_timestamp,
    event_type,
    TIMESTAMP_DIFF(
      event_timestamp,
      LAG(event_timestamp) OVER (PARTITION BY user_id ORDER BY event_timestamp),
      MINUTE
    ) AS minutes_since_last
  FROM `project.analytics.events`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
),
sessions AS (
  SELECT
    *,
    SUM(CASE WHEN minutes_since_last > 30 OR minutes_since_last IS NULL THEN 1 ELSE 0 END)
      OVER (PARTITION BY user_id ORDER BY event_timestamp) AS session_id
  FROM events_with_gaps
)
SELECT
  user_id,
  session_id,
  MIN(event_timestamp) AS session_start,
  MAX(event_timestamp) AS session_end,
  COUNT(*) AS event_count,
  TIMESTAMP_DIFF(MAX(event_timestamp), MIN(event_timestamp), SECOND) AS session_duration_sec
FROM sessions
GROUP BY user_id, session_id;
```

**DML statements:**

```sql
-- MERGE (upsert) for slowly changing dimensions
MERGE `analytics.customers` AS target
USING `staging.customer_updates` AS source
ON target.customer_id = source.customer_id
WHEN MATCHED THEN
  UPDATE SET
    target.name = source.name,
    target.email = source.email,
    target.updated_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN
  INSERT (customer_id, name, email, created_at, updated_at)
  VALUES (source.customer_id, source.name, source.email,
          CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- DELETE with partition filter (efficient)
DELETE FROM `analytics.events`
WHERE DATE(event_timestamp) < DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY);
```

### Step 5: Materialized views and scheduled queries

**Materialized views:**

```sql
-- Auto-refreshed aggregate view
CREATE MATERIALIZED VIEW analytics.daily_revenue
PARTITION BY event_date
CLUSTER BY country
OPTIONS (
  enable_refresh = true,
  refresh_interval_minutes = 30,
  max_staleness = INTERVAL "4" HOUR
)
AS
SELECT
  DATE(event_timestamp) AS event_date,
  country,
  COUNT(*) AS transaction_count,
  SUM(CAST(JSON_VALUE(properties, '$.amount') AS NUMERIC)) AS total_revenue,
  AVG(CAST(JSON_VALUE(properties, '$.amount') AS NUMERIC)) AS avg_order_value
FROM `project.analytics.events`
WHERE event_type = 'purchase'
GROUP BY event_date, country;
```

**Scheduled queries:**

```hcl
resource "google_bigquery_data_transfer_config" "daily_summary" {
  display_name           = "Daily Summary ETL"
  location               = "US"
  data_source_id         = "scheduled_query"
  schedule               = "every 24 hours"
  destination_dataset_id = google_bigquery_dataset.main.dataset_id

  params = {
    destination_table_name_template = "daily_summary_{run_date}"
    write_disposition               = "WRITE_TRUNCATE"
    query                           = <<-SQL
      SELECT
        DATE(event_timestamp) AS event_date,
        event_type,
        COUNT(*) AS event_count,
        COUNT(DISTINCT user_id) AS unique_users
      FROM `${var.project_id}.analytics.events`
      WHERE DATE(event_timestamp) = @run_date
      GROUP BY event_date, event_type
    SQL
  }

  service_account_name = "bq-scheduler@${var.project_id}.iam.gserviceaccount.com"
}
```

### Step 6: External tables and data loading

**External table (GCS):**

```sql
-- Query data directly in GCS without loading
CREATE OR REPLACE EXTERNAL TABLE analytics.external_logs
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://my-bucket/logs/year=*/month=*/*.parquet'],
  hive_partition_uri_prefix = 'gs://my-bucket/logs/',
  require_hive_partition_filter = true
);

-- BigLake table (managed external table with fine-grained access)
CREATE OR REPLACE EXTERNAL TABLE analytics.biglake_table
WITH CONNECTION `us.my-connection`
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://my-bucket/data/*.parquet'],
  metadata_cache_mode = 'AUTOMATIC',
  max_staleness = INTERVAL 1 HOUR
);
```

**Streaming inserts:**

```python
from google.cloud import bigquery
import json

client = bigquery.Client()
table_ref = client.dataset("analytics").table("events")

# Streaming insert (real-time data ingestion)
rows_to_insert = [
    {
        "event_id": "evt-12345",
        "event_timestamp": "2024-01-15T10:30:00Z",
        "event_type": "purchase",
        "user_id": "user-789",
        "country": "US",
        "device": {"type": "mobile", "os": "iOS", "browser": "Safari"},
        "properties": json.dumps({"amount": 99.99, "currency": "USD"}),
        "tags": ["conversion", "mobile"],
    }
]

errors = client.insert_rows_json(table_ref, rows_to_insert)
if errors:
    print(f"Insert errors: {errors}")
```

**Storage Write API (higher throughput, exactly-once):**

```python
from google.cloud.bigquery_storage_v1 import BigQueryWriteClient
from google.cloud.bigquery_storage_v1 import types
from google.protobuf import descriptor_pb2
import google.protobuf.json_format as json_format

write_client = BigQueryWriteClient()
parent = f"projects/{project_id}/datasets/analytics/tables/events"

# Create write stream
write_stream = write_client.create_write_stream(
    parent=parent,
    write_stream=types.WriteStream(type_=types.WriteStream.Type.COMMITTED),
)

# Append rows using the stream
# (Use proto format for best performance)
```

### Step 7: BigQuery ML

```sql
-- Create a classification model
CREATE OR REPLACE MODEL analytics.churn_predictor
OPTIONS (
  model_type = 'LOGISTIC_REG',
  input_label_cols = ['churned'],
  auto_class_weights = TRUE,
  data_split_method = 'AUTO_SPLIT',
  max_iterations = 20
) AS
SELECT
  user_id,
  days_since_last_visit,
  total_purchases,
  avg_session_duration,
  support_tickets,
  churned
FROM analytics.user_features
WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY);

-- Evaluate model
SELECT * FROM ML.EVALUATE(MODEL analytics.churn_predictor);

-- Make predictions
SELECT
  user_id,
  predicted_churned,
  predicted_churned_probs
FROM ML.PREDICT(
  MODEL analytics.churn_predictor,
  (SELECT * FROM analytics.active_user_features)
)
WHERE predicted_churned_probs[OFFSET(1)].prob > 0.7
ORDER BY predicted_churned_probs[OFFSET(1)].prob DESC;

-- Time-series forecasting with ARIMA_PLUS
CREATE OR REPLACE MODEL analytics.revenue_forecast
OPTIONS (
  model_type = 'ARIMA_PLUS',
  time_series_timestamp_col = 'event_date',
  time_series_data_col = 'daily_revenue',
  time_series_id_col = 'country',
  horizon = 30,
  auto_arima = TRUE
) AS
SELECT
  DATE(event_timestamp) AS event_date,
  country,
  SUM(CAST(JSON_VALUE(properties, '$.amount') AS NUMERIC)) AS daily_revenue
FROM `project.analytics.events`
WHERE event_type = 'purchase'
GROUP BY event_date, country;

-- Get forecast
SELECT * FROM ML.FORECAST(MODEL analytics.revenue_forecast, STRUCT(30 AS horizon));

-- K-means clustering for customer segmentation
CREATE OR REPLACE MODEL analytics.customer_segments
OPTIONS (
  model_type = 'KMEANS',
  num_clusters = 5,
  standardize_features = TRUE
) AS
SELECT
  total_purchases,
  avg_order_value,
  days_since_first_purchase,
  total_sessions,
  avg_session_duration
FROM analytics.user_features;
```

### Step 8: Security configuration

**Column-level security:**

```sql
-- Create a policy tag taxonomy
-- (Done via Data Catalog API or Console)

-- Apply policy tag to sensitive column
ALTER TABLE analytics.customers
ALTER COLUMN email SET OPTIONS (
  description = "Customer email - PII"
);

-- Column-level access is managed via Data Catalog policy tags and IAM
```

**Row-level security:**

```sql
-- Create row access policy
CREATE OR REPLACE ROW ACCESS POLICY region_filter
ON analytics.events
GRANT TO ("group:us-analysts@example.com")
FILTER USING (country = 'US');

CREATE OR REPLACE ROW ACCESS POLICY admin_access
ON analytics.events
GRANT TO ("group:data-admins@example.com")
FILTER USING (TRUE);  -- Full access
```

**Authorized views:**

```sql
-- Create a view that limits access
CREATE OR REPLACE VIEW reporting.customer_summary AS
SELECT
  customer_id,
  name,
  country,
  total_purchases,
  -- Mask PII
  CONCAT(SUBSTR(email, 1, 3), '***@', SPLIT(email, '@')[OFFSET(1)]) AS masked_email
FROM analytics.customers;

-- Grant the view access to the underlying dataset (done in dataset access config)
```

### Step 9: UDFs and remote functions

**JavaScript UDF:**

```sql
CREATE OR REPLACE FUNCTION analytics.parse_user_agent(ua STRING)
RETURNS STRUCT<browser STRING, os STRING, device STRING>
LANGUAGE js AS r"""
  var result = {browser: 'unknown', os: 'unknown', device: 'desktop'};
  if (ua.includes('Chrome')) result.browser = 'Chrome';
  else if (ua.includes('Firefox')) result.browser = 'Firefox';
  else if (ua.includes('Safari')) result.browser = 'Safari';
  if (ua.includes('Windows')) result.os = 'Windows';
  else if (ua.includes('Mac')) result.os = 'macOS';
  else if (ua.includes('Linux')) result.os = 'Linux';
  if (ua.includes('Mobile')) result.device = 'mobile';
  else if (ua.includes('Tablet')) result.device = 'tablet';
  return result;
""";

-- Use the UDF
SELECT
  event_id,
  analytics.parse_user_agent(user_agent) AS parsed_ua
FROM analytics.raw_events;
```

**SQL UDF:**

```sql
CREATE OR REPLACE FUNCTION analytics.safe_divide(numerator FLOAT64, denominator FLOAT64)
RETURNS FLOAT64 AS (
  IF(denominator = 0, NULL, numerator / denominator)
);
```

**Remote function (call Cloud Functions from SQL):**

```sql
-- Create connection
CREATE OR REPLACE CONNECTION `us.my-ml-connection`
OPTIONS (type = 'CLOUD_RESOURCE');

-- Create remote function
CREATE OR REPLACE FUNCTION analytics.sentiment_score(text STRING)
RETURNS FLOAT64
REMOTE WITH CONNECTION `us.my-ml-connection`
OPTIONS (
  endpoint = 'https://us-central1-my-project.cloudfunctions.net/sentiment-analysis',
  max_batching_rows = 1000
);

-- Use in query
SELECT
  comment_text,
  analytics.sentiment_score(comment_text) AS sentiment
FROM analytics.product_reviews;
```

### Step 10: Information schema queries

```sql
-- Table sizes and row counts
SELECT
  table_name,
  ROUND(size_bytes / POW(10, 9), 2) AS size_gb,
  row_count,
  TIMESTAMP_MILLIS(last_modified_time) AS last_modified
FROM `project.analytics.INFORMATION_SCHEMA.TABLE_STORAGE`
ORDER BY size_bytes DESC;

-- Query job statistics (cost analysis)
SELECT
  user_email,
  COUNT(*) AS query_count,
  ROUND(SUM(total_bytes_processed) / POW(10, 12), 4) AS total_tb_processed,
  ROUND(SUM(total_bytes_processed) / POW(10, 12) * 6.25, 2) AS estimated_cost_usd,
  ROUND(AVG(total_slot_ms) / 1000, 2) AS avg_slot_seconds
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND job_type = 'QUERY'
  AND state = 'DONE'
GROUP BY user_email
ORDER BY total_tb_processed DESC;

-- Identify expensive queries
SELECT
  job_id,
  user_email,
  query,
  ROUND(total_bytes_processed / POW(10, 9), 2) AS gb_processed,
  ROUND(total_slot_ms / 1000, 2) AS slot_seconds,
  creation_time
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND job_type = 'QUERY'
  AND total_bytes_processed > 10 * POW(10, 9)  -- > 10 GB
ORDER BY total_bytes_processed DESC
LIMIT 50;

-- Column usage statistics
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM `project.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

### Step 11: Cost estimation and optimization

**Dry run for cost estimation:**

```bash
# Estimate query cost before running
bq query --dry_run --use_legacy_sql=false \
  'SELECT * FROM `project.analytics.events` WHERE DATE(event_timestamp) = "2024-01-15"'

# Output shows bytes that would be processed
```

```python
from google.cloud import bigquery

client = bigquery.Client()

job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
query_job = client.query(
    "SELECT * FROM `project.analytics.events` WHERE DATE(event_timestamp) = '2024-01-15'",
    job_config=job_config,
)

bytes_processed = query_job.total_bytes_processed
cost_estimate = (bytes_processed / (1024**4)) * 6.25  # $6.25 per TB
print(f"Estimated cost: ${cost_estimate:.4f} ({bytes_processed / (1024**3):.2f} GB)")
```

**Slot reservations for flat-rate pricing:**

```hcl
resource "google_bigquery_reservation" "production" {
  name     = "production-slots"
  location = "US"

  slot_capacity = 500  # Minimum 100 slots (editions)
  edition       = "ENTERPRISE"

  autoscale {
    max_slots = 1000
  }
}

resource "google_bigquery_reservation_assignment" "assign" {
  assignee    = "projects/${var.project_id}"
  job_type    = "QUERY"
  reservation = google_bigquery_reservation.production.id
}
```

### Best practices

- **Partition tables by date** and require partition filters to prevent full table scans
- **Cluster tables** by frequently filtered columns (up to 4 columns)
- **Use materialized views** for commonly repeated aggregations
- **Denormalize data** when possible to avoid expensive JOINs across large tables
- **Use STRUCT and ARRAY** types instead of fully flattening data (preserves locality)
- **Always run dry runs** to estimate query cost before executing expensive queries
- **Use column selection** (avoid `SELECT *`) to reduce bytes scanned
- **Leverage query cache** (identical queries within 24 hours are free)
- **Use streaming inserts or Storage Write API** for real-time data; batch loads for bulk data (batch loads are free)
- **Set up custom cost controls** with maximum bytes billed per query

### Anti-patterns to avoid

- Using `SELECT *` on large partitioned tables without partition filters
- Not partitioning tables that grow beyond a few GB
- Using legacy SQL instead of Standard SQL
- Creating too many small tables instead of partitioned tables
- Running complex queries without dry-run cost estimation first
- Using streaming inserts for batch data (batch loads are free, streaming is not)
- Not setting `maximum_bytes_billed` on programmatic queries
- Joining very large tables without pre-filtering with WHERE clauses

### Cost optimization

- **Use batch loading** (free) instead of streaming inserts ($0.05/GB) when real-time is not needed
- **Set `require_partition_filter`** on all partitioned tables to prevent accidental full scans
- **Use materialized views** to avoid re-computing common aggregations
- **Compress data in GCS** (Parquet, Avro) before loading into BigQuery
- **Set per-query cost limits**: `maximum_bytes_billed` in job config
- **Consider flat-rate pricing** (slot reservations) if on-demand costs exceed $10K/month
- **Use BigQuery BI Engine** for sub-second queries on dashboards (reduces slot usage)
- **Expire old partitions** automatically with `default_partition_expiration_ms`
- **Monitor costs** using INFORMATION_SCHEMA.JOBS and set budget alerts
- **Use query cache** by avoiding non-deterministic functions (CURRENT_TIMESTAMP) when possible
