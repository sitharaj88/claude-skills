---
name: do-spaces
description: Generate Spaces configs for S3-compatible object storage with CDN. Use when the user wants to set up DigitalOcean Spaces for file storage, static assets, backups, or media delivery.
argument-hint: "[purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(doctl *), Bash(terraform *), Bash(s3cmd *), Bash(aws *), Bash(rclone *), Bash(curl *)
user-invocable: true
---

## Instructions

You are a DigitalOcean Spaces and CDN expert. Generate production-ready object storage configurations with CDN delivery, access control, and lifecycle management.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Purpose**: static-assets, backups, media, data-lake, logs, uploads
- **Access pattern**: public (CDN), private (presigned URLs), mixed
- **CDN**: whether content needs edge caching and global delivery
- **Size estimate**: expected storage volume and request patterns
- **Integration**: App Platform, Droplets, Kubernetes, external apps

### Step 2: Create Spaces bucket

**doctl CLI:**
```bash
# Create a Space
doctl compute cdn create \
  --origin <space-name>.nyc3.digitaloceanspaces.com \
  --ttl 3600

# Note: Spaces are created via API or Terraform, not directly via doctl
# Use the API or Terraform for bucket creation
```

**Terraform:**
```hcl
resource "digitalocean_spaces_bucket" "assets" {
  name   = "my-app-assets"
  region = "nyc3"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://example.com", "https://www.example.com"]
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

  lifecycle_rule {
    id      = "archive-old-logs"
    enabled = true
    prefix  = "logs/"

    expiration {
      days = 90
    }
  }

  versioning {
    enabled = true
  }

  force_destroy = false
}

# CDN endpoint
resource "digitalocean_cdn" "assets" {
  origin           = digitalocean_spaces_bucket.assets.bucket_domain_name
  ttl              = 3600
  custom_domain    = "cdn.example.com"
  certificate_name = digitalocean_certificate.cdn.name
}

resource "digitalocean_certificate" "cdn" {
  name    = "cdn-cert"
  type    = "lets_encrypt"
  domains = ["cdn.example.com"]
}
```

### Step 3: Configure access keys

```bash
# Create Spaces access keys (via API)
curl -X POST "https://api.digitalocean.com/v2/spaces/keys" \
  -H "Authorization: Bearer $DO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-app-key"}'

# Response provides:
# - access_key (like AWS Access Key ID)
# - secret_key (like AWS Secret Access Key)
```

**Terraform:**
```hcl
resource "digitalocean_spaces_bucket_object" "index" {
  region       = digitalocean_spaces_bucket.assets.region
  bucket       = digitalocean_spaces_bucket.assets.name
  key          = "index.html"
  content      = file("public/index.html")
  content_type = "text/html"
  acl          = "public-read"
}
```

Environment variables for your application:
```bash
export SPACES_KEY="your-access-key"
export SPACES_SECRET="your-secret-key"
export SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
export SPACES_BUCKET="my-app-assets"
export SPACES_REGION="nyc3"
```

### Step 4: S3-compatible SDK usage

DigitalOcean Spaces is S3-compatible. Use any AWS S3 SDK by changing the endpoint.

**Node.js (AWS SDK v3):**
```javascript
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  endpoint: 'https://nyc3.digitaloceanspaces.com',
  forcePathStyle: false,
  region: 'nyc3',
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
});

// Upload a file
async function uploadFile(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.SPACES_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'private',
    CacheControl: 'max-age=31536000', // 1 year for immutable assets
  });
  return s3Client.send(command);
}

// Generate presigned URL for private files
async function getPresignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.SPACES_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

// Delete a file
async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.SPACES_BUCKET,
    Key: key,
  });
  return s3Client.send(command);
}
```

**Python (boto3):**
```python
import boto3
from botocore.client import Config

session = boto3.session.Session()
client = session.client(
    's3',
    region_name='nyc3',
    endpoint_url='https://nyc3.digitaloceanspaces.com',
    aws_access_key_id=os.environ['SPACES_KEY'],
    aws_secret_access_key=os.environ['SPACES_SECRET'],
)

# Upload
client.upload_file(
    'local-file.jpg',
    os.environ['SPACES_BUCKET'],
    'uploads/image.jpg',
    ExtraArgs={
        'ContentType': 'image/jpeg',
        'ACL': 'private',
        'CacheControl': 'max-age=31536000',
    }
)

# Presigned URL
url = client.generate_presigned_url(
    'get_object',
    Params={
        'Bucket': os.environ['SPACES_BUCKET'],
        'Key': 'uploads/image.jpg',
    },
    ExpiresIn=3600,
)

# List objects
response = client.list_objects_v2(
    Bucket=os.environ['SPACES_BUCKET'],
    Prefix='uploads/',
    MaxKeys=100,
)
for obj in response.get('Contents', []):
    print(obj['Key'], obj['Size'])
```

**Go:**
```go
package main

import (
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/credentials"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/s3"
)

func main() {
    sess := session.Must(session.NewSession(&aws.Config{
        Region:      aws.String("nyc3"),
        Endpoint:    aws.String("https://nyc3.digitaloceanspaces.com"),
        Credentials: credentials.NewStaticCredentials(key, secret, ""),
    }))
    svc := s3.New(sess)

    // Use svc like standard AWS S3 client
}
```

### Step 5: Multipart uploads for large files

```javascript
const { Upload } = require('@aws-sdk/lib-storage');

async function uploadLargeFile(key, stream, contentType) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.SPACES_BUCKET,
      Key: key,
      Body: stream,
      ContentType: contentType,
      ACL: 'private',
    },
    queueSize: 4,           // Concurrent upload parts
    partSize: 1024 * 1024 * 10, // 10MB per part
    leavePartsOnError: false,
  });

  upload.on('httpUploadProgress', (progress) => {
    console.log(`Uploaded ${progress.loaded} of ${progress.total}`);
  });

  return upload.done();
}
```

### Step 6: CORS configuration

```hcl
resource "digitalocean_spaces_bucket" "uploads" {
  name   = "my-app-uploads"
  region = "nyc3"
  acl    = "private"

  # Browser-based direct uploads
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["https://example.com"]
    max_age_seconds = 3600
  }

  # Public CDN reads from any origin
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 86400
  }
}
```

### Step 7: Static website hosting

```bash
# Enable static site hosting on a Space
# Set ACL to public-read and configure index/error documents

# Upload static files
s3cmd put --recursive --acl-public \
  --mime-type="text/html" \
  ./dist/ s3://my-static-site/
```

**Terraform for static site:**
```hcl
resource "digitalocean_spaces_bucket" "static_site" {
  name   = "my-static-site"
  region = "nyc3"
  acl    = "public-read"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 86400
  }
}

resource "digitalocean_cdn" "static_site" {
  origin        = digitalocean_spaces_bucket.static_site.bucket_domain_name
  ttl           = 3600
  custom_domain = "static.example.com"
  certificate_name = digitalocean_certificate.static.name
}
```

Access via:
- Direct: `https://my-static-site.nyc3.digitaloceanspaces.com/index.html`
- CDN: `https://my-static-site.nyc3.cdn.digitaloceanspaces.com/index.html`
- Custom: `https://static.example.com/index.html`

### Step 8: Configure s3cmd and rclone

**s3cmd configuration (~/.s3cfg):**
```ini
[default]
access_key = YOUR_SPACES_KEY
secret_key = YOUR_SPACES_SECRET
host_base = nyc3.digitaloceanspaces.com
host_bucket = %(bucket)s.nyc3.digitaloceanspaces.com
use_https = True
```

```bash
# s3cmd usage
s3cmd ls s3://my-bucket/
s3cmd put file.txt s3://my-bucket/file.txt
s3cmd get s3://my-bucket/file.txt ./file.txt
s3cmd del s3://my-bucket/file.txt
s3cmd sync ./local-dir/ s3://my-bucket/prefix/
```

**rclone configuration (~/.config/rclone/rclone.conf):**
```ini
[spaces]
type = s3
provider = DigitalOcean
access_key_id = YOUR_SPACES_KEY
secret_access_key = YOUR_SPACES_SECRET
endpoint = nyc3.digitaloceanspaces.com
acl = private
```

```bash
# rclone usage
rclone ls spaces:my-bucket
rclone copy ./local-dir spaces:my-bucket/prefix
rclone sync ./local-dir spaces:my-bucket/prefix
rclone delete spaces:my-bucket/old-data
```

### Step 9: CDN management

```bash
# List CDN endpoints
doctl compute cdn list

# Create CDN endpoint
doctl compute cdn create \
  --origin my-bucket.nyc3.digitaloceanspaces.com \
  --ttl 3600 \
  --domain cdn.example.com \
  --certificate-id <cert-id>

# Flush CDN cache
doctl compute cdn flush <cdn-id> --files "images/*" "css/*"

# Delete CDN endpoint
doctl compute cdn delete <cdn-id>
```

**Cache control headers:**
```javascript
// Set cache headers during upload for CDN optimization
const command = new PutObjectCommand({
  Bucket: bucket,
  Key: `assets/${hash}.js`,
  Body: content,
  ContentType: 'application/javascript',
  CacheControl: 'public, max-age=31536000, immutable',  // Hashed filenames
  ContentEncoding: 'gzip',
});

// Short cache for HTML
const htmlCommand = new PutObjectCommand({
  Bucket: bucket,
  Key: 'index.html',
  Body: htmlContent,
  ContentType: 'text/html',
  CacheControl: 'public, max-age=300, s-maxage=60',  // 5 min browser, 1 min CDN
});
```

### Step 10: Spaces regions

| Region | Endpoint | CDN |
|--------|----------|-----|
| nyc3 | nyc3.digitaloceanspaces.com | nyc3.cdn.digitaloceanspaces.com |
| sfo3 | sfo3.digitaloceanspaces.com | sfo3.cdn.digitaloceanspaces.com |
| ams3 | ams3.digitaloceanspaces.com | ams3.cdn.digitaloceanspaces.com |
| sgp1 | sgp1.digitaloceanspaces.com | sgp1.cdn.digitaloceanspaces.com |
| fra1 | fra1.digitaloceanspaces.com | fra1.cdn.digitaloceanspaces.com |
| syd1 | syd1.digitaloceanspaces.com | syd1.cdn.digitaloceanspaces.com |

### Best practices

- Use the CDN endpoint for all public-facing assets to reduce latency
- Set appropriate `Cache-Control` headers: long TTL for hashed assets, short for HTML
- Use presigned URLs for private content instead of making the Space public
- Enable versioning for critical data like backups and documents
- Use lifecycle rules to automatically clean up temporary files and old logs
- Organize files with meaningful prefixes (e.g., `uploads/2024/06/`, `backups/daily/`)
- Use multipart uploads for files larger than 100MB
- Set CORS rules to restrict allowed origins to your domain
- Use `private` ACL by default; only make individual objects or the entire Space public when necessary
- Compress files before upload when serving via CDN

### Anti-patterns to avoid

- Do not use Spaces for frequently updated small files; use a database instead
- Do not store secrets, credentials, or private keys in Spaces
- Do not skip CORS configuration for browser-based uploads; requests will fail
- Do not use public ACL on the entire Space when only some files need to be public
- Do not list all objects in application code without pagination; use `MaxKeys` and continuation tokens
- Do not forget to set `Content-Type` during upload; incorrect types cause display issues
- Do not use Spaces as a primary database; it is object storage, not a file system
- Do not hardcode access keys in application code; use environment variables

### Cost optimization tips

- Spaces costs $5/mo for 250GB storage + 1TB outbound transfer (very competitive)
- Additional storage: $0.02/GB/mo, additional transfer: $0.01/GB
- Use the CDN to reduce origin requests and transfer costs
- Set lifecycle rules to automatically expire temporary and old data
- Use `Cache-Control: immutable` for hashed assets to maximize CDN hit rate
- Compress (gzip/brotli) assets before uploading to reduce storage and transfer costs
- Use Spaces for backups instead of more expensive block storage snapshots
- Compared to AWS S3: Spaces is significantly cheaper for storage-heavy workloads
- Intra-datacenter transfer (Droplet to Space in same region) is free
- CDN is included in the base Spaces subscription at no additional cost
