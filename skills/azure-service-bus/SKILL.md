---
name: azure-service-bus
description: Generate Service Bus configs with queues, topics, and messaging patterns
invocation: /azure-service-bus [pattern]
arguments:
  - name: pattern
    description: "Pattern (queue, topic, session, dead-letter)"
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

You are an Azure Service Bus messaging expert. Generate production-ready Service Bus configurations for enterprise messaging patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: queue (point-to-point), topic (pub/sub), session (ordered), dead-letter (error handling)
- **Tier**: Basic (queues only), Standard (queues + topics), Premium (isolation + VNET)
- **Volume**: messages per second, message size (up to 256KB Standard, 100MB Premium)
- **Ordering**: FIFO via sessions or partition-level ordering
- **Processing**: Azure Functions, .NET Worker, Spring Boot, custom consumer

### Step 2: Generate queue configuration

Create Service Bus queue with appropriate settings:

```bicep
resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: 'sb-${appName}-${environment}'
  location: location
  sku: {
    name: 'Standard'  // Basic, Standard, or Premium
    tier: 'Standard'
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true  // Force Entra ID auth
    zoneRedundant: false    // Premium only
  }
}

resource queue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'orders-queue'
  properties: {
    lockDuration: 'PT5M'              // 5 min peek-lock timeout
    maxSizeInMegabytes: 5120          // 5GB max queue size
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    requiresSession: false
    defaultMessageTimeToLive: 'P14D'  // 14 days
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 10
    enableBatchedOperations: true
    autoDeleteOnIdle: 'P10675199DT2H48M5.4775807S'  // Never
    enablePartitioning: false          // Disable for Premium
    forwardTo: ''
    forwardDeadLetteredMessagesTo: ''
  }
}
```

**Queue properties explained:**
- `lockDuration`: How long a message is locked during peek-lock processing (max 5 min)
- `maxDeliveryCount`: Number of delivery attempts before dead-lettering
- `requiresDuplicateDetection`: Enable with `duplicateDetectionHistoryTimeWindow`
- `requiresSession`: Enable for FIFO ordering within session groups
- `deadLetteringOnMessageExpiration`: Move expired messages to DLQ instead of discarding
- `enablePartitioning`: Distribute across message brokers (Standard only, not Premium)
- `forwardTo`: Auto-forward messages to another queue/topic
- `forwardDeadLetteredMessagesTo`: Route DLQ messages to a centralized error queue

### Step 3: Generate topic and subscription configuration

Create topic with subscriptions for fan-out messaging:

```bicep
resource topic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'order-events'
  properties: {
    maxSizeInMegabytes: 5120
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    defaultMessageTimeToLive: 'P7D'
    enableBatchedOperations: true
    supportOrdering: true
    enablePartitioning: false
  }
}

resource subscriptionInventory 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: topic
  name: 'inventory-handler'
  properties: {
    lockDuration: 'PT5M'
    requiresSession: false
    defaultMessageTimeToLive: 'P7D'
    deadLetteringOnMessageExpiration: true
    deadLetteringOnFilterEvaluationExceptions: true
    maxDeliveryCount: 10
    enableBatchedOperations: true
    autoDeleteOnIdle: 'P10675199DT2H48M5.4775807S'
    forwardTo: ''
    forwardDeadLetteredMessagesTo: 'dead-letter-queue'
  }
}

// SQL filter on subscription
resource filterRule 'Microsoft.ServiceBus/namespaces/topics/subscriptions/rules@2022-10-01-preview' = {
  parent: subscriptionInventory
  name: 'inventory-filter'
  properties: {
    filterType: 'SqlFilter'
    sqlFilter: {
      sqlExpression: 'eventType = \'OrderCreated\' AND region = \'us-east\''
    }
    action: {
      sqlExpression: 'SET processed = true'
    }
  }
}

// Correlation filter (more performant than SQL)
resource correlationRule 'Microsoft.ServiceBus/namespaces/topics/subscriptions/rules@2022-10-01-preview' = {
  parent: subscriptionInventory
  name: 'correlation-filter'
  properties: {
    filterType: 'CorrelationFilter'
    correlationFilter: {
      label: 'high-priority'
      properties: {
        eventType: 'OrderCreated'
      }
    }
  }
}
```

### Step 4: Generate sender and receiver code

**Sending messages (.NET):**

```csharp
using Azure.Messaging.ServiceBus;
using Azure.Identity;

// Use managed identity (recommended)
var client = new ServiceBusClient(
    "sb-myapp-prod.servicebus.windows.net",
    new DefaultAzureCredential()
);

var sender = client.CreateSender("orders-queue");

// Single message
var message = new ServiceBusMessage(BinaryData.FromObjectAsJson(order))
{
    ContentType = "application/json",
    MessageId = order.OrderId,           // For duplicate detection
    SessionId = order.CustomerId,        // For session-based ordering
    Subject = "OrderCreated",
    CorrelationId = correlationId,
    TimeToLive = TimeSpan.FromHours(24),
    ApplicationProperties = {
        { "eventType", "OrderCreated" },
        { "priority", "high" },
        { "region", "us-east" }
    }
};
await sender.SendMessageAsync(message);

// Batch sending (recommended for throughput)
using ServiceBusMessageBatch batch = await sender.CreateMessageBatchAsync();
foreach (var order in orders)
{
    if (!batch.TryAddMessage(new ServiceBusMessage(BinaryData.FromObjectAsJson(order))))
    {
        await sender.SendMessagesAsync(batch);
        batch = await sender.CreateMessageBatchAsync();
        batch.TryAddMessage(new ServiceBusMessage(BinaryData.FromObjectAsJson(order)));
    }
}
if (batch.Count > 0)
    await sender.SendMessagesAsync(batch);

// Scheduled message
long sequenceNumber = await sender.ScheduleMessageAsync(
    message, DateTimeOffset.UtcNow.AddMinutes(30));
// Cancel: await sender.CancelScheduledMessageAsync(sequenceNumber);
```

**Receiving messages (.NET):**

```csharp
// Processor-based (recommended for production)
var processor = client.CreateProcessor("orders-queue", new ServiceBusProcessorOptions
{
    AutoCompleteMessages = false,
    MaxConcurrentCalls = 10,
    PrefetchCount = 20,
    ReceiveMode = ServiceBusReceiveMode.PeekLock,
    MaxAutoLockRenewalDuration = TimeSpan.FromMinutes(30)
});

processor.ProcessMessageAsync += async (args) =>
{
    var order = args.Message.Body.ToObjectFromJson<Order>();
    try
    {
        await ProcessOrderAsync(order);
        await args.CompleteMessageAsync(args.Message);
    }
    catch (TransientException)
    {
        // Will be retried (up to maxDeliveryCount)
        await args.AbandonMessageAsync(args.Message);
    }
    catch (PoisonMessageException)
    {
        // Send to dead-letter with reason
        await args.DeadLetterMessageAsync(args.Message,
            deadLetterReason: "ProcessingFailed",
            deadLetterErrorDescription: "Invalid order format");
    }
};

processor.ProcessErrorAsync += async (args) =>
{
    logger.LogError(args.Exception, "Message processing error: {Source}", args.ErrorSource);
};

await processor.StartProcessingAsync();
```

**Session receiver (ordered processing):**

```csharp
var sessionProcessor = client.CreateSessionProcessor("session-queue",
    new ServiceBusSessionProcessorOptions
    {
        AutoCompleteMessages = false,
        MaxConcurrentSessions = 5,
        SessionIdleTimeout = TimeSpan.FromMinutes(5)
    });

sessionProcessor.ProcessMessageAsync += async (args) =>
{
    var sessionState = await args.GetSessionStateAsync();
    // Process in order within the session
    await args.CompleteMessageAsync(args.Message);
    await args.SetSessionStateAsync(updatedState);
};
```

### Step 5: Generate Azure Functions binding

```csharp
// Service Bus trigger function
[Function("ProcessOrder")]
public async Task Run(
    [ServiceBusTrigger("orders-queue", Connection = "ServiceBusConnection",
        AutoCompleteMessages = false,
        IsSessionsEnabled = false)]
    ServiceBusReceivedMessage message,
    ServiceBusMessageActions messageActions)
{
    var order = message.Body.ToObjectFromJson<Order>();

    try
    {
        await _orderService.ProcessAsync(order);
        await messageActions.CompleteMessageAsync(message);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to process order {OrderId}", order.Id);
        await messageActions.AbandonMessageAsync(message);
    }
}

// Topic subscription trigger
[Function("HandleOrderEvent")]
public async Task Run(
    [ServiceBusTrigger("order-events", "inventory-handler",
        Connection = "ServiceBusConnection")]
    ServiceBusReceivedMessage message,
    ServiceBusMessageActions messageActions)
{
    // Process topic message
}

// Output binding for sending
[Function("CreateOrder")]
[ServiceBusOutput("orders-queue", Connection = "ServiceBusConnection")]
public ServiceBusMessage Run(
    [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req)
{
    var order = req.ReadFromJsonAsync<Order>().Result;
    return new ServiceBusMessage(BinaryData.FromObjectAsJson(order))
    {
        MessageId = order.Id,
        Subject = "OrderCreated"
    };
}
```

### Step 6: Generate dead-letter queue handler

```csharp
// DLQ processor
[Function("ProcessDeadLetters")]
public async Task Run(
    [ServiceBusTrigger("orders-queue/$DeadLetterQueue",
        Connection = "ServiceBusConnection")]
    ServiceBusReceivedMessage message)
{
    var dlqReason = message.DeadLetterReason;
    var dlqDescription = message.DeadLetterErrorDescription;
    var deliveryCount = message.DeliveryCount;

    _logger.LogWarning("DLQ message: {Reason} - {Description}, Attempts: {Count}",
        dlqReason, dlqDescription, deliveryCount);

    // Store for investigation
    await _deadLetterStore.SaveAsync(new DeadLetterRecord
    {
        MessageId = message.MessageId,
        Body = message.Body.ToString(),
        Reason = dlqReason,
        Description = dlqDescription,
        EnqueuedTime = message.EnqueuedTime,
        DeliveryCount = deliveryCount,
        Properties = message.ApplicationProperties
    });

    // Alert on-call if high-priority
    if (message.ApplicationProperties.TryGetValue("priority", out var priority)
        && priority.ToString() == "high")
    {
        await _alertService.NotifyAsync($"High-priority DLQ: {dlqReason}");
    }
}
```

### Step 7: Generate Terraform configuration

```hcl
resource "azurerm_servicebus_namespace" "main" {
  name                          = "sb-${var.app_name}-${var.environment}"
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  sku                           = "Premium"     # Basic, Standard, Premium
  capacity                      = 1             # Premium: 1, 2, 4, 8, 16 messaging units
  premium_messaging_partitions  = 1
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false
  local_auth_enabled            = false
  zone_redundant                = true          # Premium only

  network_rule_set {
    default_action                = "Deny"
    public_network_access_enabled = false
    trusted_services_allowed      = true

    network_rules {
      subnet_id                            = azurerm_subnet.servicebus.id
      ignore_missing_vnet_service_endpoint = false
    }
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.common_tags
}

resource "azurerm_servicebus_queue" "orders" {
  name         = "orders-queue"
  namespace_id = azurerm_servicebus_namespace.main.id

  lock_duration                           = "PT5M"
  max_size_in_megabytes                   = 5120
  requires_duplicate_detection            = true
  duplicate_detection_history_time_window = "PT10M"
  requires_session                        = false
  default_message_ttl                     = "P14D"
  dead_lettering_on_message_expiration    = true
  max_delivery_count                      = 10
  enable_batched_operations               = true
  enable_partitioning                     = false
  forward_dead_lettered_messages_to       = azurerm_servicebus_queue.dead_letter.name
}

resource "azurerm_servicebus_topic" "order_events" {
  name         = "order-events"
  namespace_id = azurerm_servicebus_namespace.main.id

  max_size_in_megabytes                   = 5120
  requires_duplicate_detection            = true
  duplicate_detection_history_time_window = "PT10M"
  default_message_ttl                     = "P7D"
  support_ordering                        = true
  enable_batched_operations               = true
}

resource "azurerm_servicebus_subscription" "inventory" {
  name     = "inventory-handler"
  topic_id = azurerm_servicebus_topic.order_events.id

  lock_duration                              = "PT5M"
  max_delivery_count                         = 10
  default_message_ttl                        = "P7D"
  dead_lettering_on_message_expiration       = true
  dead_lettering_on_filter_evaluation_error  = true
  enable_batched_operations                  = true
  forward_dead_lettered_messages_to          = azurerm_servicebus_queue.dead_letter.name
}

resource "azurerm_servicebus_subscription_rule" "inventory_filter" {
  name            = "inventory-filter"
  subscription_id = azurerm_servicebus_subscription.inventory.id
  filter_type     = "SqlFilter"
  sql_filter      = "eventType = 'OrderCreated' AND region = 'us-east'"

  action = "SET processed = true"
}

# RBAC role assignment for managed identity
resource "azurerm_role_assignment" "servicebus_sender" {
  scope                = azurerm_servicebus_namespace.main.id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = azurerm_linux_function_app.main.identity[0].principal_id
}

resource "azurerm_role_assignment" "servicebus_receiver" {
  scope                = azurerm_servicebus_namespace.main.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = azurerm_linux_function_app.main.identity[0].principal_id
}
```

### Step 8: Monitoring and diagnostics

```bicep
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'sb-diagnostics'
  scope: serviceBusNamespace
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      { categoryGroup: 'allLogs', enabled: true }
    ]
    metrics: [
      { category: 'AllMetrics', enabled: true }
    ]
  }
}
```

**Key metrics to monitor:**
- `ActiveMessages` - Messages waiting to be processed
- `DeadLetteredMessages` - Messages in DLQ (alert on > 0)
- `ScheduledMessages` - Pending scheduled messages
- `IncomingMessages` / `OutgoingMessages` - Throughput
- `ServerErrors` - Service-side errors
- `ThrottledRequests` - Rate limiting (upgrade tier)
- `Size` - Namespace size utilization
- `CPUXNS` / `WSXNS` - Premium tier CPU/memory (scale messaging units)

### Receive modes: peek-lock vs receive-and-delete

| Mode | Use Case | Behavior |
|------|----------|----------|
| **PeekLock** | At-least-once processing | Message locked, must complete/abandon/dead-letter |
| **ReceiveAndDelete** | At-most-once, fire-and-forget | Message deleted on receive, no recovery |

Always use PeekLock for critical workloads. ReceiveAndDelete only for telemetry or non-critical data.

### Comparison: Service Bus vs Event Hubs vs Storage Queues

| Feature | Service Bus | Event Hubs | Storage Queues |
|---------|------------|------------|----------------|
| Pattern | Enterprise messaging | Event streaming | Simple queue |
| Ordering | Sessions / FIFO | Per partition | No guarantee |
| Throughput | Moderate (Premium: high) | Very high (millions/s) | Low-moderate |
| Max message size | 256KB (Std), 100MB (Prem) | 1MB | 64KB |
| Retention | Up to 14 days | Up to 90 days | 7 days |
| DLQ | Built-in | No | No |
| Transactions | Yes | No | No |
| Price | Higher | Lower per event | Lowest |

### Best practices

- **Use managed identity** - Disable local auth (`disableLocalAuth: true`) and use RBAC roles
- **Always configure dead-letter queues** - Monitor and process DLQ messages
- **Set appropriate lock duration** - Match to your processing time plus buffer
- **Use message batching** - `CreateMessageBatchAsync()` for throughput
- **Enable duplicate detection** - Set `requiresDuplicateDetection` with appropriate time window
- **Use sessions for ordering** - Group related messages with `SessionId`
- **Use correlation filters over SQL filters** - Better performance for simple matching
- **Prefer Premium tier for production** - VNET isolation, predictable performance, zone redundancy
- **Auto-forward for topology** - Chain queues/topics for complex routing
- **Use transactions** - Group send/complete operations when needed

### Anti-patterns

- **Using ReceiveAndDelete for critical messages** - Use PeekLock instead
- **Long lock durations without renewal** - Configure `MaxAutoLockRenewalDuration`
- **Ignoring dead-letter queues** - Always monitor and alert on DLQ depth
- **Using large messages without compression** - Compress payloads or use claim-check pattern with Blob Storage
- **Not setting MaxDeliveryCount** - Poison messages will loop indefinitely
- **Single queue for all message types** - Use topics with subscriptions for routing
- **Polling without long-poll/AMQP** - Use AMQP for push-based receive

### Security considerations

- Disable SAS keys and use Entra ID authentication with RBAC
- Use private endpoints for VNET-integrated workloads
- Enable TLS 1.2 minimum
- Use customer-managed keys (CMK) for encryption at rest (Premium)
- Apply network rules to restrict access
- Audit access with diagnostic logs sent to Log Analytics
- Use `Azure Service Bus Data Sender` and `Azure Service Bus Data Receiver` roles (least privilege)

### Cost optimization

- **Right-size the tier**: Use Basic for simple queues, Standard for topics, Premium only when isolation is needed
- **Premium messaging units**: Start with 1 MU and scale up based on CPU/memory metrics
- **Batch operations**: Reduce API call costs with message batching
- **Set TTL on messages**: Avoid accumulating unconsumed messages
- **Auto-delete idle entities**: Clean up unused queues/subscriptions
- **Use partitioning (Standard)**: Better throughput without Premium pricing
- **Monitor throttling**: If throttled on Standard, consider Premium for predictable cost
