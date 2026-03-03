# Azure Container Apps

Generate Container Apps environments with Dapr integration, scaling rules, revision management, ingress configurations, and job scheduling.

## Usage

```bash
/azure-container-apps <description of your Container App>
```

## What It Does

1. Generates Container App configurations with container images, resource limits, and environment variables
2. Creates managed environment setups with Log Analytics, virtual network injection, and workload profiles
3. Configures KEDA-based scaling rules for HTTP, queue, cron, and custom metric triggers
4. Sets up Dapr components for service invocation, state management, and pub/sub messaging
5. Produces Bicep or Terraform deployment templates with revision management and traffic splitting
6. Adds ingress configurations with custom domains, mTLS, and session affinity

## Examples

```bash
/azure-container-apps Create a Python FastAPI service with Service Bus queue scaling and Dapr state store backed by Cosmos DB

/azure-container-apps Set up a multi-container app with traffic splitting 80/20 between revisions and a custom health probe

/azure-container-apps Build a scheduled job that processes blob storage files nightly with managed identity and VNet integration
```

## What It Covers

- **Container configuration** with images, resource limits, probes, and environment variables
- **Scaling rules** with HTTP concurrency, KEDA scalers, and minimum/maximum replicas
- **Dapr integration** with service invocation, pub/sub, state management, and bindings
- **Traffic management** with revision labels, traffic splitting, and rollback strategies
- **Networking** with VNet injection, custom domains, IP restrictions, and mTLS
- **Jobs** with scheduled, event-driven, and manual trigger execution modes

<div class="badge-row">
  <span class="badge">Azure</span>
  <span class="badge">Serverless</span>
  <span class="badge">Containers</span>
</div>

## Allowed Tools

- `Read` - Read existing container app and environment configurations
- `Write` - Create container app manifests, Dapr components, and deployment templates
- `Edit` - Modify existing container app settings and scaling rules
- `Bash` - Run Azure CLI commands for deployment and revision management
- `Glob` - Search for container and Dapr configuration files
- `Grep` - Find container app references and environment configurations
