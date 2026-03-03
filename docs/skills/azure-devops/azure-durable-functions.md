# Durable Functions

Generate Durable Functions orchestrations with fan-out/fan-in, function chaining, human interaction patterns, and durable entities.

## Usage

```bash
/azure-durable-functions <description of your orchestration>
```

## What It Does

1. Generates orchestrator functions with activity chaining, fan-out/fan-in, and sub-orchestrations
2. Creates durable entity functions for stateful singleton patterns and actor models
3. Configures human interaction workflows with external events, timeouts, and approval gates
4. Sets up monitor patterns with polling intervals, expiration, and retry policies
5. Implements durable HTTP APIs with long-running operation management and status endpoints
6. Integrates Azure Storage, Event Grid, and Service Bus bindings for event-driven triggers

## Examples

```bash
/azure-durable-functions Create an order processing orchestration with inventory check, payment, shipping, and notification activities

/azure-durable-functions Set up an approval workflow with external event waiting, timeout escalation, and Teams notification

/azure-durable-functions Build a fan-out/fan-in pipeline that processes images in parallel with progress tracking and error handling
```

## What It Covers

- **Orchestrator functions** - Deterministic orchestrations with replay-safe code patterns
- **Activity functions** - Stateless activity implementations with input/output serialization
- **Function chaining** - Sequential activity execution with error propagation and retries
- **Fan-out/fan-in** - Parallel activity execution with result aggregation and task lists
- **Human interaction** - External event waiting, approval patterns, and timeout handling
- **Monitor pattern** - Polling loops with configurable intervals and expiration
- **Durable entities** - Stateful entity definitions with signal and call operations
- **Sub-orchestrations** - Nested orchestration composition and versioning strategies
- **Error handling** - Retry policies, circuit breakers, and compensation logic
- **Deployment** - Azure Functions host configuration, task hub settings, and scaling

<div class="badge-row">
  <span class="badge">Orchestration</span>
  <span class="badge">Serverless</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing function code, orchestrations, and host configurations
- `Write` - Create orchestrator functions, activities, and entity definitions
- `Edit` - Modify existing function implementations and configurations
- `Bash` - Run func, az functionapp, and az storage CLI commands
- `Glob` - Search for function files, host.json, and local.settings.json
- `Grep` - Find orchestration triggers, activity references, and entity signals
