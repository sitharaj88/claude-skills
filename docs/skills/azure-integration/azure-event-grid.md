# Azure Event Grid

Generate event subscriptions, custom topics, domain routing, dead-letter destinations, filtering rules, and event-driven architectures following Azure eventing best practices.

## Usage

```bash
/azure-event-grid <description of your event-driven requirements>
```

## What It Does

1. Creates custom topics and system topic subscriptions with appropriate event schema configurations
2. Generates event subscription filters using subject-based, advanced, and event type filtering
3. Produces event domain configurations for multi-tenant event routing and partitioning
4. Configures dead-letter destinations with blob storage and retry policies for failed deliveries
5. Sets up webhook, Azure Function, Service Bus, and Event Hub endpoint integrations
6. Implements CloudEvents schema mappings, input transformations, and delivery retry schedules

## Examples

```bash
/azure-event-grid Create a custom topic with filtered subscriptions routing events to Azure Functions and Service Bus

/azure-event-grid Design an event domain for multi-tenant SaaS with per-tenant topic partitioning and dead-lettering

/azure-event-grid Set up system topic subscriptions for blob storage events with subject prefix filtering
```

## What It Covers

- **Custom topics** - Topic creation, access keys, input schema mapping, and endpoint configuration
- **System topics** - Azure resource event subscriptions for Storage, Key Vault, and App Service
- **Event domains** - Multi-tenant event routing with domain topics and per-tenant subscriptions
- **Filtering** - Subject-based filters, advanced filters with operators, and event type selection
- **Dead-lettering** - Blob storage destinations for failed events with expiration policies
- **Delivery retry** - Exponential backoff, max delivery attempts, and event time-to-live settings
- **Endpoints** - Webhook, Azure Functions, Service Bus, Event Hubs, and Storage Queue destinations
- **CloudEvents** - CloudEvents v1.0 schema support with input mapping and output transformations

<div class="badge-row">
  <span class="badge">Events</span>
  <span class="badge">Routing</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Event Grid configurations and event handler code
- `Write` - Create topic definitions, subscription filters, and event schema mappings
- `Edit` - Modify existing Event Grid subscriptions and filtering rules
- `Bash` - Run Azure CLI commands for Event Grid resource management and event publishing
- `Glob` - Search for event-related configuration and infrastructure files
- `Grep` - Find event subscription references and topic endpoints across the project
