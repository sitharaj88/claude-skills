---
name: azure-cache-redis
description: Generate Azure Cache for Redis configurations with clustering, geo-replication, caching patterns, and Redis modules. Use when the user wants to set up in-memory caching, session management, or real-time data processing.
argument-hint: "[tier]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Cache for Redis expert. Generate production-ready in-memory caching and data store configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Purpose**: caching, session management, rate limiting, leaderboards, pub/sub, message broker
- **Tier**: Basic (dev), Standard (production), Premium (enterprise features), Enterprise (Redis modules)
- **Size**: expected data size, throughput, and connection count
- **Availability**: single zone (dev) or zone-redundant (production)

### Step 2: Choose the right tier

| Tier | Replication | Clustering | VNET | Persistence | Modules | SLA |
|------|-------------|------------|------|-------------|---------|-----|
| Basic | No | No | No | No | No | None |
| Standard | Yes (1 replica) | No | No | No | No | 99.9% |
| Premium | Yes (up to 3) | Yes (up to 10 shards) | Yes | Yes (RDB/AOF) | No | 99.9% |
| Enterprise | Yes | Yes (up to 500 shards) | Yes | Yes | Yes | 99.99% |
| Enterprise Flash | Yes | Yes | Yes | Yes (RDB) | Yes | 99.99% |

**Enterprise tier modules:**
- **RediSearch**: full-text search and secondary indexing
- **RedisJSON**: native JSON document storage and queries
- **RedisTimeSeries**: time-series data ingestion and queries
- **RedisBloom**: probabilistic data structures (Bloom filter, Count-Min Sketch)

### Step 3: Generate cache configuration

**Bicep (Standard tier):**
```bicep
param location string = resourceGroup().location
param cacheName string

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: cacheName
  location: location
  properties: {
    sku: {
      name: 'Standard'
      family: 'C'
      capacity: 2
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
      'maxmemory-reserved': '50'
      'maxfragmentationmemory-reserved': '50'
    }
    publicNetworkAccess: 'Disabled'
  }
}
```

**Bicep (Premium tier with clustering):**
```bicep
resource redisPremium 'Microsoft.Cache/redis@2023-08-01' = {
  name: cacheName
  location: location
  zones: ['1', '2', '3']
  properties: {
    sku: {
      name: 'Premium'
      family: 'P'
      capacity: 1
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    shardCount: 3
    replicasPerMaster: 1
    redisConfiguration: {
      'maxmemory-policy': 'volatile-lru'
      'maxmemory-reserved': '200'
      'rdb-backup-enabled': 'true'
      'rdb-backup-frequency': '60'
      'rdb-storage-connection-string': storageConnectionString
    }
    publicNetworkAccess: 'Disabled'
    subnetId: subnetId
  }
}
```

**Terraform:**
```hcl
resource "azurerm_redis_cache" "main" {
  name                          = var.cache_name
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  capacity                      = 2
  family                        = "C"
  sku_name                      = "Standard"
  enable_non_ssl_port           = false
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false

  redis_configuration {
    maxmemory_reserved              = 50
    maxfragmentationmemory_reserved = 50
    maxmemory_policy                = "allkeys-lru"
  }

  tags = var.tags
}

# Premium tier with clustering
resource "azurerm_redis_cache" "premium" {
  name                          = var.cache_name
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  capacity                      = 1
  family                        = "P"
  sku_name                      = "Premium"
  enable_non_ssl_port           = false
  minimum_tls_version           = "1.2"
  shard_count                   = 3
  replicas_per_master           = 1
  public_network_access_enabled = false
  subnet_id                     = azurerm_subnet.redis.id
  zones                         = ["1", "2", "3"]

  redis_configuration {
    maxmemory_reserved              = 200
    maxfragmentationmemory_reserved = 200
    maxmemory_policy                = "volatile-lru"
    rdb_backup_enabled              = true
    rdb_backup_frequency            = 60
    rdb_storage_connection_string   = azurerm_storage_account.main.primary_connection_string
  }

  tags = var.tags
}
```

**Bicep (Enterprise tier with modules):**
```bicep
resource redisEnterprise 'Microsoft.Cache/redisEnterprise@2023-11-01' = {
  name: cacheName
  location: location
  sku: {
    name: 'Enterprise_E10'
    capacity: 2
  }
  zones: ['1', '2', '3']
}

resource redisDatabase 'Microsoft.Cache/redisEnterprise/databases@2023-11-01' = {
  parent: redisEnterprise
  name: 'default'
  properties: {
    clientProtocol: 'Encrypted'
    evictionPolicy: 'AllKeysLRU'
    clusteringPolicy: 'EnterpriseCluster'
    modules: [
      { name: 'RediSearch' }
      { name: 'RedisJSON' }
    ]
    persistence: {
      rdbEnabled: true
      rdbFrequency: '6h'
    }
  }
}
```

### Step 4: Configure geo-replication

**Active geo-replication (Enterprise tier):**
```bicep
resource geoReplication 'Microsoft.Cache/redisEnterprise/databases@2023-11-01' = {
  parent: redisEnterprise
  name: 'default'
  properties: {
    geoReplication: {
      groupNickname: 'myapp-geo'
      linkedDatabases: [
        { id: primaryDatabaseId }
        { id: secondaryDatabaseId }
      ]
    }
  }
}
```

- **Active-Active**: both regions accept writes (Enterprise tier)
- **Active-Passive**: secondary is read-only (Premium tier via linked servers)
- CRDT-based conflict resolution for active-active

**Passive geo-replication (Premium tier):**
```bash
az redis server-link create \
  --name primary-cache \
  --resource-group rg-primary \
  --server-to-link /subscriptions/.../secondary-cache \
  --replication-role Secondary
```

### Step 5: Configure private endpoints

```bicep
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-04-01' = {
  name: '${cacheName}-pe'
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${cacheName}-plsc'
        properties: {
          privateLinkServiceId: redisCache.id
          groupIds: ['redisCache']
        }
      }
    ]
  }
}
```

### Step 6: Implement caching patterns

**Cache-Aside (Lazy Loading):**
```javascript
const redis = require('ioredis');
const client = new redis({
  host: process.env.REDIS_HOST,
  port: 6380,
  password: process.env.REDIS_KEY,
  tls: { servername: process.env.REDIS_HOST }
});

async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  // 1. Check cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss - query database
  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

  // 3. Populate cache with TTL
  await client.setex(cacheKey, 3600, JSON.stringify(user));

  return user;
}

async function updateUser(userId, data) {
  // 1. Update database
  await db.query('UPDATE users SET ? WHERE id = ?', [data, userId]);

  // 2. Invalidate cache
  await client.del(`user:${userId}`);
}
```

**Write-Through:**
```javascript
async function saveOrder(order) {
  const cacheKey = `order:${order.id}`;

  // Write to both cache and database
  await Promise.all([
    client.setex(cacheKey, 7200, JSON.stringify(order)),
    db.query('INSERT INTO orders SET ?', order)
  ]);

  return order;
}
```

**Write-Behind (with queue):**
```javascript
async function saveMetric(metric) {
  const cacheKey = `metric:${metric.id}`;

  // 1. Write to cache immediately
  await client.setex(cacheKey, 3600, JSON.stringify(metric));

  // 2. Queue for async database write
  await client.rpush('db:write-queue', JSON.stringify({
    table: 'metrics',
    data: metric,
    timestamp: Date.now()
  }));
}
```

### Step 7: Implement common use cases

**Session management:**
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1800000 // 30 minutes
  }
}));
```

**Rate limiting:**
```javascript
async function rateLimit(clientId, limit, windowSeconds) {
  const key = `ratelimit:${clientId}`;
  const current = await client.incr(key);

  if (current === 1) {
    await client.expire(key, windowSeconds);
  }

  if (current > limit) {
    const ttl = await client.ttl(key);
    throw new Error(`Rate limit exceeded. Retry after ${ttl} seconds.`);
  }

  return { remaining: limit - current, limit };
}
```

**Leaderboard with sorted sets:**
```javascript
// Add/update score
await client.zadd('leaderboard:weekly', score, `player:${playerId}`);

// Get top 10
const top10 = await client.zrevrange('leaderboard:weekly', 0, 9, 'WITHSCORES');

// Get player rank
const rank = await client.zrevrank('leaderboard:weekly', `player:${playerId}`);
```

**Distributed locking:**
```javascript
const Redlock = require('redlock');
const redlock = new Redlock([client], {
  retryCount: 3,
  retryDelay: 200
});

async function processExclusively(resourceId, fn) {
  const lock = await redlock.acquire([`lock:${resourceId}`], 30000);
  try {
    return await fn();
  } finally {
    await lock.release();
  }
}
```

### Step 8: Configure eviction policies

| Policy | Behavior | Use Case |
|--------|----------|----------|
| `volatile-lru` | Evict LRU keys with TTL set | Mixed persistent + cache data |
| `allkeys-lru` | Evict LRU across all keys | Pure cache |
| `volatile-ttl` | Evict keys with shortest TTL | Time-sensitive data |
| `volatile-random` | Evict random key with TTL | When all data is equally important |
| `allkeys-random` | Evict random key | When all data is equally important |
| `noeviction` | Return error when full | When data loss is unacceptable |

### Step 9: Monitoring and diagnostics

```bash
# Enable diagnostics
az redis update --name $CACHE_NAME \
  --resource-group $RG \
  --set "redisConfiguration.maxmemory-policy=allkeys-lru"

# Monitor key metrics
az monitor metrics list \
  --resource $CACHE_RESOURCE_ID \
  --metric "cacheHits,cacheMisses,connectedclients,usedmemory,serverLoad" \
  --interval PT1M
```

**Key metrics to monitor:**
- Cache hit ratio (aim for > 80%)
- Server load (alert at > 80%)
- Connected clients vs max connections
- Used memory vs max memory
- Evicted keys (indicates need for larger cache)
- Operations per second

### Best practices

- **Use Standard tier minimum**: for production (Basic has no SLA or replication)
- **Enable TLS**: disable non-SSL port, set minimum TLS 1.2
- **Use private endpoints**: disable public network access
- **Set appropriate TTLs**: never cache indefinitely in a cache-aside pattern
- **Use key prefixes**: namespace keys for organization (`user:123`, `session:abc`)
- **Use connection pooling**: reuse connections, avoid creating per-request
- **Configure maxmemory-reserved**: reserve 10% for non-cache overhead
- **Monitor cache hit ratio**: low hit ratio means TTLs are too short or keys too granular
- **Use Pipeline/MULTI for batching**: reduce round trips for multiple operations
- **Prefer managed identity**: use Azure AD authentication over access keys

### Anti-patterns to avoid

- Using Basic tier in production (no SLA, no replication)
- Creating a new connection per request instead of using connection pooling
- Storing very large values (>100 KB) that block the single-threaded Redis
- Not setting TTLs on cache entries (stale data and memory exhaustion)
- Using KEYS command in production (blocks Redis, use SCAN instead)
- Caching entire database tables instead of hot data subsets
- Ignoring eviction metrics (indicates undersized cache)
- Using Redis as primary database without persistence configuration
- Not handling connection failures gracefully (circuit breaker pattern)

### Security considerations

- Disable non-SSL port; enforce TLS 1.2+ connections
- Use Azure AD authentication with managed identities (preferred over access keys)
- Rotate access keys regularly if key-based auth is required
- Deploy in VNET (Premium) or use private endpoints (all tiers)
- Configure firewall rules to restrict access to known IPs
- Enable Microsoft Defender for Resource Manager for threat detection
- Disable public network access for production workloads
- Use separate caches for different security domains

### Cost optimization

- Right-size based on actual memory usage (monitor used memory %)
- Use Standard tier for caching (Premium only when clustering or VNET needed)
- Consider Enterprise Flash tier for large datasets (uses NVMe + DRAM)
- Use clustering to scale out instead of scaling up to larger single nodes
- Set eviction policies to prevent running out of memory
- Use TTLs aggressively to free memory for active data
- Monitor and remove unused or rarely accessed keys
- Reserve instances (1-year or 3-year) for predictable workloads
- Consider Azure Cache for Redis Enterprise for workloads needing modules (avoids self-managed Redis overhead)
