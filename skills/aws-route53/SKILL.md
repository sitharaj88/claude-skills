---
name: aws-route53
description: Generate AWS Route 53 DNS configurations with hosted zones, routing policies, health checks, and domain management. Use when the user wants to set up DNS or domain routing.
argument-hint: "[domain] [routing type] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS Route 53 DNS expert. Generate production-ready DNS configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Domain**: domain name to manage
- **Routing**: simple, weighted, latency, failover, geolocation, multivalue
- **Resources**: what to point records to (ALB, CloudFront, EC2, S3, etc.)
- **Health checks**: endpoint monitoring needs

### Step 2: Generate hosted zone

Create hosted zone configuration:
- Public hosted zone for internet-facing domains
- Private hosted zone for VPC-internal DNS
- NS records for domain delegation
- SOA record configuration
- DNSSEC signing (recommended)

### Step 3: Generate DNS records

Create records based on requirements:

**Common record types:**
- `A` / `AAAA`: IPv4/IPv6 address or alias to AWS resource
- `CNAME`: canonical name (not at zone apex)
- `MX`: mail exchange
- `TXT`: verification, SPF, DKIM, DMARC
- `NS`: name server delegation
- `SRV`: service locator
- `CAA`: certificate authority authorization

**Alias records (preferred for AWS resources):**
- CloudFront distribution
- ALB/NLB/Classic LB
- S3 website endpoint
- API Gateway
- VPC interface endpoint
- Another Route 53 record
- Global Accelerator

### Step 4: Configure routing policies

**Simple**: single resource
**Weighted**: percentage-based traffic split (A/B testing, migrations)
**Latency**: route to lowest latency region
**Failover**: primary/secondary with health check
**Geolocation**: route by continent/country/state
**Geoproximity**: route by geographic proximity with bias
**Multivalue Answer**: up to 8 healthy records returned

### Step 5: Generate health checks

Create health checks for:
- HTTP/HTTPS endpoint (status code, string matching)
- TCP connection
- CloudWatch alarm-based
- Calculated health check (combine multiple)

Configuration:
- Check interval (10 or 30 seconds)
- Failure threshold (1-10)
- Health checker regions
- Invert health check status
- SNS notification on status change

### Step 6: Generate domain registration (if needed)

- Domain registration or transfer
- Auto-renew configuration
- Privacy protection (WHOIS)
- Transfer lock

### Best practices:
- Use Alias records for AWS resources (free, supports zone apex)
- Enable DNSSEC for domain validation
- Use health checks with failover routing
- Set appropriate TTL (300s default, lower for failover)
- Use CAA records to restrict certificate issuance
- Monitor with Route 53 health check CloudWatch metrics
- Use private hosted zones for internal service discovery
- Enable query logging for troubleshooting
