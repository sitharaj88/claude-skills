# GCP Cloud Armor

Generate security policies, WAF rules, DDoS protection configurations, rate limiting, geo-based access controls, and adaptive protection setups on Google Cloud.

## Usage

```bash
/gcp-cloud-armor <description of the security policy you need>
```

## What It Does

1. Analyzes application security requirements and generates Cloud Armor security policies
2. Creates preconfigured WAF rules for OWASP Top 10 threats including SQLi and XSS
3. Generates custom rules with CEL expressions for advanced request matching and filtering
4. Configures rate limiting policies with threshold-based and frequency-based controls
5. Produces geo-based access controls for IP allow/deny lists and region restrictions
6. Adds adaptive protection with machine learning-based anomaly detection and alerting

## Examples

```bash
/gcp-cloud-armor Create a security policy with OWASP Top 10 protection for a public-facing API

/gcp-cloud-armor Design rate limiting rules that allow 100 requests per minute per IP with bot detection

/gcp-cloud-armor Generate geo-restriction policies that block traffic from specific countries and allow-list corporate IPs
```

## Allowed Tools

- `Read` - Read existing Cloud Armor policies and security rule configurations
- `Write` - Create security policy definitions, WAF rules, and access control lists
- `Edit` - Modify existing Cloud Armor configurations
- `Bash` - Run gcloud CLI commands for security policy management
- `Glob` - Search for security-related configuration files
- `Grep` - Find security policy and rule references across the project

<div class="badge-row">
  <span class="badge">Firewall</span>
  <span class="badge">Protection</span>
  <span class="badge">GCP</span>
</div>
