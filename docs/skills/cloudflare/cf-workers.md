# Cloudflare Workers

Generate Cloudflare Workers with edge compute, routing, and bindings for API endpoints, scheduled tasks, queue consumers, and event-driven processing.

## Usage

```bash
/cf-workers <description of your Worker>
```

## What It Does

1. Generates Worker code with fetch handlers, cron triggers, queue consumers, and email handlers
2. Creates wrangler.toml configuration with bindings for KV, R2, D1, Queues, Durable Objects, and AI
3. Supports ES Modules syntax with TypeScript and popular frameworks (Hono, itty-router)
4. Produces Durable Object classes for stateful edge logic such as rate limiting and coordination
5. Configures HTMLRewriter for edge-side HTML manipulation and WebSocket support
6. Sets up local development, deployment scripts, and secret management with Wrangler CLI

## Example Output

```typescript
export interface Env {
  MY_KV: KVNamespace;
  MY_BUCKET: R2Bucket;
  MY_DB: D1Database;
  MY_QUEUE: Queue;
  AI: Ai;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/api/health":
        return Response.json({ status: "ok", env: env.ENVIRONMENT });
      case "/api/data":
        return handleData(request, env, ctx);
      default:
        return new Response("Not Found", { status: 404 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(performScheduledTask(env));
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processMessage(message.body, env);
        message.ack();
      } catch (error) {
        message.retry({ delaySeconds: 60 });
      }
    }
  },
};
```

## What It Covers

- **Fetch handlers** with routing, CORS, caching, and error handling
- **Cron triggers** for scheduled background tasks
- **Queue consumers** for asynchronous message processing
- **Durable Objects** for stateful coordination and rate limiting
- **Hono and itty-router** framework integration for structured routing
- **HTMLRewriter** for edge-side HTML transformation
- **WebSocket support** for real-time communication
- **Workers for Platforms** multi-tenant dispatch patterns

<div class="badge-row">
  <span class="badge">Cloudflare</span>
  <span class="badge">Edge Compute</span>
  <span class="badge">Serverless</span>
</div>

## Installation

```bash
cp -r skills/cf-workers ~/.claude/skills/cf-workers
```

## Allowed Tools

- `Read` - Read existing Worker code and configuration files
- `Write` - Create Worker handlers, wrangler.toml, and supporting files
- `Edit` - Modify existing Worker configurations and bindings
- `Bash` - Run Wrangler CLI commands for dev, deploy, and secret management
- `Glob` - Search for Worker and configuration files
- `Grep` - Find binding references and route patterns
