# AWS Route 53

Generate DNS configurations with hosted zones, routing policies, health checks, and domain management for reliable name resolution.

## Usage

```bash
/aws-route53 <description of your DNS requirements>
```

## What It Does

1. Creates hosted zone configurations for public and private DNS
2. Generates record sets (A, AAAA, CNAME, MX, TXT, alias) with proper TTLs
3. Configures routing policies (simple, weighted, latency, failover, geolocation)
4. Sets up health checks with HTTP, HTTPS, and TCP endpoints
5. Produces domain registration and transfer configurations
6. Adds DNS failover patterns, traffic flow policies, and DNSSEC settings

## Examples

```bash
/aws-route53 Create a hosted zone with latency-based routing across US and EU regions

/aws-route53 Set up DNS failover with health checks between primary and DR environments

/aws-route53 Configure weighted routing for canary deployments with 90/10 traffic split
```

## Allowed Tools

- `Read` - Read existing DNS configurations and zone files
- `Write` - Create hosted zone templates, record sets, and health checks
- `Edit` - Modify existing Route 53 configurations
- `Bash` - Run AWS CLI Route 53 commands for DNS testing
- `Glob` - Search for DNS-related configuration files
- `Grep` - Find domain and hosted zone references
