# Azure Event Hubs

Generate Azure Event Hubs configurations with partitioned consumers, Capture to storage, Schema Registry, Kafka protocol compatibility, and event-driven processing.

## Usage

```bash
/azure-event-hubs <description of your event streaming requirements>
```

## What It Does

1. Creates Event Hubs namespace and event hub configurations with Standard, Premium, and Dedicated tiers
2. Generates consumer group configurations with partitioned event processing and checkpointing
3. Configures Event Hubs Capture for automatic event archival to Azure Blob Storage or Data Lake
4. Sets up Schema Registry with Avro schema validation and compatibility enforcement
5. Produces Apache Kafka-compatible configurations for existing Kafka workload migration
6. Adds managed identity authentication, private endpoints, and geo-disaster recovery pairing

## Examples

```bash
/azure-event-hubs Create a Premium tier Event Hubs namespace with 8 partitions, Capture to Blob Storage, and managed identity access

/azure-event-hubs Set up an event hub with Schema Registry, Avro serialization, and consumer groups for real-time analytics processing

/azure-event-hubs Configure Event Hubs with Kafka protocol support, geo-disaster recovery pairing, and private endpoint networking
```

## What It Covers

- **Namespace tiers** - Standard, Premium, and Dedicated tier selection with throughput units and processing units
- **Partitioning** - Partition count planning, partition key strategies, and ordered event delivery
- **Consumer groups** - Event processor clients, checkpointing, and load-balanced partition ownership
- **Capture** - Automatic event archival to Blob Storage and Data Lake in Avro format
- **Schema Registry** - Avro schema management, compatibility modes, and schema evolution
- **Kafka compatibility** - SASL/SSL authentication, topic mapping, and Kafka client configurations
- **Geo-disaster recovery** - Namespace pairing, alias connections, and failover procedures
- **Security** - Shared access policies, managed identity, RBAC, private endpoints, and IP filtering
- **Monitoring** - Throughput metrics, consumer lag tracking, and Azure Monitor diagnostics

<div class="badge-row">
  <span class="badge">Streaming</span>
  <span class="badge">Event Ingestion</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Event Hubs configurations and event processor code
- `Write` - Create namespace templates, consumer configs, and ARM/Bicep templates
- `Edit` - Modify existing Event Hubs settings and consumer group configurations
- `Bash` - Run az eventhubs commands for validation and namespace management
- `Glob` - Search for event streaming configuration and template files
- `Grep` - Find Event Hubs connection string references and SDK usage across the project
