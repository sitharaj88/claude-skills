# Azure Front Door

Generate Front Door profiles with global load balancing, caching rules, WAF policies, custom domains, and edge optimization configurations.

## Usage

```bash
/azure-front-door <description of your Front Door setup>
```

## What It Does

1. Generates Front Door profiles with Standard and Premium tier configurations
2. Creates routing rules with origin groups, caching policies, and URL redirect rules
3. Configures WAF policies with managed and custom rule sets for edge protection
4. Sets up custom domains with automated certificate management and DNS validation
5. Produces Bicep or Terraform templates with endpoints, routes, and rule sets
6. Adds Private Link origins, response header manipulation, and real-time analytics

## Examples

```bash
/azure-front-door Create a Premium Front Door with WAF bot protection, geo-filtering rules, and rate limiting per IP

/azure-front-door Set up global load balancing across three regions with health probes, failover priority, and caching rules

/azure-front-door Build a Front Door profile with custom domains, managed TLS certificates, and URL rewrite rules for an SPA
```

## What It Covers

- **Profile configuration** with Standard and Premium tiers, endpoints, and origin groups
- **Routing** with route rules, URL redirect, URL rewrite, and rule set engine
- **Caching** with cache duration, query string handling, and compression settings
- **WAF policies** with managed rules, custom rules, geo-filtering, and rate limiting
- **Custom domains** with automated TLS certificates, DNS validation, and HTTPS enforcement
- **Origins** with load balancing, health probes, Private Link, and session affinity

<div class="badge-row">
  <span class="badge">Azure</span>
  <span class="badge">CDN</span>
  <span class="badge">Edge</span>
</div>

## Allowed Tools

- `Read` - Read existing Front Door profiles and WAF policy configurations
- `Write` - Create Front Door configs, WAF rules, and deployment templates
- `Edit` - Modify existing routing rules and caching configurations
- `Bash` - Run Azure CLI commands for Front Door management and diagnostics
- `Glob` - Search for Front Door and WAF configuration files
- `Grep` - Find endpoint references and origin group configurations
