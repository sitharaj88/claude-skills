---
name: vercel-blob
description: Generate Vercel Blob configs for file uploads, media storage, CDN delivery, and client-side uploads. Use when the user wants to store and serve files on Vercel.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(vercel *), Bash(npm *), Bash(npx *)
user-invocable: true
---

## Instructions

You are a Vercel Blob Storage expert. Generate production-ready file upload and storage configurations using the @vercel/blob SDK.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: upload, download, list, delete, client-upload
- **Upload source**: server-side (API route) or client-side (browser)
- **File types**: images, documents, videos, general assets
- **Access pattern**: public (CDN-served) or token-authenticated
- **Size constraints**: small files (<4.5 MB) or multipart (up to 5 TB)

### Step 2: Set up Vercel Blob

**Create Blob store via Vercel Dashboard:**
```bash
# Vercel Dashboard > Storage > Blob > Create Store
# Environment variable auto-populated:
# BLOB_READ_WRITE_TOKEN

# Pull env vars to local
vercel env pull .env.local
```

**Install the SDK:**
```bash
npm install @vercel/blob
```

**Environment variables:**
| Variable | Description |
|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Full read/write access token |

### Step 3: Server-side operations

**Upload a file (server-side):**
```typescript
import { put } from '@vercel/blob';

// Upload from buffer or string
export async function uploadFile(
  filename: string,
  content: Buffer | string,
  contentType: string
) {
  const blob = await put(filename, content, {
    access: 'public',
    contentType,
    addRandomSuffix: true, // Prevents filename collisions
  });

  return blob;
  // Returns: { url, downloadUrl, pathname, contentType, contentDisposition }
}

// Upload from stream
import { put } from '@vercel/blob';
import { readFileSync } from 'fs';

const blob = await put('documents/report.pdf', readFileSync('./report.pdf'), {
  access: 'public',
  contentType: 'application/pdf',
});
```

**Upload with custom pathname (folder structure):**
```typescript
import { put } from '@vercel/blob';

// Organize files in folder-like structure
const blob = await put(
  `users/${userId}/avatars/profile.jpg`,
  imageBuffer,
  {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: false, // Use exact pathname
  }
);

// blob.url = https://<store>.public.blob.vercel-storage.com/users/123/avatars/profile.jpg
```

**Upload with cache control:**
```typescript
import { put } from '@vercel/blob';

const blob = await put('assets/logo.svg', svgContent, {
  access: 'public',
  contentType: 'image/svg+xml',
  cacheControlMaxAge: 31536000, // 1 year (immutable assets)
});
```

**Download / read a blob:**
```typescript
import { head } from '@vercel/blob';

// Get blob metadata
const blobDetails = await head(blobUrl);
// Returns: { url, downloadUrl, pathname, contentType, size, uploadedAt }

// Download content
const response = await fetch(blobUrl);
const content = await response.text(); // or .arrayBuffer(), .blob()
```

**List blobs:**
```typescript
import { list } from '@vercel/blob';

// List all blobs
const { blobs, cursor, hasMore } = await list();

// List with prefix (folder-like filtering)
const { blobs: userFiles } = await list({
  prefix: `users/${userId}/`,
  limit: 100,
});

// Paginate through all blobs
async function listAllBlobs() {
  const allBlobs = [];
  let cursor: string | undefined;

  do {
    const result = await list({ cursor, limit: 1000 });
    allBlobs.push(...result.blobs);
    cursor = result.cursor;
  } while (cursor);

  return allBlobs;
}

// List with mode 'folded' to get folder-like structure
const { blobs, folders } = await list({
  prefix: 'uploads/',
  mode: 'folded',
});
// folders = ['uploads/images/', 'uploads/documents/', ...]
```

**Delete blobs:**
```typescript
import { del } from '@vercel/blob';

// Delete a single blob
await del(blobUrl);

// Delete multiple blobs
await del([blobUrl1, blobUrl2, blobUrl3]);
```

**Copy a blob:**
```typescript
import { copy } from '@vercel/blob';

// Copy to a new pathname
const newBlob = await copy(
  sourceBlobUrl,
  'backups/image-backup.jpg',
  { access: 'public' }
);
```

### Step 4: Server-side upload API route

**Next.js App Router - handle file upload:**
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

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
      { status: 400 }
    );
  }

  // Validate file size (5 MB max)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5 MB' },
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

### Step 5: Client-side uploads (browser direct upload)

Client uploads bypass your server, sending files directly to Vercel Blob storage. This is ideal for large files.

**Server-side token handler:**
```typescript
// app/api/upload/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Authenticate the user before allowing upload
        // This runs on the server before the upload token is issued
        // You can check auth headers, session, etc.

        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
          tokenPayload: clientPayload, // Pass metadata through
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Called after upload completes (webhook-style)
        // Save blob URL to your database
        console.log('Upload completed:', blob.url);

        // Example: save to database
        // await db.file.create({
        //   data: {
        //     url: blob.url,
        //     pathname: blob.pathname,
        //     size: blob.size,
        //     userId: tokenPayload?.userId,
        //   },
        // });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
```

**Client-side upload component (React):**
```typescript
// components/FileUploader.tsx
'use client';

import { upload } from '@vercel/blob/client';
import { useState, useRef } from 'react';

export function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: JSON.stringify({ userId: 'current-user-id' }),
        onUploadProgress: (progressEvent) => {
          setProgress(Math.round(progressEvent.percentage));
        },
      });

      setBlobUrl(blob.url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        disabled={uploading}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? `Uploading... ${progress}%` : 'Upload'}
      </button>
      {blobUrl && (
        <div>
          <p>Uploaded successfully!</p>
          <a href={blobUrl} target="_blank" rel="noopener noreferrer">
            View file
          </a>
        </div>
      )}
    </div>
  );
}
```

### Step 6: Multipart uploads for large files

Client-side uploads automatically use multipart upload for files larger than ~4.5 MB. The SDK handles chunking transparently.

```typescript
// Large file upload with progress tracking
import { upload } from '@vercel/blob/client';

async function uploadLargeFile(file: File) {
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    multipart: true, // Explicit multipart (auto-detected for large files)
    onUploadProgress: ({ loaded, total, percentage }) => {
      console.log(`Progress: ${percentage}% (${loaded}/${total} bytes)`);
    },
  });

  return blob;
}
```

**Server-side multipart upload:**
```typescript
import { put } from '@vercel/blob';
import { Readable } from 'stream';

// For very large files on the server, stream the upload
export async function uploadLargeServerFile(
  stream: ReadableStream,
  filename: string
) {
  const blob = await put(filename, stream, {
    access: 'public',
    multipart: true,
  });

  return blob;
}
```

### Step 7: Image handling patterns

**Avatar upload with size variants:**
```typescript
// app/api/avatar/route.ts
import { put, del } from '@vercel/blob';
import sharp from 'sharp'; // Install: npm install sharp

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('avatar') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Generate size variants
  const sizes = {
    thumbnail: { width: 64, height: 64 },
    small: { width: 128, height: 128 },
    medium: { width: 256, height: 256 },
    large: { width: 512, height: 512 },
  };

  const uploads = await Promise.all(
    Object.entries(sizes).map(async ([size, dimensions]) => {
      const resized = await sharp(buffer)
        .resize(dimensions.width, dimensions.height, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      return put(
        `avatars/${userId}/${size}.webp`,
        resized,
        { access: 'public', contentType: 'image/webp', addRandomSuffix: false }
      );
    })
  );

  return NextResponse.json({
    thumbnail: uploads[0].url,
    small: uploads[1].url,
    medium: uploads[2].url,
    large: uploads[3].url,
  });
}
```

**Serve with Next.js Image Optimization:**
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
```

```tsx
import Image from 'next/image';

<Image
  src={user.avatarUrl} // Vercel Blob URL
  alt={user.name}
  width={128}
  height={128}
  quality={80}
/>
```

### Step 8: File management patterns

**Cleanup old files:**
```typescript
import { list, del } from '@vercel/blob';

// Delete blobs older than 30 days
async function cleanupOldBlobs(prefix: string, maxAgeDays: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  let cursor: string | undefined;
  let deletedCount = 0;

  do {
    const { blobs, cursor: nextCursor } = await list({
      prefix,
      cursor,
      limit: 1000,
    });

    const oldBlobs = blobs.filter(
      (blob) => new Date(blob.uploadedAt) < cutoff
    );

    if (oldBlobs.length > 0) {
      await del(oldBlobs.map((blob) => blob.url));
      deletedCount += oldBlobs.length;
    }

    cursor = nextCursor;
  } while (cursor);

  return deletedCount;
}

// Run as a cron job
// vercel.json: { "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }] }
```

**Replace a file (update in place):**
```typescript
import { put, del } from '@vercel/blob';

async function replaceFile(
  oldUrl: string,
  newContent: Buffer,
  pathname: string,
  contentType: string
) {
  // Upload new file
  const newBlob = await put(pathname, newContent, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });

  // Delete old file (if URL changed)
  if (oldUrl && oldUrl !== newBlob.url) {
    await del(oldUrl);
  }

  return newBlob;
}
```

### Step 9: Storage usage and limits

**Vercel Blob limits:**
| Feature | Hobby | Pro | Enterprise |
|---------|-------|-----|------------|
| Storage | 500 MB | 5 GB (more available) | Custom |
| Max file size (server) | 500 MB | 500 MB | 5 TB |
| Max file size (client) | 500 MB | 500 MB | 5 TB |
| Bandwidth | 1 GB/month | 100 GB/month | Custom |
| Stores | 1 | 5 | Custom |

**Monitor usage:**
```bash
# Check store usage via Vercel Dashboard > Storage > Blob
# Or use the list API to calculate total size
```

```typescript
async function calculateStorageUsage(prefix?: string) {
  let totalSize = 0;
  let fileCount = 0;
  let cursor: string | undefined;

  do {
    const result = await list({ prefix, cursor, limit: 1000 });
    for (const blob of result.blobs) {
      totalSize += blob.size;
      fileCount++;
    }
    cursor = result.cursor;
  } while (cursor);

  return {
    totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    fileCount,
  };
}
```

### Step 10: Access patterns

**Public blobs (default, CDN-served):**
```typescript
// Public blobs are served via Vercel's CDN with global edge caching
const blob = await put('public-file.jpg', content, {
  access: 'public',
});
// blob.url is publicly accessible without authentication
```

**Download URLs:**
```typescript
import { head } from '@vercel/blob';

// downloadUrl includes Content-Disposition: attachment header
const { downloadUrl, url } = await head(blobUrl);
// url = inline viewing (images render in browser)
// downloadUrl = forces file download dialog
```

**Generating temporary access (API proxy):**
```typescript
// app/api/files/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Authenticate user
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  const blobPath = path.join('/');
  const blobUrl = `https://${process.env.BLOB_STORE_ID}.public.blob.vercel-storage.com/${blobPath}`;

  // Proxy the file content
  const response = await fetch(blobUrl);
  return new NextResponse(response.body, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
```

### Best practices:
- Use `addRandomSuffix: true` (default) to prevent filename collisions
- Set appropriate `contentType` to ensure correct browser rendering
- Use client-side uploads for files over 4.5 MB to avoid API route size limits
- Implement file type and size validation in `onBeforeGenerateToken`
- Configure `next.config.ts` `remotePatterns` for Next.js Image Optimization
- Use prefix-based listing for folder-like file organization
- Store blob URLs in your database for reference and querying
- Set `cacheControlMaxAge` for static assets to leverage CDN caching

### Anti-patterns to avoid:
- Do not upload large files through API routes (use client uploads instead)
- Avoid storing blob tokens in client-side code (use handleUpload server handler)
- Do not use Vercel Blob as a database (store metadata in Postgres, files in Blob)
- Avoid deleting and re-uploading to "rename" files (use `copy` then `del`)
- Do not skip file validation; always check type and size before upload
- Avoid listing all blobs without pagination (can timeout with many files)
- Never expose `BLOB_READ_WRITE_TOKEN` to the client

### Cost optimization:
- Set `cacheControlMaxAge` on static assets to maximize CDN cache hits and reduce bandwidth
- Delete unused blobs regularly (implement cleanup cron jobs)
- Use client-side uploads to avoid consuming Serverless Function bandwidth
- Compress images before upload using libraries like `sharp`
- Use WebP or AVIF formats for images (smaller file sizes)
- Monitor bandwidth usage in Vercel Dashboard; large files with high traffic can be expensive
- Consider resizing images on upload rather than serving originals
- Use `mode: 'folded'` in list to efficiently browse folder structures
