---
name: gcp-load-balancing
description: Generate load balancer configs with SSL, health checks, and traffic management for Google Cloud. Use when the user wants to set up Cloud Load Balancing.
argument-hint: "[type] [backend] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a Google Cloud Load Balancing expert. Generate production-ready load balancer configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Type**: External HTTP(S), Internal HTTP(S), External TCP/UDP, Internal TCP/UDP, External TCP Proxy, External SSL Proxy
- **Backend**: Instance group, NEG (network endpoint group), serverless NEG (Cloud Run, Functions, App Engine)
- **Traffic model**: Global vs regional, HTTP vs TCP/UDP
- **SSL**: Managed certificate, self-managed, or none
- **Features**: CDN, Cloud Armor, session affinity, traffic management

### Step 2: Choose load balancer type

**Decision matrix:**
```
External + HTTP(S) + Global    -> Global External Application LB (recommended)
External + HTTP(S) + Regional  -> Regional External Application LB
Internal + HTTP(S)             -> Internal Application LB (L7)
External + TCP/UDP + Global    -> Global External Proxy Network LB
External + TCP/UDP + Regional  -> Regional External Passthrough Network LB
Internal + TCP/UDP             -> Internal Passthrough Network LB (L4)
```

**Global External Application Load Balancer (most common):**
- Layer 7 HTTP(S) load balancing
- Global anycast IP address
- URL-based routing, host-based routing
- Cloud CDN and Cloud Armor integration
- Managed SSL certificates
- WebSocket and HTTP/2 support

### Step 3: Generate Global External HTTP(S) Load Balancer

**Reserve global static IP:**
```bash
gcloud compute addresses create my-lb-ip \
  --global \
  --ip-version=IPV4
```

**Create health check:**
```bash
gcloud compute health-checks create http my-health-check \
  --port=8080 \
  --request-path=/health \
  --check-interval=10s \
  --timeout=5s \
  --healthy-threshold=2 \
  --unhealthy-threshold=3
```

**Create backend service:**
```bash
gcloud compute backend-services create my-backend \
  --protocol=HTTP \
  --port-name=http \
  --health-checks=my-health-check \
  --global \
  --enable-logging \
  --logging-sample-rate=1.0 \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --locality-lb-policy=ROUND_ROBIN \
  --connection-draining-timeout=300 \
  --timeout=30s

# Add backend (managed instance group)
gcloud compute backend-services add-backend my-backend \
  --instance-group=my-mig \
  --instance-group-region=us-central1 \
  --balancing-mode=UTILIZATION \
  --max-utilization=0.8 \
  --capacity-scaler=1.0 \
  --global
```

**Create URL map:**
```bash
# Simple URL map (single backend)
gcloud compute url-maps create my-url-map \
  --default-service=my-backend \
  --global

# Or import complex URL map from YAML
gcloud compute url-maps import my-url-map \
  --source=url-map.yaml \
  --global
```

**Complex URL map with path-based routing:**
```yaml
# url-map.yaml
name: my-url-map
defaultService: projects/PROJECT_ID/global/backendServices/default-backend
hostRules:
  - hosts:
      - "api.example.com"
    pathMatcher: api-paths
  - hosts:
      - "app.example.com"
    pathMatcher: app-paths
  - hosts:
      - "*.example.com"
    pathMatcher: default-paths
pathMatchers:
  - name: api-paths
    defaultService: projects/PROJECT_ID/global/backendServices/api-backend
    routeRules:
      - priority: 1
        matchRules:
          - prefixMatch: /api/v2
        service: projects/PROJECT_ID/global/backendServices/api-v2-backend
      - priority: 2
        matchRules:
          - prefixMatch: /api/v1
        service: projects/PROJECT_ID/global/backendServices/api-v1-backend
      - priority: 3
        matchRules:
          - prefixMatch: /api/v1
            headerMatches:
              - headerName: X-Canary
                exactMatch: "true"
        service: projects/PROJECT_ID/global/backendServices/api-v1-canary
        routeAction:
          weightedBackendServices:
            - backendService: projects/PROJECT_ID/global/backendServices/api-v1-canary
              weight: 10
            - backendService: projects/PROJECT_ID/global/backendServices/api-v1-backend
              weight: 90
  - name: app-paths
    defaultService: projects/PROJECT_ID/global/backendServices/app-backend
    routeRules:
      - priority: 1
        matchRules:
          - prefixMatch: /static
        service: projects/PROJECT_ID/global/backendBuckets/static-assets
  - name: default-paths
    defaultService: projects/PROJECT_ID/global/backendServices/default-backend
```

**Create managed SSL certificate:**
```bash
gcloud compute ssl-certificates create my-cert \
  --domains=api.example.com,app.example.com \
  --global

# Or use Certificate Manager for more control
gcloud certificate-manager certificates create my-cert \
  --domains=api.example.com,app.example.com

gcloud certificate-manager maps create my-cert-map

gcloud certificate-manager maps entries create my-cert-entry \
  --map=my-cert-map \
  --certificates=my-cert \
  --hostname=api.example.com
```

**Create SSL policy:**
```bash
gcloud compute ssl-policies create my-ssl-policy \
  --profile=MODERN \
  --min-tls-version=1.2
```

**Create HTTPS target proxy and forwarding rule:**
```bash
# Target HTTPS proxy
gcloud compute target-https-proxies create my-https-proxy \
  --url-map=my-url-map \
  --ssl-certificates=my-cert \
  --ssl-policy=my-ssl-policy \
  --global

# Forwarding rule (HTTPS)
gcloud compute forwarding-rules create my-https-rule \
  --address=my-lb-ip \
  --target-https-proxy=my-https-proxy \
  --ports=443 \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED

# HTTP to HTTPS redirect
gcloud compute url-maps create http-redirect \
  --default-url-redirect-https-redirect \
  --global

gcloud compute target-http-proxies create http-redirect-proxy \
  --url-map=http-redirect \
  --global

gcloud compute forwarding-rules create http-redirect-rule \
  --address=my-lb-ip \
  --target-http-proxy=http-redirect-proxy \
  --ports=80 \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED
```

### Step 4: Serverless NEGs (Cloud Run / Functions / App Engine)

**Cloud Run serverless NEG:**
```bash
# Create serverless NEG
gcloud compute network-endpoint-groups create cloudrun-neg \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=my-service

# Create backend service with serverless NEG
gcloud compute backend-services create cloudrun-backend \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --protocol=HTTPS

gcloud compute backend-services add-backend cloudrun-backend \
  --global \
  --network-endpoint-group=cloudrun-neg \
  --network-endpoint-group-region=us-central1

# Multi-region Cloud Run with serverless NEGs
gcloud compute network-endpoint-groups create cloudrun-neg-us \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=my-service

gcloud compute network-endpoint-groups create cloudrun-neg-eu \
  --region=europe-west1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=my-service

gcloud compute backend-services add-backend cloudrun-backend \
  --global \
  --network-endpoint-group=cloudrun-neg-us \
  --network-endpoint-group-region=us-central1

gcloud compute backend-services add-backend cloudrun-backend \
  --global \
  --network-endpoint-group=cloudrun-neg-eu \
  --network-endpoint-group-region=europe-west1
```

**Cloud Functions serverless NEG:**
```bash
gcloud compute network-endpoint-groups create functions-neg \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-function-name=my-function
```

### Step 5: Cloud Armor integration

```bash
# Create Cloud Armor security policy
gcloud compute security-policies create my-security-policy \
  --description="Web application firewall policy"

# Rate limiting
gcloud compute security-policies rules create 100 \
  --security-policy=my-security-policy \
  --action=rate-based-ban \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=300 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP \
  --src-ip-ranges="*"

# Block SQL injection
gcloud compute security-policies rules create 200 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('sqli-v33-stable')" \
  --action=deny-403

# Block XSS
gcloud compute security-policies rules create 300 \
  --security-policy=my-security-policy \
  --expression="evaluatePreconfiguredExpr('xss-v33-stable')" \
  --action=deny-403

# Geo-blocking
gcloud compute security-policies rules create 400 \
  --security-policy=my-security-policy \
  --expression="origin.region_code == 'CN' || origin.region_code == 'RU'" \
  --action=deny-403

# Attach policy to backend service
gcloud compute backend-services update my-backend \
  --security-policy=my-security-policy \
  --global
```

### Step 6: Internal Application Load Balancer

```bash
# Proxy-only subnet (required for internal L7 LB)
gcloud compute networks subnets create proxy-subnet \
  --purpose=REGIONAL_MANAGED_PROXY \
  --role=ACTIVE \
  --network=my-vpc \
  --region=us-central1 \
  --range=10.0.40.0/24

# Internal backend service
gcloud compute backend-services create internal-backend \
  --protocol=HTTP \
  --health-checks=my-health-check \
  --load-balancing-scheme=INTERNAL_MANAGED \
  --region=us-central1

gcloud compute backend-services add-backend internal-backend \
  --instance-group=my-mig \
  --instance-group-region=us-central1 \
  --region=us-central1

# URL map and proxy
gcloud compute url-maps create internal-url-map \
  --default-service=internal-backend \
  --region=us-central1

gcloud compute target-http-proxies create internal-proxy \
  --url-map=internal-url-map \
  --region=us-central1

# Internal forwarding rule
gcloud compute forwarding-rules create internal-lb-rule \
  --load-balancing-scheme=INTERNAL_MANAGED \
  --network=my-vpc \
  --subnet=private-subnet-us-central1 \
  --address=10.0.10.100 \
  --target-http-proxy=internal-proxy \
  --target-http-proxy-region=us-central1 \
  --ports=80 \
  --region=us-central1
```

### Step 7: Session affinity and traffic management

```bash
# Enable session affinity
gcloud compute backend-services update my-backend \
  --global \
  --session-affinity=GENERATED_COOKIE \
  --affinity-cookie-ttl=3600

# Or use header-based affinity
gcloud compute backend-services update my-backend \
  --global \
  --session-affinity=HEADER_FIELD \
  --custom-request-headers="X-Client-Region:{client_region}"

# Connection draining
gcloud compute backend-services update my-backend \
  --global \
  --connection-draining-timeout=300

# Circuit breaker (outlier detection)
gcloud compute backend-services update my-backend \
  --global \
  --custom-response-headers="X-Cache-Status:{cdn_cache_status}" \
  --connection-draining-timeout=300
```

### Step 8: Terraform configuration

```hcl
# Global External Application Load Balancer
resource "google_compute_global_address" "lb_ip" {
  name = "my-lb-ip"
}

resource "google_compute_health_check" "http" {
  name               = "http-health-check"
  check_interval_sec = 10
  timeout_sec        = 5
  healthy_threshold  = 2
  unhealthy_threshold = 3

  http_health_check {
    port         = 8080
    request_path = "/health"
  }
}

resource "google_compute_backend_service" "default" {
  name                  = "my-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.http.id]

  backend {
    group           = google_compute_region_instance_group_manager.mig.instance_group
    balancing_mode  = "UTILIZATION"
    max_utilization = 0.8
    capacity_scaler = 1.0
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  connection_draining_timeout_sec = 300

  security_policy = google_compute_security_policy.default.id
}

# Serverless NEG for Cloud Run
resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  name                  = "cloudrun-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"

  cloud_run {
    service = google_cloud_run_v2_service.main.name
  }
}

resource "google_compute_backend_service" "cloudrun" {
  name                  = "cloudrun-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.cloudrun_neg.id
  }
}

resource "google_compute_url_map" "default" {
  name            = "my-url-map"
  default_service = google_compute_backend_service.default.id

  host_rule {
    hosts        = ["api.example.com"]
    path_matcher = "api"
  }

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "app"
  }

  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.default.id

    route_rules {
      priority = 1
      match_rules {
        prefix_match = "/api/v2"
      }
      route_action {
        weighted_backend_services {
          backend_service = google_compute_backend_service.default.id
          weight          = 100
        }
      }
    }
  }

  path_matcher {
    name            = "app"
    default_service = google_compute_backend_service.cloudrun.id
  }
}

resource "google_compute_managed_ssl_certificate" "default" {
  name = "my-cert"
  managed {
    domains = ["api.example.com", "app.example.com"]
  }
}

resource "google_compute_ssl_policy" "default" {
  name            = "my-ssl-policy"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
}

resource "google_compute_target_https_proxy" "default" {
  name             = "my-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
  ssl_policy       = google_compute_ssl_policy.default.id
}

resource "google_compute_global_forwarding_rule" "https" {
  name                  = "my-https-rule"
  ip_address            = google_compute_global_address.lb_ip.id
  ip_protocol           = "TCP"
  port_range            = "443"
  target                = google_compute_target_https_proxy.default.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name = "http-redirect"
  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "http_redirect" {
  name    = "http-redirect-proxy"
  url_map = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http_redirect" {
  name                  = "http-redirect-rule"
  ip_address            = google_compute_global_address.lb_ip.id
  ip_protocol           = "TCP"
  port_range            = "80"
  target                = google_compute_target_http_proxy.http_redirect.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# Cloud Armor security policy
resource "google_compute_security_policy" "default" {
  name = "my-security-policy"

  rule {
    action   = "deny(403)"
    priority = 200
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block SQL injection"
  }

  rule {
    action   = "deny(403)"
    priority = 300
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block XSS"
  }

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
}

# DNS record
resource "google_dns_record_set" "api" {
  name         = "api.example.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.example.name
  rrdatas      = [google_compute_global_address.lb_ip.address]
}
```

### Best practices to follow:
- **Use EXTERNAL_MANAGED** scheme (latest generation) over classic EXTERNAL
- **Always configure health checks** with appropriate intervals and thresholds
- **Use managed SSL certificates** for automatic renewal
- **Set TLS 1.2 minimum** with MODERN SSL policy profile
- **Enable Cloud Armor** for DDoS protection and WAF on public-facing LBs
- **Configure HTTP-to-HTTPS redirect** for all external HTTPS load balancers
- **Use connection draining** (300s default) for graceful backend removal
- **Enable logging** on backend services for troubleshooting
- **Use serverless NEGs** for Cloud Run/Functions instead of direct domain mapping

### Anti-patterns to avoid:
- Using classic load balancing scheme for new deployments
- Not configuring health checks (leads to traffic sent to unhealthy backends)
- Using self-managed SSL certificates without rotation automation
- Overly broad URL map patterns that route traffic incorrectly
- Not enabling HTTP-to-HTTPS redirect
- Using a single backend without capacity planning
- Not attaching Cloud Armor policies to public-facing load balancers

### Cost optimization:
- **Use serverless NEGs** to avoid running always-on backend instances
- **Enable Cloud CDN** on the backend service to reduce origin requests
- **Right-size health check intervals** (10s is fine for most workloads)
- **Use regional LB** if global distribution is not needed
- **Consolidate backend services** where possible to reduce forwarding rule costs
- **Use Premium Tier networking** only for global LB; Standard Tier for regional
