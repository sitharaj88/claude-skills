# Azure Service Bus

Generate queues, topics, subscriptions, dead-letter handling, sessions, message routing, and retry policies following Azure messaging best practices.

## Usage

```bash
/azure-service-bus <description of your messaging requirements>
```

## What It Does

1. Creates Service Bus namespace configurations with appropriate tier selection and partitioning
2. Generates queue definitions with dead-letter policies, TTL settings, and duplicate detection
3. Produces topic and subscription configurations with SQL and correlation filter rules
4. Configures message sessions for ordered processing and session-based workflows
5. Sets up auto-forwarding chains, scheduled delivery, and message deferral patterns
6. Implements retry policies, connection management, and poison message handling strategies

## Examples

```bash
/azure-service-bus Create a topic with multiple subscriptions using SQL filter rules for order processing

/azure-service-bus Design a dead-letter handling strategy with automatic retry and alerting for failed messages

/azure-service-bus Set up session-enabled queues for ordered message processing in a multi-tenant application
```

## What It Covers

- **Queues** - FIFO delivery, duplicate detection, lock duration, and max delivery count settings
- **Topics & subscriptions** - Fan-out messaging with SQL filters, correlation filters, and action rules
- **Dead-letter queues** - Automatic dead-lettering, manual inspection, and resubmission workflows
- **Sessions** - Ordered message processing, session state management, and session-aware consumers
- **Scheduled messages** - Deferred delivery, message scheduling, and time-based processing patterns
- **Auto-forwarding** - Message chaining across queues and topics for pipeline architectures
- **Connection security** - Shared access policies, managed identity authentication, and private endpoints
- **Monitoring** - Metrics, diagnostic logging, and alerting for queue depth and processing latency

<div class="badge-row">
  <span class="badge">Messaging</span>
  <span class="badge">Queues</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Service Bus configurations and messaging code
- `Write` - Create queue definitions, topic configurations, and connection setups
- `Edit` - Modify existing Service Bus configurations and subscription filters
- `Bash` - Run Azure CLI commands for Service Bus resource management and testing
- `Glob` - Search for messaging-related configuration and infrastructure files
- `Grep` - Find Service Bus connection strings and queue references across the project
