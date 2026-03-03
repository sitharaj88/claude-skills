---
name: cf-workers
description: Generate Cloudflare Workers with edge compute, routing, and bindings. Use when the user wants to create, configure, or deploy Workers for edge-side logic, API endpoints, or event-driven processing.
argument-hint: "[type]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx wrangler *), Bash(wrangler *), Bash(npm *), Bash(pnpm *)
user-invocable: true
---

## Instructions

You are a Cloudflare Workers expert. Generate production-ready Workers with proper configuration, bindings, and deployment settings.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Worker type**: fetch handler, scheduled (cron), queue consumer, email worker, Durable Object
- **Syntax**: ES Modules (recommended) or Service Worker
- **Bindings**: KV, R2, D1, Queues, Durable Objects, AI, Vectorize, Hyperdrive, Browser Rendering
- **Framework**: plain Workers API, Hono, itty-router
- **Routing**: custom domains, route patterns, or Workers for Platforms (multi-tenant)

### Step 2: Generate wrangler.toml configuration

Create the project configuration file:

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# Optional: Smart Placement for reduced latency to back-end services
[placement]
mode = "smart"

# Environment variables (non-secret)
[vars]
ENVIRONMENT = "production"
API_VERSION = "v2"

# KV namespace binding
[[kv_namespaces]]
binding = "MY_KV"
id = "abc123"
preview_id = "def456"

# R2 bucket binding
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"

# D1 database binding
[[d1_databases]]
binding = "MY_DB"
database_name = "my-database"
database_id = "xxxx-xxxx-xxxx"

# Queue producer binding
[[queues.producers]]
binding = "MY_QUEUE"
queue = "my-queue"

# Queue consumer
[[queues.consumers]]
queue = "my-queue"
max_batch_size = 10
max_batch_timeout = 5

# Durable Object binding
[durable_objects]
bindings = [
  { name = "MY_DO", class_name = "MyDurableObject" }
]

[[migrations]]
tag = "v1"
new_classes = ["MyDurableObject"]

# AI binding
[ai]
binding = "AI"

# Cron triggers
[triggers]
crons = ["0 * * * *", "*/15 * * * *"]

# Custom domain routes
routes = [
  { pattern = "api.example.com/*", zone_name = "example.com" }
]

# Development settings
[dev]
port = 8787
local_protocol = "https"
```

### Step 3: Generate Worker code

**Fetch handler (ES Modules syntax - recommended):**

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

    // Route handling
    switch (url.pathname) {
      case "/api/health":
        return Response.json({ status: "ok", env: env.ENVIRONMENT });

      case "/api/data":
        return handleData(request, env, ctx);

      default:
        return new Response("Not Found", { status: 404 });
    }
  },

  // Cron trigger handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(performScheduledTask(env));
  },

  // Queue consumer handler
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

  // Email handler
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const { from, to } = message;
    // Process or forward email
    await message.forward("admin@example.com");
  },
};
```

**Using Hono framework:**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { cache } from "hono/cache";

type Bindings = {
  MY_KV: KVNamespace;
  MY_DB: D1Database;
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());
app.use("/api/*", cors({
  origin: ["https://example.com"],
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
}));

// Cache static responses
app.get("/api/config", cache({ cacheName: "config-cache", cacheControl: "max-age=3600" }));

// Routes
app.get("/api/users/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.MY_DB
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();

  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
});

app.post("/api/users", async (c) => {
  const body = await c.req.json();
  const result = await c.env.MY_DB
    .prepare("INSERT INTO users (name, email) VALUES (?, ?) RETURNING *")
    .bind(body.name, body.email)
    .first();
  return c.json(result, 201);
});

// Error handling
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
```

**Using itty-router:**

```typescript
import { Router, json, error, withParams } from "itty-router";

const router = Router();

router
  .all("*", withParams)
  .get("/api/items", async (request, env) => {
    const items = await env.MY_KV.list({ prefix: "item:" });
    return json(items.keys);
  })
  .get("/api/items/:id", async ({ params }, env) => {
    const item = await env.MY_KV.get(`item:${params.id}`, "json");
    return item ? json(item) : error(404, "Not found");
  })
  .all("*", () => error(404));

export default {
  fetch: (request, env, ctx) =>
    router.fetch(request, env, ctx).then(json).catch(error),
};
```

### Step 4: Generate Durable Object (if needed)

```typescript
export class RateLimiter implements DurableObject {
  private state: DurableObjectState;
  private requests: number[] = [];
  private limit = 100; // requests per window
  private windowMs = 60_000; // 1 minute

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      this.requests = (await this.state.storage.get("requests")) || [];
    });
  }

  async fetch(request: Request): Promise<Response> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove expired entries
    this.requests = this.requests.filter((ts) => ts > windowStart);

    if (this.requests.length >= this.limit) {
      return new Response("Rate limit exceeded", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((this.requests[0] + this.windowMs - now) / 1000)),
        },
      });
    }

    this.requests.push(now);
    await this.state.storage.put("requests", this.requests);

    return new Response("OK", { status: 200 });
  }

  async alarm(): Promise<void> {
    // Clean up old data periodically
    this.requests = [];
    await this.state.storage.put("requests", []);
  }
}
```

### Step 5: Generate HTMLRewriter for edge manipulation

```typescript
class HeadRewriter implements HTMLRewriterElementContentHandlers {
  element(element: Element) {
    element.append(
      `<script defer src="https://analytics.example.com/script.js"></script>`,
      { html: true }
    );
  }
}

class BodyRewriter implements HTMLRewriterElementContentHandlers {
  element(element: Element) {
    element.prepend(`<div id="announcement-bar">Site-wide banner</div>`, { html: true });
  }
}

async function handleTransform(request: Request): Promise<Response> {
  const response = await fetch(request);
  return new HTMLRewriter()
    .on("head", new HeadRewriter())
    .on("body", new BodyRewriter())
    .transform(response);
}
```

### Step 6: WebSocket support

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());

      server.accept();

      server.addEventListener("message", (event) => {
        const data = JSON.parse(event.data as string);
        server.send(JSON.stringify({ echo: data, timestamp: Date.now() }));
      });

      server.addEventListener("close", () => {
        console.log("WebSocket closed");
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Expected WebSocket", { status: 426 });
  },
};
```

### Step 7: Generate supporting files

**package.json:**

```json
{
  "name": "my-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail",
    "test": "vitest"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241205.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "wrangler": "^3.91.0"
  }
}
```

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext"],
    "types": ["@cloudflare/workers-types"],
    "moduleResolution": "Bundler",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

### Step 8: Local development and deployment

```bash
# Initialize a new Workers project
npx wrangler init my-worker

# Local development with live reload
npx wrangler dev

# Deploy to Cloudflare
npx wrangler deploy

# Set secrets (not stored in wrangler.toml)
npx wrangler secret put API_KEY
npx wrangler secret put DATABASE_URL

# Tail real-time logs
npx wrangler tail

# Deploy to a specific environment
npx wrangler deploy --env staging
```

### Step 9: Workers for Platforms (multi-tenant)

For multi-tenant/dispatch use cases:

```toml
# Dispatch namespace binding
[[dispatch_namespaces]]
binding = "DISPATCHER"
namespace = "my-dispatch-namespace"
```

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const tenantId = url.hostname.split(".")[0]; // e.g., tenant1.example.com

    // Dispatch to tenant-specific worker
    const tenantWorker = env.DISPATCHER.get(tenantId);
    return tenantWorker.fetch(request);
  },
};
```

### Best practices

- **Use ES Modules syntax** over Service Worker syntax (ES Modules is the modern standard)
- **Enable `nodejs_compat`** compatibility flag for Node.js API support (Buffer, crypto, streams)
- **Use `ctx.waitUntil()`** for background tasks that should not block the response
- **Set `compatibility_date`** to lock API behavior and avoid breaking changes
- **Use Smart Placement** to reduce latency when Workers call back-end services
- **Bundle dependencies** with Wrangler (automatic esbuild bundling)
- **Use TypeScript** for type safety with `@cloudflare/workers-types`
- **Handle errors gracefully** and return appropriate HTTP status codes
- **Use structured logging** for tail-based debugging
- **Implement cache strategies** with the Cache API or `caches.default`

### Anti-patterns to avoid

- Do NOT store mutable state in global variables (Workers can be evicted at any time)
- Do NOT use Node.js-specific APIs without `nodejs_compat` flag
- Do NOT make blocking or long-running synchronous calls (10ms CPU limit on free, 30ms on paid)
- Do NOT exceed 128MB memory limit per Worker invocation
- Do NOT use Service Worker syntax for new projects (legacy pattern)
- Do NOT hardcode secrets in wrangler.toml (use `wrangler secret put` instead)
- Do NOT ignore error handling in queue consumers (messages will be lost)
- Do NOT use `fetch()` to call the same Worker recursively without safeguards (infinite loops)
- Do NOT use `eval()` or `new Function()` (blocked by V8 isolate security model)

### Cost optimization

- **Free tier**: 100,000 requests/day, 10ms CPU time per invocation
- **Paid plan ($5/month)**: 10M requests included, then $0.50 per additional million
- Use the **Cache API** to avoid redundant upstream fetches
- Use **Smart Placement** to reduce latency rather than deploying multiple services
- Batch operations where possible (D1 batch, KV bulk, Queue sendBatch)
- Use **Cron Triggers** instead of polling patterns to reduce invocation count
- Monitor CPU time usage in the Workers dashboard to stay within limits
- Use **Workers Unbound** (now standard) for CPU-intensive tasks (up to 30s CPU time)
- Minimize subrequest count (50 subrequests limit per invocation on free, 1000 on paid)
