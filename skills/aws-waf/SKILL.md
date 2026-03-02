---
name: aws-waf
description: Generate AWS WAF configurations with managed rule groups, custom rules, rate limiting, and bot control. Use when the user wants to protect web applications from common web exploits.
argument-hint: "[cloudfront|alb|api-gateway] [protection level]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS WAF security expert. Generate production-ready web application firewall configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Protected resource**: CloudFront, ALB, API Gateway, AppSync, Cognito
- **Threats**: SQL injection, XSS, bots, DDoS, credential stuffing, IP blocking
- **Compliance**: OWASP Top 10, PCI DSS requirements
- **Budget**: managed rules have per-rule pricing

### Step 2: Generate Web ACL

Create WAF Web ACL with:
- Name and description
- Default action (Allow or Block)
- Scope: REGIONAL (ALB, API GW) or CLOUDFRONT
- Rule priority (lower number = evaluated first)
- CloudWatch metrics for each rule
- Sampled requests logging

### Step 3: Add managed rule groups

**AWS Managed Rules (recommended baseline):**
- `AWSManagedRulesCommonRuleSet` — OWASP core protections (XSS, SQLi, path traversal)
- `AWSManagedRulesKnownBadInputsRuleSet` — Log4j, Java deserialization
- `AWSManagedRulesSQLiRuleSet` — SQL injection (detailed)
- `AWSManagedRulesLinuxRuleSet` / `WindowsRuleSet` — OS-specific
- `AWSManagedRulesAmazonIpReputationList` — known malicious IPs
- `AWSManagedRulesAnonymousIpList` — VPNs, proxies, Tor
- `AWSManagedRulesBotControlRuleSet` — bot management (common or targeted)
- `AWSManagedRulesATPRuleSet` — account takeover prevention

Set rules to Count mode first, then switch to Block after validation.

### Step 4: Add custom rules

Create custom rules for:

**Rate limiting:**
```json
{
  "Name": "RateLimit",
  "Priority": 1,
  "Action": { "Block": {} },
  "Statement": {
    "RateBasedStatement": {
      "Limit": 2000,
      "AggregateKeyType": "IP"
    }
  }
}
```

**Geo-blocking:**
- Block or allow by country code
- Use as first rule for immediate filtering

**IP allow/block lists:**
- IP set for known good IPs (allow list)
- IP set for known bad IPs (block list)

**Custom patterns:**
- URI path restrictions
- Header validation
- Request body inspection
- Label-based logic for complex rules

### Step 5: Configure logging

- Full request logging to S3, CloudWatch Logs, or Kinesis Firehose
- Log filter (log only blocked, or sampled)
- Redact sensitive fields (Authorization header, cookies)

### Step 6: Monitoring and tuning

- CloudWatch metrics per rule (AllowedRequests, BlockedRequests)
- Dashboard for attack visibility
- Regular review of sampled requests
- False positive investigation and rule tuning
- Use Count mode before Block for new rules

### Best practices:
- Start with Count mode, analyze logs, then switch to Block
- Use AWS Managed Rules as baseline (low effort, high value)
- Add rate limiting as first defense against DDoS
- Use IP reputation list to block known bad actors
- Enable bot control for APIs (prevent scraping/abuse)
- Log everything to S3 for forensic analysis
- Review and tune rules monthly
- Use labels for complex rule logic across rule groups
- Test WAF rules in staging before production
