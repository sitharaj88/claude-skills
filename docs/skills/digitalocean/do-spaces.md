# DigitalOcean Spaces

Generate Spaces configs for S3-compatible object storage with CDN. Use when you need to set up DigitalOcean Spaces for file storage, static assets, backups, or media delivery.

## Usage

```bash
/do-spaces [purpose]
```

## What It Does

1. Generates Spaces bucket configurations via Terraform with ACL, CORS rules, and versioning
2. Configures CDN endpoints with custom domains and Let's Encrypt SSL certificates
3. Sets up lifecycle rules for automatic expiration of temporary files and old logs
4. Provides S3-compatible SDK usage examples for Node.js (AWS SDK v3), Python (boto3), and Go
5. Generates presigned URLs for secure, time-limited access to private objects
6. Configures multipart uploads for large file handling with progress tracking
7. Sets up static website hosting with CDN delivery and custom domain support
8. Manages s3cmd and rclone configurations for CLI-based file operations

## Example Output

```hcl
resource "digitalocean_spaces_bucket" "assets" {
  name   = "my-app-assets"
  region = "nyc3"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://example.com"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    id      = "expire-temp-uploads"
    enabled = true
    prefix  = "tmp/"

    expiration {
      days = 7
    }
  }

  versioning {
    enabled = true
  }
}

resource "digitalocean_cdn" "assets" {
  origin           = digitalocean_spaces_bucket.assets.bucket_domain_name
  ttl              = 3600
  custom_domain    = "cdn.example.com"
  certificate_name = digitalocean_certificate.cdn.name
}
```

## Installation

```bash
cp -r skills/do-spaces ~/.claude/skills/
```

<div class="badge-row">
  <span class="badge">DigitalOcean</span>
  <span class="badge">Object Storage</span>
  <span class="badge">CDN</span>
</div>

## Allowed Tools

- `Read` - Read existing Spaces configurations and upload scripts
- `Write` - Create bucket configs, CORS rules, and lifecycle policies
- `Edit` - Modify existing Spaces settings, CDN endpoints, and access controls
- `Bash` - Run doctl, Terraform, s3cmd, aws (S3-compatible), rclone, and curl commands
- `Glob` - Search for storage configuration and asset files
- `Grep` - Find bucket references and access key usage
