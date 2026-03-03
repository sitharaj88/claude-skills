---
name: azure-app-config
description: Generate App Configuration stores with feature flags and dynamic configuration
invocation: /azure-app-config [operation]
arguments:
  - name: operation
    description: "Operation (config, feature-flag, snapshot, label)"
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

You are an Azure App Configuration expert. Generate production-ready configuration management setups with feature flags, dynamic refresh, and environment-based configuration.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: key-value configuration, feature flags, configuration snapshots, label-based environments
- **Platform**: .NET, Java (Spring Boot), Python, JavaScript/Node.js, Kubernetes
- **Refresh strategy**: Push-based (Event Grid), pull-based (sentinel key), periodic polling
- **Feature flags**: Boolean toggle, conditional (targeting), percentage rollout, time window
- **Integration**: Key Vault references, managed identity, private endpoints

### Step 2: Generate App Configuration store

```bicep
resource appConfig 'Microsoft.AppConfiguration/configurationStores@2023-03-01' = {
  name: 'appcs-${appName}-${environment}'
  location: location
  sku: {
    name: 'standard'  // free or standard
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    disableLocalAuth: true              // Force Entra ID auth
    enablePurgeProtection: true         // Prevent accidental deletion
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Disabled'     // Use private endpoints
    encryption: {
      keyVaultProperties: {
        keyIdentifier: customerManagedKey.properties.keyUriWithVersion
        identityClientId: managedIdentity.properties.clientId
      }
    }
    dataPlaneProxy: {
      privateLinkDelegation: 'Enabled'
    }
  }
  tags: commonTags
}

// Private endpoint
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-appcs-${appName}'
  location: location
  properties: {
    subnet: {
      id: privateEndpointSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: 'appcs-connection'
        properties: {
          privateLinkServiceId: appConfig.id
          groupIds: ['configurationStores']
        }
      }
    ]
  }
}

// Geo-replication (Standard tier)
resource replica 'Microsoft.AppConfiguration/configurationStores/replicas@2023-03-01' = {
  parent: appConfig
  name: 'westus-replica'
  location: 'westus2'
}

// RBAC role assignments
resource dataReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(appConfig.id, appServiceIdentity, 'appconfig-data-reader')
  scope: appConfig
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '516239f1-63e1-4d78-a4de-a74fb236a071'  // App Configuration Data Reader
    )
    principalId: appServiceIdentity
    principalType: 'ServicePrincipal'
  }
}
```

### Step 3: Generate key-value configurations

```bicep
// Application settings with labels for environments
resource configAppName 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: 'App:Settings:AppName'
  properties: {
    value: appName
    contentType: 'text/plain'
    tags: { component: 'core' }
  }
}

// Environment-specific with labels
resource configDbConnectionDev 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: 'App:Database:ConnectionString$dev'  // $ separator for label
  properties: {
    value: 'Server=dev-server;Database=myapp;'
    contentType: 'text/plain'
  }
}

resource configDbConnectionProd 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: 'App:Database:ConnectionString$production'
  properties: {
    value: 'Server=prod-server;Database=myapp;'
    contentType: 'text/plain'
  }
}

// Key Vault reference (secrets stored in Key Vault, referenced from App Config)
resource configDbPassword 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: 'App:Database:Password$production'
  properties: {
    value: json('{"uri":"https://kv-${appName}.vault.azure.net/secrets/db-password"}')
    contentType: 'application/vnd.microsoft.appconfig.keyvaultref+json;charset=utf-8'
  }
}

// JSON configuration value
resource configFeatureSettings 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: 'App:Caching:Settings'
  properties: {
    value: json('''{
      "enabled": true,
      "ttlSeconds": 300,
      "maxItems": 1000,
      "provider": "redis"
    }''')
    contentType: 'application/json'
  }
}

// Sentinel key for configuration refresh
resource sentinelKey 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: 'App:Settings:Sentinel'
  properties: {
    value: '1'  // Update this value to trigger refresh in all connected apps
    contentType: 'text/plain'
  }
}
```

### Step 4: Generate feature flag configurations

```bicep
// Simple boolean feature flag
resource featureBetaDashboard 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: '.appconfig.featureflag~2FBetaDashboard'  // ~2F is URL-encoded /
  properties: {
    value: json('''{
      "id": "BetaDashboard",
      "description": "Enable the new beta dashboard experience",
      "enabled": false,
      "conditions": {
        "client_filters": []
      }
    }''')
    contentType: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8'
  }
}

// Percentage-based rollout
resource featureNewCheckout 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: '.appconfig.featureflag~2FNewCheckout'
  properties: {
    value: json('''{
      "id": "NewCheckout",
      "description": "New checkout flow - gradual rollout",
      "enabled": true,
      "conditions": {
        "client_filters": [
          {
            "name": "Microsoft.Percentage",
            "parameters": {
              "Value": 25
            }
          }
        ]
      }
    }''')
    contentType: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8'
  }
}

// Targeting filter (specific users/groups)
resource featurePremiumFeatures 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: '.appconfig.featureflag~2FPremiumFeatures'
  properties: {
    value: json('''{
      "id": "PremiumFeatures",
      "description": "Premium features for targeted users and groups",
      "enabled": true,
      "conditions": {
        "client_filters": [
          {
            "name": "Microsoft.Targeting",
            "parameters": {
              "Audience": {
                "Users": [
                  "user1@company.com",
                  "user2@company.com"
                ],
                "Groups": [
                  {
                    "Name": "BetaTesters",
                    "RolloutPercentage": 100
                  },
                  {
                    "Name": "InternalUsers",
                    "RolloutPercentage": 50
                  }
                ],
                "DefaultRolloutPercentage": 10,
                "Exclusion": {
                  "Users": ["excluded@company.com"],
                  "Groups": ["ExcludedGroup"]
                }
              }
            }
          }
        ]
      }
    }''')
    contentType: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8'
  }
}

// Time window filter
resource featureHolidaySale 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: '.appconfig.featureflag~2FHolidaySale'
  properties: {
    value: json('''{
      "id": "HolidaySale",
      "description": "Holiday sale banner and pricing",
      "enabled": true,
      "conditions": {
        "client_filters": [
          {
            "name": "Microsoft.TimeWindow",
            "parameters": {
              "Start": "2024-12-20T00:00:00Z",
              "End": "2025-01-02T23:59:59Z"
            }
          }
        ]
      }
    }''')
    contentType: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8'
  }
}

// Custom filter (evaluate in application code)
resource featureCustomFilter 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: '.appconfig.featureflag~2FGeoRestricted'
  properties: {
    value: json('''{
      "id": "GeoRestricted",
      "description": "Feature available in specific regions",
      "enabled": true,
      "conditions": {
        "client_filters": [
          {
            "name": "GeoFilter",
            "parameters": {
              "AllowedCountries": ["US", "CA", "UK"]
            }
          }
        ]
      }
    }''')
    contentType: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8'
  }
}
```

### Step 5: Generate .NET integration code

**ASP.NET Core with dynamic refresh:**

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Connect to App Configuration with managed identity
builder.Configuration.AddAzureAppConfiguration(options =>
{
    options.Connect(
            new Uri("https://appcs-myapp-prod.azconfig.io"),
            new DefaultAzureCredential())
        // Load all keys with specific label
        .Select(KeyFilter.Any, "production")
        // Load keys with no label as fallback
        .Select(KeyFilter.Any, LabelFilter.Null)
        // Configure Key Vault reference resolution
        .ConfigureKeyVault(kv =>
        {
            kv.SetCredential(new DefaultAzureCredential());
        })
        // Configure feature flags
        .UseFeatureFlags(featureOptions =>
        {
            featureOptions.Label = "production";
            featureOptions.CacheExpirationInterval = TimeSpan.FromMinutes(5);
        })
        // Configure dynamic refresh
        .ConfigureRefresh(refresh =>
        {
            refresh.Register("App:Settings:Sentinel", "production", refreshAll: true)
                   .SetCacheExpiration(TimeSpan.FromSeconds(30));
        });
});

// Add Azure App Configuration middleware for refresh
builder.Services.AddAzureAppConfiguration();

// Add feature management
builder.Services.AddFeatureManagement()
    .AddFeatureFilter<PercentageFilter>()
    .AddFeatureFilter<TimeWindowFilter>()
    .AddFeatureFilter<TargetingFilter>();

// Add targeting context accessor
builder.Services.AddSingleton<ITargetingContextAccessor, HttpContextTargetingContextAccessor>();

var app = builder.Build();

// Use App Configuration middleware (must be before routing)
app.UseAzureAppConfiguration();

app.MapGet("/api/settings", (IConfiguration config) =>
{
    return new
    {
        AppName = config["App:Settings:AppName"],
        CacheSettings = config.GetSection("App:Caching:Settings").Get<CacheSettings>()
    };
});

app.MapGet("/api/features", async (IFeatureManager featureManager) =>
{
    return new
    {
        BetaDashboard = await featureManager.IsEnabledAsync("BetaDashboard"),
        NewCheckout = await featureManager.IsEnabledAsync("NewCheckout"),
        PremiumFeatures = await featureManager.IsEnabledAsync("PremiumFeatures")
    };
});

app.Run();

// Custom targeting context accessor
public class HttpContextTargetingContextAccessor : ITargetingContextAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpContextTargetingContextAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public ValueTask<TargetingContext> GetContextAsync()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var user = httpContext?.User;

        return new ValueTask<TargetingContext>(new TargetingContext
        {
            UserId = user?.FindFirst("oid")?.Value ?? "anonymous",
            Groups = user?.FindAll("groups")?.Select(c => c.Value).ToList()
                     ?? new List<string>()
        });
    }
}

// Using feature flags in controllers
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IFeatureManager _featureManager;

    public DashboardController(IFeatureManager featureManager)
    {
        _featureManager = featureManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        if (await _featureManager.IsEnabledAsync("BetaDashboard"))
        {
            return Ok(new { version = "beta", widgets = GetBetaWidgets() });
        }
        return Ok(new { version = "stable", widgets = GetStableWidgets() });
    }
}

// Feature gate attribute (entire action behind feature flag)
[FeatureGate("PremiumFeatures")]
[HttpGet("premium")]
public IActionResult GetPremiumData()
{
    return Ok(new { data = "premium content" });
}
```

**Push-based refresh with Event Grid:**

```csharp
// Azure Function to handle App Configuration change events
[Function("AppConfigChanged")]
public async Task Run(
    [EventGridTrigger] CloudEvent cloudEvent,
    [FromServices] IConfigurationRefresherProvider refresherProvider)
{
    _logger.LogInformation("App Configuration changed: {Type}", cloudEvent.Type);

    // Trigger refresh in all connected configuration providers
    foreach (var refresher in refresherProvider.Refreshers)
    {
        refresher.ProcessPushNotification(cloudEvent, TimeSpan.FromSeconds(0));
    }
}
```

### Step 6: Generate Java Spring Boot integration

```yaml
# application.yml
spring:
  cloud:
    azure:
      appconfiguration:
        stores:
          - endpoint: https://appcs-myapp-prod.azconfig.io
            selects:
              - key-filter: /application/*
                label-filter: ${spring.profiles.active}
              - key-filter: /application/*
                label-filter: '\0'  # No label (fallback)
            feature-flags:
              enabled: true
              label-filter: ${spring.profiles.active}
            monitoring:
              enabled: true
              refresh-interval: 30s
              triggers:
                - key: /application/sentinel
                  label: ${spring.profiles.active}
        credential:
          managed-identity-enabled: true
```

```java
// Spring Boot configuration class
@Configuration
@RefreshScope
public class AppSettings {
    @Value("${app.settings.appName}")
    private String appName;

    @Value("${app.caching.ttlSeconds:300}")
    private int cacheTtl;

    // Getters...
}

// Feature flag usage in Spring Boot
@RestController
@RequestMapping("/api")
public class OrderController {

    @Autowired
    private FeatureManager featureManager;

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders() {
        if (featureManager.isEnabledAsync("NewCheckout").block()) {
            return ResponseEntity.ok(getNewCheckoutOrders());
        }
        return ResponseEntity.ok(getLegacyOrders());
    }

    // Conditional bean registration
    @Bean
    @ConditionalOnFeature("PremiumFeatures")
    public PremiumService premiumService() {
        return new PremiumServiceImpl();
    }
}
```

### Step 7: Generate Python integration

```python
from azure.appconfiguration.provider import load
from azure.identity import DefaultAzureCredential
from featuremanagement import FeatureManager

# Load configuration
credential = DefaultAzureCredential()

config = load(
    endpoint="https://appcs-myapp-prod.azconfig.io",
    credential=credential,
    selects=[
        SettingSelector(key_filter="App:*", label_filter="production"),
        SettingSelector(key_filter="App:*", label_filter=EMPTY_LABEL),
    ],
    keyvault_credential=credential,
    refresh_on=[
        SentinelKey("App:Settings:Sentinel", label="production")
    ],
    refresh_interval=30,
    feature_flag_enabled=True,
    feature_flag_selectors=[
        SettingSelector(key_filter=".appconfig.featureflag/*", label_filter="production")
    ],
)

# Access configuration values
app_name = config["App:Settings:AppName"]
cache_ttl = config.get("App:Caching:Settings:ttlSeconds", 300)

# Feature flag evaluation
feature_manager = FeatureManager(config)

if feature_manager.is_enabled("BetaDashboard"):
    print("Beta dashboard enabled")

# Dynamic refresh (call periodically or on request)
config.refresh()

# Flask integration
from flask import Flask

app = Flask(__name__)

@app.before_request
def refresh_config():
    config.refresh()

@app.route("/api/settings")
def get_settings():
    return {
        "appName": config["App:Settings:AppName"],
        "betaDashboard": feature_manager.is_enabled("BetaDashboard"),
    }
```

### Step 8: Generate Kubernetes integration

```yaml
# Azure App Configuration Kubernetes Provider
apiVersion: azconfig.io/v1
kind: AzureAppConfigurationProvider
metadata:
  name: app-config-provider
  namespace: myapp
spec:
  endpoint: https://appcs-myapp-prod.azconfig.io
  target:
    configMapName: app-settings
    configMapData:
      type: json
      key: settings.json
  auth:
    workloadIdentity:
      managedIdentityClientId: <USER_ASSIGNED_MI_CLIENT_ID>
  configuration:
    selectors:
      - keyFilter: App:*
        labelFilter: production
    refresh:
      enabled: true
      interval: 30s
      monitoring:
        keyValues:
          - key: App:Settings:Sentinel
            label: production
  secret:
    target:
      secretName: app-secrets
    auth:
      workloadIdentity:
        managedIdentityClientId: <USER_ASSIGNED_MI_CLIENT_ID>
  featureFlag:
    selectors:
      - keyFilter: '*'
        labelFilter: production
    refresh:
      enabled: true
      interval: 1m
---
# Deployment using the ConfigMap
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      serviceAccountName: myapp-sa
      containers:
        - name: myapp
          image: myacr.azurecr.io/myapp:latest
          envFrom:
            - configMapRef:
                name: app-settings
            - secretRef:
                name: app-secrets
          volumeMounts:
            - name: config-volume
              mountPath: /app/config
      volumes:
        - name: config-volume
          configMap:
            name: app-settings
```

### Step 9: Generate Terraform configuration

```hcl
resource "azurerm_app_configuration" "main" {
  name                       = "appcs-${var.app_name}-${var.environment}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  sku                        = "standard"
  local_auth_enabled         = false
  public_network_access      = "Disabled"
  purge_protection_enabled   = true
  soft_delete_retention_days = 7

  identity {
    type = "SystemAssigned"
  }

  encryption {
    key_vault_key_identifier = azurerm_key_vault_key.appconfig.id
    identity_client_id       = azurerm_user_assigned_identity.appconfig.client_id
  }

  replica {
    name     = "westus-replica"
    location = "westus2"
  }

  tags = var.common_tags
}

# Key-value configuration
resource "azurerm_app_configuration_key" "app_name" {
  configuration_store_id = azurerm_app_configuration.main.id
  key                    = "App:Settings:AppName"
  value                  = var.app_name
  label                  = var.environment
  content_type           = "text/plain"
}

resource "azurerm_app_configuration_key" "cache_settings" {
  configuration_store_id = azurerm_app_configuration.main.id
  key                    = "App:Caching:Settings"
  value = jsonencode({
    enabled    = true
    ttlSeconds = 300
    maxItems   = 1000
    provider   = "redis"
  })
  label        = var.environment
  content_type = "application/json"
}

# Key Vault reference
resource "azurerm_app_configuration_key" "db_password" {
  configuration_store_id = azurerm_app_configuration.main.id
  key                    = "App:Database:Password"
  type                   = "vault"
  vault_key_reference    = azurerm_key_vault_secret.db_password.versionless_id
  label                  = var.environment
}

# Sentinel key for refresh
resource "azurerm_app_configuration_key" "sentinel" {
  configuration_store_id = azurerm_app_configuration.main.id
  key                    = "App:Settings:Sentinel"
  value                  = "1"
  label                  = var.environment
  content_type           = "text/plain"
}

# Feature flags
resource "azurerm_app_configuration_feature" "beta_dashboard" {
  configuration_store_id = azurerm_app_configuration.main.id
  name                   = "BetaDashboard"
  description            = "Enable the new beta dashboard"
  label                  = var.environment
  enabled                = false
}

resource "azurerm_app_configuration_feature" "new_checkout" {
  configuration_store_id = azurerm_app_configuration.main.id
  name                   = "NewCheckout"
  description            = "New checkout flow - gradual rollout"
  label                  = var.environment
  enabled                = true

  percentage_filter_value = 25
}

resource "azurerm_app_configuration_feature" "premium_features" {
  configuration_store_id = azurerm_app_configuration.main.id
  name                   = "PremiumFeatures"
  description            = "Premium features for targeted users"
  label                  = var.environment
  enabled                = true

  targeting_filter {
    default_rollout_percentage = 10
    users                      = ["user1@company.com", "user2@company.com"]
    groups {
      name               = "BetaTesters"
      rollout_percentage = 100
    }
    groups {
      name               = "InternalUsers"
      rollout_percentage = 50
    }
  }
}

resource "azurerm_app_configuration_feature" "holiday_sale" {
  configuration_store_id = azurerm_app_configuration.main.id
  name                   = "HolidaySale"
  description            = "Holiday sale banner"
  label                  = var.environment
  enabled                = true

  timewindow_filter {
    start = "2024-12-20T00:00:00Z"
    end   = "2025-01-02T23:59:59Z"
  }
}

# RBAC
resource "azurerm_role_assignment" "appconfig_reader" {
  scope                = azurerm_app_configuration.main.id
  role_definition_name = "App Configuration Data Reader"
  principal_id         = azurerm_linux_web_app.main.identity[0].principal_id
}

# Private endpoint
resource "azurerm_private_endpoint" "appconfig" {
  name                = "pe-appcs-${var.app_name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "appcs-connection"
    private_connection_resource_id = azurerm_app_configuration.main.id
    subresource_names              = ["configurationStores"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.appconfig.id]
  }
}
```

### Step 10: Generate configuration snapshots

```csharp
// Create a snapshot for point-in-time configuration
using Azure.Data.AppConfiguration;
using Azure.Identity;

var client = new ConfigurationClient(
    new Uri("https://appcs-myapp-prod.azconfig.io"),
    new DefaultAzureCredential());

// Create snapshot
var snapshotFilter = new List<ConfigurationSettingsFilter>
{
    new ConfigurationSettingsFilter("App:*") { Label = "production" }
};

var snapshot = await client.CreateSnapshotAsync(
    new ConfigurationSnapshot(snapshotFilter)
    {
        Name = $"release-{DateTime.UtcNow:yyyyMMdd-HHmmss}",
        RetentionPeriod = TimeSpan.FromDays(90)
    },
    WaitUntil.Completed);

Console.WriteLine($"Snapshot created: {snapshot.Value.Name}, Status: {snapshot.Value.Status}");

// Read from snapshot (immutable point-in-time)
await foreach (var setting in client.GetConfigurationSettingsForSnapshotAsync(snapshot.Value.Name))
{
    Console.WriteLine($"{setting.Key} = {setting.Value}");
}

// List snapshots
await foreach (var s in client.GetSnapshotsAsync())
{
    Console.WriteLine($"{s.Name}: {s.Status}, Created: {s.CreatedOn}");
}
```

### Configuration patterns reference

| Pattern | Use Case | Implementation |
|---------|----------|---------------|
| Label-based environments | Different configs per environment | Use labels (dev, staging, production) |
| Key Vault references | Store secrets securely | Reference Key Vault secrets from App Config |
| Sentinel key refresh | Atomic config updates | Update sentinel key to trigger refresh in all apps |
| Event Grid push | Real-time refresh | Subscribe to key-value modified events |
| Configuration snapshots | Release-based config | Create immutable snapshots per release |
| Feature flags | Gradual rollout | Percentage, targeting, time-window filters |
| Hierarchical keys | Structured config | Use `:` separator (App:Database:ConnectionString) |

### App Configuration vs alternatives

| Feature | App Configuration | Environment Variables | Key Vault | Azure Portal App Settings |
|---------|-------------------|----------------------|-----------|--------------------------|
| Dynamic refresh | Yes | No (restart needed) | Yes (slow) | No (restart needed) |
| Feature flags | Built-in | No | No | No |
| History/audit | Yes | No | Yes | Limited |
| Labels/environments | Yes | Manual | Tags | Slots only |
| Encryption at rest | Yes (CMK) | Varies | Yes (CMK) | Yes |
| Snapshots | Yes | No | Versioning | No |
| Cost | Low | Free | Per operation | Free |

### Best practices

- **Use labels for environments** - Same keys with dev/staging/production labels
- **Store secrets in Key Vault** - Reference them from App Config via Key Vault references
- **Use sentinel key for atomic refresh** - Update one key to trigger refresh of all settings
- **Implement graceful degradation** - Cache last known config; do not fail if App Config is unreachable
- **Use feature flags for rollouts** - Percentage-based and targeting filters for safe deployments
- **Create snapshots for releases** - Immutable configuration tied to specific deployments
- **Use managed identity** - Disable local auth and use RBAC (App Configuration Data Reader)
- **Enable geo-replication** - Standard tier supports replicas for low-latency reads
- **Use hierarchical keys** - Organize with `:` separator for structured access
- **Set appropriate refresh intervals** - Balance freshness with request overhead (30s-5min)

### Anti-patterns

- **Storing large values** - App Config is for small key-value pairs, not files or blobs
- **Storing secrets directly** - Use Key Vault references instead
- **Polling too frequently** - Set reasonable refresh intervals (minimum 30 seconds)
- **Not using labels** - Without labels, environment separation requires multiple stores
- **Ignoring cache expiration** - Stale configuration can cause issues; monitor refresh health
- **Hardcoding connection strings** - Use managed identity endpoints instead
- **Not setting up monitoring** - Alert on configuration change events and access failures
- **Using free tier for production** - Standard tier provides SLA, replicas, and purge protection

### Security considerations

- Disable local authentication (`disableLocalAuth: true`) and use Entra ID with RBAC
- Use private endpoints to restrict network access
- Enable purge protection to prevent accidental deletion
- Use customer-managed keys (CMK) for encryption at rest
- Assign `App Configuration Data Reader` (not Owner/Contributor) to application identities
- Audit configuration changes via Azure Monitor activity logs
- Use Key Vault references for all sensitive configuration values
- Enable soft delete for recovery from accidental changes
- Restrict who can modify feature flags using RBAC (`App Configuration Data Owner`)

### Cost optimization

- **Free tier**: 10MB storage, 1,000 requests/day (development and testing only)
- **Standard tier**: 1GB storage, 30,000 requests/hour, SLA, geo-replication
- **Minimize polling frequency**: Reduce requests with longer cache expiration
- **Use sentinel key pattern**: One request to check sentinel vs. polling all keys
- **Batch configuration reads**: Load all keys at startup, refresh incrementally
- **Use Event Grid push**: React to changes instead of polling (reduces request count)
- **Share stores across services**: Multiple apps can read from one store (with different labels)
- **Clean up unused keys**: Remove stale configuration to reduce storage and cognitive overhead
