---
name: azure-monitor
description: Generate Azure Monitor configurations with alerts, dashboards, Log Analytics, Application Insights, and workbooks. Use when the user wants to set up monitoring and observability on Azure.
argument-hint: "[alert|dashboard|log-query|app-insights|workbook] [resource] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Monitor expert. Generate production-ready monitoring, alerting, and observability configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Monitoring type**: metric alerts, log alerts, activity log alerts, dashboards, workbooks
- **Resources**: App Service, AKS, Azure Functions, VMs, SQL Database, Cosmos DB, Storage
- **Alert channels**: email, SMS, webhook, Azure Functions, Logic Apps, ITSM
- **Observability needs**: logs, metrics, traces, application performance, availability

### Step 2: Generate Log Analytics workspace

**Bicep template:**
```bicep
param location string = resourceGroup().location
param workspaceName string

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 5
    }
  }
}

output workspaceId string = logAnalytics.id
output workspaceCustomerId string = logAnalytics.properties.customerId
```

**Terraform alternative:**
```hcl
resource "azurerm_log_analytics_workspace" "main" {
  name                       = var.workspace_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  sku                        = "PerGB2018"
  retention_in_days          = 90
  daily_quota_gb             = 5
  internet_ingestion_enabled = true
  internet_query_enabled     = true
}
```

### Step 3: Generate diagnostic settings

Configure diagnostic settings to send logs and metrics to Log Analytics:

**Bicep template:**
```bicep
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'send-to-log-analytics'
  scope: targetResource
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
  }
}
```

**Azure CLI:**
```bash
az monitor diagnostic-settings create \
  --name "send-to-la" \
  --resource "/subscriptions/{sub}/resourceGroups/{rg}/providers/{type}/{name}" \
  --workspace "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/{workspace}" \
  --logs '[{"categoryGroup":"allLogs","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
```

### Step 4: Generate KQL (Kusto Query Language) queries

**Error analysis:**
```kql
AppExceptions
| where TimeGenerated > ago(24h)
| summarize ErrorCount = count() by ExceptionType = type, ProblemId = problemId
| order by ErrorCount desc
| take 20
```

**Request performance percentiles:**
```kql
AppRequests
| where TimeGenerated > ago(1h)
| summarize
    AvgDuration = avg(DurationMs),
    P50 = percentile(DurationMs, 50),
    P95 = percentile(DurationMs, 95),
    P99 = percentile(DurationMs, 99),
    RequestCount = count()
  by bin(TimeGenerated, 5m), Name
| order by TimeGenerated desc
```

**Slow dependency calls:**
```kql
AppDependencies
| where TimeGenerated > ago(1h)
| where DurationMs > 1000
| summarize
    SlowCallCount = count(),
    AvgDuration = avg(DurationMs),
    MaxDuration = max(DurationMs)
  by Target, DependencyType = type, Name
| order by SlowCallCount desc
```

**Failed requests by endpoint:**
```kql
AppRequests
| where TimeGenerated > ago(24h)
| where Success == false
| summarize FailedCount = count(), TotalCount = countif(true) by Name, ResultCode
| extend FailureRate = round(todouble(FailedCount) / TotalCount * 100, 2)
| order by FailedCount desc
```

**Container Insights - pod resource usage:**
```kql
KubePodInventory
| where TimeGenerated > ago(1h)
| where ClusterName == "my-aks-cluster"
| join kind=inner (
    Perf
    | where ObjectName == "K8SContainer"
    | where CounterName in ("cpuUsageNanoCores", "memoryWorkingSetBytes")
) on $left.ContainerID == $right.InstanceName
| summarize AvgCPU = avg(CounterValue) by PodName = Name, CounterName
| evaluate pivot(CounterName, avg(AvgCPU))
```

**VM performance analysis:**
```kql
Perf
| where TimeGenerated > ago(1h)
| where ObjectName == "Processor" and CounterName == "% Processor Time"
| summarize AvgCPU = avg(CounterValue), MaxCPU = max(CounterValue) by Computer, bin(TimeGenerated, 5m)
| where AvgCPU > 80
| order by AvgCPU desc
```

**Custom log search for application errors:**
```kql
AppTraces
| where TimeGenerated > ago(4h)
| where SeverityLevel >= 3  // Warning and above
| where Message contains "Exception" or Message contains "Error"
| project TimeGenerated, Message, SeverityLevel, OperationId, AppRoleName
| order by TimeGenerated desc
| take 100
```

### Step 5: Generate metric alerts

**Static threshold alert (Bicep):**
```bicep
resource cpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'high-cpu-alert'
  location: 'global'
  properties: {
    description: 'Alert when CPU exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      targetResource.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCPU'
          metricName: 'CpuPercentage'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}
```

**Dynamic threshold alert (Bicep):**
```bicep
resource dynamicAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'response-time-anomaly'
  location: 'global'
  properties: {
    description: 'Alert when response time deviates from learned baseline'
    severity: 2
    enabled: true
    scopes: [
      targetResource.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTimeAnomaly'
          metricName: 'HttpResponseTime'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'GreaterOrLessThan'
          alertSensitivity: 'Medium'
          failingPeriods: {
            numberOfEvaluationPeriods: 4
            minFailingPeriodsToAlert: 3
          }
          timeAggregation: 'Average'
          criterionType: 'DynamicThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}
```

### Step 6: Generate log alerts

```bicep
resource logAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'high-error-rate'
  location: location
  properties: {
    description: 'Alert when error rate exceeds 5%'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [
      logAnalytics.id
    ]
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            AppRequests
            | where TimeGenerated > ago(15m)
            | summarize Total = count(), Failed = countif(Success == false)
            | extend ErrorRate = todouble(Failed) / Total * 100
            | where ErrorRate > 5
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
  }
}
```

### Step 7: Generate action groups

```bicep
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'critical-alerts-ag'
  location: 'global'
  properties: {
    groupShortName: 'CritAlerts'
    enabled: true
    emailReceivers: [
      {
        name: 'ops-team'
        emailAddress: 'ops-team@company.com'
        useCommonAlertSchema: true
      }
    ]
    smsReceivers: [
      {
        name: 'on-call'
        countryCode: '1'
        phoneNumber: '5551234567'
      }
    ]
    webhookReceivers: [
      {
        name: 'pagerduty'
        serviceUri: 'https://events.pagerduty.com/integration/key/enqueue'
        useCommonAlertSchema: true
      }
      {
        name: 'slack'
        serviceUri: 'https://hooks.slack.com/services/T00/B00/xxx'
        useCommonAlertSchema: false
      }
    ]
    azureFunctionReceivers: [
      {
        name: 'custom-handler'
        functionAppResourceId: functionApp.id
        functionName: 'AlertHandler'
        httpTriggerUrl: 'https://myapp.azurewebsites.net/api/AlertHandler'
        useCommonAlertSchema: true
      }
    ]
    logicAppReceivers: [
      {
        name: 'ticket-creator'
        resourceId: logicApp.id
        callbackUrl: logicApp.properties.accessEndpoint
        useCommonAlertSchema: true
      }
    ]
  }
}
```

### Step 8: Generate Application Insights configuration

**Bicep template:**
```bicep
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    DisableIpMasking: false
    DisableLocalAuth: true
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    RetentionInDays: 90
  }
}

output connectionString string = appInsights.properties.ConnectionString
output instrumentationKey string = appInsights.properties.InstrumentationKey
```

**Application Insights SDK configuration (Node.js):**
```javascript
const { ApplicationInsightsClient } = require('applicationinsights');

const appInsights = new ApplicationInsightsClient({
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
});

// Custom telemetry
appInsights.trackEvent({
  name: 'OrderPlaced',
  properties: { orderId: '12345', customerTier: 'premium' },
  measurements: { orderTotal: 99.99 },
});

// Custom metrics
appInsights.trackMetric({
  name: 'OrderProcessingTime',
  value: 250,
});

// Track dependencies
appInsights.trackDependency({
  target: 'payment-api',
  name: 'ProcessPayment',
  data: 'POST /api/payments',
  duration: 150,
  resultCode: 200,
  success: true,
  dependencyTypeName: 'HTTP',
});
```

**Availability test (Bicep):**
```bicep
resource availabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: 'homepage-availability'
  location: location
  kind: 'ping'
  tags: {
    'hidden-link:${appInsights.id}': 'Resource'
  }
  properties: {
    SyntheticMonitorId: 'homepage-test'
    Name: 'Homepage Availability'
    Enabled: true
    Frequency: 300
    Timeout: 30
    Kind: 'standard'
    RetryEnabled: true
    Locations: [
      { Id: 'us-va-ash-azr' }
      { Id: 'emea-gb-db3-azr' }
      { Id: 'apac-sg-sin-azr' }
    ]
    Request: {
      RequestUrl: 'https://myapp.azurewebsites.net'
      HttpVerb: 'GET'
      ParseDependentRequests: false
    }
    ValidationRules: {
      ExpectedHttpStatusCode: 200
      SSLCheck: true
      SSLCertRemainingLifetimeCheck: 7
    }
  }
}
```

### Step 9: Generate Azure Workbook

```json
{
  "version": "Notebook/1.0",
  "items": [
    {
      "type": 1,
      "content": {
        "json": "# Application Health Dashboard\n---"
      }
    },
    {
      "type": 9,
      "content": {
        "version": "KqlParameterItem/1.0",
        "parameters": [
          {
            "name": "TimeRange",
            "type": 4,
            "defaultValue": "Last 24 hours"
          }
        ]
      }
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "AppRequests\n| where TimeGenerated {TimeRange}\n| summarize Requests=count(), Failed=countif(Success==false), AvgDuration=avg(DurationMs) by bin(TimeGenerated, 5m)\n| order by TimeGenerated asc",
        "size": 0,
        "title": "Request Volume and Failures",
        "queryType": 0,
        "visualization": "timechart"
      }
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "AppRequests\n| where TimeGenerated {TimeRange}\n| summarize P50=percentile(DurationMs,50), P95=percentile(DurationMs,95), P99=percentile(DurationMs,99) by bin(TimeGenerated, 5m)",
        "size": 0,
        "title": "Response Time Percentiles",
        "queryType": 0,
        "visualization": "linechart"
      }
    }
  ]
}
```

### Step 10: Generate data collection rules

```bicep
resource dataCollectionRule 'Microsoft.Insights/dataCollectionRules@2022-06-01' = {
  name: 'vm-monitoring-dcr'
  location: location
  properties: {
    dataSources: {
      performanceCounters: [
        {
          name: 'perfCounters'
          streams: ['Microsoft-Perf']
          samplingFrequencyInSeconds: 60
          counterSpecifiers: [
            '\\Processor Information(_Total)\\% Processor Time'
            '\\Memory\\Available Bytes'
            '\\LogicalDisk(_Total)\\% Free Space'
            '\\Network Interface(*)\\Bytes Total/sec'
          ]
        }
      ]
      syslog: [
        {
          name: 'syslog'
          streams: ['Microsoft-Syslog']
          facilityNames: ['auth', 'authpriv', 'cron', 'daemon', 'kern', 'syslog']
          logLevels: ['Warning', 'Error', 'Critical', 'Alert', 'Emergency']
        }
      ]
    }
    destinations: {
      logAnalytics: [
        {
          workspaceResourceId: logAnalytics.id
          name: 'logAnalyticsWorkspace'
        }
      ]
    }
    dataFlows: [
      {
        streams: ['Microsoft-Perf', 'Microsoft-Syslog']
        destinations: ['logAnalyticsWorkspace']
      }
    ]
  }
}
```

### Step 11: Generate Container Insights configuration

```bicep
resource aksMonitoring 'Microsoft.ContainerService/managedClusters@2024-01-01' = {
  name: aksClusterName
  location: location
  properties: {
    addonProfiles: {
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalytics.id
          useAADAuth: 'true'
        }
      }
    }
  }
}
```

**Enable managed Prometheus and Grafana:**
```bicep
resource azureMonitorWorkspace 'Microsoft.Monitor/accounts@2023-04-03' = {
  name: 'prometheus-workspace'
  location: location
}

resource grafana 'Microsoft.Dashboard/grafana@2023-09-01' = {
  name: 'azure-grafana'
  location: location
  sku: { name: 'Standard' }
  identity: { type: 'SystemAssigned' }
  properties: {
    grafanaIntegrations: {
      azureMonitorWorkspaceIntegrations: [
        { azureMonitorWorkspaceResourceId: azureMonitorWorkspace.id }
      ]
    }
  }
}
```

### Best practices:
- Use workspace-based Application Insights (not classic) for unified log querying
- Set daily caps on Log Analytics workspace to control costs
- Use dynamic thresholds for metrics with natural patterns (traffic, CPU)
- Structure application logs as JSON for efficient KQL querying
- Use action groups with common alert schema for consistent notification handling
- Enable distributed tracing with correlation IDs across microservices
- Use data collection rules (DCR) instead of legacy diagnostic settings where possible
- Create workbooks for team-specific operational dashboards
- Use resource-specific diagnostic settings tables for better query performance
- Enable Container Insights for AKS with managed Prometheus and Grafana

### Anti-patterns to avoid:
- Do NOT set retention to maximum (730 days) without cost analysis
- Do NOT create individual alerts for each resource (use resource group or subscription scope)
- Do NOT use Instrumentation Key for Application Insights (use Connection String)
- Do NOT ignore alert fatigue (tune thresholds, use composite alerts)
- Do NOT skip sampling configuration in Application Insights (high-volume apps)
- Do NOT query across all tables (scope queries to specific tables for performance)
- Do NOT use legacy Log Alerts v1 API (migrate to Scheduled Query Rules)
- Do NOT send all log levels to Log Analytics (filter at source to control costs)

### Security considerations:
- Disable local authentication on Application Insights (use Azure AD)
- Use private link for Log Analytics workspace in enterprise scenarios
- Configure RBAC for workspace access (Reader, Contributor, Log Analytics Reader)
- Enable diagnostic settings audit logging for compliance
- Use customer-managed keys for data encryption at rest
- Restrict network access to Log Analytics workspace
- Use managed identity for data collection endpoints

### Cost optimization tips:
- **Log Analytics pricing**: PerGB2018 tier; consider commitment tiers at 100+ GB/day
- Set daily caps to prevent unexpected cost spikes
- Use Basic Logs tier for verbose logs that are rarely queried (90% cheaper)
- Archive logs to storage accounts for long-term retention (cheapest option)
- Filter unnecessary logs at the source with data collection rules
- Use sampling in Application Insights to reduce telemetry volume
- Monitor ingestion volume with `Usage` table: `Usage | summarize sum(Quantity) by DataType`
- Delete unused solutions and legacy agents
- Use resource-specific tables instead of AzureDiagnostics for better compression
- Right-size alert evaluation frequency (PT5M vs PT1M)
