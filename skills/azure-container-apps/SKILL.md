---
name: azure-container-apps
description: Generate Container Apps with auto-scaling, Dapr, and traffic splitting. Use when the user wants to deploy containerized applications on Azure Container Apps.
argument-hint: "[name] [image] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *), Bash(docker *), Bash(npm *), Bash(dotnet *)
user-invocable: true
---

## Instructions

You are an Azure Container Apps expert. Generate production-ready Container Apps configurations with scaling, Dapr integration, and traffic management.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Application type**: web API, background worker, event processor, microservice
- **Container image**: existing ACR image, Dockerfile to build, or source code
- **Scaling**: HTTP-based, queue-based, custom KEDA scaler, or manual
- **Features**: Dapr, traffic splitting, custom domains, VNET integration
- **Environment**: new or existing Container Apps Environment

### Step 2: Generate Container Apps Environment

**Bicep template:**
```bicep
param location string = resourceGroup().location
param environmentName string

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${environmentName}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource environment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    zoneRedundant: true
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
      {
        name: 'Dedicated-D4'
        workloadProfileType: 'D4'
        minimumCount: 1
        maximumCount: 5
      }
    ]
  }
}
```

**VNET-integrated environment:**
```bicep
resource environment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    vnetConfiguration: {
      infrastructureSubnetId: infrastructureSubnet.id
      internal: false  // true for internal-only access
    }
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    zoneRedundant: true
  }
}
```

### Step 3: Generate Container App

**Bicep template for a web API:**
```bicep
param containerAppName string
param containerImage string
param environmentId string

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: environmentId
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['https://myapp.com']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
          allowedHeaders: ['*']
          maxAge: 3600
        }
        traffic: [
          {
            revisionName: '${containerAppName}--stable'
            weight: 90
            label: 'stable'
          }
          {
            latestRevision: true
            weight: 10
            label: 'canary'
          }
        ]
        stickySessions: {
          affinity: 'sticky'
        }
      }
      secrets: [
        {
          name: 'db-connection'
          keyVaultUrl: 'https://my-vault.vault.azure.net/secrets/db-connection'
          identity: 'system'
        }
      ]
      registries: [
        {
          server: 'myacr.azurecr.io'
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'db-connection'
            }
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health/live'
                port: 8080
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health/ready'
                port: 8080
              }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
            {
              type: 'Startup'
              httpGet: {
                path: '/health/startup'
                port: 8080
              }
              initialDelaySeconds: 3
              periodSeconds: 5
              failureThreshold: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}
```

### Step 4: Configure KEDA-based autoscaling

**HTTP scaling:**
```bicep
scale: {
  minReplicas: 1
  maxReplicas: 30
  rules: [
    {
      name: 'http-rule'
      http: {
        metadata: {
          concurrentRequests: '100'
        }
      }
    }
  ]
}
```

**Azure Service Bus queue scaling:**
```bicep
scale: {
  minReplicas: 0
  maxReplicas: 20
  rules: [
    {
      name: 'queue-rule'
      custom: {
        type: 'azure-servicebus'
        metadata: {
          queueName: 'orders'
          messageCount: '5'
        }
        auth: [
          {
            secretRef: 'servicebus-connection'
            triggerParameter: 'connection'
          }
        ]
      }
    }
  ]
}
```

**Azure Storage Queue scaling:**
```bicep
scale: {
  minReplicas: 0
  maxReplicas: 15
  rules: [
    {
      name: 'queue-rule'
      azureQueue: {
        queueName: 'work-items'
        queueLength: 10
        auth: [
          {
            secretRef: 'storage-connection'
            triggerParameter: 'connection'
          }
        ]
      }
    }
  ]
}
```

**Cron-based scaling:**
```bicep
scale: {
  minReplicas: 1
  maxReplicas: 10
  rules: [
    {
      name: 'business-hours'
      custom: {
        type: 'cron'
        metadata: {
          timezone: 'America/New_York'
          start: '0 8 * * 1-5'
          end: '0 18 * * 1-5'
          desiredReplicas: '5'
        }
      }
    }
  ]
}
```

### Step 5: Configure Dapr integration

**Enable Dapr on Container App:**
```bicep
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  // ...
  properties: {
    configuration: {
      dapr: {
        enabled: true
        appId: 'order-service'
        appProtocol: 'http'
        appPort: 8080
        enableApiLogging: true
        logLevel: 'info'
      }
    }
  }
}
```

**Dapr component for state store (Bicep):**
```bicep
resource stateStore 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  parent: environment
  name: 'statestore'
  properties: {
    componentType: 'state.azure.cosmosdb'
    version: 'v1'
    metadata: [
      { name: 'url', value: cosmosDbAccountEndpoint }
      { name: 'database', value: 'mydb' }
      { name: 'collection', value: 'state' }
    ]
    secrets: [
      { name: 'masterkey', keyVaultUrl: 'https://my-vault.vault.azure.net/secrets/cosmos-key', identity: 'system' }
    ]
    scopes: ['order-service', 'inventory-service']
  }
}
```

**Dapr pub/sub component:**
```bicep
resource pubsub 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  parent: environment
  name: 'pubsub'
  properties: {
    componentType: 'pubsub.azure.servicebus.topics'
    version: 'v1'
    metadata: [
      { name: 'connectionString', secretRef: 'servicebus-connection' }
    ]
    secrets: [
      { name: 'servicebus-connection', keyVaultUrl: 'https://my-vault.vault.azure.net/secrets/sb-connection', identity: 'system' }
    ]
    scopes: ['order-service', 'notification-service']
  }
}
```

**Using Dapr in application code (Node.js):**
```javascript
const { DaprClient } = require('@dapr/dapr');
const client = new DaprClient();

// Service invocation
const result = await client.invoker.invoke('inventory-service', 'check-stock', 'POST', { itemId: '123' });

// State management
await client.state.save('statestore', [{ key: 'order-123', value: orderData }]);
const state = await client.state.get('statestore', 'order-123');

// Pub/Sub publish
await client.pubsub.publish('pubsub', 'orders', { orderId: '123', status: 'created' });
```

### Step 6: Generate Container Apps Jobs

**Scheduled job (cron):**
```bicep
resource scheduledJob 'Microsoft.App/jobs@2023-05-01' = {
  name: '${containerAppName}-cleanup-job'
  location: location
  properties: {
    environmentId: environmentId
    configuration: {
      triggerType: 'Schedule'
      scheduleTriggerConfig: {
        cronExpression: '0 0 * * *'
        parallelism: 1
        replicaCompletionCount: 1
      }
      replicaTimeout: 1800
      replicaRetryLimit: 3
      registries: [
        { server: 'myacr.azurecr.io', identity: 'system' }
      ]
    }
    template: {
      containers: [
        {
          name: 'cleanup'
          image: 'myacr.azurecr.io/cleanup:latest'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'DATABASE_URL', secretRef: 'db-connection' }
          ]
        }
      ]
    }
  }
}
```

**Event-driven job:**
```bicep
resource eventJob 'Microsoft.App/jobs@2023-05-01' = {
  name: '${containerAppName}-processor-job'
  location: location
  properties: {
    environmentId: environmentId
    configuration: {
      triggerType: 'Event'
      eventTriggerConfig: {
        scale: {
          minExecutions: 0
          maxExecutions: 10
          pollingInterval: 30
          rules: [
            {
              name: 'queue-trigger'
              type: 'azure-queue'
              metadata: {
                queueName: 'work-items'
                queueLength: '1'
                accountName: storageAccountName
              }
              auth: [
                { secretRef: 'storage-connection', triggerParameter: 'connection' }
              ]
            }
          ]
        }
      }
      replicaTimeout: 600
      replicaRetryLimit: 2
    }
    template: {
      containers: [
        {
          name: 'processor'
          image: 'myacr.azurecr.io/processor:latest'
          resources: { cpu: json('1.0'), memory: '2Gi' }
        }
      ]
    }
  }
}
```

### Step 7: Configure custom domains

```bicep
resource customDomain 'Microsoft.App/containerApps@2023-05-01' = {
  // ...
  properties: {
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        customDomains: [
          {
            name: 'api.myapp.com'
            certificateId: managedCertificate.id
            bindingType: 'SniEnabled'
          }
        ]
      }
    }
  }
}

resource managedCertificate 'Microsoft.App/managedEnvironments/managedCertificates@2023-05-01' = {
  parent: environment
  name: 'api-myapp-cert'
  location: location
  properties: {
    subjectName: 'api.myapp.com'
    domainControlValidation: 'CNAME'
  }
}
```

### Step 8: Terraform alternative

```hcl
resource "azurerm_container_app_environment" "main" {
  name                       = var.environment_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  zone_redundancy_enabled    = true

  infrastructure_subnet_id = var.enable_vnet ? azurerm_subnet.container_apps[0].id : null
}

resource "azurerm_container_app" "main" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Multiple"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.main.id
  }

  ingress {
    external_enabled = true
    target_port      = 8080

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 1
    max_replicas = 10

    container {
      name   = var.container_app_name
      image  = "${azurerm_container_registry.main.login_server}/${var.image_name}:${var.image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      liveness_probe {
        transport = "HTTP"
        path      = "/health/live"
        port      = 8080
      }

      readiness_probe {
        transport = "HTTP"
        path      = "/health/ready"
        port      = 8080
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "db-connection"
      }
    }

    http_scale_rule {
      name                = "http-scaling"
      concurrent_requests = "50"
    }
  }

  secret {
    name                = "db-connection"
    key_vault_secret_id = azurerm_key_vault_secret.db_connection.id
    identity            = azurerm_user_assigned_identity.main.id
  }
}
```

### Best practices:
- Use `Multiple` revision mode for blue-green and canary deployments
- Configure health probes (liveness, readiness, startup) for reliable scaling
- Use managed identity with ACR (avoid admin credentials)
- Store secrets in Key Vault and reference them via managed identity
- Set appropriate minReplicas (0 for background workers, 1+ for APIs)
- Use workload profiles for dedicated compute when you need guaranteed resources
- Enable zone redundancy for production environments
- Use Dapr for microservice communication patterns instead of direct HTTP calls
- Implement graceful shutdown handling in your containers

### Anti-patterns to avoid:
- Do NOT use Single revision mode if you need traffic splitting or blue-green deployments
- Do NOT store secrets as plain text environment variables; use Key Vault references
- Do NOT set maxReplicas too high without understanding cost implications
- Do NOT skip health probes; the platform needs them for traffic routing and scaling
- Do NOT use admin credentials for ACR; use managed identity
- Do NOT deploy without resource limits (cpu/memory); it affects scheduling and cost
- Do NOT ignore container startup time when configuring startup probes

### Security considerations:
- Use managed identity for all Azure resource access (ACR, Key Vault, databases)
- Enable VNET integration for private resource access
- Configure ingress as internal-only when not internet-facing
- Use CORS policies to restrict browser access
- Store all secrets in Key Vault with secret references
- Enable Dapr API authentication for service-to-service communication
- Use custom domains with managed TLS certificates
- Restrict container registry access with private endpoints

### Cost optimization tips:
- Use Consumption workload profile for variable workloads (pay per vCPU-second and GiB-second)
- Set minReplicas to 0 for event-driven workloads (scale to zero)
- Use Container Apps Jobs instead of always-running containers for batch work
- Right-size container resources (cpu/memory) based on actual usage
- Use Dedicated workload profiles only when you need guaranteed resources
- Monitor with Azure Cost Management to identify idle or oversized apps
- Consolidate microservices in a single environment to share infrastructure costs
