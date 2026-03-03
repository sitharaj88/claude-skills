# Vercel Functions

Generate Vercel Serverless and Edge Functions with middleware, ISR, streaming, and proper runtime configuration for API routes and server-side logic.

## Usage

```bash
/vercel-functions <function type or description>
```

## What It Does

1. Generates Serverless Functions (Node.js) and Edge Functions (V8) with proper runtime selection
2. Creates Next.js App Router route handlers with GET, POST, PUT, DELETE methods and dynamic routes
3. Configures Edge Middleware for authentication, geolocation routing, A/B testing, and rate limiting
4. Sets up Incremental Static Regeneration (ISR) with time-based and on-demand revalidation
5. Implements streaming responses with ReadableStream and AI SDK integration
6. Configures function settings including maxDuration, memory, regions, and CORS handling

## Example Output

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');

  try {
    const users = await db.user.findMany({
      skip: (page - 1) * 20,
      take: 20,
    });

    return NextResponse.json({ users, page }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## What It Covers

- **Serverless Functions** with full Node.js API access for database queries and heavy computation
- **Edge Functions** with near-zero cold start for auth checks, redirects, and lightweight transforms
- **Middleware** with request interception, authentication guards, and geolocation routing
- **ISR** with time-based revalidation and on-demand cache invalidation via webhooks
- **Streaming** with ReadableStream, Server-Sent Events, and AI SDK response streaming
- **Function configuration** with maxDuration, memory limits, preferred regions, and CORS
- **Local development** with Vercel CLI dev server and environment variable management

<div class="badge-row">
  <span class="badge">Vercel</span>
  <span class="badge">Serverless</span>
  <span class="badge">Edge</span>
</div>

## Installation

```bash
cp -r skills/vercel-functions ~/.claude/skills/vercel-functions
```

## Allowed Tools

- `Read` - Read existing function code and configuration files
- `Write` - Create route handlers, middleware, and function configurations
- `Edit` - Modify existing function settings and runtime configurations
- `Bash` - Run Vercel CLI, npm, and npx commands
- `Glob` - Search for route and middleware files
- `Grep` - Find function references and configuration patterns
