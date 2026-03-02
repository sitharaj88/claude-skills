# AWS CloudFront

Generate CloudFront CDN distributions for static sites, API acceleration, media streaming, and edge compute with Lambda@Edge or CloudFront Functions.

## Usage

```bash
/aws-cloudfront <description of your CDN requirements>
```

## What It Does

1. Creates CloudFront distribution configurations with optimal cache behaviors
2. Configures origins (S3, ALB, API Gateway, custom HTTP) with origin access controls
3. Sets up cache policies and origin request policies for performance
4. Generates edge functions (Lambda@Edge or CloudFront Functions) for request/response manipulation
5. Adds SSL/TLS certificates, custom domains, and security headers
6. Configures geo-restrictions, WAF integration, and access logging

## Examples

```bash
/aws-cloudfront Create a distribution for a React SPA hosted on S3 with custom domain

/aws-cloudfront Set up API acceleration with caching and Lambda@Edge auth headers

/aws-cloudfront Configure a video streaming distribution with signed URLs and geo-restrictions
```

## Allowed Tools

- `Read` - Read existing distribution and edge function configs
- `Write` - Create distribution templates and edge functions
- `Edit` - Modify existing CloudFront configurations
- `Bash` - Run AWS CLI commands for invalidation and testing
- `Glob` - Search for CDN-related configuration files
- `Grep` - Find origin and behavior references
