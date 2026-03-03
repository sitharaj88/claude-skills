# Cloudflare Queues

Generate Cloudflare Queues for reliable message processing with producers, consumers, dead-letter queues, fan-out patterns, and event-driven architectures at the edge.

## Usage

```bash
/cf-queues <pattern or description>
```

## What It Does

1. Creates queue configurations with producer and consumer bindings in wrangler.toml
2. Generates typed producers with single send, batch send, and delayed delivery
3. Implements consumer handlers with per-message ack/retry and batch processing
4. Configures dead-letter queues with monitoring, alerting, and failed message logging
5. Produces fan-out patterns for dispatching events to multiple downstream queues
6. Sets up R2 event notification pipelines and content-based routing

## Example Output

```typescript
interface TaskMessage {
  type: "process-image" | "send-email" | "generate-report";
  payload: Record<string, unknown>;
  metadata: { userId: string; requestId: string; timestamp: number };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
    return Response.json({ status: "queued", requestId: task.metadata.requestId }, { status: 202 });
  },

  async queue(batch: MessageBatch<TaskMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        switch (message.body.type) {
          case "process-image":
            await processImage(message.body.payload, env);
            break;
          case "send-email":
            await sendEmail(message.body.payload, env);
            break;
          case "generate-report":
            await generateReport(message.body.payload, env);
            break;
        }
        message.ack();
      } catch (error) {
        message.retry({ delaySeconds: Math.min(60 * Math.pow(2, message.attempts), 43200) });
      }
    }
  },
};
```

## What It Covers

- **Producer patterns** with single send, batch send, and delayed delivery
- **Consumer handlers** with per-message ack/retry, batch ackAll/retryAll, and error handling
- **Dead-letter queues** with failed message capture, logging, and webhook alerting
- **Fan-out patterns** for dispatching one event to multiple downstream queues
- **Content-based routing** to direct messages to priority-specific queues
- **Idempotent processing** with deduplication tracking for at-least-once delivery
- **R2 event notifications** for triggering processing on object uploads

<div class="badge-row">
  <span class="badge">Cloudflare</span>
  <span class="badge">Messaging</span>
  <span class="badge">Async</span>
</div>

## Installation

```bash
cp -r skills/cf-queues ~/.claude/skills/cf-queues
```

## Allowed Tools

- `Read` - Read existing queue configurations and consumer code
- `Write` - Create producer/consumer handlers and queue configurations
- `Edit` - Modify existing queue bindings and processing logic
- `Bash` - Run Wrangler CLI commands for queue creation and management
- `Glob` - Search for queue-related configuration files
- `Grep` - Find queue binding references and message type definitions
