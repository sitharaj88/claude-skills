---
name: gcp-cloud-functions
description: Generate Cloud Functions with triggers, IAM, and deployment configs. Use when the user wants to create, configure, or deploy Google Cloud Functions with event-driven architectures.
argument-hint: "[runtime] [trigger type] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(npm *), Bash(pip *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a Google Cloud Functions expert. Generate production-ready Cloud Functions with proper configuration, triggers, and security.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Runtime**: Node.js 20 (`nodejs20`), Python 3.12 (`python312`), Go 1.22 (`go122`), Java 17 (`java17`), .NET 8 (`dotnet8`), Ruby 3.2 (`ruby32`), PHP 8.3 (`php83`)
- **Trigger**: HTTP, Pub/Sub, Cloud Storage, Firestore, Eventarc, Cloud Scheduler
- **Generation**: Gen 2 (default, Cloud Run-based) or Gen 1 (legacy)
- **Purpose**: What the function does

### Step 2: Choose generation

**Gen 2 (default, recommended):**
- Built on Cloud Run and Eventarc
- Concurrency up to 1000 requests per instance
- Up to 60 minutes timeout
- Supports traffic splitting
- Minimum instances for cold start mitigation
- Larger instance sizes (up to 16 GiB RAM, 4 vCPUs)

**Gen 1 (legacy, use only when required):**
- 1 concurrent request per instance
- Max 9 minutes timeout
- Simpler event model
- Use only for existing Gen 1 projects or specific legacy triggers

### Step 3: Generate function code

Create the function handler following best practices:

**Node.js 20 (HTTP trigger):**
```javascript
const functions = require('@google-cloud/functions-framework');
const { Logging } = require('@google-cloud/logging');

const logging = new Logging();
const log = logging.log('my-function');

functions.http('myFunction', async (req, res) => {
  const metadata = { resource: { type: 'cloud_function' } };

  try {
    // Validate request
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { data } = req.body;

    // Business logic here
    const result = await processData(data);

    // Structured logging
    const entry = log.entry(metadata, {
      severity: 'INFO',
      message: 'Function executed successfully',
      data: { inputSize: data.length, resultId: result.id },
    });
    await log.write(entry);

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Function error:', JSON.stringify({
      severity: 'ERROR',
      message: error.message,
      stack: error.stack,
    }));
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Node.js 20 (Pub/Sub trigger):**
```javascript
const functions = require('@google-cloud/functions-framework');

functions.cloudEvent('processPubSub', async (cloudEvent) => {
  const message = cloudEvent.data.message;
  const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const attributes = message.attributes || {};

  console.log(JSON.stringify({
    severity: 'INFO',
    message: 'Processing Pub/Sub message',
    messageId: cloudEvent.id,
    data,
    attributes,
  }));

  // Business logic here
  await processMessage(data, attributes);
});
```

**Python 3.12 (HTTP trigger):**
```python
import functions_framework
from google.cloud import logging as cloud_logging
import json

client = cloud_logging.Client()
client.setup_logging()
import logging

logger = logging.getLogger(__name__)

@functions_framework.http
def my_function(request):
    """HTTP Cloud Function."""
    try:
        if request.method != 'POST':
            return ('Method Not Allowed', 405)

        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({'error': 'Invalid JSON'}), 400)

        # Business logic
        result = process_data(request_json.get('data'))

        logger.info('Function executed', extra={
            'json_fields': {'result_id': result['id']}
        })

        return (json.dumps({'success': True, 'result': result}), 200)

    except Exception as e:
        logger.error(f'Function error: {str(e)}', exc_info=True)
        return (json.dumps({'error': 'Internal server error'}), 500)
```

**Python 3.12 (Cloud Storage trigger):**
```python
import functions_framework
from cloudevents.http import CloudEvent
from google.cloud import storage
import logging

logger = logging.getLogger(__name__)

@functions_framework.cloud_event
def process_file(cloud_event: CloudEvent):
    """Triggered by Cloud Storage event."""
    data = cloud_event.data
    bucket_name = data['bucket']
    file_name = data['name']

    logger.info(f'Processing file: gs://{bucket_name}/{file_name}')

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)

    content = blob.download_as_text()
    # Process file content
    process_content(content, file_name)
```

**Go 1.22 (HTTP trigger):**
```go
package function

import (
    "encoding/json"
    "fmt"
    "log/slog"
    "net/http"
    "os"

    "github.com/GoogleCloudPlatform/functions-framework-go/functions"
)

var logger *slog.Logger

func init() {
    logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))
    functions.HTTP("MyFunction", myFunction)
}

func myFunction(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var input InputData
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        logger.Error("Failed to decode input", "error", err)
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    result, err := processData(input)
    if err != nil {
        logger.Error("Processing failed", "error", err)
        http.Error(w, "Internal server error", http.StatusInternalServerError)
        return
    }

    logger.Info("Function executed", "resultId", result.ID)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(result)
}
```

### Step 4: Cold start optimization

Apply cold start mitigation strategies:

```yaml
# Min instances to keep warm (Gen 2)
# Set in deployment configuration
minInstanceCount: 1

# In function code, use lazy initialization
# Initialize expensive clients outside the handler
```

**Best practices for cold start:**
- Move client initialization outside the handler (module-level)
- Use minimum instances for latency-sensitive functions
- Choose smaller runtimes (Go, Node.js) over larger ones (Java, .NET)
- Minimize dependencies and bundle size
- Use lazy initialization for optional services
- For Node.js: avoid large `require()` trees at startup
- For Python: import only needed modules
- For Java: use GraalVM native image or minimize class loading

### Step 5: Secret Manager integration

```javascript
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize outside handler for reuse
const secretClient = new SecretManagerServiceClient();
let cachedSecret = null;

async function getSecret(secretName) {
  if (cachedSecret) return cachedSecret;

  const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
  });
  cachedSecret = version.payload.data.toString();
  return cachedSecret;
}
```

Or reference secrets directly in deployment:
```yaml
# In function deployment config
secretEnvironmentVariables:
  - key: DB_PASSWORD
    projectId: my-project
    secret: db-password
    version: latest
```

### Step 6: Generate deployment configuration

**gcloud CLI deployment (Gen 2):**
```bash
gcloud functions deploy my-function \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=myFunction \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --timeout=60s \
  --min-instances=1 \
  --max-instances=100 \
  --concurrency=80 \
  --service-account=my-function-sa@project-id.iam.gserviceaccount.com \
  --set-env-vars="NODE_ENV=production,LOG_LEVEL=info" \
  --set-secrets="DB_PASSWORD=db-password:latest" \
  --vpc-connector=projects/project-id/locations/us-central1/connectors/my-connector \
  --egress-settings=private-ranges-only
```

**Pub/Sub trigger deployment:**
```bash
gcloud functions deploy process-events \
  --gen2 \
  --runtime=python312 \
  --region=us-central1 \
  --source=. \
  --entry-point=process_pubsub \
  --trigger-topic=my-topic \
  --retry \
  --memory=512Mi \
  --timeout=120s \
  --max-instances=50 \
  --service-account=event-processor@project-id.iam.gserviceaccount.com
```

**Cloud Storage trigger deployment:**
```bash
gcloud functions deploy process-uploads \
  --gen2 \
  --runtime=python312 \
  --region=us-central1 \
  --source=. \
  --entry-point=process_file \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=my-bucket" \
  --memory=1Gi \
  --timeout=300s
```

**Terraform configuration:**
```hcl
resource "google_cloudfunctions2_function" "my_function" {
  name     = "my-function"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "myFunction"
    source {
      storage_source {
        bucket = google_storage_bucket.source_bucket.name
        object = google_storage_bucket_object.source_archive.name
      }
    }
  }

  service_config {
    max_instance_count    = 100
    min_instance_count    = 1
    available_memory      = "256Mi"
    available_cpu         = "1"
    timeout_seconds       = 60
    max_instance_request_concurrency = 80
    environment_variables = {
      NODE_ENV  = "production"
      LOG_LEVEL = "info"
    }
    service_account_email = google_service_account.function_sa.email
    vpc_connector         = google_vpc_access_connector.connector.id
    vpc_connector_egress_settings = "PRIVATE_RANGES_ONLY"
    secret_environment_variables {
      key        = "DB_PASSWORD"
      project_id = var.project_id
      secret     = google_secret_manager_secret.db_password.secret_id
      version    = "latest"
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.my_topic.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

resource "google_service_account" "function_sa" {
  account_id   = "my-function-sa"
  display_name = "My Function Service Account"
}

resource "google_project_iam_member" "function_roles" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/secretmanager.secretAccessor",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}
```

### Step 7: IAM and security

**Service account with least privilege:**
```bash
# Create dedicated service account
gcloud iam service-accounts create my-function-sa \
  --display-name="My Function Service Account"

# Grant only needed roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:my-function-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:my-function-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**HTTP authentication options:**
- `--allow-unauthenticated`: Public endpoint (APIs, webhooks)
- `--no-allow-unauthenticated`: Requires IAM `cloudfunctions.functions.invoke` (default)
- Use API Gateway or Cloud Endpoints for API key/OAuth

### Step 8: Testing

**Local testing with Functions Framework:**
```bash
# Node.js
npx @google-cloud/functions-framework --target=myFunction --port=8080

# Python
functions-framework --target=my_function --port=8080 --debug

# Go
FUNCTION_TARGET=MyFunction go run cmd/main.go
```

**Unit test example (Node.js):**
```javascript
const { getFunction } = require('@google-cloud/functions-framework/testing');
require('../index.js');

describe('myFunction', () => {
  it('should return 200 for valid POST', async () => {
    const myFunction = getFunction('myFunction');
    const req = {
      method: 'POST',
      body: { data: [1, 2, 3] },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await myFunction(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

### Step 9: Environment configuration

**Environment variables file (.env.yaml):**
```yaml
NODE_ENV: production
LOG_LEVEL: info
DB_HOST: /cloudsql/project:region:instance
CACHE_TTL: "3600"
```

Deploy with env file:
```bash
gcloud functions deploy my-function \
  --gen2 \
  --env-vars-file=.env.yaml \
  --runtime=nodejs20 \
  --source=.
```

### Best practices to follow:
- **Always use Gen 2** unless maintaining legacy Gen 1 functions
- **One function, one purpose** - keep functions focused and small
- **Use structured logging** with `console.log(JSON.stringify({severity, message, ...}))` or Cloud Logging client
- **Cache connections** outside the handler for reuse across invocations
- **Set concurrency > 1** for Gen 2 to handle multiple requests per instance (default 1, set 80+)
- **Use minimum instances** for production latency-sensitive functions
- **Never hardcode secrets** - use Secret Manager or environment variables
- **Set appropriate timeouts** - HTTP functions default 60s, event functions may need longer
- **Use VPC connectors** for private network resources, set egress to `private-ranges-only`
- **Implement retry logic** for event-driven functions (idempotency keys)
- **Use ARM64** when available for better price-performance

### Anti-patterns to avoid:
- Running background tasks after sending HTTP response (use Pub/Sub instead)
- Storing state in global variables across invocations (use database/cache)
- Using Gen 1 concurrency model for high-throughput workloads
- Granting `roles/editor` or `roles/owner` to function service accounts
- Deploying without memory/timeout limits
- Using synchronous calls to chain functions (use Pub/Sub or Workflows)

### Cost optimization:
- Set `max-instances` to cap spending
- Use concurrency > 1 in Gen 2 to serve more requests per instance
- Choose minimum required memory (CPU scales with memory)
- Use `cpu=0.083` for light workloads with infrequent traffic
- Clean up unused functions and their associated resources
- Consider Cloud Run directly for always-on workloads
