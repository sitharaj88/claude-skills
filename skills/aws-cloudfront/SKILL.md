---
name: aws-cloudfront
description: Generate AWS CloudFront distribution configurations for static sites, API acceleration, media streaming, and CDN caching. Use when the user wants to set up CloudFront distributions or CDN caching.
argument-hint: "[static-site|api|media] [domain] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS CloudFront and CDN expert. Generate production-ready distribution configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Use case**: static website hosting, API acceleration, media streaming, SPA
- **Origin**: S3 bucket, ALB, API Gateway, custom HTTP origin
- **Domain**: custom domain name and SSL certificate
- **Caching strategy**: aggressive, moderate, or no caching

### Step 2: Generate distribution configuration

Create CloudFront distribution with:

**Origin configuration:**
- Origin domain and path
- Origin Access Control (OAC) for S3 (not OAI, which is legacy)
- Custom headers for origin identification
- Origin shield for cache hit optimization
- Connection timeout and retry settings
- Origin failover with origin group

**Cache behavior:**
- Path patterns for multiple behaviors
- Cache policy (CachingOptimized, CachingDisabled, or custom)
- Origin request policy (headers, cookies, query strings to forward)
- Response headers policy (CORS, security headers)
- Viewer protocol policy (redirect-to-https)
- Allowed HTTP methods
- Compress objects automatically

### Step 3: Configure caching

**Static site / SPA:**
- Long TTL for assets (CSS, JS, images): 1 year
- Short TTL for HTML: 5 minutes or no-cache
- Cache key based on path only
- Custom error responses (403 → /index.html for SPA routing)

**API acceleration:**
- CachingDisabled policy or short TTL
- Forward all headers, cookies, query strings
- AllViewer origin request policy

**Media streaming:**
- High TTL for media segments
- Range GET support
- Origin shield in the region closest to origin

### Step 4: Security configuration

- ACM certificate (us-east-1) for custom domain
- TLSv1.2_2021 minimum protocol
- Security headers via response headers policy:
  - Strict-Transport-Security
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options
  - Referrer-Policy
- Geo-restriction if needed
- AWS WAF integration for bot/DDoS protection
- Field-level encryption for sensitive data

### Step 5: DNS and deployment

- Route 53 alias record for custom domain
- ACM certificate with DNS validation
- Cache invalidation strategy
- Real-time logs or standard logs to S3
- CloudFront Functions or Lambda@Edge for edge compute

### Step 6: Edge computing (if needed)

**CloudFront Functions** (lightweight, <1ms):
- URL rewrites/redirects
- Header manipulation
- JWT validation
- A/B testing

**Lambda@Edge** (full Lambda, <5s):
- Origin request modification
- Dynamic content generation
- Authentication at edge
- Image optimization

### Best practices:
- Use Origin Access Control (not OAI) for S3
- Enable Origin Shield to improve cache hit ratio
- Use managed cache policies when possible
- Set appropriate TTLs (don't cache everything the same)
- Enable compression (gzip + brotli)
- Use price class based on audience geography
- Implement cache invalidation strategy (versioned filenames preferred)
- Enable real-time logs for debugging
