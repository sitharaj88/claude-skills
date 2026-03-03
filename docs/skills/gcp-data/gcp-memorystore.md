# GCP Memorystore

Generate Memorystore configurations for Redis and Memcached with caching strategies, high availability, failover, and connection code for low-latency data access.

## Usage

```bash
/gcp-memorystore <description of your caching requirements>
```

## What It Does

1. Creates Memorystore for Redis instances with appropriate tier (Basic or Standard) and memory sizing
2. Generates Memorystore for Memcached instance configs with node count and CPU/memory allocation
3. Configures high availability with automatic failover and cross-zone replication for Redis
4. Sets up VPC networking, authorized networks, and Private Service Connect
5. Produces client connection code with caching patterns (cache-aside, write-through, write-behind)
6. Adds Redis AUTH, in-transit encryption, maintenance windows, and RDB snapshot schedules

## Examples

```bash
/gcp-memorystore Create a Standard tier Redis instance with 5GB memory, automatic failover, and AUTH enabled for session caching

/gcp-memorystore Set up a Memcached instance with 3 nodes for distributed caching of API responses with TTL-based eviction

/gcp-memorystore Configure a Redis instance with in-transit encryption and connection code implementing cache-aside pattern for a web application
```

## Allowed Tools

- `Read` - Read existing cache configurations and connection code
- `Write` - Create instance templates, connection configs, and caching pattern code
- `Edit` - Modify existing Memorystore configurations
- `Bash` - Run gcloud redis and gcloud memcache commands for validation
- `Glob` - Search for caching-related templates
- `Grep` - Find Memorystore references across the project
