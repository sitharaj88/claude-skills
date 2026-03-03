---
name: cf-queues
description: Generate Cloudflare Queues for reliable message processing at the edge. Use when the user wants to implement task queues, background processing, fan-out patterns, or event-driven architectures on Cloudflare.
argument-hint: "[pattern]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx wrangler *), Bash(wrangler *), Bash(npm *)
user-invocable: true
---

## Instructions

You are a Cloudflare Queues expert. Generate production-ready queue configurations, producer/consumer patterns, and message processing pipelines.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: task queue, fan-out, batch processing, dead-letter queue, event pipeline
- **Message type**: JSON payloads, event notifications, R2 events, scheduled tasks
- **Processing**: single consumer, multiple consumers, batch processing
- **Reliability**: retry strategy, dead-letter handling, idempotency requirements
- **Scale**: expected message volume, processing latency requirements

### Step 2: Create queue and configure bindings

```bash
# Create a queue
npx wrangler queues create my-task-queue

# Create a dead-letter queue
npx wrangler queues create my-task-queue-dlq

# List queues
npx wrangler queues list

# Delete a queue
npx wrangler queues delete my-task-queue
```

**wrangler.toml configuration:**

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"

# Producer binding (send messages to queue)
[[queues.producers]]
binding = "TASK_QUEUE"
queue = "my-task-queue"

[[queues.producers]]
binding = "NOTIFICATION_QUEUE"
queue = "notification-queue"

# Consumer configuration (process messages from queue)
[[queues.consumers]]
queue = "my-task-queue"
max_batch_size = 10          # Max messages per batch (1-100, default 10)
max_batch_timeout = 5        # Max seconds to wait for a full batch (default 5)
max_retries = 3              # Max retries before sending to DLQ (default 3)
dead_letter_queue = "my-task-queue-dlq"  # DLQ for failed messages
max_concurrency = 10         # Max concurrent consumer invocations (default 10, 1-1000)
retry_delay = "exponential"  # Retry delay strategy: "exponential" or fixed seconds

# DLQ consumer (for monitoring and alerting on failed messages)
[[queues.consumers]]
queue = "my-task-queue-dlq"
max_batch_size = 5
max_retries = 0              # Don't retry DLQ messages
```

### Step 3: Generate producer (sending messages)

```typescript
interface Env {
  TASK_QUEUE: Queue;
  NOTIFICATION_QUEUE: Queue;
  DB: D1Database;
}

// Message types
interface TaskMessage {
  type: "process-image" | "send-email" | "generate-report" | "sync-data";
  payload: Record<string, unknown>;
  metadata: {
    userId: string;
    requestId: string;
    timestamp: number;
  };
}

interface NotificationMessage {
  channel: "email" | "sms" | "push" | "webhook";
  recipient: string;
  subject: string;
  body: string;
  priority: "low" | "normal" | "high";
}

// --- Send a single message ---
async function enqueueTask(queue: Queue, task: TaskMessage): Promise<void> {
  await queue.send(task);
}

// --- Send with options ---
async function enqueueWithDelay(queue: Queue, task: TaskMessage, delaySeconds: number): Promise<void> {
  await queue.send(task, {
    delaySeconds, // Delay delivery (0-43200 seconds / 12 hours max)
  });
}

// --- Send a batch of messages ---
async function enqueueBatch(queue: Queue, tasks: TaskMessage[]): Promise<void> {
  await queue.sendBatch(
    tasks.map((task) => ({
      body: task,
    }))
  );
}

// --- Send batch with per-message options ---
async function enqueueBatchWithOptions(queue: Queue, tasks: TaskMessage[]): Promise<void> {
  await queue.sendBatch(
    tasks.map((task, index) => ({
      body: task,
      delaySeconds: index * 10, // Stagger delivery
    }))
  );
}

// --- HTTP endpoint that produces messages ---
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);

    switch (url.pathname) {
      case "/api/tasks": {
        const body = await request.json() as { type: string; payload: Record<string, unknown> };
        const task: TaskMessage = {
          type: body.type as TaskMessage["type"],
          payload: body.payload,
          metadata: {
            userId: request.headers.get("X-User-Id") || "anonymous",
            requestId: crypto.randomUUID(),
            timestamp: Date.now(),
          },
        };

        await env.TASK_QUEUE.send(task);

        return Response.json({
          status: "queued",
          requestId: task.metadata.requestId,
        }, { status: 202 });
      }

      case "/api/notifications/batch": {
        const { notifications } = await request.json() as { notifications: NotificationMessage[] };
        await env.NOTIFICATION_QUEUE.sendBatch(
          notifications.map((n) => ({ body: n }))
        );
        return Response.json({ status: "queued", count: notifications.length }, { status: 202 });
      }

      default:
        return new Response("Not Found", { status: 404 });
    }
  },
};
```

### Step 4: Generate consumer (processing messages)

```typescript
export default {
  // Queue consumer handler
  async queue(batch: MessageBatch<TaskMessage>, env: Env): Promise<void> {
    console.log(`Processing batch of ${batch.messages.length} messages from ${batch.queue}`);

    for (const message of batch.messages) {
      try {
        const task = message.body;
        console.log(`Processing task: ${task.type}, requestId: ${task.metadata.requestId}`);

        switch (task.type) {
          case "process-image":
            await processImage(task.payload, env);
            break;
          case "send-email":
            await sendEmail(task.payload, env);
            break;
          case "generate-report":
            await generateReport(task.payload, env);
            break;
          case "sync-data":
            await syncData(task.payload, env);
            break;
          default:
            console.error(`Unknown task type: ${task.type}`);
        }

        // Acknowledge successful processing
        message.ack();
      } catch (error) {
        console.error(`Failed to process message ${message.id}:`, error);

        // Retry with delay (exponential backoff handled by Queues)
        message.retry({
          delaySeconds: Math.min(60 * Math.pow(2, message.attempts), 43200), // Max 12 hours
        });
      }
    }
  },
};

async function processImage(payload: Record<string, unknown>, env: Env): Promise<void> {
  const { bucketKey, operations } = payload as { bucketKey: string; operations: string[] };
  // Process image from R2, apply operations, store result
  const image = await env.MEDIA_BUCKET.get(bucketKey);
  if (!image) throw new Error(`Image not found: ${bucketKey}`);
  // ... image processing logic
}

async function sendEmail(payload: Record<string, unknown>, env: Env): Promise<void> {
  const { to, subject, body } = payload as { to: string; subject: string; body: string };
  // Send email via external API
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "noreply@example.com" },
      subject,
      content: [{ type: "text/html", value: body }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Email send failed: ${response.status}`);
  }
}
```

### Step 5: Batch processing with ackAll/retryAll

```typescript
export default {
  async queue(batch: MessageBatch<TaskMessage>, env: Env): Promise<void> {
    // Process all messages as a single batch operation
    try {
      const tasks = batch.messages.map((msg) => msg.body);

      // Batch insert into D1
      const statements = tasks.map((task) =>
        env.DB.prepare(
          "INSERT INTO processed_tasks (request_id, type, payload, processed_at) VALUES (?, ?, ?, datetime('now'))"
        ).bind(task.metadata.requestId, task.type, JSON.stringify(task.payload))
      );

      await env.DB.batch(statements);

      // All succeeded - acknowledge entire batch
      batch.ackAll();
      console.log(`Successfully processed batch of ${batch.messages.length} messages`);
    } catch (error) {
      console.error("Batch processing failed:", error);
      // Retry all messages in the batch
      batch.retryAll();
    }
  },
};
```

### Step 6: Dead-letter queue consumer

```typescript
// DLQ consumer for monitoring and alerting
interface DLQEnv {
  ALERT_WEBHOOK: string;
  DB: D1Database;
}

export default {
  async queue(batch: MessageBatch<TaskMessage>, env: DLQEnv): Promise<void> {
    for (const message of batch.messages) {
      const task = message.body;

      // Log failed message to database
      await env.DB.prepare(`
        INSERT INTO failed_tasks (
          request_id, type, payload, error_info, attempts, failed_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        task.metadata.requestId,
        task.type,
        JSON.stringify(task.payload),
        `Exceeded max retries after ${message.attempts} attempts`,
        message.attempts
      ).run();

      // Send alert via webhook
      await fetch(env.ALERT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Task failed permanently: ${task.type} (requestId: ${task.metadata.requestId}). Check DLQ for details.`,
          severity: "error",
        }),
      });

      message.ack(); // Acknowledge so it doesn't loop in DLQ
    }
  },
};
```

### Step 7: Fan-out pattern (one event to multiple queues)

```typescript
interface Env {
  EMAIL_QUEUE: Queue;
  PUSH_QUEUE: Queue;
  ANALYTICS_QUEUE: Queue;
  AUDIT_QUEUE: Queue;
}

interface UserEvent {
  eventType: "signup" | "purchase" | "password-change";
  userId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const event: UserEvent = await request.json();

    // Fan out to multiple queues based on event type
    const promises: Promise<void>[] = [];

    // Always log to analytics and audit
    promises.push(env.ANALYTICS_QUEUE.send({ event, target: "analytics" }));
    promises.push(env.AUDIT_QUEUE.send({ event, target: "audit" }));

    // Conditional fan-out based on event type
    switch (event.eventType) {
      case "signup":
        promises.push(env.EMAIL_QUEUE.send({
          type: "welcome-email",
          userId: event.userId,
          email: event.data.email,
        }));
        promises.push(env.PUSH_QUEUE.send({
          type: "onboarding-push",
          userId: event.userId,
        }));
        break;

      case "purchase":
        promises.push(env.EMAIL_QUEUE.send({
          type: "receipt-email",
          userId: event.userId,
          orderId: event.data.orderId,
        }));
        break;

      case "password-change":
        promises.push(env.EMAIL_QUEUE.send({
          type: "security-alert",
          userId: event.userId,
        }));
        break;
    }

    await Promise.all(promises);

    return Response.json({ status: "events dispatched" }, { status: 202 });
  },
};
```

### Step 8: Pull-based consumer (HTTP pull)

For consumers outside of Cloudflare Workers:

```bash
# Enable HTTP pull on a queue (via Cloudflare API)
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/{queue_id}" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"settings": {"delivery_delay": 0}}'
```

```typescript
// External consumer pulling messages via HTTP
async function pullMessages(accountId: string, queueId: string, apiToken: string) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/queues/${queueId}/messages/pull`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visibility_timeout_ms: 30000, // 30 seconds
        batch_size: 10,
      }),
    }
  );

  const data = await response.json();
  return data.result.messages;
}

// Acknowledge processed messages
async function ackMessages(
  accountId: string,
  queueId: string,
  apiToken: string,
  acks: Array<{ lease_id: string }>
) {
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/queues/${queueId}/messages/ack`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ acks }),
    }
  );
}
```

### Step 9: Idempotent processing patterns

```typescript
interface IdempotentEnv {
  DB: D1Database;
  TASK_QUEUE: Queue;
}

async function processIdempotently(
  message: Message<TaskMessage>,
  env: IdempotentEnv
): Promise<void> {
  const requestId = message.body.metadata.requestId;

  // Check if already processed
  const existing = await env.DB
    .prepare("SELECT id FROM processed_messages WHERE request_id = ?")
    .bind(requestId)
    .first();

  if (existing) {
    console.log(`Message ${requestId} already processed, skipping`);
    message.ack();
    return;
  }

  // Process the message
  await doWork(message.body, env);

  // Mark as processed (with TTL for cleanup)
  await env.DB
    .prepare(
      "INSERT INTO processed_messages (request_id, processed_at) VALUES (?, datetime('now'))"
    )
    .bind(requestId)
    .run();

  message.ack();
}

// Schema for idempotency tracking
// CREATE TABLE processed_messages (
//   request_id TEXT PRIMARY KEY,
//   processed_at TEXT NOT NULL
// );
// CREATE INDEX idx_processed_messages_date ON processed_messages(processed_at);
```

### Step 10: Content-based routing

```typescript
interface RoutingEnv {
  HIGH_PRIORITY_QUEUE: Queue;
  LOW_PRIORITY_QUEUE: Queue;
  BULK_QUEUE: Queue;
}

export default {
  async fetch(request: Request, env: RoutingEnv): Promise<Response> {
    const message = await request.json() as { priority: string; payload: unknown };

    // Route to different queues based on content
    switch (message.priority) {
      case "high":
        await env.HIGH_PRIORITY_QUEUE.send(message.payload);
        break;
      case "low":
        await env.LOW_PRIORITY_QUEUE.send(message.payload);
        break;
      default:
        await env.BULK_QUEUE.send(message.payload);
    }

    return Response.json({ status: "routed", priority: message.priority }, { status: 202 });
  },
};
```

### Step 11: R2 event notifications to Queues

```toml
# wrangler.toml - R2 event notifications
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "user-uploads"

[[r2_buckets.event_notifications]]
queue = "upload-processing-queue"
type = "object-create"
prefix = "images/"

[[queues.consumers]]
queue = "upload-processing-queue"
max_batch_size = 5
max_batch_timeout = 10
```

```typescript
interface R2Event {
  account: string;
  bucket: string;
  object: { key: string; size: number; eTag: string };
  action: "PutObject" | "CompleteMultipartUpload" | "CopyObject" | "DeleteObject";
  eventTime: string;
}

export default {
  async queue(batch: MessageBatch<R2Event>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body;

      if (event.action === "PutObject") {
        console.log(`New upload: ${event.object.key} (${event.object.size} bytes)`);
        await processUpload(event.object.key, env);
      }

      message.ack();
    }
  },
};
```

### Best practices

- **Always configure a dead-letter queue** for every production queue to capture failed messages
- **Use `message.ack()` and `message.retry()` individually** for fine-grained control over message processing
- **Make consumers idempotent** since messages may be delivered more than once (at-least-once delivery)
- **Set appropriate `max_batch_size` and `max_batch_timeout`** based on processing needs
- **Use `delaySeconds`** for scheduled or throttled message delivery
- **Include a `requestId` in message payloads** for tracing and deduplication
- **Monitor DLQ depth** and set up alerts for messages landing in the DLQ
- **Use batch operations** (`sendBatch`, `ackAll`, `retryAll`) to reduce overhead
- **Keep consumer processing time short** (under 15 minutes per batch)
- **Use structured message types** with TypeScript interfaces for type safety

### Anti-patterns to avoid

- Do NOT ignore the DLQ (failed messages represent data loss or processing gaps)
- Do NOT process messages without error handling (unhandled errors cause implicit retries)
- Do NOT set `max_retries` too high without exponential backoff (causes thundering herd)
- Do NOT store large payloads in messages (max 128KB per message; use R2 for large data and pass the key)
- Do NOT rely on message ordering (Queues provide at-least-once delivery, not FIFO ordering)
- Do NOT use Queues for real-time communication (use WebSockets or Durable Objects instead)
- Do NOT create tight producer-consumer loops (producer -> queue -> consumer -> queue) without circuit breakers
- Do NOT skip idempotency for side-effectful operations (messages can be delivered multiple times)

### Cost optimization

- **Free tier**: 1 million operations/month (each send, receive, ack counts as an operation)
- **Paid plan**: $0.40 per million operations beyond free tier
- Batch messages with `sendBatch` (up to 100 messages counts as 1 operation)
- Use `ackAll()` instead of individual `ack()` calls when the entire batch succeeds
- Tune `max_batch_size` to process more messages per consumer invocation
- Increase `max_batch_timeout` to accumulate fuller batches before processing
- Use content-based routing to avoid processing messages that should be filtered
- Monitor queue depth and consumer lag in the Cloudflare Dashboard
- Clean up unused queues to avoid unnecessary resource allocation
