---
name: gcp-cloud-cdn
description: Generate Cloud CDN configs with caching policies, signed URLs, and edge security for Google Cloud. Use when the user wants to set up Cloud CDN or optimize content delivery.
argument-hint: "[origin-type] [domain] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a Google Cloud CDN expert. Generate production-ready CDN configurations with optimal caching and security.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Origin type**: Cloud Storage bucket, instance group, Cloud Run (serverless NEG), external origin
- **Use case**: Static website, SPA, API acceleration, media streaming, mixed content
- **Domain**: Custom domain and SSL certificate requirements
- **Caching strategy**: Cache all static content, use origin headers, or force cache all
- **Security**: Signed URLs/cookies, geo-restrictions, access control

### Step 2: Choose CDN configuration approach

**Cloud CDN (integrated with Cloud Load Balancing):**
- Works with Global External Application Load Balancer
- Backend services (instance groups, NEGs) or backend buckets (Cloud Storage)
- Integrated with Cloud Armor for edge security
- Cache invalidation via API

**Media CDN (for large-scale media delivery):**
- Optimized for video streaming and large file distribution
- Higher cache capacity at edge
- Token-based authentication
- Use for >10 TB/month media delivery

### Step 3: Cloud Storage origin with backend bucket

**Create Cloud Storage bucket for static assets:**
```bash
# Create bucket with uniform access
gsutil mb -p $PROJECT_ID -l US -c STANDARD gs://my-static-assets

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://my-static-assets

# Set CORS policy
cat > cors.json <<'EOF'
[
  {
    "origin": ["https://example.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Cache-Control"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set cors.json gs://my-static-assets

# Upload static files with cache-control headers
gsutil -m -h "Cache-Control:public, max-age=31536000" cp -r static/ gs://my-static-assets/
gsutil -h "Cache-Control:public, max-age=300" cp index.html gs://my-static-assets/
```

**Create backend bucket with CDN enabled:**
```bash
gcloud compute backend-buckets create static-assets-backend \
  --gcs-bucket-name=my-static-assets \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --max-ttl=86400 \
  --client-ttl=3600 \
  --negative-caching \
  --negative-caching-policy="404=60,405=60" \
  --custom-response-headers="X-Cache-Status:{cdn_cache_status}" \
  --custom-response-headers="X-Cache-ID:{cdn_cache_id}" \
  --compression-mode=AUTOMATIC
```

### Step 4: Cache modes

**CACHE_ALL_STATIC (recommended default):**
- Caches common static content types automatically (images, CSS, JS, fonts, etc.)
- Respects Cache-Control headers when present
- Does not cache responses with Set-Cookie headers
- Best for: static websites, SPAs, asset delivery

```bash
gcloud compute backend-services update my-backend \
  --global \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --max-ttl=86400 \
  --client-ttl=3600
```

**USE_ORIGIN_HEADERS:**
- Caches only when origin sends Cache-Control or Expires headers
- Full control at the origin
- Best for: API responses, dynamic content with selective caching

```bash
gcloud compute backend-services update my-backend \
  --global \
  --enable-cdn \
  --cache-mode=USE_ORIGIN_HEADERS
```

**FORCE_CACHE_ALL:**
- Caches all successful responses regardless of headers
- Overrides Cache-Control: no-store, no-cache, private
- Best for: content that is always safe to cache (public CDN assets)
- WARNING: Never use with personalized or authenticated content

```bash
gcloud compute backend-services update my-backend \
  --global \
  --enable-cdn \
  --cache-mode=FORCE_CACHE_ALL \
  --default-ttl=86400 \
  --max-ttl=604800 \
  --client-ttl=86400
```

### Step 5: TTL configuration

**Recommended TTL settings by content type:**
```
Content Type          | Default TTL | Max TTL   | Client TTL
---------------------|-------------|-----------|----------
HTML pages           | 300 (5m)    | 3600 (1h) | 300 (5m)
CSS/JS (versioned)   | 31536000    | 31536000  | 31536000
Images               | 86400 (1d)  | 604800    | 86400
API responses        | 60 (1m)     | 300 (5m)  | 60 (1m)
Fonts                | 31536000    | 31536000  | 31536000
Video segments       | 86400 (1d)  | 604800    | 86400
```

**Configure TTL settings:**
```bash
# Static assets (long cache)
gcloud compute backend-buckets update static-backend \
  --default-ttl=86400 \
  --max-ttl=604800 \
  --client-ttl=86400

# API backend (short cache)
gcloud compute backend-services update api-backend \
  --global \
  --enable-cdn \
  --cache-mode=USE_ORIGIN_HEADERS \
  --default-ttl=60 \
  --max-ttl=300 \
  --client-ttl=60
```

### Step 6: Cache key configuration

**Custom cache key policy:**
```bash
# Include query string parameters selectively
gcloud compute backend-services update my-backend \
  --global \
  --cache-key-include-protocol \
  --cache-key-include-host \
  --no-cache-key-include-query-string

# Or include specific query params only
gcloud compute backend-services update my-backend \
  --global \
  --cache-key-query-string-whitelist=version,lang
```

**Cache key considerations:**
- Exclude query parameters that do not affect content (tracking params, session IDs)
- Include `Accept-Encoding` if serving different compressions
- Include custom headers if they affect content (e.g., `Accept-Language`)
- Exclude protocol if serving same content on HTTP and HTTPS

### Step 7: Signed URLs and signed cookies

**Create signing key:**
```bash
# Generate a random key
head -c 16 /dev/urandom | base64 | tr +/ -_ > cdn-key.txt

# Add the key to the backend
gcloud compute backend-services add-signed-url-key my-backend \
  --key-name=my-cdn-key \
  --key-file=cdn-key.txt \
  --global

# Or for backend bucket
gcloud compute backend-buckets add-signed-url-key static-backend \
  --key-name=my-cdn-key \
  --key-file=cdn-key.txt
```

**Generate signed URL (server-side code):**
```python
import datetime
import hashlib
import hmac
import base64
from urllib.parse import urlparse, urlencode

def sign_url(url, key_name, key_base64, expiration_time):
    """Generate a signed URL for Cloud CDN."""
    # Decode the key
    key = base64.urlsafe_b64decode(key_base64)

    # Build the URL with expiration
    stripped_url = url.split('?')[0]
    epoch = int(expiration_time.timestamp())
    url_to_sign = f"{stripped_url}?Expires={epoch}&KeyName={key_name}"

    # Sign with HMAC-SHA1
    signature = hmac.new(key, url_to_sign.encode('utf-8'), hashlib.sha1).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode('utf-8')

    return f"{url_to_sign}&Signature={encoded_signature}"

# Usage
signed = sign_url(
    url="https://cdn.example.com/premium/video.mp4",
    key_name="my-cdn-key",
    key_base64="YOUR_BASE64_KEY",
    expiration_time=datetime.datetime.now() + datetime.timedelta(hours=1)
)
```

**Generate signed cookie (server-side code):**
```python
import datetime
import hashlib
import hmac
import base64

def sign_cookie(url_prefix, key_name, key_base64, expiration_time):
    """Generate a signed cookie value for Cloud CDN."""
    key = base64.urlsafe_b64decode(key_base64)

    epoch = int(expiration_time.timestamp())
    encoded_prefix = base64.urlsafe_b64encode(url_prefix.encode('utf-8')).decode('utf-8').rstrip('=')

    policy = f"URLPrefix={encoded_prefix}:Expires={epoch}:KeyName={key_name}"

    signature = hmac.new(key, policy.encode('utf-8'), hashlib.sha1).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode('utf-8').rstrip('=')

    return f"{policy}:Signature={encoded_signature}"

# Set as cookie in response
cookie_value = sign_cookie(
    url_prefix="https://cdn.example.com/premium/",
    key_name="my-cdn-key",
    key_base64="YOUR_BASE64_KEY",
    expiration_time=datetime.datetime.now() + datetime.timedelta(hours=24)
)
# Set-Cookie: Cloud-CDN-Cookie=<cookie_value>; Path=/premium/; Domain=cdn.example.com; Secure; HttpOnly
```

### Step 8: Cache invalidation

```bash
# Invalidate specific path
gcloud compute url-maps invalidate-cdn-cache my-url-map \
  --path="/index.html" \
  --global

# Invalidate all content under a path
gcloud compute url-maps invalidate-cdn-cache my-url-map \
  --path="/static/*" \
  --global

# Invalidate everything (use sparingly)
gcloud compute url-maps invalidate-cdn-cache my-url-map \
  --path="/*" \
  --global

# Check invalidation status
gcloud compute operations list \
  --filter="operationType=invalidateCache" \
  --global
```

**Best practice: Use versioned filenames instead of invalidation:**
```
# Instead of: /static/app.js (requires invalidation)
# Use:        /static/app.a1b2c3d4.js (cache-bust via filename)

# Set long TTL for versioned assets
gsutil -h "Cache-Control:public, max-age=31536000, immutable" \
  cp app.a1b2c3d4.js gs://my-static-assets/static/
```

### Step 9: Negative caching

```bash
# Cache error responses to protect origin
gcloud compute backend-services update my-backend \
  --global \
  --negative-caching \
  --negative-caching-policy="404=60,405=60,502=10"

# Or for backend buckets
gcloud compute backend-buckets update static-backend \
  --negative-caching \
  --negative-caching-policy="404=60,405=60"
```

**Negative caching defaults (when enabled without explicit policy):**
- 404 Not Found: 120 seconds
- 405 Method Not Allowed: 60 seconds
- 421 Misdirected Request: 120 seconds
- 502 Bad Gateway: 10 seconds
- 503 Service Unavailable: 10 seconds
- 504 Gateway Timeout: 10 seconds

### Step 10: Custom response headers

```bash
gcloud compute backend-services update my-backend \
  --global \
  --custom-response-headers="X-Cache-Status:{cdn_cache_status}" \
  --custom-response-headers="X-Cache-ID:{cdn_cache_id}" \
  --custom-response-headers="X-Client-Region:{client_region}" \
  --custom-response-headers="X-Client-City:{client_city}" \
  --custom-response-headers="Strict-Transport-Security:max-age=31536000; includeSubDomains" \
  --custom-response-headers="X-Content-Type-Options:nosniff" \
  --custom-response-headers="X-Frame-Options:DENY"
```

**Available Cloud CDN header variables:**
```
{cdn_cache_status}    - HIT, MISS, REVALIDATED, STALE, etc.
{cdn_cache_id}        - Cache node identifier
{client_region}       - Client country code
{client_city}         - Client city name
{client_rtt_msec}     - Round-trip time to client
{tls_version}         - TLS version used
{tls_cipher_suite}    - Cipher suite used
```

### Step 11: Terraform configuration

```hcl
# Backend bucket with Cloud CDN for static assets
resource "google_storage_bucket" "static" {
  name     = "my-static-assets-${var.project_id}"
  location = "US"

  uniform_bucket_level_access = true

  cors {
    origin          = ["https://example.com"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type", "Cache-Control"]
    max_age_seconds = 3600
  }

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

resource "google_compute_backend_bucket" "static" {
  name        = "static-assets-backend"
  bucket_name = google_storage_bucket.static.name
  enable_cdn  = true

  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    max_ttl                      = 86400
    client_ttl                   = 3600
    negative_caching             = true
    serve_while_stale            = 86400
    signed_url_cache_max_age_sec = 3600

    negative_caching_policy {
      code = 404
      ttl  = 60
    }

    negative_caching_policy {
      code = 502
      ttl  = 10
    }

    cache_key_policy {
      include_http_headers = []
    }
  }

  compression_mode = "AUTOMATIC"

  custom_response_headers = [
    "X-Cache-Status:{cdn_cache_status}",
    "X-Cache-ID:{cdn_cache_id}",
    "Strict-Transport-Security:max-age=31536000; includeSubDomains",
    "X-Content-Type-Options:nosniff",
  ]
}

# Backend service with Cloud CDN for dynamic content
resource "google_compute_backend_service" "api" {
  name                  = "api-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.http.id]
  enable_cdn            = true

  cdn_policy {
    cache_mode  = "USE_ORIGIN_HEADERS"
    default_ttl = 60
    max_ttl     = 300
    client_ttl  = 60

    cache_key_policy {
      include_host           = true
      include_protocol       = true
      include_query_string   = true
      query_string_whitelist = ["version", "lang"]
    }

    negative_caching = true

    negative_caching_policy {
      code = 404
      ttl  = 60
    }

    negative_caching_policy {
      code = 502
      ttl  = 10
    }
  }

  backend {
    group           = google_compute_region_instance_group_manager.app.instance_group
    balancing_mode  = "UTILIZATION"
    max_utilization = 0.8
  }

  custom_response_headers = [
    "X-Cache-Status:{cdn_cache_status}",
  ]

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# URL map with CDN-optimized routing
resource "google_compute_url_map" "default" {
  name            = "my-cdn-url-map"
  default_service = google_compute_backend_service.api.id

  host_rule {
    hosts        = ["cdn.example.com"]
    path_matcher = "cdn-paths"
  }

  path_matcher {
    name            = "cdn-paths"
    default_service = google_compute_backend_service.api.id

    # Static assets via backend bucket (long cache)
    path_rule {
      paths   = ["/static/*", "/assets/*", "/images/*"]
      service = google_compute_backend_bucket.static.id
    }

    # API via backend service (short cache)
    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api.id
    }
  }
}

# Signed URL key
resource "google_compute_backend_bucket_signed_url_key" "cdn_key" {
  name           = "my-cdn-key"
  key_value      = var.cdn_signing_key  # base64-encoded key
  backend_bucket = google_compute_backend_bucket.static.name
}
```

### Step 12: Monitoring and debugging

**Check cache hit ratio:**
```bash
# View CDN metrics in Cloud Monitoring
gcloud monitoring dashboards create --config-from-file=cdn-dashboard.json

# Check cache status via custom headers
curl -I https://cdn.example.com/static/app.js
# Look for: X-Cache-Status: hit | miss | revalidated
```

**Key metrics to monitor:**
- Cache hit ratio (target > 90% for static content)
- Origin latency vs CDN latency
- Bandwidth saved (cache hits * response size)
- Error rates (4xx, 5xx) at the edge
- Cache fill rate (origin requests)

**Debugging cache misses:**
```bash
# Check if content is cacheable
curl -I https://cdn.example.com/path
# Check Cache-Control, Vary, Set-Cookie headers

# Common reasons for cache miss:
# 1. Cache-Control: private, no-store, no-cache
# 2. Set-Cookie in response
# 3. Vary header with high-cardinality values
# 4. Authorization header in request
# 5. POST/PUT/DELETE methods (not cached)
# 6. Response > 10MB (default max cacheable size)
```

### Best practices to follow:
- **Use versioned filenames** for static assets instead of cache invalidation
- **Set appropriate TTLs** per content type (long for assets, short for HTML/API)
- **Enable compression** (AUTOMATIC mode handles gzip and Brotli)
- **Use CACHE_ALL_STATIC** as default cache mode for most origins
- **Add cache status headers** for debugging and monitoring
- **Enable negative caching** to protect origin from thundering herd on errors
- **Use signed URLs/cookies** for premium or protected content
- **Monitor cache hit ratio** and optimize for > 90% on static content
- **Set serve-while-stale** to serve stale content when origin is unavailable
- **Use backend buckets** for Cloud Storage origins (more efficient than backend services)

### Anti-patterns to avoid:
- Using FORCE_CACHE_ALL with authenticated or personalized content
- Setting excessively long TTLs without a cache invalidation strategy
- Not using versioned filenames (leads to frequent invalidation)
- Caching responses with Set-Cookie headers
- Using Vary: * or high-cardinality Vary headers (kills cache hit ratio)
- Invalidating entire cache paths frequently (defeats purpose of CDN)
- Not enabling compression (wastes bandwidth)
- Using CDN for WebSocket or long-polling connections

### Cost optimization:
- **Maximize cache hit ratio**: Higher hit ratio = less origin traffic = lower cost
- **Use versioned filenames**: Avoid paid cache invalidation requests
- **Enable compression**: Reduces bandwidth charges (egress costs)
- **Set appropriate TTLs**: Longer TTLs = fewer origin fetches
- **Use backend buckets** for Cloud Storage (cheaper than backend services)
- **Standard storage class** for frequently accessed CDN content
- **Monitor egress**: Cloud CDN egress is cheaper than direct origin egress
- **Cache invalidation**: Limit to specific paths, avoid wildcard invalidation
- **Serve-while-stale**: Reduces origin load during failures
- **Consider Media CDN** for high-volume video/media (better edge pricing at scale)
