---
name: gcp-cloud-tasks
description: Generate Cloud Tasks queues with rate limiting, retries, and HTTP targets for reliable task execution. Use when the user wants to dispatch asynchronous work with guaranteed delivery and configurable retries.
argument-hint: "[target-type]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Cloud Tasks expert. Generate production-ready task queue configurations with rate limiting, retry policies, and secure HTTP/App Engine targets.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Target type**: HTTP target or App Engine target
- **Use case**: background processing, scheduled work, rate-limited API calls, webhooks
- **Rate requirements**: tasks per second, concurrent dispatches
- **Retry needs**: max attempts, backoff strategy
- **Authentication**: OIDC token, OAuth token, or none (internal)

### Step 2: Choose Cloud Tasks vs Pub/Sub

| Feature | Cloud Tasks | Pub/Sub |
|---------|------------|---------|
| Delivery | Exactly-once per task | At-least-once per message |
| Targeting | Specific HTTP endpoint | Multiple subscribers |
| Rate control | Built-in rate limiting | No built-in rate limiting |
| Scheduling | Future task execution | Immediate delivery |
| Deduplication | Task naming | No built-in dedup |
| Pattern | Task queue (1:1) | Pub/Sub (1:many) |
| Best for | Controlled dispatch to a service | Event-driven fan-out |

**Use Cloud Tasks when:**
- You need rate limiting on task dispatch
- You need to schedule tasks for future execution
- You need task-level deduplication
- You have a single target service per queue

**Use Pub/Sub when:**
- You need fan-out to multiple consumers
- You need message filtering
- You need exactly-once processing
- You need message replay (seek)

### Step 3: Generate queue configuration

**HTTP target queue (most common):**
```bash
gcloud tasks queues create my-queue \
  --location=us-central1 \
  --max-dispatches-per-second=500 \
  --max-concurrent-dispatches=100 \
  --max-attempts=5 \
  --min-backoff=1s \
  --max-backoff=300s \
  --max-doublings=4 \
  --max-retry-duration=3600s
```

**App Engine target queue:**
```bash
gcloud tasks queues create my-appengine-queue \
  --location=us-central1 \
  --max-dispatches-per-second=100 \
  --max-concurrent-dispatches=10 \
  --max-attempts=3 \
  --routing-override=service:worker,version:v1
```

**Terraform queue configuration:**
```hcl
resource "google_cloud_tasks_queue" "processing" {
  name     = "processing-queue"
  location = "us-central1"
  project  = var.project_id

  rate_limits {
    max_dispatches_per_second = 500
    max_concurrent_dispatches = 100
    max_burst_size            = 100
  }

  retry_config {
    max_attempts       = 5
    max_retry_duration = "3600s"
    min_backoff        = "1s"
    max_backoff        = "300s"
    max_doublings      = 4
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0 # Log all tasks (reduce in production)
  }
}
```

### Step 4: Generate HTTP target tasks

**Create HTTP task with OIDC authentication:**
```python
from google.cloud import tasks_v2
from google.protobuf import timestamp_pb2
import json
import datetime

client = tasks_v2.CloudTasksClient()
parent = client.queue_path("my-project", "us-central1", "my-queue")

def create_http_task(
    url: str,
    payload: dict,
    schedule_time: datetime.datetime = None,
    task_id: str = None,
):
    """Create an HTTP task with OIDC authentication."""
    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST,
            "url": url,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(payload).encode(),
            "oidc_token": {
                "service_account_email": "task-invoker@my-project.iam.gserviceaccount.com",
                "audience": url,
            },
        },
    }

    # Optional: Schedule for future execution
    if schedule_time:
        timestamp = timestamp_pb2.Timestamp()
        timestamp.FromDatetime(schedule_time)
        task["schedule_time"] = timestamp

    # Optional: Task name for deduplication
    if task_id:
        task["name"] = f"{parent}/tasks/{task_id}"

    response = client.create_task(parent=parent, task=task)
    print(f"Created task: {response.name}")
    return response

# Create an immediate task
create_http_task(
    url="https://my-service.run.app/process",
    payload={"order_id": "123", "action": "fulfill"},
)

# Schedule a task for 30 minutes from now
create_http_task(
    url="https://my-service.run.app/reminder",
    payload={"user_id": "456", "type": "cart_abandonment"},
    schedule_time=datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
)

# Create a task with deduplication (same task_id = rejected if already exists)
create_http_task(
    url="https://my-service.run.app/process",
    payload={"order_id": "123"},
    task_id="process-order-123",  # Idempotent task creation
)
```

**Node.js HTTP task creation:**
```javascript
const { CloudTasksClient } = require("@google-cloud/tasks");

const client = new CloudTasksClient();

async function createHttpTask(queuePath, url, payload, options = {}) {
  const task = {
    httpRequest: {
      httpMethod: "POST",
      url,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      oidcToken: {
        serviceAccountEmail: "task-invoker@my-project.iam.gserviceaccount.com",
        audience: url,
      },
    },
  };

  // Schedule for future execution
  if (options.scheduleTime) {
    task.scheduleTime = {
      seconds: Math.floor(options.scheduleTime.getTime() / 1000),
    };
  }

  // Task name for deduplication
  if (options.taskId) {
    task.name = `${queuePath}/tasks/${options.taskId}`;
  }

  const [response] = await client.createTask({
    parent: queuePath,
    task,
  });

  console.log(`Created task: ${response.name}`);
  return response;
}

const queue = client.queuePath("my-project", "us-central1", "my-queue");
await createHttpTask(queue, "https://my-service.run.app/process", {
  order_id: "123",
});
```

### Step 5: Generate App Engine target tasks

```python
from google.cloud import tasks_v2
import json

client = tasks_v2.CloudTasksClient()
parent = client.queue_path("my-project", "us-central1", "my-appengine-queue")

def create_appengine_task(relative_uri: str, payload: dict, service: str = "default"):
    """Create an App Engine task."""
    task = {
        "app_engine_http_request": {
            "http_method": tasks_v2.HttpMethod.POST,
            "relative_uri": relative_uri,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(payload).encode(),
            "app_engine_routing": {
                "service": service,
            },
        },
    }

    response = client.create_task(parent=parent, task=task)
    print(f"Created task: {response.name}")
    return response

# No authentication needed for App Engine targets (handled automatically)
create_appengine_task(
    relative_uri="/worker/process",
    payload={"order_id": "123"},
    service="worker",
)
```

### Step 6: Generate task handler (receiver)

**Cloud Run task handler (Python/Flask):**
```python
from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logger = logging.getLogger(__name__)

@app.route("/process", methods=["POST"])
def process_task():
    """Handle a Cloud Tasks request."""
    # Verify the request is from Cloud Tasks
    task_name = request.headers.get("X-CloudTasks-TaskName")
    queue_name = request.headers.get("X-CloudTasks-QueueName")
    retry_count = int(request.headers.get("X-CloudTasks-TaskRetryCount", 0))
    execution_count = int(request.headers.get("X-CloudTasks-TaskExecutionCount", 0))

    if not task_name:
        logger.warning("Request missing Cloud Tasks headers")
        return jsonify({"error": "Not a Cloud Tasks request"}), 400

    logger.info(
        f"Processing task: {task_name}, queue: {queue_name}, "
        f"retry: {retry_count}, execution: {execution_count}"
    )

    try:
        payload = request.get_json()
        # Process the task...

        return jsonify({"status": "ok"}), 200
    except Exception as e:
        logger.error(f"Task processing failed: {e}")
        # Return 5xx to trigger retry, 2xx to acknowledge
        # Return 4xx for non-retryable errors
        return jsonify({"error": str(e)}), 500
```

**Cloud Run handler (Node.js/Express):**
```javascript
const express = require("express");
const app = express();
app.use(express.json());

app.post("/process", async (req, res) => {
  const taskName = req.headers["x-cloudtasks-taskname"];
  const queueName = req.headers["x-cloudtasks-queuename"];
  const retryCount = parseInt(req.headers["x-cloudtasks-taskretrycount"] || "0");

  if (!taskName) {
    return res.status(400).json({ error: "Not a Cloud Tasks request" });
  }

  console.log(`Processing task: ${taskName}, retry: ${retryCount}`);

  try {
    const payload = req.body;
    // Process the task...

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Task failed:", error);
    // 5xx triggers retry, 2xx acknowledges, 4xx drops (no retry)
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 8080);
```

### Step 7: Generate queue management operations

```bash
# Pause a queue (stop dispatching tasks)
gcloud tasks queues pause my-queue --location=us-central1

# Resume a queue
gcloud tasks queues resume my-queue --location=us-central1

# Purge all tasks from a queue
gcloud tasks queues purge my-queue --location=us-central1

# Update queue rate limits
gcloud tasks queues update my-queue \
  --location=us-central1 \
  --max-dispatches-per-second=1000 \
  --max-concurrent-dispatches=200

# List tasks in a queue
gcloud tasks list --queue=my-queue --location=us-central1

# Delete a specific task
gcloud tasks delete TASK_ID --queue=my-queue --location=us-central1
```

### Step 8: Generate IAM configuration

```hcl
# Service account for task creation
resource "google_service_account" "task_creator" {
  account_id   = "task-creator"
  display_name = "Task Creator Service Account"
}

# Permission to create tasks in the queue
resource "google_cloud_tasks_queue_iam_member" "enqueuer" {
  name     = google_cloud_tasks_queue.processing.id
  location = google_cloud_tasks_queue.processing.location
  role     = "roles/cloudtasks.enqueuer"
  member   = "serviceAccount:${google_service_account.task_creator.email}"
}

# Service account for OIDC authentication on HTTP targets
resource "google_service_account" "task_invoker" {
  account_id   = "task-invoker"
  display_name = "Task Invoker Service Account"
}

# Permission to invoke Cloud Run service
resource "google_cloud_run_service_iam_member" "invoker" {
  service  = google_cloud_run_v2_service.worker.name
  location = google_cloud_run_v2_service.worker.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.task_invoker.email}"
}

# Permission to generate OIDC tokens
resource "google_service_account_iam_member" "token_creator" {
  service_account_id = google_service_account.task_invoker.id
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.task_creator.email}"
}
```

### Step 9: Task TTL and deduplication

```python
# Task with dispatch deadline (TTL)
task = {
    "http_request": {
        "http_method": tasks_v2.HttpMethod.POST,
        "url": "https://my-service.run.app/process",
        "body": json.dumps(payload).encode(),
        "oidc_token": {
            "service_account_email": "task-invoker@my-project.iam.gserviceaccount.com",
        },
    },
    # Task will be deleted if not dispatched within 30 minutes
    "dispatch_deadline": {"seconds": 1800},
}

# Deduplication via task naming
# Same task name within dedup window (~1 hour after deletion) is rejected
task_name = f"{parent}/tasks/order-{order_id}-{idempotency_key}"
task["name"] = task_name

try:
    response = client.create_task(parent=parent, task=task)
except google.api_core.exceptions.AlreadyExists:
    print("Task already exists (deduplicated)")
```

### Step 10: Monitoring and alerting

```yaml
# Cloud Monitoring alert policy for queue depth
resource "google_monitoring_alert_policy" "queue_depth" {
  display_name = "Cloud Tasks Queue Depth Alert"

  conditions {
    display_name = "Queue depth exceeds threshold"
    condition_threshold {
      filter          = "resource.type = \"cloud_tasks_queue\" AND metric.type = \"cloudtasks.googleapis.com/queue/depth\""
      comparison      = "COMPARISON_GT"
      threshold_value = 10000
      duration        = "300s"

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MAX"
      }
    }
  }

  notification_channels = [var.notification_channel_id]
}
```

**Key metrics to monitor:**
- `cloudtasks.googleapis.com/queue/depth` - number of tasks in queue
- `cloudtasks.googleapis.com/api/request_count` - API calls by method
- `cloudtasks.googleapis.com/queue/task_attempt_count` - dispatch attempts
- `cloudtasks.googleapis.com/queue/task_attempt_delays` - dispatch latency

## Best practices

- **Use OIDC tokens** for HTTP target authentication (never rely on IP-based security)
- **Set appropriate rate limits** to protect downstream services from overload
- **Use task naming** for idempotent task creation (prevent duplicates)
- **Return correct HTTP status codes** from handlers: 2xx for success, 5xx for retryable errors, 4xx for permanent failures
- **Configure retry backoff** with exponential backoff and jitter to avoid thundering herd
- **Set dispatch deadlines** so stale tasks are dropped rather than processed late
- **Use separate queues** for different priority levels or rate requirements
- **Pause queues** during deployments or incidents to prevent task dispatch

## Anti-patterns

- Using Cloud Tasks for fan-out patterns (use Pub/Sub instead)
- Not authenticating HTTP targets (always use OIDC/OAuth tokens)
- Setting max-concurrent-dispatches too high, overwhelming the target service
- Using Cloud Tasks as a message broker between many services
- Not handling idempotency in task handlers (tasks can be dispatched more than once)
- Returning 2xx for failed processing (task will not retry)

## Cost optimization

- Cloud Tasks pricing is per million operations (very cost-effective)
- Use appropriate rate limits to avoid provisioning excess target capacity
- Clean up completed queues that are no longer needed
- Use batch operations where possible to reduce API call count
- Set task TTL to avoid processing stale tasks that waste compute

## Security considerations

- Always use OIDC or OAuth tokens for HTTP target authentication
- Restrict queue IAM permissions (separate enqueuer from admin roles)
- Use VPC Service Controls to restrict Cloud Tasks API access
- Validate task headers (`X-CloudTasks-*`) in handlers to verify origin
- Never embed secrets in task payloads; reference them by ID
- Use separate service accounts for task creation vs task execution
