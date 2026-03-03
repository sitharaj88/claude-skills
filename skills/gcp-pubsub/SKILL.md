---
name: gcp-pubsub
description: Generate Pub/Sub topics, subscriptions, and messaging patterns for event-driven architectures on GCP. Use when the user wants to set up asynchronous messaging, streaming pipelines, or fan-out patterns.
argument-hint: "[pattern]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Pub/Sub messaging expert. Generate production-ready Pub/Sub configurations for topics, subscriptions, and messaging patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: fanout, queue, streaming, dead-letter, exactly-once
- **Delivery type**: pull, push, BigQuery subscription, Cloud Storage subscription
- **Volume**: messages per second, message size (max 10MB)
- **Ordering**: unordered (default) or ordered with ordering keys
- **Consumers**: Cloud Run, Cloud Functions, GKE, Dataflow, custom application

### Step 2: Generate topic configuration

Create Pub/Sub topic with appropriate settings:

```bash
# Create a topic
gcloud pubsub topics create my-topic \
  --message-retention-duration=7d \
  --labels=env=production,team=platform

# Create topic with schema validation (Avro)
gcloud pubsub schemas create my-schema \
  --type=AVRO \
  --definition-file=schema.avsc

gcloud pubsub topics create my-topic \
  --schema=my-schema \
  --message-encoding=JSON
```

**Topic configuration options:**
- Message retention duration (10 minutes to 31 days) for replay/seek
- Schema validation with Avro or Protocol Buffers
- Message encoding: JSON or BINARY (for Protocol Buffers)
- KMS encryption key for customer-managed encryption (CMEK)
- Labels for organization and cost tracking
- IAM bindings for publish access control

**Terraform example:**
```hcl
resource "google_pubsub_topic" "orders" {
  name = "orders-topic"

  labels = {
    env  = "production"
    team = "platform"
  }

  message_retention_duration = "604800s" # 7 days

  schema_settings {
    schema   = google_pubsub_schema.orders.id
    encoding = "JSON"
  }

  kms_key_name = google_kms_crypto_key.pubsub_key.id
}

resource "google_pubsub_schema" "orders" {
  name       = "orders-schema"
  type       = "AVRO"
  definition = file("schemas/order.avsc")
}
```

### Step 3: Generate subscription configuration

Create subscriptions based on delivery pattern:

**Pull subscription (default, most common):**
```bash
gcloud pubsub subscriptions create my-sub \
  --topic=my-topic \
  --ack-deadline=60 \
  --message-retention-duration=7d \
  --expiration-period=never \
  --enable-exactly-once-delivery \
  --dead-letter-topic=my-dlq-topic \
  --max-delivery-attempts=5 \
  --min-retry-delay=10s \
  --max-retry-delay=600s
```

**Push subscription (webhook-style):**
```bash
gcloud pubsub subscriptions create my-push-sub \
  --topic=my-topic \
  --push-endpoint=https://my-service.run.app/webhook \
  --push-auth-service-account=push-invoker@project.iam.gserviceaccount.com \
  --ack-deadline=60
```

**BigQuery subscription (direct write):**
```bash
gcloud pubsub subscriptions create my-bq-sub \
  --topic=my-topic \
  --bigquery-table=project:dataset.table \
  --use-topic-schema \
  --write-metadata \
  --drop-unknown-fields
```

**Cloud Storage subscription (batch export):**
```bash
gcloud pubsub subscriptions create my-gcs-sub \
  --topic=my-topic \
  --cloud-storage-bucket=my-bucket \
  --cloud-storage-file-prefix=events/ \
  --cloud-storage-file-suffix=.avro \
  --cloud-storage-max-duration=5m \
  --cloud-storage-max-bytes=1000000000
```

**Terraform subscription:**
```hcl
resource "google_pubsub_subscription" "orders_processor" {
  name  = "orders-processor-sub"
  topic = google_pubsub_topic.orders.id

  ack_deadline_seconds       = 60
  message_retention_duration = "604800s"
  retain_acked_messages      = false
  enable_exactly_once_delivery = true

  expiration_policy {
    ttl = "" # Never expires
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.orders_dlq.id
    max_delivery_attempts = 5
  }

  labels = {
    env = "production"
  }
}
```

### Step 4: Generate message ordering configuration

For ordered message delivery using ordering keys:

```python
from google.cloud import pubsub_v1
from google.api_core import retry

# Publisher with ordering enabled
publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path("my-project", "my-ordered-topic")

# All messages with the same ordering key are delivered in order
future = publisher.publish(
    topic_path,
    data=b"order-update",
    ordering_key="customer-123",  # Messages with same key delivered in order
)
result = future.result()

# Subscription must enable message ordering
# gcloud pubsub subscriptions create my-sub \
#   --topic=my-ordered-topic \
#   --enable-message-ordering
```

**Ordering key strategy:**
- Use entity ID (customer ID, order ID) as ordering key
- Messages with different ordering keys are delivered in parallel
- Messages with the same ordering key are delivered sequentially
- Ordering is per-subscription, not per-topic
- If a message fails ack, subsequent messages with the same key are held

### Step 5: Generate publisher code with batching

```python
from google.cloud import pubsub_v1
from google.cloud.pubsub_v1.types import BatchSettings
import json

# Configure publish batching for throughput
batch_settings = BatchSettings(
    max_messages=100,        # Batch up to 100 messages
    max_bytes=1_000_000,     # Batch up to 1MB
    max_latency=0.01,        # Flush every 10ms
)

publisher = pubsub_v1.PublisherClient(batch_settings=batch_settings)
topic_path = publisher.topic_path("my-project", "my-topic")

def publish_message(data: dict, attributes: dict = None):
    """Publish a message with attributes."""
    message_bytes = json.dumps(data).encode("utf-8")
    attrs = attributes or {}
    future = publisher.publish(
        topic_path,
        data=message_bytes,
        **attrs,  # Message attributes for filtering
    )
    return future.result()

# Publish with attributes for filtering
publish_message(
    data={"order_id": "123", "status": "completed"},
    attributes={"event_type": "order.completed", "region": "us-east1"},
)
```

**Node.js publisher:**
```javascript
const { PubSub } = require("@google-cloud/pubsub");

const pubsub = new PubSub({ projectId: "my-project" });
const topic = pubsub.topic("my-topic", {
  batching: {
    maxMessages: 100,
    maxMilliseconds: 10,
  },
});

async function publishMessage(data, attributes = {}) {
  const messageBuffer = Buffer.from(JSON.stringify(data));
  const messageId = await topic.publishMessage({
    data: messageBuffer,
    attributes,
  });
  console.log(`Message ${messageId} published.`);
  return messageId;
}
```

### Step 6: Generate subscriber code with flow control

```python
from google.cloud import pubsub_v1
from concurrent.futures import TimeoutError
import json

subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path("my-project", "my-sub")

def callback(message):
    """Process a message."""
    try:
        data = json.loads(message.data.decode("utf-8"))
        attributes = dict(message.attributes)
        print(f"Processing: {data}, attributes: {attributes}")

        # Process the message...

        message.ack()
    except Exception as e:
        print(f"Error processing message: {e}")
        message.nack()  # Message will be redelivered

# Flow control: limit outstanding messages
flow_control = pubsub_v1.types.FlowControl(
    max_messages=100,           # Max outstanding messages
    max_bytes=100 * 1024 * 1024,  # Max outstanding bytes (100MB)
    max_lease_duration=3600,    # Max time to hold a message (seconds)
)

streaming_pull_future = subscriber.subscribe(
    subscription_path,
    callback=callback,
    flow_control=flow_control,
)

print(f"Listening on {subscription_path}...")
try:
    streaming_pull_future.result(timeout=None)
except TimeoutError:
    streaming_pull_future.cancel()
    streaming_pull_future.result()
```

**Node.js subscriber:**
```javascript
const { PubSub } = require("@google-cloud/pubsub");

const pubsub = new PubSub();
const subscription = pubsub.subscription("my-sub", {
  flowControl: {
    maxMessages: 100,
    allowExcessMessages: false,
  },
});

subscription.on("message", async (message) => {
  try {
    const data = JSON.parse(message.data.toString());
    console.log("Processing:", data);

    // Process the message...

    message.ack();
  } catch (error) {
    console.error("Error:", error);
    message.nack();
  }
});

subscription.on("error", (error) => {
  console.error("Subscription error:", error);
});
```

### Step 7: Generate message filtering

Filter messages at the subscription level to reduce consumer processing:

```bash
# Create subscription with filter
gcloud pubsub subscriptions create filtered-sub \
  --topic=my-topic \
  --message-filter='attributes.event_type = "order.completed"'
```

**Filter syntax examples:**
```
# Exact match
attributes.event_type = "order.completed"

# NOT match
NOT attributes.event_type = "test"

# Has attribute
hasPrefix(attributes.region, "us-")

# Combine with AND/OR
attributes.event_type = "order.completed" AND attributes.region = "us-east1"

# Numeric comparison (cast required)
attributes:priority AND cast(attributes.priority, "int") > 5
```

**Terraform with filter:**
```hcl
resource "google_pubsub_subscription" "high_priority" {
  name   = "high-priority-orders-sub"
  topic  = google_pubsub_topic.orders.id
  filter = "attributes.priority = \"high\""

  ack_deadline_seconds = 30
}
```

### Step 8: Generate dead-letter topic pattern

```hcl
# Dead-letter topic
resource "google_pubsub_topic" "orders_dlq" {
  name = "orders-dlq-topic"
}

# DLQ subscription for monitoring/reprocessing
resource "google_pubsub_subscription" "orders_dlq_sub" {
  name  = "orders-dlq-sub"
  topic = google_pubsub_topic.orders_dlq.id

  ack_deadline_seconds       = 600
  message_retention_duration = "1209600s" # 14 days

  expiration_policy {
    ttl = "" # Never expires
  }
}

# IAM: Grant Pub/Sub service account permission to publish to DLQ
resource "google_pubsub_topic_iam_member" "dlq_publisher" {
  topic  = google_pubsub_topic.orders_dlq.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

# IAM: Grant Pub/Sub service account permission to ack from source subscription
resource "google_pubsub_subscription_iam_member" "dlq_subscriber" {
  subscription = google_pubsub_subscription.orders_processor.id
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}
```

### Step 9: Generate snapshot and seek for replay

```bash
# Create a snapshot (point-in-time capture of ack state)
gcloud pubsub snapshots create my-snapshot \
  --subscription=my-sub

# Seek to snapshot (replay messages acked after snapshot)
gcloud pubsub subscriptions seek my-sub \
  --snapshot=my-snapshot

# Seek to timestamp (replay messages published after timestamp)
gcloud pubsub subscriptions seek my-sub \
  --time="2024-01-15T10:00:00Z"
```

### Step 10: Pub/Sub Lite for cost-sensitive workloads

```bash
# Create a Pub/Sub Lite reservation (provisioned capacity)
gcloud pubsub lite-reservations create my-reservation \
  --location=us-central1 \
  --throughput-capacity=10

# Create Lite topic
gcloud pubsub lite-topics create my-lite-topic \
  --location=us-central1-a \
  --partitions=4 \
  --per-partition-bytes=30GiB \
  --per-partition-publish-mib=4 \
  --per-partition-subscribe-mib=8 \
  --message-retention-period=7d

# Create Lite subscription
gcloud pubsub lite-subscriptions create my-lite-sub \
  --location=us-central1-a \
  --topic=my-lite-topic \
  --delivery-requirement=deliver-after-stored
```

**When to use Pub/Sub Lite vs standard:**
- Pub/Sub Lite: high-volume, cost-sensitive, can manage capacity (zonal)
- Standard Pub/Sub: global, fully managed, serverless, exactly-once delivery

### Step 11: Generate emulator configuration for testing

```bash
# Start the Pub/Sub emulator
gcloud beta emulators pubsub start --project=test-project --host-port=0.0.0.0:8085

# Set environment variable for client libraries
export PUBSUB_EMULATOR_HOST=localhost:8085

# Python client automatically connects to emulator when PUBSUB_EMULATOR_HOST is set
```

**Docker Compose for testing:**
```yaml
services:
  pubsub-emulator:
    image: gcr.io/google.com/cloudsdktool/google-cloud-cli:latest
    command: gcloud beta emulators pubsub start --project=test-project --host-port=0.0.0.0:8085
    ports:
      - "8085:8085"

  app:
    build: .
    environment:
      PUBSUB_EMULATOR_HOST: pubsub-emulator:8085
      GOOGLE_CLOUD_PROJECT: test-project
    depends_on:
      - pubsub-emulator
```

### Step 12: Cross-project subscriptions and IAM

```hcl
# Grant another project permission to subscribe
resource "google_pubsub_topic_iam_member" "cross_project_subscriber" {
  topic  = google_pubsub_topic.shared_events.id
  role   = "roles/pubsub.subscriber"
  member = "serviceAccount:consumer-sa@other-project.iam.gserviceaccount.com"
}

# Grant another project permission to create subscriptions on topic
resource "google_pubsub_topic_iam_member" "cross_project_attach" {
  topic  = google_pubsub_topic.shared_events.id
  role   = "roles/pubsub.viewer"
  member = "serviceAccount:consumer-sa@other-project.iam.gserviceaccount.com"
}
```

## Best practices

- **Use dead-letter topics** for all production subscriptions to capture failed messages
- **Enable message ordering** only when required (reduces throughput per ordering key)
- **Use message filtering** at the subscription level to reduce unnecessary processing
- **Configure flow control** on subscribers to prevent memory exhaustion
- **Set appropriate ack deadlines** based on processing time (10s to 600s)
- **Use batch publishing** for high-throughput producers (batch by count, bytes, or latency)
- **Enable exactly-once delivery** for financial or critical workloads
- **Set message retention** on topics to enable seek/replay for recovery
- **Use schema validation** to enforce message contracts between publishers and subscribers
- **Never set subscription expiration** for production subscriptions (set to "never")
- **Monitor** unacked message count and oldest unacked message age via Cloud Monitoring

## Anti-patterns

- Using Pub/Sub for synchronous request/response (use Cloud Tasks or HTTP instead)
- Creating one subscription per message type (use filtering instead)
- Setting ack deadline too low causing duplicate redelivery
- Not configuring dead-letter topics, losing failed messages silently
- Using ordering keys with high cardinality without understanding throughput impact
- Ignoring flow control, leading to OOM errors in subscribers

## Cost optimization

- Use Pub/Sub Lite for high-volume, cost-sensitive workloads
- Use BigQuery subscriptions to avoid intermediate processing
- Use message filtering to reduce delivered message volume
- Batch publish operations to reduce per-message overhead
- Set appropriate message retention (shorter = cheaper)
- Monitor and clean up unused subscriptions and topics

## Security considerations

- Use IAM to restrict who can publish/subscribe (principle of least privilege)
- Enable CMEK for encryption with customer-managed keys
- Use push subscription auth tokens (OIDC) for authenticated delivery
- Audit access with Cloud Audit Logs
- Use VPC Service Controls to restrict Pub/Sub access to authorized networks
- Avoid embedding secrets in message payloads; reference secrets by ID
