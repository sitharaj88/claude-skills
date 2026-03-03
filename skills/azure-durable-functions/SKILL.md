---
name: azure-durable-functions
description: Generate Durable Functions with orchestration patterns, entity functions, and stateful workflows. Use when the user wants to build complex serverless workflows on Azure.
argument-hint: "[chaining|fan-out|async-http|monitor|human-interaction|aggregator] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *), Bash(func *), Bash(npm *), Bash(pip *), Bash(dotnet *)
user-invocable: true
---

## Instructions

You are a Durable Functions expert. Generate production-ready orchestration patterns, activity functions, and entity functions for complex stateful workflows.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: function chaining, fan-out/fan-in, async HTTP API, monitor, human interaction, aggregator
- **Runtime**: Node.js (V4 model), Python (V2 model), .NET (isolated worker)
- **Use case**: order processing, approval workflow, batch processing, long-running operations
- **Storage provider**: Azure Storage (default), Netherite, MSSQL

### Step 2: Generate function chaining pattern

Sequential execution where the output of one function feeds into the next.

**Node.js (V4 model):**
```javascript
const { app } = require('@azure/functions');
const df = require('durable-functions');

// Orchestrator: chain activities sequentially
df.app.orchestration('orderProcessingOrchestrator', function* (context) {
  const orderId = context.df.getInput();

  // Step 1: Validate order
  const validationResult = yield context.df.callActivity('validateOrder', orderId);
  if (!validationResult.isValid) {
    return { status: 'rejected', reason: validationResult.reason };
  }

  // Step 2: Process payment
  const paymentResult = yield context.df.callActivity('processPayment', {
    orderId,
    amount: validationResult.total,
  });

  // Step 3: Reserve inventory
  const inventoryResult = yield context.df.callActivity('reserveInventory', {
    orderId,
    items: validationResult.items,
  });

  // Step 4: Send confirmation
  yield context.df.callActivity('sendConfirmation', {
    orderId,
    paymentId: paymentResult.paymentId,
    email: validationResult.customerEmail,
  });

  return { status: 'completed', orderId, paymentId: paymentResult.paymentId };
});

// Activity functions
df.app.activity('validateOrder', {
  handler: async (input, context) => {
    context.log(`Validating order: ${input}`);
    // Validate order logic
    return { isValid: true, total: 99.99, items: ['item1', 'item2'], customerEmail: 'user@example.com' };
  },
});

df.app.activity('processPayment', {
  handler: async (input, context) => {
    context.log(`Processing payment for order: ${input.orderId}`);
    // Payment processing logic
    return { paymentId: `PAY-${Date.now()}`, status: 'charged' };
  },
});

df.app.activity('reserveInventory', {
  handler: async (input, context) => {
    context.log(`Reserving inventory for order: ${input.orderId}`);
    // Inventory reservation logic
    return { reserved: true };
  },
});

df.app.activity('sendConfirmation', {
  handler: async (input, context) => {
    context.log(`Sending confirmation for order: ${input.orderId}`);
    // Email sending logic
  },
});

// HTTP trigger to start orchestration
app.http('startOrderProcessing', {
  methods: ['POST'],
  route: 'orders',
  extraInputs: [df.input.durableClient()],
  handler: async (req, context) => {
    const client = df.getClient(context);
    const body = await req.json();
    const instanceId = await client.startNew('orderProcessingOrchestrator', {
      input: body.orderId,
    });
    return client.createCheckStatusResponse(req, instanceId);
  },
});
```

**Python (V2 model):**
```python
import azure.functions as func
import azure.durable_functions as df

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)
bp = df.Blueprint()

@bp.orchestration_trigger(context_name="context")
def order_processing_orchestrator(context: df.DurableOrchestrationContext):
    order_id = context.get_input()

    validation = yield context.call_activity("validate_order", order_id)
    if not validation["is_valid"]:
        return {"status": "rejected", "reason": validation["reason"]}

    payment = yield context.call_activity("process_payment", {
        "order_id": order_id,
        "amount": validation["total"],
    })

    yield context.call_activity("reserve_inventory", {
        "order_id": order_id,
        "items": validation["items"],
    })

    yield context.call_activity("send_confirmation", {
        "order_id": order_id,
        "payment_id": payment["payment_id"],
    })

    return {"status": "completed", "order_id": order_id}

@bp.activity_trigger(input_name="orderId")
def validate_order(orderId: str):
    return {"is_valid": True, "total": 99.99, "items": ["item1"], "customer_email": "user@example.com"}

@bp.activity_trigger(input_name="input")
def process_payment(input: dict):
    return {"payment_id": f"PAY-{input['order_id']}", "status": "charged"}

@bp.activity_trigger(input_name="input")
def reserve_inventory(input: dict):
    return {"reserved": True}

@bp.activity_trigger(input_name="input")
def send_confirmation(input: dict):
    pass

app.register_functions(bp)
```

### Step 3: Generate fan-out/fan-in pattern

Execute multiple activities in parallel and aggregate results.

```javascript
df.app.orchestration('batchProcessingOrchestrator', function* (context) {
  const documents = context.df.getInput();

  // Fan-out: process all documents in parallel
  const parallelTasks = documents.map((doc) =>
    context.df.callActivity('processDocument', doc)
  );

  // Fan-in: wait for all parallel tasks to complete
  const results = yield context.df.Task.all(parallelTasks);

  // Aggregate results
  const summary = yield context.df.callActivity('aggregateResults', results);

  return summary;
});

df.app.activity('processDocument', {
  handler: async (document, context) => {
    context.log(`Processing document: ${document.id}`);
    // Process individual document
    return { id: document.id, status: 'processed', wordCount: 1500 };
  },
});

df.app.activity('aggregateResults', {
  handler: async (results, context) => {
    const totalDocs = results.length;
    const totalWords = results.reduce((sum, r) => sum + r.wordCount, 0);
    const succeeded = results.filter((r) => r.status === 'processed').length;
    return { totalDocs, totalWords, succeeded, failed: totalDocs - succeeded };
  },
});
```

**Fan-out with batching (for large workloads):**
```javascript
df.app.orchestration('largeBatchOrchestrator', function* (context) {
  const allItems = context.df.getInput();
  const batchSize = 50;
  const batches = [];

  // Split into batches
  for (let i = 0; i < allItems.length; i += batchSize) {
    batches.push(allItems.slice(i, i + batchSize));
  }

  // Process batches in parallel (with concurrency limit)
  const maxConcurrency = 10;
  const results = [];

  for (let i = 0; i < batches.length; i += maxConcurrency) {
    const batchTasks = batches.slice(i, i + maxConcurrency).map((batch) =>
      context.df.callActivity('processBatch', batch)
    );
    const batchResults = yield context.df.Task.all(batchTasks);
    results.push(...batchResults);
  }

  return { totalBatches: batches.length, results };
});
```

### Step 4: Generate async HTTP API pattern

Long-running operations with status polling.

```javascript
// HTTP trigger to start long-running operation
app.http('startLongRunningOperation', {
  methods: ['POST'],
  route: 'operations',
  extraInputs: [df.input.durableClient()],
  handler: async (req, context) => {
    const client = df.getClient(context);
    const body = await req.json();

    const instanceId = await client.startNew('longRunningOrchestrator', {
      input: body,
    });

    // Returns 202 with status query URLs:
    // - statusQueryGetUri: GET to check status
    // - sendEventPostUri: POST to send events
    // - terminatePostUri: POST to terminate
    // - purgeHistoryDeleteUri: DELETE to purge history
    return client.createCheckStatusResponse(req, instanceId);
  },
});

df.app.orchestration('longRunningOrchestrator', function* (context) {
  const input = context.df.getInput();

  // Set custom status for polling clients
  context.df.setCustomStatus({ stage: 'extracting', progress: 0 });
  const extracted = yield context.df.callActivity('extractData', input);

  context.df.setCustomStatus({ stage: 'transforming', progress: 33 });
  const transformed = yield context.df.callActivity('transformData', extracted);

  context.df.setCustomStatus({ stage: 'loading', progress: 66 });
  const loaded = yield context.df.callActivity('loadData', transformed);

  context.df.setCustomStatus({ stage: 'completed', progress: 100 });
  return loaded;
});

// Separate endpoint to check status
app.http('checkOperationStatus', {
  methods: ['GET'],
  route: 'operations/{instanceId}',
  extraInputs: [df.input.durableClient()],
  handler: async (req, context) => {
    const client = df.getClient(context);
    const instanceId = req.params.instanceId;

    const status = await client.getStatus(instanceId, {
      showHistory: false,
      showHistoryOutput: false,
      showInput: false,
    });

    if (!status) {
      return { status: 404, body: 'Operation not found' };
    }

    return {
      jsonBody: {
        instanceId: status.instanceId,
        runtimeStatus: status.runtimeStatus,
        customStatus: status.customStatus,
        output: status.output,
        createdTime: status.createdTime,
        lastUpdatedTime: status.lastUpdatedTime,
      },
    };
  },
});
```

### Step 5: Generate monitor/polling pattern

Periodic checks with flexible intervals (replaces cron jobs).

```javascript
df.app.orchestration('resourceProvisioningMonitor', function* (context) {
  const { resourceId, timeout, pollingInterval } = context.df.getInput();

  const expiryTime = new Date(context.df.currentUtcDateTime);
  expiryTime.setMinutes(expiryTime.getMinutes() + (timeout || 60));

  while (context.df.currentUtcDateTime < expiryTime) {
    // Check resource status
    const status = yield context.df.callActivity('checkResourceStatus', resourceId);

    if (status.state === 'Succeeded') {
      context.df.setCustomStatus({ state: 'completed' });
      return { status: 'completed', resourceId, provisionedAt: context.df.currentUtcDateTime };
    }

    if (status.state === 'Failed') {
      context.df.setCustomStatus({ state: 'failed', error: status.error });
      return { status: 'failed', resourceId, error: status.error };
    }

    // Not ready yet, wait before checking again
    context.df.setCustomStatus({ state: 'polling', lastCheck: context.df.currentUtcDateTime });
    const nextCheck = new Date(context.df.currentUtcDateTime);
    nextCheck.setSeconds(nextCheck.getSeconds() + (pollingInterval || 30));
    yield context.df.createTimer(nextCheck);
  }

  // Timeout
  return { status: 'timeout', resourceId };
});

df.app.activity('checkResourceStatus', {
  handler: async (resourceId, context) => {
    // Check the status of the resource being provisioned
    const response = await fetch(`https://api.example.com/resources/${resourceId}`);
    const data = await response.json();
    return { state: data.provisioningState, error: data.error };
  },
});
```

### Step 6: Generate human interaction pattern

Approval workflow with timeouts.

```javascript
df.app.orchestration('approvalOrchestrator', function* (context) {
  const request = context.df.getInput();

  // Send approval request notification
  yield context.df.callActivity('sendApprovalRequest', {
    requestId: context.df.instanceId,
    requester: request.requester,
    description: request.description,
    amount: request.amount,
    approverEmail: request.approverEmail,
  });

  // Wait for approval event OR timeout (3 business days)
  const approvalTimeout = new Date(context.df.currentUtcDateTime);
  approvalTimeout.setHours(approvalTimeout.getHours() + 72);

  const approvalEvent = context.df.waitForExternalEvent('ApprovalResponse');
  const timeoutEvent = context.df.createTimer(approvalTimeout);

  const winner = yield context.df.Task.any([approvalEvent, timeoutEvent]);

  if (winner === approvalEvent) {
    // Cancel the timeout timer
    timeoutEvent.cancel();

    const response = approvalEvent.result;
    if (response.approved) {
      yield context.df.callActivity('processApprovedRequest', {
        requestId: context.df.instanceId,
        ...request,
        approvedBy: response.approver,
      });
      return { status: 'approved', approvedBy: response.approver };
    } else {
      yield context.df.callActivity('notifyRejection', {
        requestId: context.df.instanceId,
        requester: request.requester,
        reason: response.reason,
      });
      return { status: 'rejected', reason: response.reason };
    }
  } else {
    // Timeout - escalate
    yield context.df.callActivity('escalateRequest', {
      requestId: context.df.instanceId,
      ...request,
    });
    return { status: 'escalated', reason: 'Approval timeout exceeded' };
  }
});

df.app.activity('sendApprovalRequest', {
  handler: async (input, context) => {
    // Send email/Teams notification with approve/reject links
    context.log(`Sending approval request to ${input.approverEmail}`);
    // The links should include the instance ID:
    // POST /api/approval/{instanceId} with body { approved: true/false }
  },
});

// External event trigger (called by approver via webhook/UI)
app.http('submitApproval', {
  methods: ['POST'],
  route: 'approval/{instanceId}',
  extraInputs: [df.input.durableClient()],
  handler: async (req, context) => {
    const client = df.getClient(context);
    const instanceId = req.params.instanceId;
    const body = await req.json();

    await client.raiseEvent(instanceId, 'ApprovalResponse', {
      approved: body.approved,
      approver: body.approver,
      reason: body.reason,
    });

    return { status: 202, body: 'Approval response recorded' };
  },
});
```

### Step 7: Generate entity functions (aggregator pattern)

Virtual actor pattern for stateful singleton entities.

```javascript
// Entity function: Shopping Cart (stateful)
df.app.entity('shoppingCart', (context) => {
  const state = context.df.getState(() => ({ items: [], total: 0 }));

  switch (context.df.operationName) {
    case 'addItem': {
      const item = context.df.getInput();
      state.items.push(item);
      state.total += item.price;
      break;
    }
    case 'removeItem': {
      const itemId = context.df.getInput();
      const index = state.items.findIndex((i) => i.id === itemId);
      if (index >= 0) {
        state.total -= state.items[index].price;
        state.items.splice(index, 1);
      }
      break;
    }
    case 'getCart':
      context.df.return(state);
      return;
    case 'checkout': {
      const result = { items: [...state.items], total: state.total };
      state.items = [];
      state.total = 0;
      context.df.return(result);
      break;
    }
    case 'clear':
      state.items = [];
      state.total = 0;
      break;
  }

  context.df.setState(state);
});

// Entity function: Counter (simple aggregator)
df.app.entity('counter', (context) => {
  let currentValue = context.df.getState(() => 0);

  switch (context.df.operationName) {
    case 'add':
      currentValue += context.df.getInput();
      break;
    case 'reset':
      currentValue = 0;
      break;
    case 'get':
      context.df.return(currentValue);
      return;
  }

  context.df.setState(currentValue);
});

// Use entities from orchestrator
df.app.orchestration('ecommerceOrchestrator', function* (context) {
  const userId = context.df.getInput();
  const entityId = new df.EntityId('shoppingCart', userId);

  // Signal entity (fire-and-forget)
  context.df.signalEntity(entityId, 'addItem', {
    id: 'prod-1',
    name: 'Widget',
    price: 29.99,
  });

  // Call entity (request-response)
  const cart = yield context.df.callEntity(entityId, 'getCart');

  return cart;
});

// HTTP API for entity operations
app.http('cartOperation', {
  methods: ['POST'],
  route: 'cart/{userId}/{operation}',
  extraInputs: [df.input.durableClient()],
  handler: async (req, context) => {
    const client = df.getClient(context);
    const { userId, operation } = req.params;
    const entityId = new df.EntityId('shoppingCart', userId);
    const body = await req.json().catch(() => null);

    await client.signalEntity(entityId, operation, body);
    return { status: 202, body: `Operation ${operation} sent to cart ${userId}` };
  },
});
```

### Step 8: Generate sub-orchestrations and eternal orchestrations

**Sub-orchestrations:**
```javascript
df.app.orchestration('parentOrchestrator', function* (context) {
  const regions = ['eastus', 'westeurope', 'southeastasia'];

  // Run sub-orchestrations in parallel
  const subOrchTasks = regions.map((region) =>
    context.df.callSubOrchestrator('regionDeploymentOrchestrator', region, `deploy-${region}`)
  );

  const results = yield context.df.Task.all(subOrchTasks);
  return { deployments: results };
});

df.app.orchestration('regionDeploymentOrchestrator', function* (context) {
  const region = context.df.getInput();

  yield context.df.callActivity('deployInfrastructure', region);
  yield context.df.callActivity('deployApplication', region);
  yield context.df.callActivity('runSmokeTests', region);

  return { region, status: 'deployed' };
});
```

**Eternal orchestration (continuous processing):**
```javascript
df.app.orchestration('continuousExportOrchestrator', function* (context) {
  const config = context.df.getInput();

  // Export data
  const exportResult = yield context.df.callActivity('exportData', config);

  // Log result
  yield context.df.callActivity('logExportResult', exportResult);

  // Wait for next interval (e.g., 1 hour)
  const nextRun = new Date(context.df.currentUtcDateTime);
  nextRun.setHours(nextRun.getHours() + 1);
  yield context.df.createTimer(nextRun);

  // Continue as new (resets history to avoid unbounded growth)
  context.df.continueAsNew(config);
});
```

### Step 9: Generate error handling and compensation

```javascript
df.app.orchestration('sagaOrchestrator', function* (context) {
  const order = context.df.getInput();
  const completedSteps = [];

  try {
    // Step 1: Reserve inventory
    yield context.df.callActivity('reserveInventory', order);
    completedSteps.push('inventory');

    // Step 2: Charge payment
    yield context.df.callActivity('chargePayment', order);
    completedSteps.push('payment');

    // Step 3: Schedule shipment
    yield context.df.callActivity('scheduleShipment', order);
    completedSteps.push('shipment');

    return { status: 'completed', orderId: order.id };
  } catch (error) {
    // Compensation: undo completed steps in reverse order
    context.df.setCustomStatus({ stage: 'compensating', error: error.message });

    const compensations = {
      shipment: 'cancelShipment',
      payment: 'refundPayment',
      inventory: 'releaseInventory',
    };

    for (const step of completedSteps.reverse()) {
      try {
        yield context.df.callActivity(compensations[step], order);
      } catch (compError) {
        // Log compensation failure but continue compensating
        yield context.df.callActivity('logCompensationFailure', {
          step,
          orderId: order.id,
          error: compError.message,
        });
      }
    }

    return { status: 'failed', orderId: order.id, error: error.message };
  }
});
```

**Retry policies on activity calls:**
```javascript
df.app.orchestration('retryOrchestrator', function* (context) {
  const retryOptions = new df.RetryOptions(
    5000,    // firstRetryIntervalInMilliseconds
    3        // maxNumberOfAttempts
  );
  retryOptions.backoffCoefficient = 2.0;
  retryOptions.maxRetryIntervalInMilliseconds = 30000;
  retryOptions.retryTimeoutInMilliseconds = 120000;

  const result = yield context.df.callActivityWithRetry(
    'unreliableActivity',
    retryOptions,
    inputData
  );

  return result;
});
```

### Step 10: Generate instance management

```javascript
app.http('manageInstances', {
  methods: ['GET', 'POST', 'DELETE'],
  route: 'manage/{action}',
  extraInputs: [df.input.durableClient()],
  handler: async (req, context) => {
    const client = df.getClient(context);
    const action = req.params.action;

    switch (action) {
      case 'query': {
        // Query running instances
        const instances = await client.getStatusAll();
        const running = instances.filter(
          (i) => i.runtimeStatus === 'Running' || i.runtimeStatus === 'Pending'
        );
        return { jsonBody: running };
      }

      case 'purge': {
        // Purge completed instances older than 7 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const purgeResult = await client.purgeInstancesBy(
          cutoff,
          undefined,
          [df.OrchestrationRuntimeStatus.Completed, df.OrchestrationRuntimeStatus.Failed]
        );
        return { jsonBody: { instancesDeleted: purgeResult.instancesDeleted } };
      }

      case 'terminate': {
        const instanceId = req.query.get('instanceId');
        await client.terminate(instanceId, 'Terminated by admin');
        return { body: `Instance ${instanceId} terminated` };
      }

      case 'rewind': {
        const instanceId = req.query.get('instanceId');
        await client.rewind(instanceId, 'Rewound by admin');
        return { body: `Instance ${instanceId} rewound` };
      }
    }
  },
});
```

### Step 11: Generate host.json configuration for Durable Functions

```json
{
  "version": "2.0",
  "extensions": {
    "durableTask": {
      "hubName": "MyTaskHub",
      "storageProvider": {
        "type": "AzureStorage",
        "connectionStringName": "AzureWebJobsStorage",
        "controlQueueBatchSize": 32,
        "controlQueueVisibilityTimeout": "00:05:00",
        "maxQueuePollingInterval": "00:00:30",
        "partitionCount": 4,
        "trackingStoreConnectionStringName": "AzureWebJobsStorage",
        "trackingStoreNamePrefix": "DurableFunctions",
        "useLegacyPartitionManagement": false
      },
      "tracing": {
        "traceInputsAndOutputs": false,
        "traceReplayEvents": false
      },
      "maxConcurrentActivityFunctions": 10,
      "maxConcurrentOrchestratorFunctions": 10,
      "extendedSessionsEnabled": true,
      "extendedSessionIdleTimeoutInSeconds": 30
    }
  }
}
```

**Netherite storage provider (high throughput):**
```json
{
  "extensions": {
    "durableTask": {
      "hubName": "MyTaskHub",
      "storageProvider": {
        "type": "Netherite",
        "StorageConnectionName": "AzureWebJobsStorage",
        "EventHubsConnectionName": "EventHubsConnection",
        "PartitionCount": 12
      }
    }
  }
}
```

**MSSQL storage provider:**
```json
{
  "extensions": {
    "durableTask": {
      "hubName": "MyTaskHub",
      "storageProvider": {
        "type": "MicrosoftSQL",
        "connectionStringName": "SQLDB_Connection",
        "createDatabaseIfNotExists": true,
        "schemaName": "dt"
      }
    }
  }
}
```

### Step 12: Generate infrastructure (Bicep/Terraform)

**Bicep for Durable Functions:**
```bicep
param location string = resourceGroup().location
param functionAppName string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: '${replace(functionAppName, '-', '')}stor'
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${functionAppName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

resource hostingPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: {
    name: 'EP1'  // Premium plan recommended for Durable Functions
    tier: 'ElasticPremium'
  }
  kind: 'elastic'
  properties: {
    maximumElasticWorkerCount: 20
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
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
        { name: 'DurableTask__HubName', value: 'MyTaskHub' }
      ]
      linuxFxVersion: 'NODE|20'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
    }
    httpsOnly: true
  }
}
```

### Best practices:
- Orchestrator functions MUST be deterministic (no random, no DateTime.Now, no I/O, no async)
- Use `context.df.currentUtcDateTime` instead of `new Date()` in orchestrators
- Use `context.df.newGuid()` instead of random UUID generators in orchestrators
- Keep activity functions small and focused (orchestrators coordinate, activities do work)
- Use sub-orchestrations to break down complex workflows
- Use `continueAsNew` for eternal orchestrations to prevent unbounded history growth
- Use entity functions for stateful aggregation instead of external databases
- Set appropriate `maxConcurrentActivityFunctions` to avoid overloading downstream services
- Enable extended sessions for reduced latency between orchestrator steps
- Use the Premium plan (EP1+) for predictable performance and VNET integration
- Implement the saga pattern with compensation for distributed transactions
- Use retry policies on activity calls for transient failures

### Anti-patterns to avoid:
- Do NOT perform I/O, HTTP calls, or database queries in orchestrator functions
- Do NOT use `await` or `async` in orchestrator generators (only `yield`)
- Do NOT use non-deterministic APIs (random, current time) in orchestrators
- Do NOT let orchestration history grow unbounded (use `continueAsNew`)
- Do NOT use Durable Functions for simple fire-and-forget tasks (use regular functions)
- Do NOT share task hub names between different function apps
- Do NOT ignore the replay behavior (orchestrators replay from the beginning on each step)
- Do NOT store large payloads in orchestrator input/output (use blob references)
- Do NOT use thread-local storage or static variables in orchestrators

### Security considerations:
- Secure the HTTP status endpoints (use function keys or Azure AD)
- Use managed identity for storage access
- Encrypt sensitive data in orchestrator inputs and entity state
- Use private endpoints for the storage account used by Durable Functions
- Implement authorization checks in the HTTP trigger before starting orchestrations
- Audit instance management operations (terminate, rewind, purge)
- Do not expose internal orchestration IDs to end users

### Cost optimization tips:
- **Consumption plan**: cheapest but has cold start and 10-minute timeout limit
- **Premium plan (EP1)**: recommended for Durable Functions (no cold start, pre-warmed instances)
- **Dedicated plan**: use for high-volume, predictable workloads
- Minimize the number of activity calls (each call has storage I/O overhead)
- Use `Task.all` for parallel execution instead of sequential calls
- Purge completed orchestration history regularly to reduce storage costs
- Use extended sessions to reduce dispatcher overhead between steps
- Monitor storage transactions with Application Insights (they are the primary cost driver)
- Consider Netherite storage provider for high-throughput scenarios (reduces storage costs)
- Set appropriate partition counts (default 4, increase for high throughput)
