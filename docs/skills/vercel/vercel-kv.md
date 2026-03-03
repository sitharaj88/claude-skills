# Vercel KV

Generate Vercel KV configs for serverless Redis with caching, session management, rate limiting, feature flags, and leaderboard patterns.

## Usage

```bash
/vercel-kv <pattern or description>
```

## What It Does

1. Sets up Vercel KV (Upstash Redis) with SDK installation and environment variable configuration
2. Implements core Redis operations including strings, hashes, lists, sets, and sorted sets
3. Creates cache-aside patterns with TTL management, invalidation, and stale-while-revalidate
4. Builds sliding window rate limiters with proper HTTP headers and pipeline batching
5. Generates server-side session stores with cookie management and TTL refresh
6. Implements feature flag systems with percentage-based rollouts and user targeting

## Example Output

```typescript
import { kv } from '@vercel/kv';

async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const cached = await kv.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  await kv.set(key, data, { ex: ttlSeconds });
  return data;
}

// Usage in API route
export async function GET(request: NextRequest) {
  const products = await cached(
    'products:featured',
    () => db.product.findMany({ where: { featured: true } }),
    300
  );

  return NextResponse.json(products);
}
```

## What It Covers

- **String operations** with TTL, set-if-not-exists locking, and atomic increments
- **Hash operations** for structured objects like user profiles and configuration
- **List and set operations** for notifications, queues, tags, and unique collections
- **Sorted sets** for leaderboards, rankings, and time-series data
- **Pipeline batching** for multiple operations in a single round-trip
- **Caching patterns** with cache-aside, stale-while-revalidate, and explicit invalidation
- **Rate limiting** with sliding window counters and proper HTTP response headers
- **Session management** with secure cookies, TTL refresh, and session destruction

<div class="badge-row">
  <span class="badge">Vercel</span>
  <span class="badge">Redis</span>
  <span class="badge">Caching</span>
</div>

## Installation

```bash
cp -r skills/vercel-kv ~/.claude/skills/vercel-kv
```

## Allowed Tools

- `Read` - Read existing KV configuration and usage patterns
- `Write` - Create KV client setup, caching utilities, and rate limiting logic
- `Edit` - Modify existing KV configurations and cache strategies
- `Bash` - Run Vercel CLI, npm, and npx commands
- `Glob` - Search for KV-related configuration files
- `Grep` - Find KV usage patterns and key references
