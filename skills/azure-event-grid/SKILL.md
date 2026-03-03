---
name: azure-event-grid
description: Generate Event Grid configs with topics, subscriptions, and event-driven architectures
invocation: /azure-event-grid [source] [destination]
arguments:
  - name: source
    description: "Event source (blob, resource-group, custom, partner)"
    required: false
  - name: destination
    description: "Handler (function, webhook, service-bus, event-hub, queue)"
    required: false
allowed_tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
---

## Instructions

You are an Azure Event Grid expert. Generate production-ready event-driven configurations for reactive architectures.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Source**: Azure resource events (Blob, Resource Group), custom topic, partner topic, Event Grid Namespace
- **Destination**: Azure Functions, webhook, Service Bus, Event Hubs, Storage Queue, Relay Hybrid Connections
- **Schema**: Event Grid schema, CloudEvents v1.0, custom input schema
- **Delivery**: Push (event subscriptions) or pull (Event Grid Namespaces)
- **Filtering**: Event type, subject prefix/suffix, advanced filters

### Step 2: Generate system topic (Azure resource events)

System topics are automatically created for Azure resource events:

```bicep
resource systemTopic 'Microsoft.EventGrid/systemTopics@2023-12-15-preview' = {
  name: 'evgt-blob-${appName}-${environment}'
  location: location
  properties: {
    source: storageAccount.id
    topicType: 'Microsoft.Storage.StorageAccounts'
  }
  identity: {
    type: 'SystemAssigned'
  }
  tags: commonTags
}

resource blobEventSubscription 'Microsoft.EventGrid/systemTopics/eventSubscriptions@2023-12-15-preview' = {
  parent: systemTopic
  name: 'blob-created-handler'
  properties: {
    destination: {
      endpointType: 'AzureFunction'
      properties: {
        resourceId: functionApp.id
        maxEventsPerBatch: 1
        preferredBatchSizeInKilobytes: 64
      }
    }
    filter: {
      includedEventTypes: [
        'Microsoft.Storage.BlobCreated'
      ]
      subjectBeginsWith: '/blobServices/default/containers/uploads/'
      subjectEndsWith: '.pdf'
      isSubjectCaseSensitive: false
      advancedFilters: [
        {
          operatorType: 'NumberGreaterThan'
          key: 'data.contentLength'
          value: 0
        }
        {
          operatorType: 'StringNotContains'
          key: 'subject'
          values: [ 'temp', 'staging' ]
        }
      ]
    }
    retryPolicy: {
      maxDeliveryAttempts: 30
      eventTimeToLiveInMinutes: 1440  // 24 hours
    }
    deadLetterDestination: {
      endpointType: 'StorageBlob'
      properties: {
        resourceId: deadLetterStorage.id
        blobContainerName: 'dead-letters'
      }
    }
    eventDeliverySchema: 'CloudEventSchemaV1_0'
  }
}
```

**Common Azure resource event sources:**
- `Microsoft.Storage.StorageAccounts` - Blob created/deleted
- `Microsoft.Resources.ResourceGroups` - Resource write/delete/action
- `Microsoft.Resources.Subscriptions` - Subscription-level events
- `Microsoft.KeyVault.Vaults` - Secret/certificate/key events
- `Microsoft.ContainerRegistry.Registries` - Image push/delete/quarantine
- `Microsoft.EventHub.Namespaces` - Capture file created
- `Microsoft.ServiceBus.Namespaces` - Active messages available
- `Microsoft.AppConfiguration.ConfigurationStores` - Key-value modified
- `Microsoft.SignalRService.SignalR` - Client connection events
- `Microsoft.Communication.CommunicationServices` - SMS/email events

### Step 3: Generate custom topic

For application-defined events:

```bicep
resource customTopic 'Microsoft.EventGrid/topics@2023-12-15-preview' = {
  name: 'evgt-orders-${appName}-${environment}'
  location: location
  properties: {
    inputSchema: 'CloudEventSchemaV1_0'
    publicNetworkAccess: 'Disabled'
    disableLocalAuth: true           // Force Entra ID auth
    minimumTlsVersionAllowed: '1.2'
    dataResidencyBoundary: 'WithinGeopair'
  }
  identity: {
    type: 'SystemAssigned'
  }
  tags: commonTags
}

// Private endpoint for custom topic
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-evgt-orders'
  location: location
  properties: {
    subnet: {
      id: privateEndpointSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: 'evgt-connection'
        properties: {
          privateLinkServiceId: customTopic.id
          groupIds: [ 'topic' ]
        }
      }
    ]
  }
}
```

### Step 4: Generate event domain (multi-tenant)

For multi-tenant or multi-department event routing:

```bicep
resource eventDomain 'Microsoft.EventGrid/domains@2023-12-15-preview' = {
  name: 'evgd-${appName}-${environment}'
  location: location
  properties: {
    inputSchema: 'CloudEventSchemaV1_0'
    publicNetworkAccess: 'Disabled'
    disableLocalAuth: true
    autoCreateTopicWithFirstSubscription: true
    autoDeleteTopicWithLastSubscription: true
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Domain topic for each tenant
resource tenantTopic 'Microsoft.EventGrid/domains/topics@2023-12-15-preview' = {
  parent: eventDomain
  name: 'tenant-${tenantId}'
}
```

### Step 5: Generate Event Grid Namespace (MQTT and pull delivery)

Event Grid Namespaces provide MQTT broker and pull-based delivery:

```bicep
resource eventGridNamespace 'Microsoft.EventGrid/namespaces@2023-12-15-preview' = {
  name: 'egns-${appName}-${environment}'
  location: location
  sku: {
    name: 'Standard'
    capacity: 1  // Throughput units
  }
  properties: {
    publicNetworkAccess: 'Disabled'
    topicSpacesConfiguration: {
      state: 'Enabled'
      maximumSessionExpiryInHours: 8
      maximumClientSessionsPerAuthenticationName: 5
      routeTopicResourceId: namespaceTopic.id  // Route MQTT to namespace topic
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Namespace topic for pull delivery
resource namespaceTopic 'Microsoft.EventGrid/namespaces/topics@2023-12-15-preview' = {
  parent: eventGridNamespace
  name: 'orders'
  properties: {
    publisherType: 'Custom'
    inputSchema: 'CloudEventSchemaV1_0'
    eventRetentionInDays: 7
  }
}

// Namespace topic subscription for pull delivery
resource namespaceSubscription 'Microsoft.EventGrid/namespaces/topics/eventSubscriptions@2023-12-15-preview' = {
  parent: namespaceTopic
  name: 'order-processor'
  properties: {
    deliveryConfiguration: {
      deliveryMode: 'Queue'
      queue: {
        receiveLockDurationInSeconds: 300
        maxDeliveryCount: 10
        eventTimeToLive: 'P7D'
      }
    }
    filtersConfiguration: {
      includedEventTypes: [ 'OrderCreated', 'OrderUpdated' ]
    }
  }
}
```

### Step 6: Generate publisher code

**Publishing to custom topic (.NET):**

```csharp
using Azure.Messaging.EventGrid;
using Azure.Identity;
using CloudNative.CloudEvents;

// CloudEvents schema (recommended)
var client = new EventGridPublisherClient(
    new Uri("https://evgt-orders-myapp-prod.eastus-1.eventgrid.azure.net/api/events"),
    new DefaultAzureCredential()
);

var cloudEvent = new CloudEvent(
    source: "/myapp/orders",
    type: "OrderCreated",
    jsonSerializableData: new
    {
        orderId = "ORD-12345",
        customerId = "CUST-789",
        total = 99.99,
        items = new[] { new { sku = "ITEM-001", qty = 2 } }
    })
{
    Id = Guid.NewGuid().ToString(),
    Subject = $"orders/{orderId}",
    Time = DateTimeOffset.UtcNow
};

await client.SendEventAsync(cloudEvent);

// Batch publishing
var events = orders.Select(o => new CloudEvent(
    source: "/myapp/orders",
    type: "OrderCreated",
    jsonSerializableData: o
)).ToList();

await client.SendEventsAsync(events);
```

**Publishing to event domain:**

```csharp
// Each event routed to domain topic via the "source" attribute
var events = tenantOrders.Select(o => new CloudEvent(
    source: $"/tenants/{o.TenantId}",
    type: "OrderCreated",
    jsonSerializableData: o
)
{
    // The topic property routes to the domain topic
    ExtensionAttributes = { ["topic"] = $"tenant-{o.TenantId}" }
}).ToList();

await domainClient.SendEventsAsync(events);
```

### Step 7: Generate subscriber/handler code

**Azure Functions Event Grid trigger:**

```csharp
// CloudEvents schema trigger
[Function("HandleBlobCreated")]
public async Task Run(
    [EventGridTrigger] CloudEvent cloudEvent)
{
    var blobData = cloudEvent.Data.ToObjectFromJson<StorageBlobCreatedEventData>();

    _logger.LogInformation("Blob created: {Url}, Size: {Size}",
        blobData.Url, blobData.ContentLength);

    await _processor.ProcessBlobAsync(blobData.Url);
}

// Webhook handler with validation
[Function("WebhookHandler")]
public async Task<HttpResponseData> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options")] HttpRequestData req)
{
    // Handle Event Grid validation handshake
    if (req.Headers.TryGetValues("aeg-event-type", out var eventTypeValues)
        && eventTypeValues.First() == "SubscriptionValidation")
    {
        var events = await req.ReadFromJsonAsync<EventGridEvent[]>();
        var validationEvent = events[0].Data.ToObjectFromJson<SubscriptionValidationEventData>();
        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new { validationResponse = validationEvent.ValidationCode });
        return response;
    }

    // Process actual events
    var cloudEvents = await req.ReadFromJsonAsync<CloudEvent[]>();
    foreach (var ce in cloudEvents)
    {
        await _handler.HandleAsync(ce);
    }

    return req.CreateResponse(HttpStatusCode.OK);
}
```

**Pull delivery consumer (Event Grid Namespaces):**

```csharp
var client = new EventGridReceiverClient(
    new Uri("https://egns-myapp-prod.eastus-1.eventgrid.azure.net"),
    "orders",
    "order-processor",
    new DefaultAzureCredential()
);

while (!cancellationToken.IsCancellationRequested)
{
    ReceiveResult result = await client.ReceiveAsync(
        maxEvents: 10,
        maxWaitTime: TimeSpan.FromSeconds(30),
        cancellationToken);

    var ackTokens = new List<string>();
    var releaseTokens = new List<string>();

    foreach (var detail in result.Details)
    {
        try
        {
            await ProcessEventAsync(detail.Event);
            ackTokens.Add(detail.BrokerProperties.LockToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process event {Id}", detail.Event.Id);
            releaseTokens.Add(detail.BrokerProperties.LockToken);
        }
    }

    if (ackTokens.Any())
        await client.AcknowledgeAsync(ackTokens);
    if (releaseTokens.Any())
        await client.ReleaseAsync(releaseTokens);
}
```

### Step 8: Generate Terraform configuration

```hcl
resource "azurerm_eventgrid_system_topic" "blob_events" {
  name                   = "evgt-blob-${var.app_name}-${var.environment}"
  location               = azurerm_resource_group.main.location
  resource_group_name    = azurerm_resource_group.main.name
  source_arm_resource_id = azurerm_storage_account.main.id
  topic_type             = "Microsoft.Storage.StorageAccounts"

  identity {
    type = "SystemAssigned"
  }

  tags = var.common_tags
}

resource "azurerm_eventgrid_system_topic_event_subscription" "blob_created" {
  name                = "blob-created-handler"
  system_topic        = azurerm_eventgrid_system_topic.blob_events.name
  resource_group_name = azurerm_resource_group.main.name

  azure_function_endpoint {
    function_id                       = "${azurerm_linux_function_app.main.id}/functions/HandleBlobCreated"
    max_events_per_batch              = 1
    preferred_batch_size_in_kilobytes = 64
  }

  included_event_types = [
    "Microsoft.Storage.BlobCreated"
  ]

  subject_filter {
    subject_begins_with = "/blobServices/default/containers/uploads/"
    subject_ends_with   = ".pdf"
    case_sensitive      = false
  }

  advanced_filter {
    number_greater_than {
      key   = "data.contentLength"
      value = 0
    }
  }

  retry_policy {
    max_delivery_attempts = 30
    event_time_to_live    = 1440
  }

  storage_blob_dead_letter_destination {
    storage_account_id          = azurerm_storage_account.dead_letter.id
    storage_blob_container_name = "dead-letters"
  }

  event_delivery_schema = "CloudEventSchemaV1_0"
}

resource "azurerm_eventgrid_topic" "custom" {
  name                          = "evgt-orders-${var.app_name}-${var.environment}"
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  input_schema                  = "CloudEventSchemaV1_0"
  public_network_access_enabled = false
  local_auth_enabled            = false

  identity {
    type = "SystemAssigned"
  }

  tags = var.common_tags
}

resource "azurerm_eventgrid_event_subscription" "custom_handler" {
  name  = "order-handler"
  scope = azurerm_eventgrid_topic.custom.id

  service_bus_queue_endpoint_id = azurerm_servicebus_queue.orders.id

  included_event_types = ["OrderCreated", "OrderUpdated"]

  subject_filter {
    subject_begins_with = "orders/"
  }

  delivery_identity {
    type = "SystemAssigned"
  }

  dead_letter_identity {
    type = "SystemAssigned"
  }
}

# RBAC for Event Grid publisher
resource "azurerm_role_assignment" "eventgrid_sender" {
  scope                = azurerm_eventgrid_topic.custom.id
  role_definition_name = "EventGrid Data Sender"
  principal_id         = azurerm_linux_function_app.main.identity[0].principal_id
}
```

### Event filtering reference

**Filter types:**
| Filter | Example | Description |
|--------|---------|-------------|
| Event type | `Microsoft.Storage.BlobCreated` | Filter by event type |
| Subject prefix | `/blobServices/default/containers/uploads/` | Subject starts with |
| Subject suffix | `.pdf` | Subject ends with |
| Advanced: NumberIn | `data.quantity` in `[1, 5, 10]` | Numeric set membership |
| Advanced: StringContains | `subject` contains `important` | String partial match |
| Advanced: IsNotNull | `data.metadata` | Field exists check |
| Advanced: BoolEquals | `data.isProcessed` = false | Boolean match |

**Advanced filter limits:** Up to 25 advanced filters per subscription, up to 5 values per filter.

### Best practices

- **Use CloudEvents schema** - Industry standard, portable across platforms
- **Configure dead-letter destination** - Always capture failed deliveries for investigation
- **Set appropriate retry policies** - Max 30 attempts, exponential backoff with 24h TTL
- **Use managed identity for delivery** - Enable system-assigned identity on topics for secure delivery
- **Use event domains for multi-tenant** - Avoid creating hundreds of individual topics
- **Filter at the subscription level** - Reduce unnecessary handler invocations and cost
- **Validate webhook endpoints** - Implement validation handshake for secure webhook delivery
- **Use private endpoints** - Restrict topic access to VNET for production workloads
- **Consider Event Grid Namespaces** - Use pull delivery for consumers that need control over consumption rate
- **Set subject patterns** - Use hierarchical subjects (`/dept/team/resource`) for flexible filtering

### Anti-patterns

- **Publishing events without idempotent handlers** - Events may be delivered more than once
- **Using Event Grid for high-throughput streaming** - Use Event Hubs instead (millions/s)
- **Creating individual topics per tenant** - Use event domains for multi-tenant scenarios
- **Not configuring dead-letter storage** - Failed events are silently dropped after retries
- **Using Event Grid schema for new projects** - Prefer CloudEvents for portability
- **Hardcoding webhook URLs** - Use managed identity delivery to Azure services
- **Ignoring event ordering** - Event Grid does not guarantee ordering; design handlers accordingly

### Security considerations

- Disable local authentication (`disableLocalAuth: true`) and use Entra ID with RBAC
- Use private endpoints for custom topics and system topics
- Validate webhook endpoints with the Event Grid validation handshake
- Use managed identity for event delivery to downstream services
- Configure network rules and IP filtering
- Enable diagnostic logging for audit trails
- Use `EventGrid Data Sender` and `EventGrid Contributor` roles (least privilege)
- Set `dataResidencyBoundary` for compliance requirements

### Cost optimization

- **Filter aggressively** - Every delivered event costs money; filter at subscription level
- **Batch publishing** - Reduce HTTP overhead by sending events in batches
- **Use system topics** - No additional cost for system topic creation (pay per event only)
- **Review event volume** - Monitor and optimize high-volume publishers
- **Dead-letter to cheap storage** - Use Blob Storage for dead-letter (cheapest option)
- **Right-size Event Grid Namespaces** - Scale throughput units based on actual consumption
- **Free tier**: First 100,000 operations/month are free for custom topics
