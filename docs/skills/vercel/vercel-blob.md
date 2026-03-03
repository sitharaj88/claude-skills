# Vercel Blob

Generate Vercel Blob configs for file uploads, media storage, CDN delivery, and client-side uploads with multipart support for large files.

## Usage

```bash
/vercel-blob <operation or description>
```

## What It Does

1. Sets up Vercel Blob storage with SDK installation and `BLOB_READ_WRITE_TOKEN` configuration
2. Generates server-side upload, download, list, delete, and copy operations with `@vercel/blob`
3. Creates client-side browser uploads with `handleUpload` token handler and progress tracking
4. Implements multipart uploads for large files with automatic chunking up to 5 TB
5. Builds image handling pipelines with Sharp resizing, WebP conversion, and Next.js Image Optimization
6. Creates file management patterns including cleanup cron jobs, storage monitoring, and access control

## Example Output

```typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
      { status: 400 }
    );
  }

  const blob = await put(`uploads/${file.name}`, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: true,
  });

  return NextResponse.json(blob);
}
```

## What It Covers

- **Server-side uploads** with file validation, content type detection, and custom pathnames
- **Client-side uploads** with browser direct upload, progress tracking, and token-based auth
- **Multipart uploads** for large files with automatic chunking and streaming support
- **Image handling** with Sharp resizing, format conversion, and Next.js Image Optimization
- **File management** with listing, deletion, copying, and prefix-based folder structures
- **Cleanup patterns** with cron jobs for deleting old blobs and monitoring storage usage
- **Access control** with public CDN-served blobs, download URLs, and API proxy patterns
- **Cache control** with custom max-age headers for static assets and CDN optimization

<div class="badge-row">
  <span class="badge">Vercel</span>
  <span class="badge">Storage</span>
  <span class="badge">CDN</span>
</div>

## Installation

```bash
cp -r skills/vercel-blob ~/.claude/skills/vercel-blob
```

## Allowed Tools

- `Read` - Read existing upload handlers and storage configuration
- `Write` - Create upload routes, client components, and file management utilities
- `Edit` - Modify existing blob storage settings and upload configurations
- `Bash` - Run Vercel CLI, npm, and npx commands
- `Glob` - Search for upload and storage-related files
- `Grep` - Find blob usage patterns and storage references
