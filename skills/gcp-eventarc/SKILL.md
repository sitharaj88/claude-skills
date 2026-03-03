---
name: gcp-eventarc
description: Generate Eventarc triggers for event-driven architectures on GCP with Cloud Audit Log events, direct events, and custom events. Use when the user wants to react to GCP resource changes or build event-driven systems.
argument-hint: "[source] [destination]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Eventarc expert. Generate production-ready event-driven architecture configurations using Eventarc triggers, channels, and event routing.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Event source**: Cloud Storage, Firestore, Cloud Audit Logs, Pub/Sub (custom), third-party
- **Destination**: Cloud Run, Cloud Functions (2nd gen), Workflows, GKE
- **Event type**: direct events, audit log events, or custom events
- **Filtering**: path pattern matching, attribute filtering
- **Region**: single region or multi-region routing

### Step 2: Understand event source types

**Direct events (60+ Google sources):**
- Cloud Storage: object create, delete, archive, metadata update
- Firestore: document create, update, delete, write
- Firebase: Authentication, Remote Config, Test Lab
- Cloud Memorystore: instance events
- Low latency, no audit log dependency

**Cloud Audit Log events (100+ Google services):**
- Any GCP API call captured in audit logs
- BigQuery: job complete, table create/delete
- Compute Engine: instance create, delete, start, stop
- Cloud SQL: instance create, failover
- GKE: cluster create, node pool update
- Higher latency (depends on audit log delivery)

**Custom events:**
- Published via Pub/Sub channels
- Any application-defined event in CloudEvents format
- Third-party providers (Datadog, Twilio, etc.)

### Step 3: Generate direct event triggers

**Cloud Storage trigger (Cloud Run):**
```bash
gcloud eventarc triggers create storage-trigger \
  --location=us-central1 \
  --destination-run-service=my-processor \
  --destination-run-region=us-central1 \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=my-bucket" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

**Cloud Storage trigger with path pattern:**
```bash
gcloud eventarc triggers create upload-trigger \
  --location=us-central1 \
  --destination-run-service=image-processor \
  --destination-run-region=us-central1 \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=my-uploads" \
  --event-filters-path-pattern="name=/images/*.jpg" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

**Firestore trigger (Cloud Functions 2nd gen):**
```bash
gcloud eventarc triggers create firestore-trigger \
  --location=us-central1 \
  --destination-function=process-order \
  --destination-function-region=us-central1 \
  --event-filters="type=google.cloud.firestore.document.v1.created" \
  --event-filters="database=(default)" \
  --event-filters-path-pattern="document=orders/{orderId}" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

**Terraform direct event trigger:**
```hcl
resource "google_eventarc_trigger" "storage_trigger" {
  name     = "storage-upload-trigger"
  location = "us-central1"
  project  = var.project_id

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = google_storage_bucket.uploads.name
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.processor.name
      region  = "us-central1"
      path    = "/events/storage"
    }
  }

  service_account = google_service_account.eventarc_trigger.email

  labels = {
    env = "production"
  }
}
```

### Step 4: Generate Cloud Audit Log event triggers

**BigQuery job completion trigger:**
```bash
gcloud eventarc triggers create bq-job-trigger \
  --location=us-central1 \
  --destination-run-service=bq-processor \
  --destination-run-region=us-central1 \
  --event-filters="type=google.cloud.audit.log.v1.written" \
  --event-filters="serviceName=bigquery.googleapis.com" \
  --event-filters="methodName=google.cloud.bigquery.v2.JobService.InsertJob" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

**Compute Engine instance creation trigger:**
```bash
gcloud eventarc triggers create vm-create-trigger \
  --location=us-central1 \
  --destination-run-service=compliance-checker \
  --destination-run-region=us-central1 \
  --event-filters="type=google.cloud.audit.log.v1.written" \
  --event-filters="serviceName=compute.googleapis.com" \
  --event-filters="methodName=v1.compute.instances.insert" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

**Cloud SQL failover trigger:**
```bash
gcloud eventarc triggers create sql-failover-trigger \
  --location=us-central1 \
  --destination-run-service=incident-handler \
  --destination-run-region=us-central1 \
  --event-filters="type=google.cloud.audit.log.v1.written" \
  --event-filters="serviceName=sqladmin.googleapis.com" \
  --event-filters="methodName=cloudsql.instances.failover" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

**Terraform audit log trigger:**
```hcl
resource "google_eventarc_trigger" "audit_log_trigger" {
  name     = "vm-compliance-trigger"
  location = "us-central1"
  project  = var.project_id

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.audit.log.v1.written"
  }

  matching_criteria {
    attribute = "serviceName"
    value     = "compute.googleapis.com"
  }

  matching_criteria {
    attribute = "methodName"
    value     = "v1.compute.instances.insert"
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.compliance.name
      region  = "us-central1"
    }
  }

  service_account = google_service_account.eventarc_trigger.email
}
```

### Step 5: Generate custom event triggers

**Create a channel for custom events:**
```bash
# Create an Eventarc channel
gcloud eventarc channels create my-channel \
  --location=us-central1

# Create trigger for custom events on channel
gcloud eventarc triggers create custom-trigger \
  --location=us-central1 \
  --destination-run-service=event-handler \
  --destination-run-region=us-central1 \
  --channel=my-channel \
  --event-filters="type=com.mycompany.order.created" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

**Publish custom events (Python):**
```python
from google.cloud import eventarc_publishing_v1
from google.protobuf import any_pb2, timestamp_pb2
import json
import uuid
from datetime import datetime

client = eventarc_publishing_v1.PublisherClient()
channel = client.channel_path("my-project", "us-central1", "my-channel")

def publish_custom_event(event_type: str, data: dict, subject: str = None):
    """Publish a custom CloudEvent to an Eventarc channel."""
    cloud_event = eventarc_publishing_v1.CloudEvent(
        id=str(uuid.uuid4()),
        source="//my-service/orders",
        type=event_type,
        spec_version="1.0",
        data=json.dumps(data).encode("utf-8"),
    )

    if subject:
        cloud_event.subject = subject

    # Set custom attributes
    cloud_event.attributes["datacontenttype"] = (
        eventarc_publishing_v1.CloudEvent.CloudEventAttributeValue(
            ce_string="application/json"
        )
    )

    request = eventarc_publishing_v1.PublishEventsRequest(
        channel=channel,
        events=[cloud_event],
    )

    response = client.publish_events(request=request)
    print(f"Published event: {cloud_event.id}")
    return response

# Publish a custom event
publish_custom_event(
    event_type="com.mycompany.order.created",
    data={"order_id": "123", "customer_id": "456", "total": 99.99},
    subject="orders/123",
)
```

**Terraform custom event trigger:**
```hcl
resource "google_eventarc_channel" "custom" {
  name     = "custom-events-channel"
  location = "us-central1"
  project  = var.project_id
}

resource "google_eventarc_trigger" "custom_event" {
  name     = "order-created-trigger"
  location = "us-central1"
  project  = var.project_id

  matching_criteria {
    attribute = "type"
    value     = "com.mycompany.order.created"
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.order_handler.name
      region  = "us-central1"
    }
  }

  channel         = google_eventarc_channel.custom.id
  service_account = google_service_account.eventarc_trigger.email
}
```

### Step 6: Generate Workflows destination triggers

```bash
# Trigger a Workflow on Cloud Storage upload
gcloud eventarc triggers create workflow-trigger \
  --location=us-central1 \
  --destination-workflow=my-workflow \
  --destination-workflow-location=us-central1 \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=my-bucket" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

**Terraform Workflows trigger:**
```hcl
resource "google_eventarc_trigger" "workflow_trigger" {
  name     = "storage-workflow-trigger"
  location = "us-central1"

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = google_storage_bucket.input.name
  }

  destination {
    workflow = google_workflows_workflow.processing.id
  }

  service_account = google_service_account.eventarc_trigger.email
}
```

### Step 7: Generate event handler code

**Cloud Run event handler (Python/Flask):**
```python
from flask import Flask, request, jsonify
from cloudevents.http import from_http
import logging
import json

app = Flask(__name__)
logger = logging.getLogger(__name__)

@app.route("/events/storage", methods=["POST"])
def handle_storage_event():
    """Handle a Cloud Storage event via Eventarc."""
    # Parse CloudEvent
    event = from_http(request.headers, request.get_data())

    logger.info(f"Received event: type={event['type']}, source={event['source']}")
    logger.info(f"Event ID: {event['id']}, subject: {event.get('subject', 'N/A')}")

    # Extract event data
    data = event.data
    bucket = data.get("bucket")
    name = data.get("name")
    content_type = data.get("contentType")
    size = data.get("size")

    logger.info(f"File: gs://{bucket}/{name}, type: {content_type}, size: {size}")

    # Process the event...

    return jsonify({"status": "ok"}), 200

@app.route("/events/audit", methods=["POST"])
def handle_audit_event():
    """Handle a Cloud Audit Log event via Eventarc."""
    event = from_http(request.headers, request.get_data())

    data = event.data
    proto_payload = data.get("protoPayload", {})
    method_name = proto_payload.get("methodName")
    resource_name = proto_payload.get("resourceName")
    principal = proto_payload.get("authenticationInfo", {}).get("principalEmail")

    logger.info(f"Audit event: {method_name} on {resource_name} by {principal}")

    # Process the audit event...

    return jsonify({"status": "ok"}), 200

@app.route("/events/custom", methods=["POST"])
def handle_custom_event():
    """Handle a custom event via Eventarc."""
    event = from_http(request.headers, request.get_data())

    logger.info(f"Custom event: type={event['type']}, source={event['source']}")
    data = json.loads(event.data) if isinstance(event.data, (str, bytes)) else event.data

    # Process custom event...

    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
```

**Cloud Functions 2nd gen handler:**
```python
import functions_framework
from cloudevents.http import CloudEvent

@functions_framework.cloud_event
def handle_storage_event(cloud_event: CloudEvent):
    """Handle a Cloud Storage event."""
    data = cloud_event.data
    bucket = data["bucket"]
    name = data["name"]
    print(f"Processing file: gs://{bucket}/{name}")
    # Process the file...

@functions_framework.cloud_event
def handle_firestore_event(cloud_event: CloudEvent):
    """Handle a Firestore document event."""
    data = cloud_event.data
    # Old value (before change) and new value (after change)
    old_value = data.get("oldValue", {})
    new_value = data.get("value", {})
    print(f"Document changed: {cloud_event.get('document')}")
    # Process the document change...
```

### Step 8: Generate GKE destination trigger

```bash
# Create Eventarc trigger targeting a GKE service
gcloud eventarc triggers create gke-trigger \
  --location=us-central1 \
  --destination-gke-cluster=my-cluster \
  --destination-gke-location=us-central1 \
  --destination-gke-namespace=default \
  --destination-gke-service=my-service \
  --destination-gke-path=/events \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=my-bucket" \
  --service-account=eventarc-trigger@my-project.iam.gserviceaccount.com
```

### Step 9: Generate IAM configuration

```hcl
# Service account for Eventarc triggers
resource "google_service_account" "eventarc_trigger" {
  account_id   = "eventarc-trigger-sa"
  display_name = "Eventarc Trigger Service Account"
}

# Permission to invoke Cloud Run services
resource "google_cloud_run_service_iam_member" "eventarc_invoker" {
  service  = google_cloud_run_v2_service.processor.name
  location = google_cloud_run_v2_service.processor.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.eventarc_trigger.email}"
}

# Permission to receive events (required for Eventarc)
resource "google_project_iam_member" "eventarc_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.eventarc_trigger.email}"
}

# For Cloud Storage direct events: grant Pub/Sub publisher to GCS service account
resource "google_project_iam_member" "gcs_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-${data.google_project.current.number}@gs-project-accounts.iam.gserviceaccount.com"
}

# For Audit Log events: grant Cloud Audit Logs permissions
resource "google_project_iam_member" "audit_log_reader" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.eventarc_trigger.email}"
}

# For Workflows destination: grant Workflows invoker
resource "google_project_iam_member" "workflows_invoker" {
  project = var.project_id
  role    = "roles/workflows.invoker"
  member  = "serviceAccount:${google_service_account.eventarc_trigger.email}"
}
```

### Step 10: Event filtering with path patterns

```bash
# Match files in a specific directory
--event-filters-path-pattern="name=/uploads/images/*"

# Match Firestore documents with wildcards
--event-filters-path-pattern="document=users/{userId}/orders/{orderId}"

# Match specific file extensions
--event-filters-path-pattern="name=/*.csv"
```

**Supported filter operators:**
- Exact match: `--event-filters="attribute=value"`
- Path pattern: `--event-filters-path-pattern="attribute=pattern"`
- Path patterns support `*` (single segment) and `**` (multiple segments)

### Step 11: Cross-project event delivery

```bash
# In the source project, create a channel
gcloud eventarc channels create shared-channel \
  --location=us-central1 \
  --project=source-project

# In the destination project, create a trigger referencing the source channel
gcloud eventarc triggers create cross-project-trigger \
  --location=us-central1 \
  --project=destination-project \
  --destination-run-service=handler \
  --destination-run-region=us-central1 \
  --channel=projects/source-project/locations/us-central1/channels/shared-channel \
  --event-filters="type=com.mycompany.order.created" \
  --service-account=eventarc-trigger@destination-project.iam.gserviceaccount.com
```

## Best practices

- **Use direct events** instead of audit log events when available (lower latency)
- **Use path patterns** for fine-grained event filtering to reduce unnecessary invocations
- **Create dedicated service accounts** per trigger for least-privilege access
- **Handle duplicate events** idempotently (events may be delivered more than once)
- **Use CloudEvents SDK** for parsing events (not raw JSON parsing)
- **Log event IDs** for traceability and debugging
- **Use Workflows** as destination for complex multi-step event processing
- **Test with direct Pub/Sub publishing** before deploying Eventarc triggers

## Anti-patterns

- Using audit log events when direct events are available (higher latency, higher cost)
- Not configuring retry policies for transient failures
- Creating overly broad triggers without filtering (processing unnecessary events)
- Relying on event ordering (Eventarc does not guarantee order)
- Not handling the CloudEvents envelope format correctly
- Using Eventarc for high-frequency synchronous workflows (use Pub/Sub with pull)

## Cost optimization

- Use event filtering to reduce the number of triggered invocations
- Use direct events (cheaper than audit log routing)
- Batch process events in Cloud Run to amortize cold start costs
- Use Workflows for orchestration instead of chaining multiple Cloud Run services
- Clean up unused triggers to avoid unnecessary Pub/Sub topic costs

## Security considerations

- Always use dedicated service accounts per trigger (not default compute SA)
- Grant minimum required roles (eventarc.eventReceiver, run.invoker)
- Enable Cloud Audit Logging for Eventarc API calls
- Use VPC Service Controls to restrict event routing
- Validate CloudEvent headers and source in event handlers
- Use IAM conditions to restrict trigger creation to specific event types
