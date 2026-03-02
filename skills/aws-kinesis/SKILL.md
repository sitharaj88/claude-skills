---
name: aws-kinesis
description: Generate AWS Kinesis configurations for real-time data streaming, analytics, and Firehose delivery. Use when the user wants to set up real-time data pipelines or streaming.
argument-hint: "[streams|firehose|analytics] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS Kinesis expert. Generate production-ready real-time streaming configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Service**: Kinesis Data Streams, Kinesis Data Firehose, Kinesis Data Analytics
- **Data source**: application logs, clickstream, IoT, transactions
- **Volume**: records per second, average record size
- **Destinations**: S3, Redshift, OpenSearch, Splunk, HTTP endpoint, Lambda

### Step 2: Choose the right Kinesis service

| Service | Use Case | Latency |
|---------|----------|---------|
| Data Streams | Custom real-time processing | ~200ms |
| Data Firehose | Load streaming data to destinations | 60s buffer |
| Data Analytics | SQL/Apache Flink on streaming data | Seconds |

### Step 3: Generate Kinesis Data Streams configuration

- Stream name and shard count (or on-demand mode)
- Retention period (24 hours to 365 days)
- Encryption with KMS
- Enhanced fan-out for multiple consumers
- Shard-level metrics

**Producer code:**
- KPL (Kinesis Producer Library) for high throughput
- PutRecord/PutRecords API for simple use cases
- Partition key strategy for even distribution

**Consumer code:**
- KCL (Kinesis Client Library) for complex processing
- Lambda trigger for serverless processing
- Enhanced fan-out for dedicated throughput per consumer
- Checkpoint management and error handling

### Step 4: Generate Kinesis Data Firehose configuration

- Delivery stream with source (Direct PUT or Kinesis stream)
- Buffer size (1-128 MB) and interval (60-900 seconds)
- Data transformation Lambda (optional)
- Format conversion (JSON to Parquet/ORC for analytics)
- Destination configuration:
  - **S3**: prefix, partitioning, compression (gzip, snappy)
  - **Redshift**: COPY command, table mapping
  - **OpenSearch**: index, rotation
- Error output bucket
- CloudWatch logging

### Step 5: Generate Kinesis Data Analytics (if applicable)

- Apache Flink application
- Input stream mapping
- SQL queries or Flink code for transformation
- Output stream or destination
- Scaling configuration (KPU count)

### Step 6: Monitoring and scaling

- CloudWatch alarms for:
  - IncomingRecords, IncomingBytes
  - ReadProvisionedThroughputExceeded
  - WriteProvisionedThroughputExceeded
  - IteratorAgeMilliseconds (consumer lag)
- Auto-scaling for shard splitting/merging
- Enhanced monitoring for shard-level metrics

### Best practices:
- Use on-demand capacity mode for variable throughput
- Choose partition keys that distribute evenly across shards
- Use KPL for high-throughput producers (batching, retry)
- Use enhanced fan-out for multiple consumers reading same stream
- Monitor IteratorAge to detect consumer lag
- Use Firehose for simple ETL to S3/Redshift (no code needed)
- Enable server-side encryption
- Set retention period based on recovery requirements
