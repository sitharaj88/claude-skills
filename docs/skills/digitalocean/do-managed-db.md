# DigitalOcean Managed Databases

Generate managed database configs for PostgreSQL, MySQL, Redis, MongoDB, and Kafka. Use when you need to provision or configure DigitalOcean Managed Databases.

## Usage

```bash
/do-managed-db [engine] [purpose]
```

## What It Does

1. Generates database cluster configurations for PostgreSQL, MySQL, Redis, MongoDB, and Kafka via doctl or Terraform
2. Creates database users, databases, and connection pools (PgBouncer for PostgreSQL)
3. Configures read replicas for offloading read-heavy queries from the primary node
4. Sets up trusted sources (firewall rules) restricting access to Droplets, Kubernetes, and App Platform
5. Tunes engine-specific settings for performance (shared_buffers, innodb_buffer_pool, eviction policies)
6. Manages Kafka topics with partition counts, replication factors, and retention policies
7. Provides connection examples with SSL/TLS for Node.js, Python, and Go clients
8. Handles backup management, point-in-time recovery, and database migration workflows

## Example Output

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

resource "digitalocean_database_db" "app_db" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "myapp"
}

resource "digitalocean_database_connection_pool" "app_pool" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "app-pool"
  mode       = "transaction"
  size       = 20
  db_name    = digitalocean_database_db.app_db.name
  user       = digitalocean_database_user.app_user.name
}

resource "digitalocean_database_firewall" "postgres" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "k8s"
    value = digitalocean_kubernetes_cluster.main.id
  }
}
```

## Installation

```bash
cp -r skills/do-managed-db ~/.claude/skills/
```

<div class="badge-row">
  <span class="badge">DigitalOcean</span>
  <span class="badge">PostgreSQL</span>
  <span class="badge">Redis</span>
  <span class="badge">Kafka</span>
</div>

## Allowed Tools

- `Read` - Read existing database configurations and connection settings
- `Write` - Create database cluster configs, user definitions, and firewall rules
- `Edit` - Modify existing database settings, pool sizes, and replication configs
- `Bash` - Run doctl, Terraform, psql, mysql, redis-cli, and mongosh commands
- `Glob` - Search for database configuration and migration files
- `Grep` - Find connection string references and database dependencies
