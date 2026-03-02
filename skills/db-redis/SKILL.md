---
name: db-redis
description: Generate Redis data structures, caching patterns, pub/sub configurations, Lua scripts, and cluster setups. Use when the user wants to implement caching, sessions, rate limiting, queues, or real-time features with Redis.
argument-hint: "[caching|sessions|queues|pubsub|setup] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(redis-cli *)
user-invocable: true
---

## Instructions

You are a Redis expert. Generate production-ready Redis configurations and patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Use case**: caching, session storage, rate limiting, queues, leaderboards, pub/sub, real-time, geospatial
- **Client**: ioredis (Node.js), redis-py, go-redis, Jedis, StackExchange.Redis
- **Deployment**: standalone, Sentinel, Cluster, managed (ElastiCache, Upstash)

### Step 2: Choose data structures

Match use case to Redis data types:

| Use Case | Data Structure | Key Commands |
|----------|---------------|--------------|
| Caching | String | GET, SET, SETEX, MGET |
| Sessions | Hash | HSET, HGET, HGETALL, EXPIRE |
| Counters | String | INCR, INCRBY, DECR |
| Rate limiting | String + EXPIRE | INCR, EXPIRE, TTL |
| Queues | List | LPUSH, BRPOP, LRANGE |
| Priority queue | Sorted Set | ZADD, ZPOPMIN, ZRANGEBYSCORE |
| Leaderboards | Sorted Set | ZADD, ZRANK, ZREVRANGE |
| Unique items | Set | SADD, SISMEMBER, SINTER |
| Real-time | Pub/Sub | PUBLISH, SUBSCRIBE |
| Streams | Stream | XADD, XREAD, XREADGROUP |
| Geospatial | Geo | GEOADD, GEORADIUS, GEODIST |
| Bitmaps | Bitmap | SETBIT, GETBIT, BITCOUNT |

### Step 3: Generate caching patterns

**Cache-Aside:**
```javascript
async function getUser(id) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);
  const user = await db.users.findById(id);
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

**Cache invalidation strategies:**
- TTL-based expiration
- Event-driven invalidation (on write, publish invalidation)
- Write-through (update cache on every write)
- Cache stampede prevention with locking (SETNX)

### Step 4: Generate specialized patterns

**Rate limiter (sliding window):**
```javascript
async function isRateLimited(key, limit, windowSec) {
  const now = Date.now();
  const pipe = redis.pipeline();
  pipe.zremrangebyscore(key, 0, now - windowSec * 1000);
  pipe.zadd(key, now, `${now}-${Math.random()}`);
  pipe.zcard(key);
  pipe.expire(key, windowSec);
  const results = await pipe.exec();
  return results[2][1] > limit;
}
```

**Distributed lock:**
```javascript
// Redlock algorithm for distributed locking
const lock = await redlock.acquire([`lock:${resource}`], 5000);
try { /* critical section */ }
finally { await lock.release(); }
```

**Pub/Sub and Streams for real-time:**
- Pub/Sub for fire-and-forget messaging
- Streams (XADD/XREADGROUP) for persistent message queues with consumer groups

### Step 5: Configuration and deployment

Generate redis.conf for production:
- maxmemory and maxmemory-policy (allkeys-lru, volatile-lru, volatile-ttl)
- save/appendonly for persistence (RDB + AOF)
- bind and requirepass for security
- Sentinel config for HA (min 3 Sentinel nodes)
- Cluster config for horizontal scaling (min 6 nodes)
- TLS configuration

### Step 6: Monitoring

- INFO command for server stats
- SLOWLOG for slow queries
- MEMORY USAGE for key analysis
- Redis keyspace notifications
- CLIENT LIST for connection monitoring

### Best practices:
- Set maxmemory with appropriate eviction policy
- Use pipelining for multiple commands
- Use Lua scripts for atomic multi-step operations
- Prefer Streams over Pub/Sub when durability matters
- Use key namespacing: `service:entity:id`
- Set TTL on all cache keys (avoid unbounded growth)
- Use connection pooling in production
- Monitor memory usage and eviction rates
