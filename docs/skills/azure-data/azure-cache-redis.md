# Azure Cache for Redis

Generate Azure Cache for Redis configurations with clustering, data persistence, geo-replication, connection pooling, and cache-aside patterns.

## Usage

```bash
/azure-cache-redis <description of your caching requirements>
```

## What It Does

1. Creates Azure Cache for Redis instances with Basic, Standard, Premium, and Enterprise tiers
2. Generates clustering configurations with shard counts for horizontal scaling
3. Configures RDB and AOF data persistence with backup frequency and storage account targets
4. Sets up active geo-replication across Azure regions for disaster recovery
5. Produces connection pooling configurations with retry policies and circuit breakers
6. Adds cache-aside patterns, session store configs, rate limiting, and pub/sub messaging setups

## Examples

```bash
/azure-cache-redis Create a Premium tier Redis cache with 3 shards, RDB persistence, and active geo-replication across two regions

/azure-cache-redis Set up an Enterprise tier Redis cache with RediSearch and RedisJSON modules for full-text search workloads

/azure-cache-redis Configure a Standard tier cache with connection pooling, cache-aside pattern implementation, and private endpoint access
```

## What It Covers

- **Service tiers** - Basic, Standard, Premium, Enterprise, and Enterprise Flash with feature comparison
- **Clustering** - Shard configuration, cluster topology, and hash slot distribution
- **Data persistence** - RDB snapshots, AOF persistence, backup frequency, and recovery procedures
- **Geo-replication** - Active geo-replication with linked caches across Azure regions
- **Network security** - Private endpoints, VNet injection (Premium), and firewall rules
- **Connection management** - Connection pooling, retry policies, and StackExchange.Redis configuration
- **Caching patterns** - Cache-aside, write-through, write-behind, and read-through implementations
- **Advanced features** - Redis modules (RediSearch, RedisJSON, RedisTimeSeries) on Enterprise tier
- **Monitoring** - Azure Monitor metrics, cache diagnostics, and slow-log analysis

<div class="badge-row">
  <span class="badge">Caching</span>
  <span class="badge">In-Memory</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Redis configurations and caching strategy files
- `Write` - Create cache configurations, connection helpers, and ARM/Bicep templates
- `Edit` - Modify existing Redis cache settings and connection parameters
- `Bash` - Run az redis commands for validation and cache management
- `Glob` - Search for caching-related configuration and template files
- `Grep` - Find Redis connection string references and cache usage across the project
