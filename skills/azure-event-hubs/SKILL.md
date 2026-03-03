---
name: azure-event-hubs
description: Generate Azure Event Hubs configurations for real-time streaming, event processing, and Kafka-compatible messaging. Use when the user wants to set up event ingestion, streaming pipelines, or managed Kafka.
argument-hint: "[tier]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Event Hubs expert. Generate production-ready event streaming and ingestion configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Tier**: Basic, Standard, Premium, or Dedicated
- **Purpose**: event ingestion, stream processing, Kafka replacement, log aggregation
- **Volume**: events per second, average event size, peak throughput
- **Processing**: real-time analytics, batch processing, event-driven functions
- **Consumers**: number of consumer groups and downstream systems

### Step 2: Choose the right tier

| Feature | Basic | Standard | Premium | Dedicated |
|---------|-------|----------|---------|-----------|
| Consumer groups | 1 | 20 | 100 | 100+ |
| Partitions | 32 | 32 | 100 | 1024 |
| Max retention | 1 day | 7 days | 90 days | 90 days |
| Capture | No | Yes | Yes | Yes |
| Schema Registry | No | Yes | Yes | Yes |
| Kafka support | No | Yes | Yes | Yes |
| VNET/Private Endpoint | No | Yes (PE only) | Yes | Yes |
| Zone redundancy | No | Yes | Yes | Yes |
| Throughput | TU (1-40) | TU (1-40) | PU (1-16) | CU (1-20) |

**Throughput units (TU):** 1 TU = 1 MB/s ingress, 2 MB/s egress, 1000 events/s
**Processing units (PU):** ~5-10 TU equivalent with isolation
**Capacity units (CU):** dedicated cluster capacity

### Step 3: Generate Event Hubs namespace and hub

**Bicep:**
```bicep
param location string = resourceGroup().location
param namespaceName string

resource eventHubNamespace 'Microsoft.EventHub/namespaces@2024-01-01' = {
  name: namespaceName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
    capacity: 2
  }
  properties: {
    isAutoInflateEnabled: true
    maximumThroughputUnits: 10
    zoneRedundant: true
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    disableLocalAuth: true
    kafkaEnabled: true
  }
}

resource eventHub 'Microsoft.EventHub/namespaces/eventhubs@2024-01-01' = {
  parent: eventHubNamespace
  name: 'events'
  properties: {
    partitionCount: 8
    messageRetentionInDays: 7
  }
}

resource consumerGroup 'Microsoft.EventHub/namespaces/eventhubs/consumergroups@2024-01-01' = {
  parent: eventHub
  name: 'analytics-processor'
  properties: {
    userMetadata: 'Consumer group for analytics pipeline'
  }
}

// Authorization rule for specific event hub
resource sendRule 'Microsoft.EventHub/namespaces/eventhubs/authorizationRules@2024-01-01' = {
  parent: eventHub
  name: 'sender'
  properties: {
    rights: ['Send']
  }
}

resource listenRule 'Microsoft.EventHub/namespaces/eventhubs/authorizationRules@2024-01-01' = {
  parent: eventHub
  name: 'listener'
  properties: {
    rights: ['Listen']
  }
}
```

**Terraform:**
```hcl
resource "azurerm_eventhub_namespace" "main" {
  name                          = var.namespace_name
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  sku                           = "Standard"
  capacity                      = 2
  auto_inflate_enabled          = true
  maximum_throughput_units       = 10
  zone_redundant                = true
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false
  local_authentication_enabled  = false

  tags = var.tags
}

resource "azurerm_eventhub" "events" {
  name                = "events"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
  partition_count     = 8
  message_retention   = 7
}

resource "azurerm_eventhub_consumer_group" "analytics" {
  name                = "analytics-processor"
  namespace_name      = azurerm_eventhub_namespace.main.name
  eventhub_name       = azurerm_eventhub.events.name
  resource_group_name = azurerm_resource_group.main.name
  user_metadata       = "Consumer group for analytics pipeline"
}
```

### Step 4: Configure partition strategy

**Choosing partition count:**
- Start with `max(expected_consumers, expected_MB_per_second_ingress)`
- Cannot decrease after creation; can increase (Premium/Dedicated only)
- More partitions = higher parallelism but more ordering complexity

**Partition key strategy:**
```javascript
// Events with same partition key go to same partition (ordering guarantee)
const eventData = {
  body: { orderId: '12345', status: 'shipped' },
  partitionKey: 'customer-789' // All events for this customer are ordered
};

// Round-robin (no partition key) for maximum throughput
const eventData = {
  body: { metric: 'cpu', value: 85.2 }
  // No partitionKey = round-robin distribution
};
```

**Partition key patterns:**
| Pattern | Partition Key | Trade-off |
|---------|--------------|-----------|
| Per-customer ordering | `customerId` | Ordered per customer, may create hot partitions |
| Per-device telemetry | `deviceId` | Ordered per device |
| Geographic | `region` | Low cardinality, risk of imbalance |
| Random (max throughput) | None | No ordering, maximum parallelism |
| Composite | `tenantId-userId` | Higher cardinality, balanced |

### Step 5: Configure Event Hubs Capture

Auto-archive events to Azure Blob Storage or Data Lake:

```bicep
resource eventHubWithCapture 'Microsoft.EventHub/namespaces/eventhubs@2024-01-01' = {
  parent: eventHubNamespace
  name: 'events-captured'
  properties: {
    partitionCount: 8
    messageRetentionInDays: 7
    captureDescription: {
      enabled: true
      encoding: 'Avro'
      intervalInSeconds: 300
      sizeLimitInBytes: 314572800 // 300 MB
      destination: {
        name: 'EventHubArchive.AzureBlockBlob'
        properties: {
          storageAccountResourceId: storageAccountId
          blobContainer: 'event-archive'
          archiveNameFormat: '{Namespace}/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}/{Hour}/{Minute}/{Second}'
        }
      }
      skipEmptyArchives: true
    }
  }
}
```

**Capture to Data Lake Storage Gen2:**
```bicep
captureDescription: {
  enabled: true
  encoding: 'Avro'
  intervalInSeconds: 300
  sizeLimitInBytes: 314572800
  destination: {
    name: 'EventHubArchive.AzureDataLake'
    properties: {
      storageAccountResourceId: dataLakeAccountId
      dataLakeSubscriptionId: subscription().subscriptionId
      dataLakeFolderPath: 'events/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}'
      dataLakeAccountName: dataLakeAccountName
    }
  }
}
```

### Step 6: Configure Schema Registry

```bash
# Create schema group
az eventhubs namespace schema-registry create \
  --namespace-name $NAMESPACE \
  --resource-group $RG \
  --name "order-events" \
  --schema-compatibility "Forward" \
  --schema-type "Avro"
```

**Avro schema example:**
```json
{
  "namespace": "com.myapp.events",
  "type": "record",
  "name": "OrderEvent",
  "fields": [
    { "name": "orderId", "type": "string" },
    { "name": "customerId", "type": "string" },
    { "name": "amount", "type": "double" },
    { "name": "currency", "type": "string", "default": "USD" },
    { "name": "timestamp", "type": "long", "logicalType": "timestamp-millis" }
  ]
}
```

**Schema compatibility modes:**
- **None**: no compatibility checks
- **Backward**: new schema can read old data
- **Forward**: old schema can read new data
- **Full**: both backward and forward compatible

### Step 7: Produce events

**JavaScript (Azure SDK):**
```javascript
const { EventHubProducerClient } = require('@azure/event-hubs');

const producer = new EventHubProducerClient(connectionString, eventHubName);

async function sendEvents(events) {
  const batch = await producer.createBatch();

  for (const event of events) {
    if (!batch.tryAdd({ body: event })) {
      // Batch full, send and create new one
      await producer.sendBatch(batch);
      batch = await producer.createBatch();
      batch.tryAdd({ body: event });
    }
  }

  await producer.sendBatch(batch);
}

// With partition key for ordering
async function sendOrderEvent(order) {
  await producer.sendBatch([{
    body: order,
    properties: { eventType: 'OrderCreated' }
  }], { partitionKey: order.customerId });
}
```

**Kafka producer (compatible with Event Hubs):**
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-producer',
  brokers: ['<namespace>.servicebus.windows.net:9093'],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: '$ConnectionString',
    password: '<event-hubs-connection-string>'
  }
});

const producer = kafka.producer();
await producer.connect();

await producer.send({
  topic: 'events', // Event Hub name
  messages: [
    { key: 'customer-789', value: JSON.stringify({ orderId: '123' }) }
  ]
});
```

### Step 8: Consume events

**Event Processor (reliable consumption with checkpointing):**
```javascript
const { EventHubConsumerClient, CheckpointStore } = require('@azure/event-hubs');
const { BlobCheckpointStore } = require('@azure/eventhubs-checkpointstore-blob');
const { ContainerClient } = require('@azure/storage-blob');

const checkpointStore = new BlobCheckpointStore(
  new ContainerClient(storageConnectionString, 'checkpoints')
);

const consumer = new EventHubConsumerClient(
  'analytics-processor',
  connectionString,
  eventHubName,
  checkpointStore
);

const subscription = consumer.subscribe({
  processEvents: async (events, context) => {
    for (const event of events) {
      console.log(`Partition ${context.partitionId}: ${JSON.stringify(event.body)}`);
    }
    // Checkpoint after processing batch
    await context.updateCheckpoint(events[events.length - 1]);
  },
  processError: async (err, context) => {
    console.error(`Error on partition ${context.partitionId}: ${err.message}`);
  }
});
```

**Azure Functions trigger:**
```javascript
// function.json
{
  "bindings": [
    {
      "type": "eventHubTrigger",
      "name": "events",
      "direction": "in",
      "eventHubName": "events",
      "connection": "EventHubConnection",
      "consumerGroup": "functions-processor",
      "cardinality": "many",
      "dataType": "string"
    }
  ]
}

// index.js
module.exports = async function (context, events) {
  context.log(`Processing ${events.length} events`);
  for (const event of events) {
    const data = JSON.parse(event);
    // Process event
    context.log(`Event: ${data.orderId}`);
  }
};
```

### Step 9: Integrate with Azure Stream Analytics

```sql
-- Stream Analytics query
SELECT
    customerId,
    COUNT(*) AS orderCount,
    SUM(amount) AS totalAmount,
    System.Timestamp() AS windowEnd
INTO [output-blob]
FROM [input-eventhub]
TIMESTAMP BY eventTimestamp
GROUP BY
    customerId,
    TumblingWindow(minute, 5)
HAVING COUNT(*) > 10
```

**Windowing functions:**
- **Tumbling**: fixed, non-overlapping time windows
- **Hopping**: fixed, overlapping windows (hop size < window size)
- **Sliding**: triggered by events, window around each event
- **Session**: groups events by activity periods

### Step 10: Configure geo-disaster recovery

```bicep
resource alias 'Microsoft.EventHub/namespaces/disasterRecoveryConfigs@2024-01-01' = {
  parent: eventHubNamespace
  name: 'dr-alias'
  properties: {
    partnerNamespace: secondaryNamespaceId
  }
}
```

- Metadata replication (namespace config, event hubs, consumer groups)
- Data is NOT replicated (use Capture for data durability)
- Alias DNS name for transparent failover
- Manual failover via Azure portal or CLI

### Step 11: Configure private endpoints and RBAC

**Private endpoint:**
```bicep
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-04-01' = {
  name: '${namespaceName}-pe'
  location: location
  properties: {
    subnet: { id: subnetId }
    privateLinkServiceConnections: [
      {
        name: '${namespaceName}-plsc'
        properties: {
          privateLinkServiceId: eventHubNamespace.id
          groupIds: ['namespace']
        }
      }
    ]
  }
}
```

**RBAC role assignments:**
```bicep
// Azure Event Hubs Data Sender
resource senderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(eventHubNamespace.id, 'sender', principalId)
  scope: eventHub
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',
      '2b629674-e913-4c01-ae53-ef4638d8f975')
    principalId: producerIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Azure Event Hubs Data Receiver
resource receiverRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(eventHubNamespace.id, 'receiver', principalId)
  scope: eventHub
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',
      'a638d3c7-ab3a-418d-83e6-5f17a39d4fde')
    principalId: consumerIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}
```

### Best practices

- **Use Standard or Premium tier**: Basic lacks key features (Kafka, Capture, multiple consumer groups)
- **Enable auto-inflate**: for Standard tier to handle traffic spikes
- **Use Azure AD RBAC**: disable local SAS-based authentication
- **Set partition count thoughtfully**: cannot decrease later; over-partition slightly for growth
- **Use partition keys for ordering**: only when order matters per entity
- **Enable Capture**: for replay, auditing, and Data Lake integration
- **Use Schema Registry**: enforce schema evolution with compatibility checks
- **Checkpoint frequently**: balance between performance and reprocessing on failure
- **Separate consumer groups**: each downstream system gets its own consumer group
- **Use Kafka protocol**: when migrating from or interoperating with Kafka

### Anti-patterns to avoid

- Using a single consumer group for multiple independent consumers
- Setting partition count too low (bottlenecks) or too high (management overhead)
- Not checkpointing frequently enough (causes excessive reprocessing on failure)
- Ignoring back-pressure when consumers fall behind (monitor partition lag)
- Using Basic tier when you need Kafka compatibility or Capture
- Sending events without batching (high overhead per event)
- Using low-cardinality partition keys that create hot partitions
- Relying on geo-DR for data replication (it only replicates metadata)

### Security considerations

- Disable local authentication; use Azure AD RBAC exclusively
- Configure private endpoints; disable public network access
- Use separate authorization rules with minimal rights (Send-only, Listen-only)
- Enable diagnostic logging to Log Analytics
- Encrypt data in transit (TLS 1.2) and at rest (service-managed or CMK)
- Use managed identities for producers and consumers
- Apply network security group rules on VNET-integrated namespaces
- Rotate SAS keys regularly if local auth must remain enabled

### Cost optimization

- Enable auto-inflate to avoid over-provisioning throughput units
- Use Capture to offload long-term storage to cheaper Blob/Data Lake
- Choose appropriate retention (shorter retention = lower cost)
- Use Standard tier unless you need Premium isolation features
- Optimize batch sizes to maximize throughput per TU
- Monitor ingress/egress utilization to right-size TU count
- Consider Premium tier for workloads needing > 40 TU (better cost-per-unit)
- Use Event Hubs Capture with Avro format for efficient compression
- Delete unused consumer groups and event hubs to reduce management overhead
