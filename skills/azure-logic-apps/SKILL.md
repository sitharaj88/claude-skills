---
name: azure-logic-apps
description: Generate Logic Apps workflows with connectors, triggers, and integration patterns
invocation: /azure-logic-apps [pattern]
arguments:
  - name: pattern
    description: "Pattern (approval, sync, batch, schedule, event)"
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

You are an Azure Logic Apps integration expert. Generate production-ready Logic Apps workflows for enterprise integration patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: approval workflow, data sync, batch processing, scheduled job, event-driven
- **Plan**: Consumption (serverless, pay-per-execution) or Standard (single-tenant, dedicated)
- **Triggers**: HTTP request, recurrence, Event Grid, Service Bus, Blob Storage, email
- **Connectors**: Office 365, Salesforce, SAP, SQL Server, Dynamics 365, custom APIs
- **Integration**: B2B (EDI, AS2, X12), API-based, file-based

### Step 2: Generate Consumption Logic App (serverless)

```bicep
resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: 'logic-${appName}-${environment}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    state: 'Enabled'
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      parameters: {
        '$connections': {
          defaultValue: {}
          type: 'Object'
        }
        environment: {
          defaultValue: environment
          type: 'String'
        }
      }
      triggers: {}
      actions: {}
      outputs: {}
    }
    parameters: {
      '$connections': {
        value: {}
      }
    }
    accessControl: {
      triggers: {
        allowedCallerIpAddresses: [
          { addressRange: '10.0.0.0/8' }
        ]
      }
      contents: {
        allowedCallerIpAddresses: [
          { addressRange: '10.0.0.0/8' }
        ]
      }
    }
  }
  tags: commonTags
}
```

### Step 3: Generate Standard Logic App (single-tenant)

```bicep
resource logicAppStandard 'Microsoft.Web/sites@2023-01-01' = {
  name: 'logic-${appName}-${environment}'
  location: location
  kind: 'functionapp,workflowapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      netFrameworkVersion: 'v6.0'
      appSettings: [
        { name: 'APP_KIND', value: 'workflowapp' }
        { name: 'AzureFunctionsJobHost__extensionBundle__id', value: 'Microsoft.Azure.Functions.ExtensionBundle.Workflows' }
        { name: 'AzureFunctionsJobHost__extensionBundle__version', value: '[1.*, 2.0.0)' }
        { name: 'AzureWebJobsStorage', value: storageConnectionString }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~18' }
      ]
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      vnetRouteAllEnabled: true
    }
    virtualNetworkSubnetId: logicAppSubnet.id
    httpsOnly: true
  }
  tags: commonTags
}

// App Service Plan for Standard Logic App
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'asp-logic-${appName}-${environment}'
  location: location
  sku: {
    name: 'WS1'  // WS1, WS2, WS3 (Workflow Standard)
    tier: 'WorkflowStandard'
  }
  properties: {
    zoneRedundant: true
  }
}
```

### Step 4: Generate workflow definitions

**HTTP-triggered approval workflow:**

```json
{
  "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
  "contentVersion": "1.0.0.0",
  "triggers": {
    "When_a_HTTP_request_is_received": {
      "type": "Request",
      "kind": "Http",
      "inputs": {
        "schema": {
          "type": "object",
          "properties": {
            "requestId": { "type": "string" },
            "requestType": { "type": "string" },
            "requestedBy": { "type": "string" },
            "amount": { "type": "number" },
            "description": { "type": "string" }
          },
          "required": ["requestId", "requestType", "requestedBy", "amount"]
        }
      }
    }
  },
  "actions": {
    "Initialize_status": {
      "type": "InitializeVariable",
      "inputs": {
        "variables": [{
          "name": "approvalStatus",
          "type": "string",
          "value": "Pending"
        }]
      },
      "runAfter": {}
    },
    "Check_amount_threshold": {
      "type": "If",
      "expression": {
        "and": [{
          "greater": ["@triggerBody()?['amount']", 10000]
        }]
      },
      "actions": {
        "Send_VP_approval": {
          "type": "ApiConnectionWebhook",
          "inputs": {
            "host": { "connection": { "name": "@parameters('$connections')['office365']['connectionId']" } },
            "body": {
              "NotificationUrl": "@{listCallbackUrl()}",
              "Message": {
                "To": "vp@company.com",
                "Subject": "Approval Required: @{triggerBody()?['requestType']} - $@{triggerBody()?['amount']}",
                "Options": "Approve, Reject",
                "Body": "Request from @{triggerBody()?['requestedBy']}: @{triggerBody()?['description']}"
              }
            },
            "path": "/approvalmail/$subscriptions"
          }
        },
        "Set_VP_status": {
          "type": "SetVariable",
          "inputs": { "name": "approvalStatus", "value": "@body('Send_VP_approval')?['SelectedOption']" },
          "runAfter": { "Send_VP_approval": ["Succeeded"] }
        }
      },
      "else": {
        "actions": {
          "Send_manager_approval": {
            "type": "ApiConnectionWebhook",
            "inputs": {
              "host": { "connection": { "name": "@parameters('$connections')['office365']['connectionId']" } },
              "body": {
                "NotificationUrl": "@{listCallbackUrl()}",
                "Message": {
                  "To": "manager@company.com",
                  "Subject": "Approval Required: @{triggerBody()?['requestType']}",
                  "Options": "Approve, Reject"
                }
              },
              "path": "/approvalmail/$subscriptions"
            }
          },
          "Set_manager_status": {
            "type": "SetVariable",
            "inputs": { "name": "approvalStatus", "value": "@body('Send_manager_approval')?['SelectedOption']" },
            "runAfter": { "Send_manager_approval": ["Succeeded"] }
          }
        }
      },
      "runAfter": { "Initialize_status": ["Succeeded"] }
    },
    "Update_database": {
      "type": "ApiConnection",
      "inputs": {
        "host": { "connection": { "name": "@parameters('$connections')['sql']['connectionId']" } },
        "method": "patch",
        "path": "/v2/datasets/@{encodeURIComponent('default')}/tables/@{encodeURIComponent('[dbo].[Requests]')}/items/@{encodeURIComponent(triggerBody()?['requestId'])}",
        "body": {
          "Status": "@variables('approvalStatus')",
          "ApprovedDate": "@utcNow()"
        }
      },
      "runAfter": { "Check_amount_threshold": ["Succeeded"] }
    },
    "Send_notification": {
      "type": "ApiConnection",
      "inputs": {
        "host": { "connection": { "name": "@parameters('$connections')['office365']['connectionId']" } },
        "method": "post",
        "path": "/v2/Mail",
        "body": {
          "To": "@triggerBody()?['requestedBy']",
          "Subject": "Request @{variables('approvalStatus')}: @{triggerBody()?['requestType']}",
          "Body": "<p>Your request has been <b>@{variables('approvalStatus')}</b>.</p>"
        }
      },
      "runAfter": { "Update_database": ["Succeeded"] }
    },
    "Response": {
      "type": "Response",
      "inputs": {
        "statusCode": 200,
        "body": {
          "requestId": "@triggerBody()?['requestId']",
          "status": "@variables('approvalStatus')"
        }
      },
      "runAfter": { "Send_notification": ["Succeeded"] }
    }
  }
}
```

**Scheduled data sync workflow:**

```json
{
  "triggers": {
    "Recurrence": {
      "type": "Recurrence",
      "recurrence": {
        "frequency": "Hour",
        "interval": 1,
        "timeZone": "Eastern Standard Time",
        "schedule": {
          "hours": ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17"],
          "minutes": [0]
        }
      }
    }
  },
  "actions": {
    "Get_records_from_Salesforce": {
      "type": "ApiConnection",
      "inputs": {
        "host": { "connection": { "name": "@parameters('$connections')['salesforce']['connectionId']" } },
        "method": "get",
        "path": "/datasets/default/tables/Account/items",
        "queries": {
          "$filter": "LastModifiedDate ge @{addHours(utcNow(), -1)}"
        }
      },
      "runAfter": {}
    },
    "For_each_record": {
      "type": "Foreach",
      "foreach": "@body('Get_records_from_Salesforce')?['value']",
      "actions": {
        "Upsert_to_SQL": {
          "type": "ApiConnection",
          "inputs": {
            "host": { "connection": { "name": "@parameters('$connections')['sql']['connectionId']" } },
            "method": "post",
            "path": "/v2/datasets/@{encodeURIComponent('default')}/procedures/@{encodeURIComponent('[dbo].[UpsertAccount]')}",
            "body": {
              "AccountId": "@items('For_each_record')?['Id']",
              "AccountName": "@items('For_each_record')?['Name']",
              "LastModified": "@items('For_each_record')?['LastModifiedDate']"
            }
          }
        }
      },
      "operationOptions": "Sequential",
      "runtimeConfiguration": {
        "concurrency": { "repetitions": 20 }
      },
      "runAfter": { "Get_records_from_Salesforce": ["Succeeded"] }
    }
  }
}
```

### Step 5: Error handling patterns

**Scope with try-catch:**

```json
{
  "actions": {
    "Try_scope": {
      "type": "Scope",
      "actions": {
        "Process_data": {
          "type": "Http",
          "inputs": {
            "method": "POST",
            "uri": "https://api.example.com/process",
            "body": "@triggerBody()",
            "retryPolicy": {
              "type": "exponential",
              "count": 3,
              "interval": "PT10S",
              "minimumInterval": "PT5S",
              "maximumInterval": "PT1H"
            },
            "authentication": {
              "type": "ManagedServiceIdentity",
              "audience": "https://api.example.com"
            }
          }
        }
      },
      "runAfter": {}
    },
    "Catch_scope": {
      "type": "Scope",
      "actions": {
        "Log_error": {
          "type": "Http",
          "inputs": {
            "method": "POST",
            "uri": "https://log-analytics-api.example.com/log",
            "body": {
              "workflowName": "@workflow().name",
              "runId": "@workflow().run.name",
              "error": "@result('Try_scope')",
              "timestamp": "@utcNow()"
            }
          }
        },
        "Send_alert": {
          "type": "ApiConnection",
          "inputs": {
            "host": { "connection": { "name": "@parameters('$connections')['teams']['connectionId']" } },
            "method": "post",
            "path": "/v1.0/teams/@{parameters('teamsChannelId')}/channels/@{parameters('alertChannelId')}/messages",
            "body": {
              "body": {
                "content": "Logic App failure: @{workflow().name} - @{result('Try_scope')[0]['error']['message']}"
              }
            }
          },
          "runAfter": { "Log_error": ["Succeeded"] }
        }
      },
      "runAfter": {
        "Try_scope": ["Failed", "TimedOut"]
      }
    },
    "Finally_scope": {
      "type": "Scope",
      "actions": {
        "Update_audit_log": {
          "type": "ApiConnection",
          "inputs": {
            "host": { "connection": { "name": "@parameters('$connections')['sql']['connectionId']" } },
            "method": "post",
            "path": "/v2/datasets/@{encodeURIComponent('default')}/tables/@{encodeURIComponent('[dbo].[AuditLog]')}/items",
            "body": {
              "WorkflowName": "@workflow().name",
              "RunId": "@workflow().run.name",
              "Status": "@if(equals(result('Try_scope')[0]['status'], 'Succeeded'), 'Success', 'Failed')",
              "Timestamp": "@utcNow()"
            }
          }
        }
      },
      "runAfter": {
        "Try_scope": ["Succeeded", "Failed", "TimedOut", "Skipped"],
        "Catch_scope": ["Succeeded", "Failed", "TimedOut", "Skipped"]
      }
    }
  }
}
```

### Step 6: Common workflow expressions

```text
# String functions
@concat('Hello, ', triggerBody()?['name'])
@substring('Hello World', 0, 5)                     => 'Hello'
@replace('Hello World', 'World', 'Azure')            => 'Hello Azure'
@toLower(triggerBody()?['email'])
@split('a,b,c', ',')                                => ['a','b','c']

# Date/time functions
@utcNow()                                            => '2024-01-15T10:30:00Z'
@addDays(utcNow(), 7)                                => 7 days from now
@formatDateTime(utcNow(), 'yyyy-MM-dd')              => '2024-01-15'
@convertTimeZone(utcNow(), 'UTC', 'Eastern Standard Time')

# Collection functions
@length(body('Get_items')?['value'])                  => count of items
@first(body('Get_items')?['value'])                   => first item
@last(body('Get_items')?['value'])                    => last item
@contains(createArray('a','b','c'), 'b')              => true

# Control flow
@if(equals(variables('status'), 'Approved'), 'Yes', 'No')
@coalesce(triggerBody()?['name'], 'Unknown')
@empty(triggerBody()?['items'])                       => true if null/empty

# JSON functions
@json('{"key":"value"}')
@xml(body('Get_response'))
@base64(triggerBody()?['file'])

# Workflow functions
@workflow().name                                      => Logic App name
@workflow().run.name                                  => Run ID
@actions('action_name').outputs.statusCode
@result('scope_name')                                 => scope execution results
```

### Step 7: Generate Terraform configuration

```hcl
# Consumption Logic App
resource "azurerm_logic_app_workflow" "main" {
  name                = "logic-${var.app_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  identity {
    type = "SystemAssigned"
  }

  workflow_parameters = {
    "$connections" = jsonencode({
      defaultValue = {}
      type         = "Object"
    })
  }

  access_control {
    trigger {
      allowed_caller_ip_address_range = ["10.0.0.0/8"]
    }
    content {
      allowed_caller_ip_address_range = ["10.0.0.0/8"]
    }
  }

  tags = var.common_tags
}

# HTTP trigger
resource "azurerm_logic_app_trigger_http_request" "main" {
  name         = "http-trigger"
  logic_app_id = azurerm_logic_app_workflow.main.id

  schema = jsonencode({
    type = "object"
    properties = {
      requestId = { type = "string" }
      data      = { type = "object" }
    }
  })
}

# Recurrence trigger
resource "azurerm_logic_app_trigger_recurrence" "daily" {
  name         = "daily-trigger"
  logic_app_id = azurerm_logic_app_workflow.main.id
  frequency    = "Day"
  interval     = 1
  time_zone    = "Eastern Standard Time"

  schedule {
    at_these_hours   = [8]
    at_these_minutes = [0]
  }
}

# HTTP action
resource "azurerm_logic_app_action_http" "call_api" {
  name         = "call-api"
  logic_app_id = azurerm_logic_app_workflow.main.id
  method       = "POST"
  uri          = "https://api.example.com/process"

  body = jsonencode({
    data = "@triggerBody()"
  })

  headers = {
    "Content-Type" = "application/json"
  }

  run_after {}
}

# Standard Logic App
resource "azurerm_logic_app_standard" "main" {
  name                       = "logic-std-${var.app_name}-${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  app_service_plan_id        = azurerm_service_plan.logic.id
  storage_account_name       = azurerm_storage_account.logic.name
  storage_account_access_key = azurerm_storage_account.logic.primary_access_key
  virtual_network_subnet_id  = azurerm_subnet.logic.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    dotnet_framework_version         = "v6.0"
    vnet_route_all_enabled           = true
    min_tls_version                  = "1.2"
    ftps_state                       = "Disabled"
    elastic_instance_minimum         = 1
    app_scale_limit                  = 10
    runtime_scale_monitoring_enabled = true
  }

  app_settings = {
    "FUNCTIONS_EXTENSION_VERSION"    = "~4"
    "FUNCTIONS_WORKER_RUNTIME"       = "node"
    "WEBSITE_NODE_DEFAULT_VERSION"   = "~18"
  }

  tags = var.common_tags
}
```

### Step 8: Monitoring and diagnostics

```bicep
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'logic-diagnostics'
  scope: logicApp
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      { category: 'WorkflowRuntime', enabled: true }
    ]
    metrics: [
      { category: 'AllMetrics', enabled: true }
    ]
  }
}
```

**Key metrics:**
- `RunsStarted` / `RunsCompleted` / `RunsFailed` - Workflow execution stats
- `RunLatency` - End-to-end workflow duration
- `ActionLatency` - Individual action duration
- `TriggersFired` / `TriggersSucceeded` / `TriggersFailed` - Trigger health
- `BillableActionExecutions` / `BillableTriggerExecutions` - Cost tracking

### Consumption vs Standard comparison

| Feature | Consumption | Standard |
|---------|-------------|----------|
| Hosting | Serverless, multi-tenant | Single-tenant, App Service |
| Pricing | Pay per execution | Fixed plan cost |
| VNET | Not supported | Full VNET integration |
| Workflows | One per Logic App resource | Multiple per Logic App |
| Stateful/Stateless | Stateful only | Both stateful and stateless |
| Deployment slots | No | Yes |
| Local development | No | VS Code extension |
| Scale | Automatic | Configurable (1-10+ instances) |
| SLA | 99.9% | 99.95% |

### Best practices

- **Use Standard for production** - VNET integration, deployment slots, better isolation
- **Implement error handling** - Use scopes for try-catch-finally patterns
- **Use managed identity** - Authenticate to Azure services without connection strings
- **Parameterize workflows** - Use parameters for environment-specific values
- **Enable diagnostic logging** - Send logs to Log Analytics for monitoring
- **Use tracked properties** - Add custom tracking data to action outputs for querying
- **Limit connector permissions** - Use API connections with least-privilege credentials
- **Implement retry policies** - Configure exponential backoff for transient failures
- **Use concurrency control** - Set `runtimeConfiguration.concurrency.repetitions` on loops
- **Version workflows** - Use ARM/Bicep templates in source control

### Anti-patterns

- **Deeply nested conditions** - Use Switch actions or separate child workflows
- **Large payloads in workflow state** - Use Blob Storage for files; pass references only
- **Polling triggers for real-time needs** - Use webhook or push-based triggers
- **Single monolithic workflow** - Break into child workflows for maintainability
- **Hardcoded connection strings** - Use Key Vault references and managed identity
- **Ignoring run history limits** - Consumption retains 90 days; archive if needed
- **Synchronous long-running operations** - Use async patterns with webhooks
- **Using Consumption for high-frequency triggers** - Cost can exceed Standard plan

### Security considerations

- Restrict trigger access with IP allowlists (`accessControl.triggers`)
- Use managed identity for all Azure service connections
- Secure inputs/outputs with obfuscation (`runtimeConfiguration.secureData`)
- Store secrets in Key Vault, not workflow parameters
- Enable HTTPS-only for Standard Logic Apps
- Use private endpoints for VNET-connected Logic Apps (Standard)
- Audit with Azure Monitor and Log Analytics
- Control access with Azure RBAC (Logic App Contributor, Logic App Operator)

### Cost optimization

- **Consumption**: Monitor billable executions; optimize loops and conditions to reduce action count
- **Standard**: Right-size the App Service Plan; use auto-scale rules
- **Reduce polling frequency**: Use longer intervals or event-based triggers
- **Use built-in connectors**: They cost less than managed/enterprise connectors
- **Avoid unnecessary actions**: Combine expressions instead of using multiple Compose actions
- **Use stateless workflows (Standard)**: Lower overhead for request-response patterns
- **Archive run history**: Configure retention to manage storage costs
- **Disable unused workflows**: Stop workflows that are not actively needed
