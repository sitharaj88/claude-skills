---
name: azure-functions
description: Generate Azure Functions with triggers, bindings, and deployment configs. Use when the user wants to create, configure, or deploy serverless functions on Azure.
argument-hint: "[runtime] [trigger type] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *), Bash(func *), Bash(npm *), Bash(pip *), Bash(dotnet *)
user-invocable: true
---

## Instructions

You are an Azure Functions expert. Generate production-ready serverless functions with proper triggers, bindings, and deployment configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Runtime**: Node.js 20 (V4 model), Python 3.11 (V2 model), .NET 8 (isolated worker), Java 17
- **Trigger**: HTTP, Timer, Blob Storage, Queue Storage, Event Grid, Cosmos DB, Service Bus, Event Hub, Durable Functions
- **Purpose**: What the function does (API endpoint, background processor, event handler, orchestrator)
- **Hosting plan**: Consumption (serverless), Premium (EP1-EP3), Dedicated (App Service Plan), Flex Consumption

### Step 2: Generate function code

Create the function following the latest programming model:

**Node.js V4 programming model:**
```javascript
const { app } = require('@azure/functions');

app.http('httpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request.');
        const name = request.query.get('name') || (await request.text());
        return { body: `Hello, ${name}!` };
    }
});
```

**Node.js Timer trigger:**
```javascript
const { app } = require('@azure/functions');

app.timer('timerTrigger', {
    schedule: '0 */5 * * * *',
    handler: async (myTimer, context) => {
        context.log('Timer trigger executed at:', new Date().toISOString());
        if (myTimer.isPastDue) {
            context.log('Timer is past due!');
        }
    }
});
```

**Node.js Blob trigger with output binding:**
```javascript
const { app, output } = require('@azure/functions');

const blobOutput = output.storageBlob({
    path: 'output-container/{name}-processed',
    connection: 'AzureWebJobsStorage'
});

app.storageBlob('blobTrigger', {
    path: 'input-container/{name}',
    connection: 'AzureWebJobsStorage',
    return: blobOutput,
    handler: async (blob, context) => {
        context.log(`Processing blob: ${context.triggerMetadata.name}, Size: ${blob.length}`);
        return processBlob(blob);
    }
});
```

**Python V2 programming model:**
```python
import azure.functions as func
import logging

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

@app.route(route="hello", methods=["GET", "POST"])
def http_trigger(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    name = req.params.get('name') or req.get_body().decode()
    return func.HttpResponse(f"Hello, {name}!", status_code=200)
```

**Python Timer trigger:**
```python
@app.timer_trigger(schedule="0 */5 * * * *", arg_name="myTimer",
                    run_on_startup=False, use_monitor=True)
def timer_trigger(myTimer: func.TimerRequest) -> None:
    if myTimer.past_due:
        logging.info('Timer is past due!')
    logging.info('Python timer trigger function executed.')
```

**Python Cosmos DB trigger:**
```python
@app.cosmos_db_trigger_v3(arg_name="documents",
                           container_name="items",
                           database_name="mydb",
                           connection="CosmosDBConnection",
                           lease_container_name="leases",
                           create_lease_container_if_not_exists=True)
def cosmos_trigger(documents: func.DocumentList) -> None:
    for doc in documents:
        logging.info(f"Modified document: {doc.to_json()}")
```

**.NET 8 Isolated Worker:**
```csharp
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

public class HttpTriggerFunction
{
    private readonly ILogger<HttpTriggerFunction> _logger;

    public HttpTriggerFunction(ILogger<HttpTriggerFunction> logger)
    {
        _logger = logger;
    }

    [Function("HttpTrigger")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequestData req)
    {
        _logger.LogInformation("C# HTTP trigger function processed a request.");
        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteStringAsync("Hello from Azure Functions!");
        return response;
    }
}
```

### Step 3: Generate Durable Functions (if applicable)

Create Durable Functions for complex workflows:

**Orchestrator (Node.js V4):**
```javascript
const { app } = require('@azure/functions');
const df = require('durable-functions');

df.app.orchestration('orchestrator', function* (context) {
    const outputs = [];
    outputs.push(yield context.df.callActivity('activityOne', 'Tokyo'));
    outputs.push(yield context.df.callActivity('activityOne', 'Seattle'));
    outputs.push(yield context.df.callActivity('activityOne', 'London'));
    return outputs;
});

df.app.activity('activityOne', {
    handler: (input) => {
        return `Hello, ${input}!`;
    }
});

app.http('startOrchestrator', {
    route: 'orchestrators/{orchestratorName}',
    extraInputs: [df.input.durableClient()],
    handler: async (req, context) => {
        const client = df.getClient(context);
        const instanceId = await client.startNew(req.params.orchestratorName);
        return client.createCheckStatusResponse(req, instanceId);
    }
});
```

**Durable Functions patterns:**
- Function chaining (sequential steps)
- Fan-out/Fan-in (parallel execution with aggregation)
- Async HTTP APIs (long-running operations with status polling)
- Monitor pattern (periodic checks with flexible intervals)
- Human interaction (approval workflows with timeouts)
- Durable Entities (stateful singleton actors)

### Step 4: Generate host.json configuration

```json
{
    "version": "2.0",
    "logging": {
        "applicationInsights": {
            "samplingSettings": {
                "isEnabled": true,
                "excludedTypes": "Request"
            },
            "enableLiveMetricsFilters": true
        },
        "logLevel": {
            "default": "Information",
            "Host.Results": "Error",
            "Function": "Information",
            "Host.Aggregator": "Trace"
        }
    },
    "extensions": {
        "http": {
            "routePrefix": "api",
            "maxOutstandingRequests": 200,
            "maxConcurrentRequests": 100
        },
        "queues": {
            "maxPollingInterval": "00:00:02",
            "visibilityTimeout": "00:00:30",
            "batchSize": 16,
            "maxDequeueCount": 5
        },
        "cosmosDB": {
            "connectionMode": "Direct",
            "leaseOptions": {
                "feedPollDelay": "00:00:05"
            }
        },
        "durableTask": {
            "hubName": "MyTaskHub",
            "storageProvider": {
                "maxQueuePollingInterval": "00:00:30"
            }
        }
    },
    "functionTimeout": "00:05:00",
    "concurrency": {
        "dynamicConcurrencyEnabled": true,
        "snapshotPersistenceEnabled": true
    }
}
```

### Step 5: Generate local.settings.json

```json
{
    "IsEncrypted": false,
    "Values": {
        "AzureWebJobsStorage": "UseDevelopmentStorage=true",
        "FUNCTIONS_WORKER_RUNTIME": "node",
        "FUNCTIONS_EXTENSION_VERSION": "~4",
        "APPINSIGHTS_INSTRUMENTATIONKEY": "<from-key-vault>",
        "CosmosDBConnection": "<connection-string>",
        "ServiceBusConnection": "<connection-string>"
    },
    "Host": {
        "CORS": "*",
        "CORSCredentials": false
    }
}
```

### Step 6: Generate deployment configuration

**Bicep template:**
```bicep
param location string = resourceGroup().location
param functionAppName string
param storageAccountName string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${functionAppName}-insights'
  location: location
  kind: 'web'
  properties: { Application_Type: 'web' }
}

resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: hostingPlan.id
    siteConfig: {
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=core.windows.net;AccountKey=${storageAccount.listKeys().keys[0].value}' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'APPINSIGHTS_INSTRUMENTATIONKEY', value: appInsights.properties.InstrumentationKey }
      ]
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      netFrameworkVersion: 'v8.0'
    }
    httpsOnly: true
  }
}
```

**Terraform alternative:**
```hcl
resource "azurerm_linux_function_app" "main" {
  name                       = var.function_app_name
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  service_plan_id            = azurerm_service_plan.main.id
  storage_account_name       = azurerm_storage_account.main.name
  storage_account_access_key = azurerm_storage_account.main.primary_access_key

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      node_version = "20"
    }
    application_insights_connection_string = azurerm_application_insights.main.connection_string
  }

  app_settings = {
    "FUNCTIONS_EXTENSION_VERSION" = "~4"
  }
}
```

### Step 7: Configure deployment slots (Premium/Dedicated plans)

```bicep
resource stagingSlot 'Microsoft.Web/sites/slots@2023-01-01' = {
  parent: functionApp
  name: 'staging'
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: hostingPlan.id
    siteConfig: {
      appSettings: [
        // Same settings with staging-specific values
      ]
      autoSwapSlotName: 'production'
    }
  }
}
```

### Step 8: Configure managed identity for secure resource access

Use managed identity instead of connection strings when possible:

```javascript
// Using DefaultAzureCredential in Node.js
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://my-vault.vault.azure.net', credential);
```

Grant RBAC roles to the function app's managed identity:
- `Storage Blob Data Contributor` for Blob Storage
- `Azure Service Bus Data Receiver` for Service Bus triggers
- `Cosmos DB Built-in Data Contributor` for Cosmos DB
- `Key Vault Secrets User` for Key Vault references

### Best practices:
- Use the V4 programming model for Node.js and V2 for Python (latest patterns)
- Prefer managed identity over connection strings for resource access
- Use Application Insights for monitoring and distributed tracing
- Keep functions small and focused (single responsibility)
- Use Durable Functions for complex orchestrations instead of chaining queues
- Configure appropriate timeouts (Consumption max 10 min, Premium max unlimited)
- Use Premium plan (EP1+) when you need VNET integration or predictable latency
- Set FUNCTIONS_EXTENSION_VERSION to ~4 (pin the major version)
- Use Key Vault references for secrets in app settings
- Implement retry policies for triggers (maxDequeueCount, retry options)

### Anti-patterns to avoid:
- Do NOT store state in function memory (functions are stateless and ephemeral)
- Do NOT use Consumption plan for latency-sensitive workloads (cold starts)
- Do NOT hardcode connection strings or secrets in code or local.settings.json for production
- Do NOT use in-process model for .NET (isolated worker is the future)
- Do NOT create overly large functions; split into multiple functions with queue-based communication
- Do NOT ignore poison messages; configure dead-letter queues
- Do NOT skip Application Insights; it is essential for debugging serverless functions

### Security considerations:
- Always use HTTPS (httpsOnly: true)
- Set appropriate auth levels (function key for internal APIs, anonymous only behind APIM or Front Door)
- Disable FTP access (ftpsState: Disabled)
- Use managed identity for all Azure resource access
- Store secrets in Key Vault with Key Vault references
- Enable VNET integration for accessing private resources (Premium plan required)
- Configure IP restrictions for function app access
- Use private endpoints for the function app in enterprise scenarios
- Implement CORS policies for browser-based clients
- Set minimum TLS version to 1.2

### Cost optimization tips:
- **Consumption plan**: Pay per execution (first 1M executions/month free, 400K GB-s free)
- **Premium plan**: Pre-warmed instances avoid cold starts but cost more; use minimum instance count of 1
- **Flex Consumption**: New plan with per-second billing and fast scaling; best of both worlds
- Use smaller memory allocations when possible (Consumption plan charges by memory-time)
- Optimize function execution time to reduce costs
- Use timer triggers to batch process instead of per-item triggers where appropriate
- Monitor execution counts and duration in Application Insights to identify expensive functions
- Consider moving high-volume workloads to Container Apps or AKS if cost exceeds fixed compute
