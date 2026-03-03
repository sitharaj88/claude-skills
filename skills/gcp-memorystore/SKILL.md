---
name: gcp-memorystore
description: Generate Memorystore Redis and Memcached instance configurations with caching strategies, HA, and connection patterns. Use when the user wants to set up in-memory caching or session storage on GCP.
argument-hint: "[redis|memcached]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a GCP Memorystore expert. Generate production-ready in-memory caching and data store configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Engine**: Redis (recommended) or Memcached
- **Purpose**: caching, session storage, rate limiting, leaderboards, pub/sub, real-time analytics
- **Size**: expected data size, read/write throughput, concurrent connections
- **Availability**: basic (development) or standard with HA (production)
- **Connectivity**: which GCP services need access (GCE, GKE, Cloud Run, Cloud Functions)

### Step 2: Choose engine

**Redis (recommended for most use cases):**
- Persistence (RDB snapshots), replication, automatic failover
- Rich data structures: strings, hashes, lists, sets, sorted sets, streams, HyperLogLog
- Pub/sub messaging, Lua scripting, transactions (MULTI/EXEC)
- Redis Cluster mode for horizontal scaling
- Read replicas for read-heavy workloads

**Memcached:**
- Simple key-value caching only
- Multi-threaded architecture (higher per-node throughput for simple gets/sets)
- No persistence, no replication
- Auto-discovery of nodes
- Best for simple cache-aside patterns with ephemeral data

### Step 3: Generate Redis instance configuration

**Standard HA instance (production):**

```hcl
resource "google_redis_instance" "cache" {
  name           = "${var.project_id}-redis"
  tier           = "STANDARD_HA"  # BASIC (dev) or STANDARD_HA (prod)
  memory_size_gb = 5
  region         = var.region

  # Redis version
  redis_version = "REDIS_7_2"

  # Network configuration
  authorized_network = var.vpc_id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  # Redis configuration
  redis_configs = {
    maxmemory-policy  = "allkeys-lru"
    notify-keyspace-events = ""
    activedefrag      = "yes"
    lfu-log-factor    = "10"
  }

  # AUTH for additional security
  auth_enabled = true

  # TLS encryption in transit
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  # Maintenance window
  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 4
        minutes = 0
      }
    }
  }

  # Persistence (RDB snapshots)
  persistence_config {
    persistence_mode    = "RDB"
    rdb_snapshot_period = "ONE_HOUR"
  }

  # Read replicas
  replica_count      = 2
  read_replicas_mode = "READ_REPLICAS_ENABLED"

  labels = {
    environment = var.environment
    team        = var.team
  }
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "redis_port" {
  value = google_redis_instance.cache.port
}

output "redis_auth_string" {
  value     = google_redis_instance.cache.auth_string
  sensitive = true
}

output "redis_read_endpoint" {
  value = google_redis_instance.cache.read_endpoint
}
```

**Redis Cluster mode (for horizontal scaling):**

```hcl
resource "google_redis_cluster" "cluster" {
  name       = "${var.project_id}-redis-cluster"
  shard_count = 3
  region     = var.region

  psc_configs {
    network = var.vpc_id
  }

  replica_count          = 1
  transit_encryption_mode = "SERVER_AUTHENTICATION"
  authorization_mode      = "AUTH_DISABLED"
  node_type               = "REDIS_SHARED_CORE_NANO"  # or REDIS_STANDARD_SMALL, REDIS_HIGHMEM_MEDIUM, etc.
}
```

### Step 4: Generate Memcached instance configuration

```hcl
resource "google_memcache_instance" "cache" {
  name               = "${var.project_id}-memcached"
  region             = var.region
  authorized_network = var.vpc_id

  node_config {
    cpu_count      = 1
    memory_size_mb = 1024
  }
  node_count = 3  # Distribute across zones

  memcache_version = "MEMCACHE_1_6_15"

  memcache_parameters {
    params = {
      max-item-size = "8388608"  # 8MB max item size
      listen-backlog = "2048"
    }
  }

  maintenance_policy {
    weekly_maintenance_window {
      day      = "SATURDAY"
      duration = "7200s"
      start_time {
        hours   = 4
        minutes = 0
      }
    }
  }
}

output "memcached_discovery_endpoint" {
  value = google_memcache_instance.cache.discovery_endpoint
}

output "memcached_nodes" {
  value = google_memcache_instance.cache.memcache_nodes
}
```

### Step 5: Connection patterns from GCP services

**From GCE / GKE (direct VPC access):**

```python
import redis

# Standard Redis connection
def create_redis_client():
    client = redis.Redis(
        host="10.0.0.3",        # Memorystore private IP
        port=6379,
        password="auth-string",  # If AUTH enabled
        ssl=True,                # If TLS enabled
        ssl_ca_certs="/path/to/server-ca.pem",
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5,
        retry_on_timeout=True,
        health_check_interval=30,
    )
    return client

# Connection pool (recommended for multi-threaded apps)
def create_redis_pool():
    pool = redis.ConnectionPool(
        host="10.0.0.3",
        port=6379,
        password="auth-string",
        ssl=True,
        ssl_ca_certs="/path/to/server-ca.pem",
        max_connections=50,
        decode_responses=True,
    )
    return redis.Redis(connection_pool=pool)
```

**From Cloud Run (requires Serverless VPC Access connector):**

```hcl
resource "google_vpc_access_connector" "connector" {
  name          = "redis-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = var.vpc_name

  min_instances = 2
  max_instances = 10
}

resource "google_cloud_run_v2_service" "app" {
  name     = "my-app"
  location = var.region

  template {
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = "gcr.io/${var.project_id}/my-app:latest"
      env {
        name  = "REDIS_HOST"
        value = google_redis_instance.cache.host
      }
      env {
        name  = "REDIS_PORT"
        value = tostring(google_redis_instance.cache.port)
      }
      env {
        name = "REDIS_AUTH"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.redis_auth.secret_id
            version = "latest"
          }
        }
      }
    }
  }
}
```

**From Cloud Functions:**

```python
import functions_framework
import redis
import os

# Initialize outside handler for connection reuse
redis_client = redis.Redis(
    host=os.environ.get("REDIS_HOST", "10.0.0.3"),
    port=int(os.environ.get("REDIS_PORT", 6379)),
    password=os.environ.get("REDIS_AUTH"),
    decode_responses=True,
)

@functions_framework.http
def handler(request):
    cached = redis_client.get("my-key")
    if cached:
        return cached
    # Compute and cache
    result = expensive_computation()
    redis_client.setex("my-key", 300, result)  # Cache for 5 minutes
    return result
```

**Node.js connection with ioredis:**

```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_AUTH,
  tls: { rejectUnauthorized: false },
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));
```

### Step 6: Caching strategy implementations

**Cache-aside (lazy loading) pattern:**

```python
import json
import hashlib

class CacheAside:
    def __init__(self, redis_client, default_ttl=300):
        self.redis = redis_client
        self.default_ttl = default_ttl

    def get_or_set(self, key, fetch_fn, ttl=None):
        """Get from cache or fetch from source and cache."""
        cached = self.redis.get(key)
        if cached is not None:
            return json.loads(cached)

        # Cache miss - fetch from source
        data = fetch_fn()
        if data is not None:
            self.redis.setex(
                key,
                ttl or self.default_ttl,
                json.dumps(data, default=str),
            )
        return data

    def invalidate(self, key):
        """Remove cached item."""
        self.redis.delete(key)

    def invalidate_pattern(self, pattern):
        """Remove all keys matching a pattern (use sparingly)."""
        cursor = 0
        while True:
            cursor, keys = self.redis.scan(cursor, match=pattern, count=100)
            if keys:
                self.redis.delete(*keys)
            if cursor == 0:
                break

# Usage
cache = CacheAside(redis_client)
user = cache.get_or_set(
    f"user:{user_id}",
    lambda: db.query("SELECT * FROM users WHERE id = %s", user_id),
    ttl=600,
)
```

**Write-through pattern:**

```python
class WriteThrough:
    def __init__(self, redis_client, db_client, default_ttl=600):
        self.redis = redis_client
        self.db = db_client
        self.default_ttl = default_ttl

    def write(self, key, data, db_write_fn):
        """Write to both cache and database."""
        # Write to database first
        db_write_fn(data)
        # Then update cache
        self.redis.setex(key, self.default_ttl, json.dumps(data, default=str))

    def read(self, key, db_read_fn):
        """Read from cache, fallback to database."""
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        data = db_read_fn()
        if data:
            self.redis.setex(key, self.default_ttl, json.dumps(data, default=str))
        return data
```

**Write-behind (write-back) pattern:**

```python
import threading
import queue

class WriteBehind:
    def __init__(self, redis_client, db_client, flush_interval=5):
        self.redis = redis_client
        self.db = db_client
        self.write_queue = queue.Queue()
        self.flush_interval = flush_interval
        self._start_flusher()

    def write(self, key, data):
        """Write to cache immediately, queue DB write."""
        self.redis.set(key, json.dumps(data, default=str))
        self.write_queue.put((key, data))

    def _start_flusher(self):
        """Background thread to flush writes to database."""
        def flush():
            while True:
                batch = []
                try:
                    while len(batch) < 100:
                        item = self.write_queue.get(timeout=self.flush_interval)
                        batch.append(item)
                except queue.Empty:
                    pass
                if batch:
                    self.db.bulk_write(batch)

        thread = threading.Thread(target=flush, daemon=True)
        thread.start()
```

### Step 7: Session management

```python
import uuid
from datetime import timedelta

class SessionManager:
    def __init__(self, redis_client, session_ttl=3600):
        self.redis = redis_client
        self.session_ttl = session_ttl
        self.prefix = "session:"

    def create_session(self, user_id, metadata=None):
        """Create a new session."""
        session_id = str(uuid.uuid4())
        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            **(metadata or {}),
        }
        self.redis.hset(f"{self.prefix}{session_id}", mapping=session_data)
        self.redis.expire(f"{self.prefix}{session_id}", self.session_ttl)
        return session_id

    def get_session(self, session_id):
        """Retrieve and refresh session."""
        key = f"{self.prefix}{session_id}"
        session = self.redis.hgetall(key)
        if session:
            self.redis.expire(key, self.session_ttl)  # Refresh TTL
        return session or None

    def destroy_session(self, session_id):
        """Delete a session."""
        self.redis.delete(f"{self.prefix}{session_id}")
```

### Step 8: Rate limiting

```python
class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client

    def is_allowed(self, identifier, max_requests, window_seconds):
        """Sliding window rate limiter."""
        key = f"ratelimit:{identifier}"
        now = time.time()
        window_start = now - window_seconds

        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window_seconds)
        results = pipe.execute()

        current_count = results[2]
        return current_count <= max_requests

    def token_bucket(self, identifier, capacity, refill_rate):
        """Token bucket rate limiter using Lua script."""
        lua_script = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now

        local elapsed = now - last_refill
        tokens = math.min(capacity, tokens + elapsed * refill_rate)

        if tokens >= 1 then
            tokens = tokens - 1
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
            redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)
            return 1
        else
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
            redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)
            return 0
        end
        """
        result = self.redis.eval(
            lua_script, 1, f"bucket:{identifier}",
            capacity, refill_rate, time.time()
        )
        return bool(result)
```

### Step 9: Pub/Sub messaging

```python
import threading

# Publisher
def publish_event(redis_client, channel, event_data):
    """Publish an event to a Redis channel."""
    redis_client.publish(channel, json.dumps(event_data))

# Subscriber
def subscribe_to_events(redis_client, channels, handler):
    """Subscribe to Redis channels and process messages."""
    pubsub = redis_client.pubsub()
    pubsub.subscribe(*channels)

    def listen():
        for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                handler(message["channel"], data)

    thread = threading.Thread(target=listen, daemon=True)
    thread.start()
    return pubsub

# Usage
subscribe_to_events(
    redis_client,
    ["order:created", "order:updated"],
    lambda channel, data: print(f"Event on {channel}: {data}")
)
```

### Step 10: Memory management and eviction policies

| Policy | Description | Use Case |
|--------|-------------|----------|
| `noeviction` | Return errors when memory is full | Critical data that must not be lost |
| `allkeys-lru` | Evict least recently used keys | General-purpose caching |
| `allkeys-lfu` | Evict least frequently used keys | Frequency-biased caching |
| `volatile-lru` | Evict LRU keys with TTL set | Mixed persistent + cache data |
| `volatile-ttl` | Evict keys with shortest TTL | Time-sensitive caching |
| `allkeys-random` | Evict random keys | When all keys equally important |

```bash
# Check memory usage
gcloud redis instances describe my-redis \
  --region=us-central1 \
  --format="value(memorySizeGb)"

# Update Redis config
gcloud redis instances update my-redis \
  --region=us-central1 \
  --update-redis-config=maxmemory-policy=allkeys-lfu
```

### Best practices

- **Use Redis** for most use cases (richer features, persistence, replication)
- **Enable AUTH and TLS** for all production instances
- **Use STANDARD_HA tier** for production (automatic failover to replica)
- **Set appropriate TTLs** on all cached data (never cache indefinitely without reason)
- **Use connection pooling** to avoid creating/destroying connections per request
- **Use read replicas** for read-heavy workloads to reduce primary load
- **Use pipelining** for multiple commands to reduce round trips
- **Monitor memory utilization** and set alerts at 80% to avoid eviction surprises
- **Use key prefixes** for namespacing (e.g., `user:`, `session:`, `cache:`)
- **Initialize connections outside request handlers** in serverless environments

### Anti-patterns to avoid

- Caching without TTLs (leads to stale data and memory exhaustion)
- Using Redis as a primary database without backups
- Storing large values (> 1MB) that block the single-threaded Redis event loop
- Using KEYS command in production (blocks Redis; use SCAN instead)
- Not handling connection failures gracefully (app should degrade, not crash)
- Connecting to Memorystore without VPC access (requires VPC peering or Serverless VPC connector)
- Using Memcached when you need persistence or complex data structures

### Cost optimization

- **Use Basic tier** for development and non-critical caching (no replication, lower cost)
- **Right-size memory**: start small and scale up based on monitoring data
- **Use Redis Cluster mode** to scale horizontally instead of vertically for large datasets
- **Set eviction policies** to keep memory usage bounded without manual intervention
- **Use Memcached** for simple cache-aside patterns where persistence is not needed (lower cost per GB)
- **Monitor cache hit ratio** (aim for > 80%); low hit ratios indicate wasted spending
- **Review and clean up unused instances** regularly
- **Use Serverless VPC connectors** with min/max instances to control networking costs for Cloud Run/Functions
