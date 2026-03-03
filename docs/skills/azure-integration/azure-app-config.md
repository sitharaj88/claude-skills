# Azure App Configuration

Generate feature flags, configuration stores, key-value management, labeling strategies, refresh policies, and sentinel key patterns following Azure App Configuration best practices.

## Usage

```bash
/azure-app-config <description of your configuration management requirements>
```

## What It Does

1. Creates App Configuration store setups with appropriate tier selection and geo-replication settings
2. Generates feature flag definitions with targeting filters, time windows, and percentage rollouts
3. Produces key-value configurations with labels, content types, and Key Vault secret references
4. Configures dynamic configuration refresh with sentinel keys and polling interval strategies
5. Sets up configuration snapshots for point-in-time rollback and environment promotion workflows
6. Implements provider integration with .NET, Java, JavaScript, and Python SDK configurations

## Examples

```bash
/azure-app-config Create feature flags with percentage-based rollout and user targeting for a new checkout flow

/azure-app-config Design a labeling strategy with environment-specific overrides and Key Vault references for secrets

/azure-app-config Set up dynamic configuration refresh with sentinel keys and ASP.NET Core middleware integration
```

## What It Covers

- **Key-value pairs** - Hierarchical keys, labels, content types, and JSON value configurations
- **Feature flags** - Boolean flags, targeting filters, time windows, and custom filter handlers
- **Labels** - Environment-based labeling, version labels, and label-based configuration resolution
- **Key Vault references** - Secure secret referencing with managed identity authentication
- **Snapshots** - Point-in-time configuration captures for auditing and rollback scenarios
- **Dynamic refresh** - Sentinel key monitoring, pull-based refresh, and push-based Event Grid notifications
- **SDK integration** - .NET, Java, JavaScript, and Python provider configurations with middleware
- **Access control** - Data reader and data owner roles, private endpoints, and managed identity access

<div class="badge-row">
  <span class="badge">Config</span>
  <span class="badge">Feature Flags</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing configuration files and feature flag definitions
- `Write` - Create App Configuration key-value exports, feature flag JSON, and provider setups
- `Edit` - Modify existing configuration values and feature flag targeting rules
- `Bash` - Run Azure CLI commands for App Configuration store management and imports
- `Glob` - Search for configuration files and feature management setup code
- `Grep` - Find configuration key references and feature flag usage across the project
