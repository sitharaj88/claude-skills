---
name: do-managed-db
description: Generate managed database configs for PostgreSQL, MySQL, Redis, MongoDB, and Kafka. Use when the user wants to provision or configure DigitalOcean Managed Databases.
argument-hint: "[engine] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(doctl *), Bash(terraform *), Bash(psql *), Bash(mysql *), Bash(redis-cli *), Bash(mongosh *)
user-invocable: true
---

## Instructions

You are a DigitalOcean Managed Databases expert. Generate production-ready database configurations for PostgreSQL, MySQL, Redis, MongoDB, and Kafka.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Engine**: PostgreSQL, MySQL, Redis, MongoDB, Kafka
- **Purpose**: transactional (OLTP), caching, session store, message queue, analytics
- **Size**: expected data volume, connection count, throughput
- **Availability**: single node (dev), standby nodes (production)
- **Connectivity**: Droplets, Kubernetes, App Platform, external

### Step 2: PostgreSQL configuration

**doctl CLI:**
```bash
doctl databases create my-pg-db \
  --engine pg \
  --version 16 \
  --region nyc3 \
  --size db-s-2vcpu-4gb \
  --num-nodes 2 \
  --private-network-uuid <vpc-uuid>
```

**Terraform:**
```hcl
resource "digitalocean_database_cluster" "postgres" {
  name       = "my-pg-db"
  engine     = "pg"
  version    = "16"
  size       = "db-s-2vcpu-4gb"
  region     = "nyc3"
  node_count = 2

  private_network_uuid = digitalocean_vpc.main.id

  maintenance_window {
    day  = "sunday"
    hour = "04:00:00"
  }
}

# Create a database
resource "digitalocean_database_db" "app_db" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "myapp"
}

# Create application user
resource "digitalocean_database_user" "app_user" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "app"
}

# Connection pool (PgBouncer)
resource "digitalocean_database_connection_pool" "app_pool" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "app-pool"
  mode       = "transaction"
  size       = 20
  db_name    = digitalocean_database_db.app_db.name
  user       = digitalocean_database_user.app_user.name
}

# Read replica
resource "digitalocean_database_replica" "read_replica" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "pg-read-replica"
  size       = "db-s-2vcpu-4gb"
  region     = "nyc3"
}

# Trusted sources (firewall)
resource "digitalocean_database_firewall" "postgres" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "droplet"
    value = digitalocean_droplet.web.id
  }

  rule {
    type  = "k8s"
    value = digitalocean_kubernetes_cluster.main.id
  }

  rule {
    type  = "app"
    value = digitalocean_app.my_app.id
  }

  rule {
    type  = "ip_addr"
    value = "203.0.113.0/24"
  }
}
```

**PostgreSQL connection pooling (PgBouncer):**
```bash
# Create connection pool
doctl databases pool create <db-id> app-pool \
  --db myapp \
  --user app \
  --size 20 \
  --mode transaction

# Pool modes:
# - transaction: returns connection to pool after each transaction (recommended)
# - session: holds connection for entire client session
# - statement: returns connection after each statement (limited SQL support)
```

**PostgreSQL-specific configuration:**
```bash
# Configure database settings
doctl databases configuration update <db-id> \
  --config-json '{
    "pgbouncer_settings": {
      "server_reset_query_always": false,
      "min_pool_size": 5
    },
    "pg_settings": {
      "max_connections": 200,
      "shared_buffers_percentage": 25,
      "work_mem": 4,
      "effective_cache_size_percentage": 75,
      "log_min_duration_statement": 500,
      "autovacuum_naptime": 60,
      "autovacuum_vacuum_threshold": 50,
      "autovacuum_analyze_threshold": 50
    }
  }'
```

### Step 3: MySQL configuration

```hcl
resource "digitalocean_database_cluster" "mysql" {
  name       = "my-mysql-db"
  engine     = "mysql"
  version    = "8"
  size       = "db-s-2vcpu-4gb"
  region     = "nyc3"
  node_count = 2

  private_network_uuid = digitalocean_vpc.main.id
}

resource "digitalocean_database_db" "mysql_db" {
  cluster_id = digitalocean_database_cluster.mysql.id
  name       = "myapp"
}

resource "digitalocean_database_user" "mysql_user" {
  cluster_id        = digitalocean_database_cluster.mysql.id
  name              = "app"
  mysql_auth_plugin = "caching_sha2_password"
}

resource "digitalocean_database_replica" "mysql_replica" {
  cluster_id = digitalocean_database_cluster.mysql.id
  name       = "mysql-read-replica"
  size       = "db-s-2vcpu-4gb"
  region     = "nyc3"
}
```

**MySQL-specific settings:**
```bash
doctl databases configuration update <db-id> \
  --config-json '{
    "mysql_settings": {
      "sql_mode": "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION",
      "innodb_buffer_pool_size_percentage": 75,
      "max_connections": 200,
      "long_query_time": 2,
      "slow_query_log": true,
      "innodb_log_buffer_size": 16777216,
      "net_read_timeout": 30,
      "net_write_timeout": 30
    }
  }'
```

### Step 4: Redis configuration

```hcl
resource "digitalocean_database_cluster" "redis" {
  name       = "my-redis"
  engine     = "redis"
  version    = "7"
  size       = "db-s-1vcpu-2gb"
  region     = "nyc3"
  node_count = 1

  private_network_uuid = digitalocean_vpc.main.id
}
```

**Redis eviction policies:**
```bash
doctl databases configuration update <db-id> \
  --config-json '{
    "redis_settings": {
      "redis_maxmemory_policy": "allkeys-lru",
      "redis_timeout": 300,
      "redis_notify_keyspace_events": "",
      "redis_persistence": "rdb",
      "redis_acl_channels_default": "allchannels"
    }
  }'

# Eviction policies:
# - noeviction: return errors when memory limit reached (default)
# - allkeys-lru: evict least recently used keys (recommended for caching)
# - allkeys-lfu: evict least frequently used keys
# - volatile-lru: evict LRU keys with TTL set
# - volatile-lfu: evict LFU keys with TTL set
# - allkeys-random: evict random keys
# - volatile-random: evict random keys with TTL set
# - volatile-ttl: evict keys with shortest TTL
```

**Redis connection example:**
```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('ca-certificate.crt'),
  },
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});
```

### Step 5: MongoDB configuration

```hcl
resource "digitalocean_database_cluster" "mongodb" {
  name       = "my-mongodb"
  engine     = "mongodb"
  version    = "7"
  size       = "db-s-2vcpu-4gb"
  region     = "nyc3"
  node_count = 3  # MongoDB requires odd number for replica sets

  private_network_uuid = digitalocean_vpc.main.id
}

resource "digitalocean_database_db" "mongo_db" {
  cluster_id = digitalocean_database_cluster.mongodb.id
  name       = "myapp"
}

resource "digitalocean_database_user" "mongo_user" {
  cluster_id = digitalocean_database_cluster.mongodb.id
  name       = "app"
}
```

**MongoDB connection example:**
```javascript
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI, {
  tls: true,
  tlsCAFile: 'ca-certificate.crt',
  retryWrites: true,
  w: 'majority',
  readPreference: 'secondaryPreferred',
});
```

### Step 6: Kafka configuration

```hcl
resource "digitalocean_database_cluster" "kafka" {
  name       = "my-kafka"
  engine     = "kafka"
  version    = "3.7"
  size       = "db-s-2vcpu-4gb"
  region     = "nyc3"
  node_count = 3

  private_network_uuid = digitalocean_vpc.main.id
}

resource "digitalocean_database_kafka_topic" "events" {
  cluster_id         = digitalocean_database_cluster.kafka.id
  name               = "events"
  partition_count    = 6
  replication_factor = 3
  config {
    retention_ms                = 604800000   # 7 days
    cleanup_policy              = "delete"
    compression_type            = "producer"
    min_insync_replicas         = 2
    segment_ms                  = 86400000    # 1 day
    message_max_bytes           = 1048576     # 1MB
  }
}
```

**Kafka connection example:**
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: process.env.KAFKA_BROKERS.split(','),
  ssl: {
    ca: [fs.readFileSync('ca-certificate.crt')],
  },
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

// Producer
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'events',
  messages: [{ key: 'user-123', value: JSON.stringify({ action: 'login' }) }],
});

// Consumer
const consumer = kafka.consumer({ groupId: 'my-group' });
await consumer.connect();
await consumer.subscribe({ topic: 'events', fromBeginning: false });
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log(message.value.toString());
  },
});
```

### Step 7: Database migration

```bash
# Migrate an existing database to DO Managed Databases
doctl databases migrate <db-id> \
  --source "host=old-server.example.com port=5432 dbname=myapp user=admin password=secret sslmode=require"

# For MySQL, use mysqldump + restore
mysqldump -h old-server -u admin -p myapp > dump.sql
mysql -h <do-db-host> -u doadmin -p -P <port> --ssl-ca=ca-certificate.crt myapp < dump.sql

# For PostgreSQL, use pg_dump + pg_restore
pg_dump -h old-server -U admin -Fc myapp > dump.dump
pg_restore -h <do-db-host> -U doadmin -d myapp --no-owner dump.dump
```

### Step 8: Backups and recovery

```bash
# List backups
doctl databases backups list <db-id>

# Restore from backup (creates new cluster)
doctl databases create restored-db \
  --engine pg \
  --version 16 \
  --size db-s-2vcpu-4gb \
  --region nyc3 \
  --num-nodes 2 \
  --restore-from <db-id> \
  --backup-created-at "2024-06-15T10:30:00Z"

# Point-in-time recovery (PostgreSQL and MySQL)
doctl databases create pitr-db \
  --engine pg \
  --version 16 \
  --size db-s-2vcpu-4gb \
  --region nyc3 \
  --num-nodes 2 \
  --restore-from <db-id> \
  --backup-created-at "2024-06-15T14:25:00Z"
```

Automated backups:
- Daily backups retained for 7 days
- Point-in-time recovery within the backup window
- Backups are stored regionally and encrypted at rest

### Step 9: Connection management

**Connection strings:**
```bash
# Get connection details
doctl databases connection <db-id>

# Get connection pool details
doctl databases pool get <db-id> app-pool

# Connection string format (PostgreSQL)
# postgresql://user:password@host:port/dbname?sslmode=require

# Private connection (within VPC)
# postgresql://user:password@private-host:port/dbname?sslmode=require
```

**SSL/TLS connections:**
```bash
# Download CA certificate
doctl databases ca get <db-id> --output ca-certificate.crt

# PostgreSQL with SSL
psql "postgresql://doadmin:password@host:25060/defaultdb?sslmode=require"

# MySQL with SSL
mysql -h host -P 25060 -u doadmin -p --ssl-ca=ca-certificate.crt

# Redis with TLS
redis-cli -h host -p 25061 -a password --tls --cacert ca-certificate.crt
```

### Step 10: doctl database commands reference

```bash
# Cluster management
doctl databases list
doctl databases get <db-id>
doctl databases create <name> --engine <engine> --version <ver> --size <size> --region <region> --num-nodes <count>
doctl databases delete <db-id>
doctl databases resize <db-id> --size <new-size> --num-nodes <count>
doctl databases migrate <db-id> --region <new-region>

# Database and user management
doctl databases db list <db-id>
doctl databases db create <db-id> <db-name>
doctl databases user list <db-id>
doctl databases user create <db-id> <username>
doctl databases user reset <db-id> <username>

# Connection pools (PostgreSQL)
doctl databases pool list <db-id>
doctl databases pool create <db-id> <pool-name> --db <db> --user <user> --size <size> --mode <mode>

# Replicas
doctl databases replica list <db-id>
doctl databases replica create <db-id> <name> --size <size>

# Firewall (trusted sources)
doctl databases firewalls list <db-id>
doctl databases firewalls append <db-id> --rule <type>:<value>
doctl databases firewalls remove <db-id> --uuid <rule-uuid>

# Maintenance
doctl databases maintenance-window update <db-id> --day <day> --hour <hour>

# Topics (Kafka)
doctl databases topics list <db-id>
doctl databases topics create <db-id> <topic-name> --partitions <count> --replication <factor>
```

### Database size reference

| Size Slug | vCPUs | RAM | Disk | $/mo |
|-----------|-------|-----|------|------|
| db-s-1vcpu-1gb | 1 | 1GB | 10GB | $15 |
| db-s-1vcpu-2gb | 1 | 2GB | 25GB | $30 |
| db-s-2vcpu-4gb | 2 | 4GB | 38GB | $60 |
| db-s-4vcpu-8gb | 4 | 8GB | 115GB | $120 |
| db-s-6vcpu-16gb | 6 | 16GB | 270GB | $240 |
| db-s-8vcpu-32gb | 8 | 32GB | 580GB | $480 |
| db-s-16vcpu-64gb | 16 | 64GB | 1.12TB | $960 |

Standby node: same price as primary (2-node = 2x cost).

### Best practices

- Always configure trusted sources (firewall rules) to restrict database access
- Use private networking (VPC) for all database connections from Droplets and K8s
- Enable standby nodes (node_count: 2+) for production databases
- Use connection pooling (PgBouncer) for PostgreSQL with many concurrent connections
- Download and use the CA certificate for SSL verification in all clients
- Set maintenance windows during low-traffic periods
- Use read replicas to offload read-heavy queries from the primary
- Store connection strings in environment variables or secrets management
- Monitor connection count, CPU, memory, and disk usage via the dashboard
- Test backup restoration regularly; create restore drills

### Anti-patterns to avoid

- Do not expose databases to the public internet; always use trusted sources
- Do not use the `doadmin` superuser for application connections; create dedicated users
- Do not skip SSL/TLS; always connect with `sslmode=require` or equivalent
- Do not use single-node clusters for production; add standby nodes for HA
- Do not set overly high connection pool sizes; match your actual connection needs
- Do not ignore slow query logs; enable and monitor `log_min_duration_statement`
- Do not forget to resize before hitting disk limits; monitor disk usage closely

### Cost optimization tips

- Use single-node clusters for development and staging environments
- Start with the smallest size and resize up as needed (resize is non-destructive)
- Use connection pooling to serve more clients with fewer database connections
- Use read replicas only when read traffic justifies the cost (same price as primary)
- Use Redis with `allkeys-lru` eviction instead of oversizing to hold all data
- Migrate to a larger region if your region has higher costs
- Consider App Platform dev databases (free tier) for prototyping
- Clean up unused databases; DO charges even for idle clusters
- Use Kafka only when you need durable message streaming; Redis pub/sub is cheaper for simple cases
