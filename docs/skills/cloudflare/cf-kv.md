# Cloudflare KV

Generate Workers KV configurations for global key-value storage with caching patterns, session management, feature flags, and rate limiting at the edge.

## Usage

```bash
/cf-kv <pattern or description>
```

## What It Does

1. Creates KV namespace bindings with production and preview namespaces in wrangler.toml
2. Generates typed KV API operations for get, put, delete, and list with metadata support
3. Implements stale-while-revalidate caching patterns with background refresh
4. Builds configuration stores and feature flag services with rollout percentages
5. Produces session management with sliding expiration and secure token handling
6. Creates rate limiting middleware using KV-backed sliding window counters

## Example Output

```typescript
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

async function cachedFetch<T>(
  kv: KVNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttlSeconds: number; staleTtlSeconds: number; ctx: ExecutionContext }
): Promise<T> {
  const { value, metadata } = await kv.getWithMetadata<string, { cachedAt: number }>(key, "text");

  if (value !== null && metadata) {
    const age = (Date.now() - metadata.cachedAt) / 1000;

    if (age < options.ttlSeconds) {
      return JSON.parse(value) as T;
    }

    if (age < options.staleTtlSeconds) {
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

  const freshData = await fetchFn();
  await kv.put(key, JSON.stringify(freshData), {
    expirationTtl: options.staleTtlSeconds,
    metadata: { cachedAt: Date.now() },
  });
  return freshData;
}
```

## What It Covers

- **Basic operations** with typed get (json, text, arrayBuffer, stream), put with TTL, delete, and list
- **Caching patterns** with stale-while-revalidate and background refresh via waitUntil
- **Configuration stores** for runtime application config with in-memory caching
- **Feature flags** with rollout percentages, user targeting, region filtering, and date ranges
- **Session management** with sliding expiration, secure token creation, and session data
- **Rate limiting** with sliding window counters and appropriate HTTP headers
- **Bulk operations** via Wrangler CLI for importing and exporting data

<div class="badge-row">
  <span class="badge">Cloudflare</span>
  <span class="badge">Key-Value</span>
  <span class="badge">Edge</span>
</div>

## Installation

```bash
cp -r skills/cf-kv ~/.claude/skills/cf-kv
```

## Allowed Tools

- `Read` - Read existing KV configurations and access patterns
- `Write` - Create KV access modules, caching layers, and session managers
- `Edit` - Modify existing KV bindings and usage patterns
- `Bash` - Run Wrangler CLI commands for namespace management and bulk operations
- `Glob` - Search for KV-related configuration files
- `Grep` - Find KV namespace references and usage patterns
