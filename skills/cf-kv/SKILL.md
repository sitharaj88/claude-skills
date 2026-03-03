---
name: cf-kv
description: Generate Workers KV configs for global key-value storage at the edge. Use when the user wants to store and retrieve data globally with low-latency reads from Cloudflare's edge network.
argument-hint: "[pattern]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx wrangler *), Bash(wrangler *), Bash(npm *)
user-invocable: true
---

## Instructions

You are a Cloudflare Workers KV expert. Generate production-ready KV configurations, access patterns, and integration code.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: caching, configuration store, session management, feature flags, rate limiting, URL shortener
- **Data characteristics**: value size, read/write ratio, consistency requirements
- **Expiration**: TTL-based expiration, manual cleanup, permanent storage
- **Access**: Workers binding, REST API, wrangler CLI
- **Scale**: estimated reads/writes per second, total number of keys

### Step 2: Create namespace and configure binding

```bash
# Create a KV namespace
npx wrangler kv namespace create MY_KV

# Create a preview namespace (for wrangler dev)
npx wrangler kv namespace create MY_KV --preview

# List namespaces
npx wrangler kv namespace list

# Delete a namespace
npx wrangler kv namespace delete --namespace-id=<id>
```

**wrangler.toml binding:**

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"

# KV namespace bindings
[[kv_namespaces]]
binding = "CACHE"
id = "abc123def456"
preview_id = "ghi789jkl012"

[[kv_namespaces]]
binding = "CONFIG"
id = "mno345pqr678"
preview_id = "stu901vwx234"

[[kv_namespaces]]
binding = "SESSIONS"
id = "yza567bcd890"
preview_id = "efg123hij456"
```

### Step 3: Generate KV API operations

```typescript
interface Env {
  CACHE: KVNamespace;
  CONFIG: KVNamespace;
  SESSIONS: KVNamespace;
}

// --- Basic Operations ---

// GET: Retrieve a value
async function getValue(kv: KVNamespace, key: string): Promise<string | null> {
  return kv.get(key); // Returns null if key doesn't exist
}

// GET with type: json, text, arrayBuffer, stream
async function getJsonValue<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return kv.get<T>(key, "json");
}

async function getBinaryValue(kv: KVNamespace, key: string): Promise<ArrayBuffer | null> {
  return kv.get(key, "arrayBuffer");
}

async function getStreamValue(kv: KVNamespace, key: string): Promise<ReadableStream | null> {
  return kv.get(key, "stream");
}

// GET with metadata
async function getWithMetadata<T, M = unknown>(
  kv: KVNamespace,
  key: string
): Promise<KVNamespaceGetWithMetadataResult<T, M>> {
  return kv.getWithMetadata<T, M>(key, "json");
}

// PUT: Store a value
async function putValue(kv: KVNamespace, key: string, value: string): Promise<void> {
  await kv.put(key, value);
}

// PUT with options
async function putWithOptions(
  kv: KVNamespace,
  key: string,
  value: unknown,
  options?: {
    expirationTtl?: number; // seconds until expiration
    expiration?: number; // absolute unix timestamp
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await kv.put(key, JSON.stringify(value), {
    expirationTtl: options?.expirationTtl,
    expiration: options?.expiration,
    metadata: options?.metadata,
  });
}

// DELETE: Remove a key
async function deleteValue(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}

// LIST: Enumerate keys with prefix and pagination
async function listKeys(
  kv: KVNamespace,
  options?: { prefix?: string; limit?: number; cursor?: string }
): Promise<KVNamespaceListResult<unknown, string>> {
  return kv.list({
    prefix: options?.prefix,
    limit: options?.limit || 1000,
    cursor: options?.cursor,
  });
}
```

### Step 4: Cache pattern (stale-while-revalidate)

```typescript
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

async function cachedFetch<T>(
  kv: KVNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttlSeconds: number;       // How long the cache is "fresh"
    staleTtlSeconds: number;  // How long to serve stale data while revalidating
    ctx: ExecutionContext;
  }
): Promise<T> {
  const { value, metadata } = await kv.getWithMetadata<string, { cachedAt: number }>(key, "text");

  if (value !== null && metadata) {
    const age = (Date.now() - metadata.cachedAt) / 1000;

    if (age < options.ttlSeconds) {
      // Fresh cache hit
      return JSON.parse(value) as T;
    }

    if (age < options.staleTtlSeconds) {
      // Stale but usable; revalidate in background
      options.ctx.waitUntil(
        fetchFn().then((freshData) =>
          kv.put(key, JSON.stringify(freshData), {
            expirationTtl: options.staleTtlSeconds,
            metadata: { cachedAt: Date.now() },
          })
        )
      );
      return JSON.parse(value) as T;
    }
  }

  // Cache miss or expired; fetch fresh data
  const freshData = await fetchFn();
  await kv.put(key, JSON.stringify(freshData), {
    expirationTtl: options.staleTtlSeconds,
    metadata: { cachedAt: Date.now() },
  });

  return freshData;
}

// Usage
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const data = await cachedFetch(
      env.CACHE,
      "api:products:featured",
      async () => {
        const res = await fetch("https://api.example.com/products/featured");
        return res.json();
      },
      {
        ttlSeconds: 60,        // Fresh for 1 minute
        staleTtlSeconds: 3600, // Serve stale up to 1 hour while revalidating
        ctx,
      }
    );

    return Response.json(data);
  },
};
```

### Step 5: Configuration store pattern

```typescript
interface AppConfig {
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
  rateLimits: Record<string, number>;
  allowedOrigins: string[];
  apiVersion: string;
}

class ConfigStore {
  private kv: KVNamespace;
  private cache: AppConfig | null = null;
  private cacheExpiry = 0;
  private cacheTtlMs = 30_000; // 30 seconds in-memory cache

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async getConfig(): Promise<AppConfig> {
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    const config = await this.kv.get<AppConfig>("app:config", "json");
    if (!config) {
      throw new Error("Application configuration not found in KV");
    }

    this.cache = config;
    this.cacheExpiry = Date.now() + this.cacheTtlMs;
    return config;
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    const current = await this.getConfig();
    const updated = { ...current, ...updates };
    await this.kv.put("app:config", JSON.stringify(updated));
    this.cache = updated;
    this.cacheExpiry = Date.now() + this.cacheTtlMs;
  }

  async isFeatureEnabled(feature: string): Promise<boolean> {
    const config = await this.getConfig();
    return config.featureFlags[feature] ?? false;
  }
}
```

### Step 6: Feature flags implementation

```typescript
interface FeatureFlag {
  enabled: boolean;
  rolloutPercentage?: number;
  allowedUsers?: string[];
  allowedRegions?: string[];
  startDate?: string;
  endDate?: string;
}

class FeatureFlagService {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async isEnabled(
    flagName: string,
    context?: { userId?: string; region?: string }
  ): Promise<boolean> {
    const flag = await this.kv.get<FeatureFlag>(`flag:${flagName}`, "json");

    if (!flag || !flag.enabled) return false;

    // Check date range
    const now = new Date().toISOString();
    if (flag.startDate && now < flag.startDate) return false;
    if (flag.endDate && now > flag.endDate) return false;

    // Check allowed users
    if (flag.allowedUsers && context?.userId) {
      if (flag.allowedUsers.includes(context.userId)) return true;
    }

    // Check allowed regions
    if (flag.allowedRegions && context?.region) {
      if (!flag.allowedRegions.includes(context.region)) return false;
    }

    // Check rollout percentage (deterministic based on userId)
    if (flag.rolloutPercentage !== undefined && context?.userId) {
      const hash = await hashString(context.userId + flagName);
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  async setFlag(name: string, flag: FeatureFlag): Promise<void> {
    await this.kv.put(`flag:${name}`, JSON.stringify(flag));
  }

  async listFlags(): Promise<Array<{ name: string; flag: FeatureFlag }>> {
    const { keys } = await this.kv.list({ prefix: "flag:" });
    const flags = await Promise.all(
      keys.map(async (key) => ({
        name: key.name.replace("flag:", ""),
        flag: (await this.kv.get<FeatureFlag>(key.name, "json"))!,
      }))
    );
    return flags.filter((f) => f.flag !== null);
  }
}

async function hashString(str: string): Promise<number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return hashArray[0] + (hashArray[1] << 8);
}
```

### Step 7: Session management

```typescript
interface Session {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastAccessedAt: number;
  data: Record<string, unknown>;
}

class SessionManager {
  private kv: KVNamespace;
  private ttlSeconds = 86400; // 24 hours

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async createSession(userId: string, userData: Omit<Session, "createdAt" | "lastAccessedAt" | "data">): Promise<string> {
    const sessionId = crypto.randomUUID();
    const session: Session = {
      ...userData,
      userId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      data: {},
    };

    await this.kv.put(`session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: this.ttlSeconds,
      metadata: { userId },
    });

    return sessionId;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.kv.get<Session>(`session:${sessionId}`, "json");
    if (!session) return null;

    // Refresh TTL on access (sliding expiration)
    session.lastAccessedAt = Date.now();
    await this.kv.put(`session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: this.ttlSeconds,
      metadata: { userId: session.userId },
    });

    return session;
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.kv.delete(`session:${sessionId}`);
  }

  async setSessionData(sessionId: string, key: string, value: unknown): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    session.data[key] = value;
    await this.kv.put(`session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: this.ttlSeconds,
      metadata: { userId: session.userId },
    });
  }
}
```

### Step 8: Rate limiting with KV

```typescript
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

async function checkRateLimit(
  kv: KVNamespace,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  const entry = await kv.get<RateLimitEntry>(key, "json");

  if (!entry || now - entry.windowStart > windowSeconds * 1000) {
    // New window
    const newEntry: RateLimitEntry = { count: 1, windowStart: now };
    await kv.put(key, JSON.stringify(newEntry), { expirationTtl: windowSeconds });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowSeconds * 1000 };
  }

  if (entry.count >= limit) {
    const resetAt = entry.windowStart + windowSeconds * 1000;
    return { allowed: false, remaining: 0, resetAt };
  }

  entry.count++;
  await kv.put(key, JSON.stringify(entry), { expirationTtl: windowSeconds });
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.windowStart + windowSeconds * 1000,
  };
}

// Usage in Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const { allowed, remaining, resetAt } = await checkRateLimit(
      env.CACHE,
      clientIP,
      100,  // 100 requests
      60    // per 60 seconds
    );

    if (!allowed) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
        },
      });
    }

    const response = await handleRequest(request, env);
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
    return response;
  },
};
```

### Step 9: Bulk operations via wrangler

```bash
# Put a single key-value pair
npx wrangler kv key put --namespace-id=<id> "my-key" "my-value"

# Put with TTL (expires in 3600 seconds)
npx wrangler kv key put --namespace-id=<id> "temp-key" "temp-value" --ttl=3600

# Put from file
npx wrangler kv key put --namespace-id=<id> "config" --path=./config.json

# Get a value
npx wrangler kv key get --namespace-id=<id> "my-key"

# Delete a key
npx wrangler kv key delete --namespace-id=<id> "my-key"

# List keys
npx wrangler kv key list --namespace-id=<id>
npx wrangler kv key list --namespace-id=<id> --prefix="user:"

# Bulk put from JSON file
# bulk-data.json format: [{"key": "k1", "value": "v1"}, {"key": "k2", "value": "v2"}]
npx wrangler kv bulk put --namespace-id=<id> ./bulk-data.json

# Bulk delete
# keys.json format: ["key1", "key2", "key3"]
npx wrangler kv bulk delete --namespace-id=<id> ./keys.json
```

### Step 10: List all keys with full pagination

```typescript
async function listAllKeys(
  kv: KVNamespace,
  prefix?: string
): Promise<KVNamespaceListKey<unknown, string>[]> {
  const allKeys: KVNamespaceListKey<unknown, string>[] = [];
  let cursor: string | undefined;

  do {
    const result = await kv.list({ prefix, cursor, limit: 1000 });
    allKeys.push(...result.keys);
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  return allKeys;
}
```

### Best practices

- **Use JSON type** for structured data (`kv.get(key, "json")`) to avoid manual parsing
- **Set TTL on all cache entries** to prevent unbounded storage growth
- **Use metadata** for secondary information without deserializing the full value
- **Use prefix-based key naming** for logical grouping and efficient listing (e.g., `user:123:profile`)
- **Keep values under 25 MiB** (hard limit) and ideally under 1 MiB for best performance
- **Keep keys under 512 bytes** (hard limit)
- **Use `ctx.waitUntil()`** for background KV writes that should not block the response
- **Understand eventual consistency**: reads may return stale data for up to 60 seconds after writes
- **Use KV for read-heavy workloads** (KV is optimized for reads, not writes)
- **Use in-Worker memory caching** for extremely hot keys (cache within the request lifecycle)

### Anti-patterns to avoid

- Do NOT use KV for write-heavy workloads (writes have ~60s propagation delay globally)
- Do NOT use KV as a primary database (use D1 for relational data)
- Do NOT rely on strong consistency (reads are eventually consistent)
- Do NOT store large binary files in KV (use R2 for object storage)
- Do NOT use `list()` for real-time counting (list is eventually consistent)
- Do NOT use KV for real-time counters or atomic operations (no atomic increment)
- Do NOT iterate all keys in a hot path (list operations are expensive)
- Do NOT put without TTL for temporary data (leads to unbounded storage and cost)
- Do NOT use KV for session storage requiring strict consistency (race conditions on concurrent writes)

### Cost optimization

- **Free tier**: 100,000 reads/day, 1,000 writes/day, 1,000 list operations/day, 1,000 delete operations/day, 1GB storage
- **Paid plan**: $0.50 per million reads, $5.00 per million writes, $5.00 per million list operations, $5.00 per million delete operations, $0.50/GB storage
- Cache KV reads in Worker memory for the duration of the request to avoid duplicate reads
- Use longer TTLs where freshness is not critical to reduce write operations
- Batch reads when possible (though KV does not have native batch-get, you can use `Promise.all`)
- Use the Cache API for hot public content instead of KV (Cache API is free)
- Monitor usage in the Cloudflare Dashboard under Workers KV Analytics
- Clean up unused keys and namespaces to reduce storage costs
