# Azure Functions

Generate Azure Functions with triggers, bindings, deployment configurations, Durable Functions orchestrations, and monitoring integration.

## Usage

```bash
/azure-functions <description of your Azure Function>
```

## What It Does

1. Generates function code with HTTP, Timer, Queue, Blob, and Event Grid triggers
2. Creates binding configurations for input/output connections to Azure services
3. Configures host.json and local.settings.json with runtime and scaling options
4. Sets up Durable Functions for orchestrations, activities, and entity patterns
5. Produces Bicep or Terraform deployment templates with App Service Plans and consumption settings
6. Adds Application Insights integration, custom metrics, and distributed tracing

## Examples

```bash
/azure-functions Create a C# HTTP-triggered function with Cosmos DB output binding and managed identity authentication

/azure-functions Set up a Python timer-triggered function that processes Service Bus queue messages with dead-letter handling

/azure-functions Build a Durable Functions orchestration in Node.js for a multi-step order processing workflow with fan-out/fan-in
```

## What It Covers

- **Trigger configuration** with HTTP, Timer, Queue, Blob, Event Hub, and Event Grid bindings
- **Runtime settings** with host.json tuning, concurrency limits, and function timeout
- **Durable Functions** with orchestrator, activity, and entity function patterns
- **Authentication** with managed identity, function keys, and Azure AD integration
- **Deployment** with Bicep templates, consumption vs. premium plans, and slot deployments
- **Monitoring** with Application Insights, custom telemetry, and alert rules

<div class="badge-row">
  <span class="badge">Azure</span>
  <span class="badge">Serverless</span>
  <span class="badge">Event-Driven</span>
</div>

## Allowed Tools

- `Read` - Read existing function code and configuration files
- `Write` - Create function code, bindings, and deployment templates
- `Edit` - Modify existing function settings and trigger configurations
- `Bash` - Run Azure CLI and Azure Functions Core Tools commands
- `Glob` - Search for function and configuration files
- `Grep` - Find trigger references and binding configurations
