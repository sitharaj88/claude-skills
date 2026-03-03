# GCP Bigtable

Generate Cloud Bigtable instance and table configurations with column families, garbage collection policies, replication, and application profiles for high-throughput workloads.

## Usage

```bash
/gcp-bigtable <description of your Bigtable requirements>
```

## What It Does

1. Creates Bigtable instance configurations with appropriate cluster sizing and storage types (SSD or HDD)
2. Designs table schemas with row key strategies optimized for read and write patterns
3. Configures column families with garbage collection policies for version-based and age-based retention
4. Sets up multi-cluster replication with application profiles for failover and read affinity
5. Produces client connection code with batch mutations and read row patterns
6. Adds monitoring, autoscaling policies, and key visualizer integration

## Examples

```bash
/gcp-bigtable Design a time-series table schema for IoT sensor data with row key optimization and age-based garbage collection

/gcp-bigtable Create a multi-cluster Bigtable instance with replication across us-central1 and us-east1 with single-cluster routing

/gcp-bigtable Configure a table for high-throughput user analytics with column families and autoscaling from 3 to 10 nodes
```

## Allowed Tools

- `Read` - Read existing Bigtable schemas and configurations
- `Write` - Create instance templates, table schemas, and client connection code
- `Edit` - Modify existing Bigtable configurations
- `Bash` - Run cbt and gcloud bigtable commands for validation
- `Glob` - Search for Bigtable-related templates
- `Grep` - Find Bigtable references across the project
