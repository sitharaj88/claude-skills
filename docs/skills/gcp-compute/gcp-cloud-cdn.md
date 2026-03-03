# GCP Cloud CDN

Generate Cloud CDN configurations for cache policies, signed URLs, cache invalidation, origin shields, and edge caching with backend services.

## Usage

```bash
/gcp-cloud-cdn <description of your CDN requirements>
```

## What It Does

1. Enables Cloud CDN on existing or new load balancer backend services
2. Configures cache policies with TTL settings, cache modes, and cache key definitions
3. Sets up signed URLs and signed cookies for access-controlled content delivery
4. Creates cache invalidation rules and patterns for content refresh workflows
5. Configures origin shields to reduce origin load and improve cache hit ratios
6. Adds custom response headers, negative caching, and bypass rules

## Examples

```bash
/gcp-cloud-cdn Enable CDN on a global HTTPS load balancer serving a React SPA from Cloud Storage

/gcp-cloud-cdn Set up signed URLs for a video streaming backend with 24-hour expiration and cache keys by query parameter

/gcp-cloud-cdn Configure CDN caching policies for an API backend with short TTLs and cache bypass for authenticated requests
```

## What It Covers

- **Cache policies** with configurable TTLs, cache modes (FORCE_CACHE_ALL, USE_ORIGIN_HEADERS, CACHE_ALL_STATIC)
- **Cache keys** with inclusion/exclusion of headers, cookies, and query parameters
- **Signed URLs and cookies** for time-limited and access-controlled content delivery
- **Cache invalidation** with path and tag-based purging strategies
- **Origin shields** for reduced origin load and improved cache hit ratios
- **Integration** with Cloud Storage, Compute Engine, Cloud Run, and GKE backends

<div class="badge-row">
  <span class="badge">GCP</span>
  <span class="badge">CDN</span>
  <span class="badge">Edge</span>
</div>

## Allowed Tools

- `Read` - Read existing CDN and backend service configurations
- `Write` - Create CDN configs, cache policies, and signed URL scripts
- `Edit` - Modify existing Cloud CDN settings
- `Bash` - Run gcloud CLI commands for cache invalidation and testing
- `Glob` - Search for CDN-related configuration files
- `Grep` - Find cache policy and backend service references
