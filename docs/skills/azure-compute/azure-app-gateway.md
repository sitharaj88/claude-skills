# Azure Application Gateway

Generate Application Gateway configurations with WAF policies, SSL termination, URL-based routing, backend pools, and health probes.

## Usage

```bash
/azure-app-gateway <description of your Application Gateway setup>
```

## What It Does

1. Generates Application Gateway configurations with SKU, capacity, and autoscaling settings
2. Creates WAF policies with custom rules, managed rule sets, and exclusion configurations
3. Configures URL-based and path-based routing rules with rewrite sets and redirects
4. Sets up SSL/TLS termination with certificates from Key Vault and end-to-end SSL
5. Produces Bicep or Terraform templates with backend pools, health probes, and listeners
6. Adds integration with AKS via AGIC, Private Link, and diagnostic logging

## Examples

```bash
/azure-app-gateway Create a WAF v2 gateway with OWASP 3.2 rules, custom rate limiting, and Key Vault SSL certificates

/azure-app-gateway Set up path-based routing to three backend pools with custom health probes and cookie-based affinity

/azure-app-gateway Build an autoscaling Application Gateway with URL rewrite rules, redirect policies, and end-to-end TLS
```

## What It Covers

- **Gateway configuration** with SKU selection, autoscaling, and zone redundancy
- **WAF policies** with OWASP rule sets, custom rules, bot protection, and exclusions
- **Routing** with URL-based rules, path maps, multi-site listeners, and rewrite sets
- **SSL/TLS** with termination, end-to-end encryption, Key Vault integration, and TLS policies
- **Backend pools** with health probes, connection draining, and custom probe settings
- **Integration** with AKS Ingress Controller, Private Link, and Azure Monitor diagnostics

<div class="badge-row">
  <span class="badge">Azure</span>
  <span class="badge">HTTP(S)</span>
  <span class="badge">WAF</span>
</div>

## Allowed Tools

- `Read` - Read existing gateway configurations and WAF policies
- `Write` - Create gateway configs, WAF rules, and deployment templates
- `Edit` - Modify existing routing rules and backend pool settings
- `Bash` - Run Azure CLI commands for gateway management and diagnostics
- `Glob` - Search for gateway and WAF configuration files
- `Grep` - Find listener references and routing rule configurations
