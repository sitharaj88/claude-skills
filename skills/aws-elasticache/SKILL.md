---
name: aws-elasticache
description: Generate AWS ElastiCache configurations for Redis and Memcached with cluster mode, replication, caching strategies, and connection management. Use when the user wants to set up in-memory caching or session storage.
argument-hint: "[redis|memcached] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS ElastiCache expert. Generate production-ready in-memory caching configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Engine**: Redis (recommended) or Memcached
- **Purpose**: caching, session storage, rate limiting, leaderboards, pub/sub, queues
- **Size**: expected data size and throughput
- **Availability**: single node (dev) or replication (production)

### Step 2: Choose engine

**Redis (recommended for most use cases):**
- Data persistence, replication, clustering
- Rich data structures (strings, hashes, lists, sets, sorted sets, streams)
- Pub/sub, Lua scripting, transactions
- Backup and restore

**Memcached:**
- Simple key-value caching only
- Multi-threaded (better per-node throughput)
- No persistence or replication
- Auto-discovery of nodes

### Step 3: Generate cluster configuration

Create ElastiCache (CloudFormation/Terraform) with:

**Redis:**
- Node type (cache.r7g for memory-intensive, cache.m7g for general)
- Cluster mode: disabled (single shard) or enabled (multiple shards)
- Replication group with 1-5 read replicas per shard
- Multi-AZ with automatic failover
- Subnet group (private/isolated subnets)
- Security group (app tier only, port 6379)
- Parameter group (maxmemory-policy, timeout, etc.)
- At-rest encryption (KMS) and in-transit encryption (TLS)
- Auth token or IAM authentication
- Automatic backups with retention
- Maintenance window

**Memcached:**
- Node type and count
- AZ placement
- Parameter group (max_item_size, chunk_size)

### Step 4: Generate caching strategy code

Implement the appropriate pattern:

**Cache-Aside (Lazy Loading):**
```
1. Check cache → if hit, return cached data
2. On miss → query database
3. Write result to cache with TTL
4. Return data
```

**Write-Through:**
```
1. Write to cache AND database simultaneously
2. Always consistent but higher write latency
```

**Write-Behind:**
```
1. Write to cache immediately
2. Async write to database (with queue)
3. Fast writes but risk of data loss
```

Generate client code with:
- Connection pooling
- Retry logic with exponential backoff
- Serialization/deserialization
- TTL management
- Cache key naming conventions

### Step 5: Performance tuning

- Eviction policy (volatile-lru, allkeys-lru, volatile-ttl)
- Memory management and reserved memory
- Connection limits
- Slow log monitoring
- CloudWatch alarms (CPU, memory, connections, cache hit ratio)

### Best practices:
- Use Redis for most use cases (richer features, persistence)
- Enable cluster mode for > 100GB or high throughput
- Use reader endpoint for read-heavy workloads
- Set appropriate TTLs (don't cache forever)
- Use cache key prefixes for namespacing
- Enable TLS in-transit encryption
- Monitor cache hit ratio (aim for > 80%)
- Use ElastiCache Serverless for variable workloads
