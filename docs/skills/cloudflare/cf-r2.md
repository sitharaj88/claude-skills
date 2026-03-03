# Cloudflare R2

Generate R2 object storage configurations with Workers bindings, S3 API compatibility, multipart uploads, lifecycle rules, and public access with zero egress fees.

## Usage

```bash
/cf-r2 <purpose or description>
```

## What It Does

1. Creates R2 bucket configurations with Workers bindings, location hints, and jurisdictional restrictions
2. Generates Workers API code for object get, put, delete, list, and head operations
3. Implements multipart upload workflows for large files with create, upload-part, complete, and abort
4. Configures S3 API compatibility with AWS SDK v3 and presigned URL generation
5. Sets up public access via custom domains, CORS rules, and edge caching patterns
6. Produces R2 event notification pipelines to Queues for upload processing

## Example Output

```typescript
interface Env {
  MEDIA_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    switch (request.method) {
      case "GET": {
        const object = await env.MEDIA_BUCKET.get(key);
        if (!object) return new Response("Not Found", { status: 404 });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("cache-control", "public, max-age=86400");
        return new Response(object.body, { headers });
      }
      case "PUT": {
        const contentType = request.headers.get("content-type") || "application/octet-stream";
        const object = await env.MEDIA_BUCKET.put(key, request.body, {
          httpMetadata: { contentType },
        });
        return Response.json({ key: object.key, size: object.size }, { status: 201 });
      }
      case "DELETE": {
        await env.MEDIA_BUCKET.delete(key);
        return new Response(null, { status: 204 });
      }
      default:
        return new Response("Method Not Allowed", { status: 405 });
    }
  },
};
```

## What It Covers

- **Workers bindings** for fast, authenticated server-side access to R2 buckets
- **S3 API compatibility** with AWS SDK v3, presigned URLs, and rclone migration
- **Multipart uploads** for large file handling with resume and abort support
- **Object listing** with prefix filtering, pagination, and delimiter-based folder simulation
- **Public access** via custom domains, r2.dev subdomains, and Worker-based caching
- **Event notifications** to Queues for triggering processing on object create/delete

<div class="badge-row">
  <span class="badge">Cloudflare</span>
  <span class="badge">Storage</span>
  <span class="badge">S3-Compatible</span>
</div>

## Installation

```bash
cp -r skills/cf-r2 ~/.claude/skills/cf-r2
```

## Allowed Tools

- `Read` - Read existing R2 configurations and Worker code
- `Write` - Create storage Workers, wrangler.toml bindings, and CORS rules
- `Edit` - Modify existing R2 configurations and access patterns
- `Bash` - Run Wrangler and AWS CLI commands for bucket management
- `Glob` - Search for storage-related configuration files
- `Grep` - Find R2 binding references and bucket usage
