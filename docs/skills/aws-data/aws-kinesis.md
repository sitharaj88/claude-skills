# AWS Kinesis

Generate real-time streaming configurations with Kinesis Data Streams, Data Firehose, and Data Analytics for event processing pipelines.

## Usage

```bash
/aws-kinesis <description of your streaming requirements>
```

## What It Does

1. Selects the appropriate Kinesis service (Data Streams, Firehose, Analytics)
2. Generates stream configurations with shard count and retention settings
3. Creates producer and consumer application code with proper error handling
4. Configures Firehose delivery streams to S3, Redshift, or OpenSearch
5. Sets up Data Analytics applications with SQL or Apache Flink
6. Adds enhanced fan-out, encryption, and CloudWatch monitoring

## Examples

```bash
/aws-kinesis Create a Data Stream with Lambda consumer for real-time clickstream processing

/aws-kinesis Set up Firehose delivery to S3 with Parquet conversion and partitioning

/aws-kinesis Build a streaming analytics pipeline with Flink for fraud detection
```

## Allowed Tools

- `Read` - Read existing streaming configurations and consumer code
- `Write` - Create stream templates, producer/consumer code, and analytics queries
- `Edit` - Modify existing Kinesis configurations
- `Bash` - Run AWS CLI Kinesis commands for testing
- `Glob` - Search for streaming-related files
- `Grep` - Find stream ARN and consumer references
