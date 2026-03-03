---
name: vercel-kv
description: Generate Vercel KV configs for serverless Redis with caching, session management, rate limiting, and feature flags. Use when the user wants to use Redis-compatible key-value storage on Vercel.
argument-hint: "[pattern]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(vercel *), Bash(npm *), Bash(npx *)
user-invocable: true
---

## Instructions

You are a Vercel KV (serverless Redis) expert. Generate production-ready configurations using Vercel KV powered by Upstash Redis.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: caching, session management, rate limiting, feature flags, leaderboard, real-time counters
- **Runtime**: Serverless Functions (Node.js) or Edge Functions (V8)
- **Data model**: key-value pairs, hashes, lists, sets, sorted sets
- **TTL requirements**: expiration policies for stored data
- **Throughput**: expected read/write operations per second

### Step 2: Set up Vercel KV

**Create KV store via CLI:**
```bash
# Install Vercel CLI and link project
vercel link

# Create a KV database (via Vercel Dashboard > Storage > KV)
# Environment variables are auto-populated:
# KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN

# Pull env vars to local development
vercel env pull .env.local
```

**Install the SDK:**
```bash
npm install @vercel/kv
```

**Basic connection:**
```typescript
import { kv } from '@vercel/kv';

// Uses KV_REST_API_URL and KV_REST_API_TOKEN automatically
const value = await kv.get('my-key');
```

**Custom client (multiple databases):**
```typescript
import { createClient } from '@vercel/kv';

const primaryKV = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const secondaryKV = createClient({
  url: process.env.SECONDARY_KV_REST_API_URL!,
  token: process.env.SECONDARY_KV_REST_API_TOKEN!,
});
```

### Step 3: Core Redis operations

**String operations:**
```typescript
import { kv } from '@vercel/kv';

// Set with optional TTL (in seconds)
await kv.set('user:123:name', 'Alice', { ex: 3600 });

// Set only if key does not exist (for locking)
await kv.set('lock:resource', 'owner-id', { nx: true, ex: 30 });

// Get a value
const name = await kv.get<string>('user:123:name');

// Delete a key
await kv.del('user:123:name');

// Increment / Decrement
await kv.incr('page:views:home');
await kv.incrby('user:123:score', 10);

// Set expiration on existing key
await kv.expire('session:abc', 1800);

// Check TTL
const ttl = await kv.ttl('session:abc');

// Check if key exists
const exists = await kv.exists('user:123:name');
```

**Hash operations (structured objects):**
```typescript
// Store a user profile as a hash
await kv.hset('user:123', {
  name: 'Alice',
  email: 'alice@example.com',
  plan: 'pro',
  signupDate: '2024-01-15',
});

// Get single field
const email = await kv.hget<string>('user:123', 'email');

// Get all fields
const user = await kv.hgetall<Record<string, string>>('user:123');

// Update single field
await kv.hset('user:123', { plan: 'enterprise' });

// Delete a field
await kv.hdel('user:123', 'signupDate');

// Check if field exists
const hasEmail = await kv.hexists('user:123', 'email');

// Increment a numeric hash field
await kv.hincrby('user:123', 'loginCount', 1);
```

**List operations (queues, recent items):**
```typescript
// Push items to a list
await kv.lpush('notifications:user:123', JSON.stringify({
  type: 'message',
  text: 'New message from Bob',
  timestamp: Date.now(),
}));

// Get recent items (last 10)
const recent = await kv.lrange<string>('notifications:user:123', 0, 9);

// Pop from list (FIFO queue)
const next = await kv.rpop<string>('job-queue');

// Get list length
const count = await kv.llen('notifications:user:123');

// Trim list to keep only last N items
await kv.ltrim('notifications:user:123', 0, 99);
```

**Set operations (unique collections):**
```typescript
// Add to set
await kv.sadd('tags:post:456', 'javascript', 'vercel', 'nextjs');

// Check membership
const isMember = await kv.sismember('tags:post:456', 'vercel');

// Get all members
const tags = await kv.smembers<string>('tags:post:456');

// Remove from set
await kv.srem('tags:post:456', 'nextjs');

// Set intersection (common tags between posts)
const commonTags = await kv.sinter<string>('tags:post:456', 'tags:post:789');

// Set cardinality (count)
const tagCount = await kv.scard('tags:post:456');
```

**Sorted set operations (rankings, scores):**
```typescript
// Add scores
await kv.zadd('leaderboard:weekly', {
  score: 1500,
  member: 'user:alice',
});
await kv.zadd('leaderboard:weekly', {
  score: 1200,
  member: 'user:bob',
});

// Get top 10 (highest score first)
const topPlayers = await kv.zrange<string>(
  'leaderboard:weekly', 0, 9, { rev: true }
);

// Get rank (0-indexed)
const rank = await kv.zrevrank('leaderboard:weekly', 'user:alice');

// Get score
const score = await kv.zscore('leaderboard:weekly', 'user:alice');

// Increment score
await kv.zincrby('leaderboard:weekly', 50, 'user:alice');

// Count members in score range
const eliteCount = await kv.zcount('leaderboard:weekly', 1000, '+inf');

// Remove member
await kv.zrem('leaderboard:weekly', 'user:bob');
```

### Step 4: Pipeline and batching

**Pipeline multiple commands (single round-trip):**
```typescript
import { kv } from '@vercel/kv';

const pipeline = kv.pipeline();
pipeline.incr('page:views:home');
pipeline.incr('page:views:total');
pipeline.set('last-visit', new Date().toISOString());
pipeline.expire('last-visit', 86400);

const results = await pipeline.exec();
// results = [newHomeViews, newTotalViews, 'OK', 1]
```

**Multi-get pattern:**
```typescript
// Fetch multiple keys at once
const keys = ['config:theme', 'config:locale', 'config:timezone'];
const pipeline = kv.pipeline();
keys.forEach((key) => pipeline.get(key));
const values = await pipeline.exec();
```

### Step 5: Implement caching pattern

**Generic cache-aside function:**
```typescript
import { kv } from '@vercel/kv';

async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await kv.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss: fetch from source
  const data = await fetcher();

  // Store in cache with TTL
  await kv.set(key, data, { ex: ttlSeconds });

  return data;
}

// Usage in API route
export async function GET(request: NextRequest) {
  const products = await cached(
    'products:featured',
    () => db.product.findMany({ where: { featured: true } }),
    300 // 5 minutes
  );

  return NextResponse.json(products);
}
```

**Cache invalidation on write:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const product = await db.product.create({ data: body });

  // Invalidate related caches
  await kv.del('products:featured');
  await kv.del('products:all');
  await kv.del(`product:${product.id}`);

  return NextResponse.json(product, { status: 201 });
}
```

**Stale-while-revalidate pattern:**
```typescript
async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60,
  staleSeconds: number = 300
): Promise<T> {
  const cached = await kv.get<{ data: T; timestamp: number }>(key);

  if (cached) {
    const age = (Date.now() - cached.timestamp) / 1000;

    if (age < ttlSeconds) {
      return cached.data; // Fresh
    }

    if (age < staleSeconds) {
      // Stale: return cached but refresh in background
      fetcher().then(async (data) => {
        await kv.set(key, { data, timestamp: Date.now() }, { ex: staleSeconds });
      });
      return cached.data;
    }
  }

  // Expired or missing: fetch fresh
  const data = await fetcher();
  await kv.set(key, { data, timestamp: Date.now() }, { ex: staleSeconds });
  return data;
}
```

### Step 6: Implement rate limiting

**Sliding window rate limiter:**
```typescript
import { kv } from '@vercel/kv';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const pipeline = kv.pipeline();
  // Remove expired entries
  pipeline.zremrangebyscore(key, 0, windowStart);
  // Add current request
  pipeline.zadd(key, { score: now, member: `${now}:${Math.random()}` });
  // Count requests in window
  pipeline.zcard(key);
  // Set TTL on the key
  pipeline.expire(key, windowSeconds);

  const results = await pipeline.exec();
  const requestCount = results[2] as number;

  return {
    success: requestCount <= limit,
    limit,
    remaining: Math.max(0, limit - requestCount),
    reset: Math.ceil((windowStart + windowSeconds * 1000) / 1000),
  };
}

// Usage in API route
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success, limit, remaining, reset } = await rateLimit(ip, 20, 60);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': '60',
        },
      }
    );
  }

  // Process request...
}
```

### Step 7: Implement session management

**Server-side session store:**
```typescript
import { kv } from '@vercel/kv';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

interface Session {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
}

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

async function createSession(userData: Omit<Session, 'createdAt'>): Promise<string> {
  const sessionId = randomUUID();
  const session: Session = {
    ...userData,
    createdAt: Date.now(),
  };

  await kv.set(`session:${sessionId}`, session, { ex: SESSION_TTL });

  const cookieStore = await cookies();
  cookieStore.set('session-id', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL,
    path: '/',
  });

  return sessionId;
}

async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session-id')?.value;
  if (!sessionId) return null;

  const session = await kv.get<Session>(`session:${sessionId}`);

  if (session) {
    // Refresh TTL on access
    await kv.expire(`session:${sessionId}`, SESSION_TTL);
  }

  return session;
}

async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session-id')?.value;
  if (sessionId) {
    await kv.del(`session:${sessionId}`);
    cookieStore.delete('session-id');
  }
}
```

### Step 8: Implement feature flags

**Feature flag system with JSON:**
```typescript
import { kv } from '@vercel/kv';

interface FeatureFlag {
  enabled: boolean;
  percentage?: number; // 0-100 for gradual rollout
  allowedUsers?: string[];
  metadata?: Record<string, unknown>;
}

async function isFeatureEnabled(
  flagName: string,
  userId?: string
): Promise<boolean> {
  const flag = await kv.get<FeatureFlag>(`flag:${flagName}`);

  if (!flag) return false;
  if (!flag.enabled) return false;

  // Check user allowlist
  if (flag.allowedUsers && userId) {
    if (flag.allowedUsers.includes(userId)) return true;
  }

  // Percentage-based rollout
  if (flag.percentage !== undefined && userId) {
    const hash = Array.from(userId).reduce(
      (acc, char) => acc + char.charCodeAt(0), 0
    );
    return (hash % 100) < flag.percentage;
  }

  return flag.enabled;
}

// Set a feature flag
async function setFeatureFlag(
  flagName: string,
  flag: FeatureFlag
): Promise<void> {
  await kv.set(`flag:${flagName}`, flag);
}

// Usage
await setFeatureFlag('new-checkout', {
  enabled: true,
  percentage: 25, // 25% of users
  allowedUsers: ['user:admin', 'user:beta-tester'],
});

const showNewCheckout = await isFeatureEnabled('new-checkout', userId);
```

### Step 9: Implement leaderboard

**Real-time leaderboard with sorted sets:**
```typescript
import { kv } from '@vercel/kv';

interface LeaderboardEntry {
  member: string;
  score: number;
  rank: number;
}

async function addScore(
  board: string,
  userId: string,
  points: number
): Promise<void> {
  await kv.zincrby(`leaderboard:${board}`, points, userId);
}

async function getTopN(
  board: string,
  n: number = 10
): Promise<LeaderboardEntry[]> {
  const members = await kv.zrange<string>(
    `leaderboard:${board}`, 0, n - 1, { rev: true, withScores: true }
  );

  // zrange with withScores returns [member, score, member, score, ...]
  // But @vercel/kv types may vary; adjust based on actual response
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < members.length; i += 2) {
    entries.push({
      member: members[i] as string,
      score: members[i + 1] as unknown as number,
      rank: Math.floor(i / 2) + 1,
    });
  }

  return entries;
}

async function getUserRank(
  board: string,
  userId: string
): Promise<{ rank: number; score: number } | null> {
  const pipeline = kv.pipeline();
  pipeline.zrevrank(`leaderboard:${board}`, userId);
  pipeline.zscore(`leaderboard:${board}`, userId);

  const [rank, score] = await pipeline.exec();

  if (rank === null) return null;

  return {
    rank: (rank as number) + 1,
    score: score as number,
  };
}

// Periodic reset (call from cron job)
async function resetLeaderboard(board: string): Promise<void> {
  // Archive current leaderboard
  const timestamp = new Date().toISOString().split('T')[0];
  const pipeline = kv.pipeline();
  // Copy current to archive (not a native Redis command, must reconstruct)
  // Instead, delete the current board
  pipeline.del(`leaderboard:${board}`);
  await pipeline.exec();
}
```

### Step 10: Vercel KV vs Upstash Redis direct

**When to use @vercel/kv:**
- Integrated with Vercel project environment variables
- Simplified setup with auto-configured connection
- Works from both Serverless and Edge Functions

**When to use @upstash/redis directly:**
- Need advanced features (JSON module, vector search)
- Need Upstash-specific rate limiting library
- Using outside of Vercel
- Need lower-level control

```bash
npm install @upstash/redis @upstash/ratelimit
```

### Best practices:
- Always set TTL on cache keys to prevent unbounded memory growth
- Use pipelines to batch multiple operations into a single round-trip
- Prefix keys with a namespace pattern (`user:123:profile`, `cache:products:featured`)
- Store JSON-serializable data; KV handles serialization automatically
- Use sorted sets for time-series data and leaderboards
- Implement cache-aside pattern with explicit invalidation on writes
- Keep individual values under 1 MB for optimal performance
- Use `nx` (set-if-not-exists) for distributed locking patterns

### Anti-patterns to avoid:
- Do not use KV as a primary database (it is a cache/state store)
- Avoid storing large blobs (over 1 MB); use Vercel Blob instead
- Do not rely on key scanning (`SCAN`, `KEYS`) in production (expensive)
- Avoid unbounded lists or sets; use `LTRIM` or TTL to bound data
- Do not use pub/sub patterns (Vercel KV uses REST, not persistent connections)
- Never store sensitive data without encryption (KV data is not encrypted at the application level)
- Avoid using KV for full-text search (use a dedicated search service)

### Cost optimization:
- Use pipelines to reduce command count (billed per command)
- Set appropriate TTL to automatically clean up stale data
- Use `s-maxage` HTTP caching before falling back to KV caching
- Batch reads with `mget` or pipelines instead of individual `get` calls
- Monitor daily command usage in Vercel Dashboard > Storage
- Use read-only tokens for read-heavy workloads (cheaper read commands)
- Consider edge caching (HTTP cache) for data that does not change frequently
- Avoid unnecessary `EXISTS` checks; attempt the operation and handle nulls
