# Redis

Expert guidance for Redis caching patterns, data structures, pub/sub messaging, streams, rate limiting, and Lua scripting.

## Usage

```bash
/db-redis [description or question]
```

## What It Does

1. Designs caching strategies with TTL policies, eviction rules, and invalidation patterns
2. Selects optimal data structures (strings, hashes, sorted sets, HyperLogLog, Bloom filters)
3. Implements pub/sub messaging and Redis Streams for event-driven architectures
4. Builds rate limiters using sliding window or token bucket algorithms
5. Writes atomic Lua scripts for complex multi-key operations
6. Configures Redis Sentinel and Cluster for high availability

## Examples

```bash
/db-redis implement a sliding window rate limiter for an API
```

```bash
/db-redis design a leaderboard with sorted sets and real-time updates
```

```bash
/db-redis set up cache-aside pattern with invalidation for user sessions
```

## Allowed Tools

- Read
- Edit
- Write
- Bash
- Grep
- Glob
