---
name: gcp-cloud-armor
description: Generate Cloud Armor security policies with WAF rules, DDoS protection, rate limiting, and bot management. Use when the user wants to protect web applications and APIs behind GCP load balancers.
argument-hint: "[policy-type]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Cloud Armor security expert. Generate production-ready security policies with WAF rules, DDoS protection, rate limiting, and bot management for GCP load balancers.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Policy type**: backend security, edge security, network edge (DDoS)
- **Protected resource**: HTTP(S) Load Balancer, TCP/SSL Proxy, external backend
- **Threats**: DDoS, SQL injection, XSS, credential stuffing, bot abuse, geo-blocking
- **Compliance**: OWASP Top 10, PCI DSS requirements
- **Traffic profile**: expected RPS, geographic distribution, bot traffic percentage

### Step 2: Understand Cloud Armor policy types

| Type | Protection | Scope |
|------|-----------|-------|
| Backend security policy | L7 WAF rules, rate limiting | HTTP(S) Load Balancer backend services |
| Edge security policy | L7 filtering at CDN edge | HTTP(S) Load Balancer with Cloud CDN |
| Network edge security | L3/L4 DDoS protection | TCP/UDP load balancers, VMs with external IPs |

### Step 3: Generate backend security policy

**Create a baseline security policy:**
```bash
# Create security policy
gcloud compute security-policies create my-security-policy \
  --description="Production WAF policy" \
  --type=CLOUD_ARMOR

# Set default rule to allow (deny rules will block bad traffic)
gcloud compute security-policies rules update 2147483647 \
  --security-policy=my-security-policy \
  --action=allow
```

**Terraform security policy:**
```hcl
resource "google_compute_security_policy" "default" {
  name        = "my-security-policy"
  description = "Production WAF security policy"
  project     = var.project_id
  type        = "CLOUD_ARMOR"

  # Default rule (lowest priority, always evaluated last)
  rule {
    action   = "allow"
    priority = 2147483647

    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }

    description = "Default allow rule"
  }

  # Adaptive protection (ML-based DDoS detection)
  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD"
    }
  }

  # Advanced options
  advanced_options_config {
    json_parsing = "STANDARD"
    log_level    = "VERBOSE"
  }
}

# Attach to backend service
resource "google_compute_backend_service" "default" {
  name            = "my-backend-service"
  security_policy = google_compute_security_policy.default.id
  # ... other backend service config
}
```

### Step 4: Add preconfigured WAF rules (OWASP Top 10)

```bash
# SQL injection protection
gcloud compute security-policies rules create 1000 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('sqli-v33-stable')" \
  --action=deny-403 \
  --description="SQL injection protection"

# Cross-site scripting (XSS) protection
gcloud compute security-policies rules create 1001 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('xss-v33-stable')" \
  --action=deny-403 \
  --description="XSS protection"

# Local file inclusion (LFI) protection
gcloud compute security-policies rules create 1002 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('lfi-v33-stable')" \
  --action=deny-403 \
  --description="Local file inclusion protection"

# Remote file inclusion (RFI) protection
gcloud compute security-policies rules create 1003 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('rfi-v33-stable')" \
  --action=deny-403 \
  --description="Remote file inclusion protection"

# Remote code execution (RCE) protection
gcloud compute security-policies rules create 1004 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('rce-v33-stable')" \
  --action=deny-403 \
  --description="Remote code execution protection"

# Method enforcement (block non-standard HTTP methods)
gcloud compute security-policies rules create 1005 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('methodenforcement-v33-stable')" \
  --action=deny-403 \
  --description="Method enforcement"

# Scanner detection
gcloud compute security-policies rules create 1006 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('scannerdetection-v33-stable')" \
  --action=deny-403 \
  --description="Scanner detection"

# Protocol attack protection
gcloud compute security-policies rules create 1007 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('protocolattack-v33-stable')" \
  --action=deny-403 \
  --description="Protocol attack protection"

# PHP injection protection
gcloud compute security-policies rules create 1008 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('php-v33-stable')" \
  --action=deny-403 \
  --description="PHP injection protection"

# Session fixation protection
gcloud compute security-policies rules create 1009 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('sessionfixation-v33-stable')" \
  --action=deny-403 \
  --description="Session fixation protection"

# Java/Log4j attack protection
gcloud compute security-policies rules create 1010 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('cve-canary')" \
  --action=deny-403 \
  --description="CVE canary rules (Log4j, Spring4Shell, etc.)"
```

**Terraform WAF rules:**
```hcl
resource "google_compute_security_policy" "waf" {
  name = "waf-policy"

  # OWASP SQL Injection
  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "SQL injection protection"
  }

  # OWASP XSS
  rule {
    action   = "deny(403)"
    priority = 1001
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "XSS protection"
  }

  # LFI/RFI
  rule {
    action   = "deny(403)"
    priority = 1002
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-v33-stable')"
      }
    }
    description = "Local file inclusion protection"
  }

  rule {
    action   = "deny(403)"
    priority = 1003
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rfi-v33-stable')"
      }
    }
    description = "Remote file inclusion protection"
  }

  # RCE
  rule {
    action   = "deny(403)"
    priority = 1004
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rce-v33-stable')"
      }
    }
    description = "Remote code execution protection"
  }

  # CVE canary (Log4j, Spring4Shell)
  rule {
    action   = "deny(403)"
    priority = 1010
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('cve-canary')"
      }
    }
    description = "CVE protection (Log4j, Spring4Shell)"
  }

  # Default allow
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow"
  }

  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD"
    }
  }
}
```

### Step 5: Generate rate limiting rules

```bash
# IP-based rate limiting
gcloud compute security-policies rules create 100 \
  --security-policy=my-security-policy \
  --expression="true" \
  --action=throttle \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP \
  --description="Rate limit: 100 req/min per IP"

# Rate limit on specific path (e.g., login endpoint)
gcloud compute security-policies rules create 101 \
  --security-policy=my-security-policy \
  --expression="request.path.matches('/api/auth/login')" \
  --action=throttle \
  --rate-limit-threshold-count=10 \
  --rate-limit-threshold-interval-sec=60 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP \
  --description="Login rate limit: 10 req/min per IP"

# Rate limit by HTTP header (e.g., API key)
gcloud compute security-policies rules create 102 \
  --security-policy=my-security-policy \
  --expression="true" \
  --action=throttle \
  --rate-limit-threshold-count=1000 \
  --rate-limit-threshold-interval-sec=60 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=HTTP-HEADER \
  --enforce-on-key-name="X-API-Key" \
  --description="API rate limit: 1000 req/min per API key"

# Ban (block) IPs that exceed rate limit
gcloud compute security-policies rules create 103 \
  --security-policy=my-security-policy \
  --expression="true" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=500 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-threshold-count=1000 \
  --ban-threshold-interval-sec=120 \
  --ban-duration-sec=600 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP \
  --description="Ban IPs exceeding 1000 req/2min for 10 minutes"
```

**Terraform rate limiting:**
```hcl
# Per-IP rate limiting
rule {
  action   = "throttle"
  priority = 100

  match {
    versioned_expr = "SRC_IPS_V1"
    config {
      src_ip_ranges = ["*"]
    }
  }

  rate_limit_options {
    conform_action = "allow"
    exceed_action  = "deny(429)"

    rate_limit_threshold {
      count        = 100
      interval_sec = 60
    }

    enforce_on_key = "IP"
  }

  description = "Rate limit: 100 req/min per IP"
}

# Login endpoint rate limiting
rule {
  action   = "throttle"
  priority = 101

  match {
    expr {
      expression = "request.path.matches('/api/auth/login')"
    }
  }

  rate_limit_options {
    conform_action = "allow"
    exceed_action  = "deny(429)"

    rate_limit_threshold {
      count        = 10
      interval_sec = 60
    }

    enforce_on_key = "IP"
  }

  description = "Login rate limit: 10 req/min per IP"
}

# Rate-based ban
rule {
  action   = "rate_based_ban"
  priority = 103

  match {
    versioned_expr = "SRC_IPS_V1"
    config {
      src_ip_ranges = ["*"]
    }
  }

  rate_limit_options {
    conform_action = "allow"
    exceed_action  = "deny(429)"

    rate_limit_threshold {
      count        = 500
      interval_sec = 60
    }

    ban_threshold {
      count        = 1000
      interval_sec = 120
    }

    ban_duration_sec = 600

    enforce_on_key = "IP"
  }

  description = "Ban abusive IPs for 10 minutes"
}
```

### Step 6: Generate geo-based access control

```bash
# Block traffic from specific countries
gcloud compute security-policies rules create 200 \
  --security-policy=my-security-policy \
  --expression="origin.region_code == 'CN' || origin.region_code == 'RU' || origin.region_code == 'KP'" \
  --action=deny-403 \
  --description="Geo-block: CN, RU, KP"

# Allow only specific countries
gcloud compute security-policies rules create 201 \
  --security-policy=my-security-policy \
  --expression="!(origin.region_code == 'US' || origin.region_code == 'CA' || origin.region_code == 'GB')" \
  --action=deny-403 \
  --description="Allow only US, CA, GB"
```

**Terraform geo-blocking:**
```hcl
rule {
  action   = "deny(403)"
  priority = 200

  match {
    expr {
      expression = "origin.region_code == 'CN' || origin.region_code == 'RU' || origin.region_code == 'KP'"
    }
  }

  description = "Block traffic from restricted countries"
}
```

### Step 7: Generate custom CEL expression rules

```bash
# Block requests with specific User-Agent
gcloud compute security-policies rules create 300 \
  --security-policy=my-security-policy \
  --expression="request.headers['user-agent'].contains('sqlmap') || request.headers['user-agent'].contains('nikto')" \
  --action=deny-403 \
  --description="Block known attack tools"

# Block requests to admin paths from non-allowed IPs
gcloud compute security-policies rules create 301 \
  --security-policy=my-security-policy \
  --expression="request.path.matches('/admin/.*') && !inIpRange(origin.ip, '10.0.0.0/8')" \
  --action=deny-403 \
  --description="Restrict admin access to internal IPs"

# Block requests with oversized bodies
gcloud compute security-policies rules create 302 \
  --security-policy=my-security-policy \
  --expression="int(request.headers['content-length']) > 10485760" \
  --action=deny-413 \
  --description="Block requests > 10MB"

# Block specific HTTP methods
gcloud compute security-policies rules create 303 \
  --security-policy=my-security-policy \
  --expression="request.method == 'TRACE' || request.method == 'OPTIONS'" \
  --action=deny-403 \
  --description="Block TRACE and OPTIONS methods"

# Require specific header for API access
gcloud compute security-policies rules create 304 \
  --security-policy=my-security-policy \
  --expression="request.path.matches('/api/.*') && !has(request.headers['x-api-key'])" \
  --action=deny-401 \
  --description="Require API key header"
```

### Step 8: Generate IP allow/block lists

```bash
# Create named IP list
gcloud compute security-policies add-ip-list my-security-policy \
  --ip-list="allow-list" \
  --ips="203.0.113.0/24,198.51.100.0/24,192.0.2.0/24"

# Allow listed IPs with high priority (bypass other rules)
gcloud compute security-policies rules create 10 \
  --security-policy=my-security-policy \
  --src-ip-ranges="203.0.113.0/24,198.51.100.0/24" \
  --action=allow \
  --description="Allow trusted partner IPs"

# Block specific IPs
gcloud compute security-policies rules create 50 \
  --security-policy=my-security-policy \
  --src-ip-ranges="192.0.2.1/32,198.51.100.50/32" \
  --action=deny-403 \
  --description="Block known malicious IPs"

# Use Google threat intelligence feed
gcloud compute security-policies rules create 60 \
  --security-policy=my-security-policy \
  --expression="evaluateThreatIntelligence('iplist-known-malicious-ips')" \
  --action=deny-403 \
  --description="Block known malicious IPs (threat intelligence)"

# Block Tor exit nodes
gcloud compute security-policies rules create 61 \
  --security-policy=my-security-policy \
  --expression="evaluateThreatIntelligence('iplist-tor-exit-nodes')" \
  --action=deny-403 \
  --description="Block Tor exit nodes"
```

**Terraform IP lists and threat intelligence:**
```hcl
# Allow trusted IPs (highest priority)
rule {
  action   = "allow"
  priority = 10

  match {
    versioned_expr = "SRC_IPS_V1"
    config {
      src_ip_ranges = [
        "203.0.113.0/24",  # Office network
        "198.51.100.0/24", # VPN exit
      ]
    }
  }

  description = "Allow trusted IPs"
}

# Block known malicious IPs via threat intelligence
rule {
  action   = "deny(403)"
  priority = 60

  match {
    expr {
      expression = "evaluateThreatIntelligence('iplist-known-malicious-ips')"
    }
  }

  description = "Block threat intelligence malicious IPs"
}
```

### Step 9: Generate adaptive protection (ML-based DDoS)

```hcl
resource "google_compute_security_policy" "adaptive" {
  name = "adaptive-policy"

  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD" # or "PREMIUM" for advanced
    }

    auto_deploy_config {
      load_threshold              = 0.8  # Deploy when load > 80%
      confidence_threshold        = 0.7  # Confidence of attack > 70%
      impacted_baseline_threshold = 0.01 # Baseline traffic impacted > 1%
      expiration_sec              = 7200 # Auto-deployed rules expire in 2 hours
    }
  }

  # Default rule
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}
```

### Step 10: Generate reCAPTCHA Enterprise integration

```bash
# Redirect suspicious traffic to reCAPTCHA challenge
gcloud compute security-policies rules create 400 \
  --security-policy=my-security-policy \
  --expression="request.path.matches('/api/auth/.*')" \
  --action=redirect \
  --redirect-type=GOOGLE_RECAPTCHA \
  --description="reCAPTCHA challenge for auth endpoints"
```

**Terraform reCAPTCHA integration:**
```hcl
# Create reCAPTCHA key
resource "google_recaptcha_enterprise_key" "default" {
  display_name = "WAF integration key"
  project      = var.project_id

  web_settings {
    integration_type  = "INVISIBLE"
    allowed_domains   = ["myapp.example.com"]
    allow_amp_traffic = false
  }

  waf_settings {
    waf_service = "CA"
    waf_feature = "SESSION_TOKEN"
  }
}

# reCAPTCHA challenge rule
rule {
  action   = "redirect"
  priority = 400

  match {
    expr {
      expression = "request.path.matches('/api/auth/.*')"
    }
  }

  redirect_options {
    type = "GOOGLE_RECAPTCHA"
  }

  description = "reCAPTCHA challenge for auth endpoints"
}

# Use reCAPTCHA token score in rules
rule {
  action   = "deny(403)"
  priority = 401

  match {
    expr {
      expression = "token.recaptcha_session.score < 0.3"
    }
  }

  description = "Block low reCAPTCHA score traffic (likely bots)"
}
```

### Step 11: Generate network edge security policy (L3/L4 DDoS)

```bash
# Create network edge security policy
gcloud compute security-policies create network-ddos-policy \
  --type=CLOUD_ARMOR_NETWORK \
  --region=us-central1

# Add DDoS protection rules
gcloud compute security-policies rules create 100 \
  --security-policy=network-ddos-policy \
  --region=us-central1 \
  --network-src-ip-ranges="0.0.0.0/0" \
  --network-dest-ip-ranges="10.0.0.0/8" \
  --network-ip-protocols="TCP" \
  --action=deny \
  --description="Block external TCP to internal ranges"
```

**Terraform network edge policy:**
```hcl
resource "google_compute_region_security_policy" "network_ddos" {
  name        = "network-ddos-policy"
  region      = "us-central1"
  type        = "CLOUD_ARMOR_NETWORK"
  description = "Network edge DDoS protection"

  ddos_protection_config {
    ddos_protection = "ADVANCED"
  }
}
```

### Step 12: Generate logging and monitoring

```bash
# View Cloud Armor logs
gcloud logging read 'resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.name="my-security-policy"' \
  --project=my-project \
  --limit=50

# View blocked requests
gcloud logging read 'resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.outcome="DENY"' \
  --project=my-project \
  --limit=50
```

**Terraform monitoring alerts:**
```hcl
# Alert on high rate of blocked requests (possible attack)
resource "google_monitoring_alert_policy" "high_block_rate" {
  display_name = "Cloud Armor High Block Rate"

  conditions {
    display_name = "Blocked requests > 1000/min"
    condition_threshold {
      filter          = "resource.type = \"https_lb_rule\" AND metric.type = \"loadbalancing.googleapis.com/https/request_count\" AND metric.labels.response_code_class = \"400\" OR metric.labels.response_code_class = \"500\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1000
      duration        = "60s"

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [var.notification_channel_id]
}
```

### Step 13: Preview mode for testing rules

```bash
# Create rule in preview mode (log but don't enforce)
gcloud compute security-policies rules create 500 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('sqli-v33-stable')" \
  --action=deny-403 \
  --preview \
  --description="SQL injection (preview mode)"

# Check preview logs before enforcing
gcloud logging read 'resource.type="http_load_balancer" AND jsonPayload.previewSecurityPolicy.name="my-security-policy"' \
  --limit=100

# Remove preview mode when ready to enforce
gcloud compute security-policies rules update 500 \
  --security-policy=my-security-policy \
  --no-preview
```

## Best practices

- **Start with preview mode** for all new rules; analyze logs before enforcing
- **Use preconfigured WAF rules** as a baseline (OWASP protections)
- **Enable adaptive protection** for ML-based DDoS detection and response
- **Layer rate limiting** with different thresholds for different endpoints (login, API, general)
- **Use threat intelligence** feeds to block known malicious IPs automatically
- **Apply IP allow lists** for trusted partners with highest priority rules
- **Enable verbose logging** during initial deployment, reduce for steady state
- **Review rules monthly** and tune based on false positive / false negative analysis
- **Use priority ordering** carefully: lower numbers evaluated first, default rule is last

## Anti-patterns

- Deploying WAF rules directly in block mode without preview testing
- Setting rate limits too low, causing false positives for legitimate users
- Using only IP-based blocking (sophisticated attackers rotate IPs)
- Not configuring adaptive protection for DDoS defense
- Relying solely on Cloud Armor without application-level security
- Not monitoring blocked requests for false positives
- Using overly broad allow rules that bypass WAF inspection

## Cost optimization

- Cloud Armor Standard is included with Cloud Load Balancing
- Cloud Armor Managed Protection Plus has per-policy and per-request pricing
- Use preconfigured WAF rules (included in standard tier)
- Minimize the number of security policies (consolidate where possible)
- Use adaptive protection selectively for high-value backends
- Review and consolidate rules to reduce evaluation overhead

## Security considerations

- Enable Cloud Audit Logging for security policy changes
- Use IAM to restrict who can modify security policies
- Implement defense in depth: Cloud Armor + application-level security
- Monitor for rule bypass attempts via access logs
- Keep preconfigured WAF rule sets updated (Google manages updates)
- Test with penetration testing tools (OWASP ZAP, Burp Suite) after deployment
- Configure separate policies for different backend services based on risk
- Use reCAPTCHA Enterprise integration for bot management at authentication endpoints
