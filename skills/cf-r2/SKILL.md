---
name: cf-r2
description: Generate R2 storage configs with S3 compatibility, lifecycle, and public access. Use when the user wants to store, serve, or manage objects with zero egress fees on Cloudflare R2.
argument-hint: "[purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx wrangler *), Bash(wrangler *), Bash(npm *), Bash(aws s3*)
user-invocable: true
---

## Instructions

You are a Cloudflare R2 expert. Generate production-ready R2 object storage configurations with Workers bindings, S3 compatibility, and lifecycle management.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Purpose**: media storage, backups, data lake, static assets, user uploads, logs
- **Access pattern**: Workers binding (private), S3 API (compatibility), public access (r2.dev or custom domain)
- **Size profile**: small objects (<1MB), large objects (multipart), mixed workloads
- **Lifecycle**: retention period, automatic deletion, archival needs
- **Integration**: Workers, Pages Functions, external S3-compatible tools

### Step 2: Create bucket and configure wrangler.toml

```bash
# Create an R2 bucket
npx wrangler r2 bucket create my-media-bucket

# Create with location hint (optional, for data locality)
npx wrangler r2 bucket create my-media-bucket --location=enam  # Eastern North America
# Location hints: wnam, enam, weur, eeur, apac

# List buckets
npx wrangler r2 bucket list

# Delete a bucket (must be empty)
npx wrangler r2 bucket delete my-media-bucket
```

**wrangler.toml binding:**

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "my-media-bucket"
preview_bucket_name = "my-media-bucket-preview"  # Used during wrangler dev

# Multiple buckets
[[r2_buckets]]
binding = "BACKUP_BUCKET"
bucket_name = "my-backup-bucket"

# Jurisdictional restrictions (EU-only data)
[[r2_buckets]]
binding = "EU_BUCKET"
bucket_name = "my-eu-bucket"
jurisdiction = "eu"
```

### Step 3: Generate Workers API for R2

```typescript
interface Env {
  MEDIA_BUCKET: R2Bucket;
  BACKUP_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading /

    switch (request.method) {
      case "GET":
        return handleGet(env.MEDIA_BUCKET, key);
      case "PUT":
        return handlePut(env.MEDIA_BUCKET, key, request);
      case "DELETE":
        return handleDelete(env.MEDIA_BUCKET, key);
      case "HEAD":
        return handleHead(env.MEDIA_BUCKET, key);
      default:
        return new Response("Method Not Allowed", { status: 405 });
    }
  },
};

async function handleGet(bucket: R2Bucket, key: string): Promise<Response> {
  // Support range requests for large files / video streaming
  const object = await bucket.get(key);

  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");

  return new Response(object.body, { headers });
}

async function handlePut(bucket: R2Bucket, key: string, request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") || "application/octet-stream";

  const object = await bucket.put(key, request.body, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=86400",
    },
    customMetadata: {
      uploadedBy: request.headers.get("x-uploaded-by") || "unknown",
      uploadedAt: new Date().toISOString(),
    },
  });

  return Response.json({
    key: object.key,
    size: object.size,
    etag: object.etag,
    version: object.version,
  }, { status: 201 });
}

async function handleDelete(bucket: R2Bucket, key: string): Promise<Response> {
  await bucket.delete(key);
  return new Response(null, { status: 204 });
}

async function handleHead(bucket: R2Bucket, key: string): Promise<Response> {
  const object = await bucket.head(key);

  if (!object) {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-length", String(object.size));

  return new Response(null, { headers });
}
```

### Step 4: List objects with pagination

```typescript
async function handleList(bucket: R2Bucket, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const prefix = url.searchParams.get("prefix") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "100");
  const delimiter = url.searchParams.get("delimiter") || undefined;

  const listed = await bucket.list({
    prefix,
    cursor,
    limit,
    delimiter, // Use "/" to simulate folder structure
    include: ["httpMetadata", "customMetadata"],
  });

  return Response.json({
    objects: listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      etag: obj.etag,
      uploaded: obj.uploaded,
      httpMetadata: obj.httpMetadata,
      customMetadata: obj.customMetadata,
    })),
    truncated: listed.truncated,
    cursor: listed.truncated ? listed.cursor : undefined,
    delimitedPrefixes: listed.delimitedPrefixes, // "folders" when using delimiter
  });
}

// Iterate all objects (paginate automatically)
async function listAllObjects(bucket: R2Bucket, prefix?: string): Promise<R2Object[]> {
  const allObjects: R2Object[] = [];
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({ prefix, cursor, limit: 1000 });
    allObjects.push(...listed.objects);
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return allObjects;
}
```

### Step 5: Multipart uploads for large files

```typescript
async function handleMultipartUpload(
  bucket: R2Bucket,
  key: string,
  request: Request
): Promise<Response> {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  switch (action) {
    case "create": {
      const upload = await bucket.createMultipartUpload(key, {
        httpMetadata: {
          contentType: request.headers.get("content-type") || "application/octet-stream",
        },
      });
      return Response.json({ uploadId: upload.uploadId, key: upload.key });
    }

    case "upload-part": {
      const uploadId = url.searchParams.get("uploadId")!;
      const partNumber = parseInt(url.searchParams.get("partNumber")!);

      const upload = bucket.resumeMultipartUpload(key, uploadId);
      const part = await upload.uploadPart(partNumber, request.body!);

      return Response.json({
        partNumber: part.partNumber,
        etag: part.etag,
      });
    }

    case "complete": {
      const uploadId = url.searchParams.get("uploadId")!;
      const body = await request.json() as { parts: R2UploadedPart[] };

      const upload = bucket.resumeMultipartUpload(key, uploadId);
      const object = await upload.complete(body.parts);

      return Response.json({
        key: object.key,
        size: object.size,
        etag: object.etag,
      });
    }

    case "abort": {
      const uploadId = url.searchParams.get("uploadId")!;
      const upload = bucket.resumeMultipartUpload(key, uploadId);
      await upload.abort();
      return new Response(null, { status: 204 });
    }

    default:
      return new Response("Invalid action", { status: 400 });
  }
}
```

### Step 6: S3 API compatibility

R2 supports the S3 API. Use existing AWS SDKs with R2:

```typescript
// Using AWS SDK v3 with R2
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://<ACCOUNT_ID>.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Upload object
await s3.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "images/photo.jpg",
  Body: fileBuffer,
  ContentType: "image/jpeg",
}));

// Generate presigned URL (for direct browser uploads/downloads)
const presignedUrl = await getSignedUrl(
  s3,
  new GetObjectCommand({ Bucket: "my-bucket", Key: "images/photo.jpg" }),
  { expiresIn: 3600 } // 1 hour
);

// List objects
const listed = await s3.send(new ListObjectsV2Command({
  Bucket: "my-bucket",
  Prefix: "images/",
  MaxKeys: 100,
}));
```

**Presigned URL generation in a Worker:**

```typescript
import { AwsClient } from "aws4fetch";

interface Env {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const aws = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    });

    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    // Generate presigned PUT URL for direct upload
    const r2Url = new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/my-bucket/${key}`);
    r2Url.searchParams.set("X-Amz-Expires", "3600");

    const signed = await aws.sign(
      new Request(r2Url, { method: "PUT" }),
      { aws: { signQuery: true } }
    );

    return Response.json({ uploadUrl: signed.url });
  },
};
```

### Step 7: CORS configuration

Configure CORS for browser-based access (via S3 API or custom domain):

```bash
# Apply CORS via wrangler (use a JSON file)
# cors-rules.json:
```

```json
[
  {
    "AllowedOrigins": ["https://example.com", "https://app.example.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Authorization", "x-amz-content-sha256"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 8: Public access and custom domains

**Enable public access via r2.dev:**

```bash
# Enable r2.dev subdomain (not recommended for production)
# Configure in Cloudflare Dashboard: R2 -> Bucket -> Settings -> Public Access
# URL format: https://pub-<hash>.r2.dev/my-file.jpg
```

**Custom domain (recommended for production):**

```bash
# 1. Add a custom domain in Dashboard: R2 -> Bucket -> Settings -> Custom Domains
# 2. Point your domain to the bucket (e.g., assets.example.com)
# 3. Cloudflare handles SSL and caching automatically
# URL format: https://assets.example.com/my-file.jpg
```

**Worker-based public access with caching:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    // Check cache first
    const cache = caches.default;
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    const object = await env.MEDIA_BUCKET.get(key);
    if (!object) return new Response("Not Found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=86400, s-maxage=604800");

    const response = new Response(object.body, { headers });

    // Store in cache for future requests
    const ctx = (globalThis as any).__ctx;
    ctx.waitUntil(cache.put(request, response.clone()));

    return response;
  },
};
```

### Step 9: Event notifications to Queues

```toml
# wrangler.toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "my-media-bucket"

# R2 event notifications
[[r2_buckets.event_notifications]]
queue = "image-processing-queue"
type = "object-create"
prefix = "uploads/"
suffix = ".jpg"

[[r2_buckets.event_notifications]]
queue = "cleanup-queue"
type = "object-delete"
```

```typescript
// Queue consumer for R2 events
interface R2EventMessage {
  account: string;
  bucket: string;
  object: { key: string; size: number; eTag: string };
  action: "PutObject" | "DeleteObject" | "CompleteMultipartUpload";
  eventTime: string;
}

export default {
  async queue(batch: MessageBatch<R2EventMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body;

      if (event.action === "PutObject" && event.object.key.startsWith("uploads/")) {
        // Process uploaded image (e.g., generate thumbnail)
        await generateThumbnail(env.MEDIA_BUCKET, event.object.key);
      }

      message.ack();
    }
  },
};
```

### Step 10: Lifecycle rules

Configure object lifecycle rules via the Cloudflare API or dashboard:

```bash
# Lifecycle rules are configured via Cloudflare Dashboard or API
# Dashboard: R2 -> Bucket -> Settings -> Object lifecycle rules

# Example lifecycle policy via API:
# - Delete objects with prefix "temp/" after 7 days
# - Delete objects with prefix "logs/" after 90 days
# - Abort incomplete multipart uploads after 1 day
```

### Step 11: Migration from S3

```bash
# Using rclone for S3-to-R2 migration
rclone sync s3:my-s3-bucket r2:my-r2-bucket \
  --transfers 32 \
  --checkers 64 \
  --s3-provider Cloudflare \
  --progress

# Using wrangler for small migrations
npx wrangler r2 object put my-bucket/path/to/file --file=./local-file.txt

# Using Sippy (Super Slurper) for incremental migration
# Configure in Dashboard: R2 -> Bucket -> Settings -> Incremental Migration
# R2 will automatically pull objects from S3 on first access
```

### Best practices

- **Use Workers bindings** for server-side access (faster than S3 API, no auth overhead)
- **Use S3 API** for external tools, CLI access, and migration from existing S3 workflows
- **Use custom domains** instead of r2.dev for production public access
- **Set appropriate `Cache-Control` headers** for public objects to leverage Cloudflare CDN
- **Use multipart uploads** for files larger than 100MB (recommended) or 5GB (required)
- **Use `writeHttpMetadata`** to automatically set Content-Type and other headers on responses
- **Use object metadata** for tagging and categorization without separate database lookups
- **Use delimiter in list** operations to simulate folder-based navigation
- **Use event notifications** to trigger processing pipelines instead of polling for changes

### Anti-patterns to avoid

- Do NOT use r2.dev subdomain for production (no caching, rate-limited, not a custom domain)
- Do NOT store sensitive data without access controls (R2 has no built-in object-level ACLs via Workers)
- Do NOT skip Content-Type when uploading (browsers and CDNs rely on it for proper handling)
- Do NOT make individual GET requests for listing/searching (use list with prefix/delimiter instead)
- Do NOT upload large files in a single PUT without multipart (5GB limit per single PUT, and failures are costly)
- Do NOT ignore the `truncated` flag in list results (you will miss objects beyond the first page)
- Do NOT use R2 as a database (use D1 or KV for structured data lookups)

### Cost optimization

- **Zero egress fees**: R2 charges $0 for data retrieval (major differentiator from S3)
- **Storage**: $0.015/GB per month (Class A operations: $4.50/million, Class B: $0.36/million)
- **Free tier**: 10GB storage, 10 million Class A operations, 1 million Class B operations per month
- Use the Cache API in Workers to reduce Class B (read) operation costs
- Set lifecycle rules to automatically delete temporary and expired objects
- Use custom domains with Cloudflare CDN to cache frequently accessed objects
- Batch upload operations when possible to reduce Class A operation count
- Use multipart upload only when necessary (each part counts as a Class A operation)
- Monitor usage in the Cloudflare Dashboard under R2 Analytics
