# AWS ElastiCache

Generate Redis and Memcached cluster configurations with replication, caching strategies, and application connection code.

## Usage

```bash
/aws-elasticache <description of your caching requirements>
```

## What It Does

1. Selects the appropriate engine (Redis or Memcached) based on use case
2. Generates cluster or replication group configurations with node types
3. Configures cluster mode, sharding, and replica settings for Redis
4. Sets up subnet groups, security groups, and parameter groups
5. Produces application code with caching patterns (cache-aside, write-through, TTL)
6. Adds encryption in-transit/at-rest, AUTH tokens, and CloudWatch alarms

## Examples

```bash
/aws-elasticache Create a Redis cluster with 3 shards and 2 replicas for session storage

/aws-elasticache Set up a Memcached cluster for API response caching with Node.js client code

/aws-elasticache Configure Redis with cache-aside pattern for DynamoDB query results
```

## Allowed Tools

- `Read` - Read existing caching configurations and application code
- `Write` - Create cluster templates, connection code, and caching logic
- `Edit` - Modify existing ElastiCache configurations
- `Bash` - Run AWS CLI ElastiCache commands
- `Glob` - Search for cache-related files
- `Grep` - Find caching references in application code
