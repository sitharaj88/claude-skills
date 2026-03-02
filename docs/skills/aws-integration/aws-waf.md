# AWS WAF

Generate WAF Web ACLs with managed rule groups, custom rules, rate limiting, bot control, and IP reputation filtering.

## Usage

```bash
/aws-waf <description of your web application protection needs>
```

## What It Does

1. Creates Web ACL configurations with appropriate default actions
2. Configures AWS Managed Rule groups (Core, SQL injection, Known Bad Inputs)
3. Generates custom rules with match conditions and regex patterns
4. Sets up rate-based rules for DDoS protection and abuse prevention
5. Adds bot control rules to distinguish legitimate bots from threats
6. Produces IP set configurations, logging, and CloudWatch metrics

## Examples

```bash
/aws-waf Create a Web ACL for API Gateway with SQL injection and XSS protection

/aws-waf Set up rate limiting at 1000 requests per IP with bot control for CloudFront

/aws-waf Build custom WAF rules to block requests by geo-location and IP reputation
```

## Allowed Tools

- `Read` - Read existing WAF configurations and rule definitions
- `Write` - Create Web ACL templates, rule groups, and IP sets
- `Edit` - Modify existing WAF configurations
- `Bash` - Run AWS CLI WAF commands for testing and log inspection
- `Glob` - Search for security-related template files
- `Grep` - Find WAF and Web ACL references
