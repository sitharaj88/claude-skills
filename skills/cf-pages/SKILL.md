---
name: cf-pages
description: Generate Cloudflare Pages configs with SSR, functions, and edge deployment. Use when the user wants to deploy full-stack web applications with static assets, server-side rendering, or API functions on Cloudflare Pages.
argument-hint: "[framework]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx wrangler *), Bash(wrangler *), Bash(npm *), Bash(pnpm *)
user-invocable: true
---

## Instructions

You are a Cloudflare Pages expert. Generate production-ready Pages configurations with framework integration, functions, and edge deployment.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Framework**: Next.js, Nuxt, Astro, Remix, SvelteKit, SolidStart, Qwik, or static HTML/CSS/JS
- **Rendering mode**: static (SSG), server-side (SSR), hybrid (per-route), or SPA
- **Functions**: API routes via Pages Functions (/functions directory)
- **Bindings**: KV, R2, D1, Durable Objects, AI, Vectorize
- **Deployment**: Git integration (GitHub/GitLab) or direct upload via wrangler

### Step 2: Generate framework-specific configuration

**Next.js with `@cloudflare/next-on-pages`:**

```javascript
// next.config.mjs
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
  },
};

export default nextConfig;
```

```typescript
// image-loader.ts
export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = [`width=${width}`, `quality=${quality || 75}`, "format=auto"];
  return `/cdn-cgi/image/${params.join(",")}/${src}`;
}
```

```toml
# wrangler.toml (for Next.js on Pages)
name = "my-next-app"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[kv_namespaces]]
binding = "MY_KV"
id = "abc123"
```

**Astro:**

```javascript
// astro.config.mjs
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server", // or "hybrid" for per-route SSR
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: "cloudflare",
  }),
});
```

```typescript
// src/env.d.ts
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  MY_KV: KVNamespace;
  MY_DB: D1Database;
}
```

**Nuxt:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: "cloudflare-pages",
    cloudflare: {
      pages: {
        routes: {
          exclude: ["/api/*"],
        },
      },
    },
  },
});
```

**Remix:**

```typescript
// app/load-context.ts
import { type PlatformProxy } from "wrangler";

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}
```

**SvelteKit:**

```javascript
// svelte.config.js
import adapter from "@sveltejs/adapter-cloudflare";

export default {
  kit: {
    adapter: adapter({
      routes: {
        include: ["/*"],
        exclude: ["<all>"],
      },
    }),
  },
};
```

**SolidStart:**

```typescript
// app.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
  },
});
```

### Step 3: Generate Pages Functions

Pages Functions live in the `/functions` directory and map to URL paths:

```
functions/
  api/
    index.ts          -> /api
    users/
      index.ts        -> /api/users
      [id].ts         -> /api/users/:id
    [[catchall]].ts   -> /api/* (catch-all)
  _middleware.ts      -> runs on all routes
```

**Basic Pages Function:**

```typescript
// functions/api/users/index.ts
interface Env {
  MY_DB: D1Database;
  MY_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { results } = await context.env.MY_DB
    .prepare("SELECT id, name, email FROM users LIMIT 50")
    .all();

  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json();
  const { name, email } = body as { name: string; email: string };

  const result = await context.env.MY_DB
    .prepare("INSERT INTO users (name, email) VALUES (?, ?) RETURNING *")
    .bind(name, email)
    .first();

  return Response.json(result, { status: 201 });
};
```

**Dynamic route parameter:**

```typescript
// functions/api/users/[id].ts
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = context.params.id;

  const user = await context.env.MY_DB
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(user);
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const id = context.params.id;
  const body = await context.request.json();

  const result = await context.env.MY_DB
    .prepare("UPDATE users SET name = ?, email = ? WHERE id = ? RETURNING *")
    .bind(body.name, body.email, id)
    .first();

  return Response.json(result);
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = context.params.id;
  await context.env.MY_DB
    .prepare("DELETE FROM users WHERE id = ?")
    .bind(id)
    .run();

  return new Response(null, { status: 204 });
};
```

**Middleware:**

```typescript
// functions/_middleware.ts
const authMiddleware: PagesFunction = async (context) => {
  const token = context.request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Validate token (example with JWT)
    const payload = await verifyToken(token);
    context.data.user = payload;
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 403 });
  }

  return context.next();
};

const corsMiddleware: PagesFunction = async (context) => {
  const response = await context.next();

  response.headers.set("Access-Control-Allow-Origin", "https://example.com");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: response.headers });
  }

  return response;
};

export const onRequest = [corsMiddleware, authMiddleware];
```

### Step 4: Generate routing and redirects

**_routes.json (controls which routes invoke Functions):**

```json
{
  "version": 1,
  "include": ["/api/*", "/auth/*"],
  "exclude": ["/assets/*", "/images/*", "/*.css", "/*.js"]
}
```

**_redirects file:**

```
/old-page /new-page 301
/blog/:slug /articles/:slug 301
/docs https://docs.example.com 302
/app/* /app/index.html 200
```

**_headers file:**

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: no-store
  Access-Control-Allow-Origin: https://example.com
```

### Step 5: Generate wrangler.toml for Pages

```toml
name = "my-pages-app"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"   # or "build", ".next", etc.

# Bindings available in Pages Functions
[[kv_namespaces]]
binding = "CACHE"
id = "abc123"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "my-assets"

[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "xxxx-xxxx-xxxx"

[ai]
binding = "AI"

# Environment-specific overrides
[env.preview]
name = "my-pages-app-preview"

[env.preview.vars]
ENVIRONMENT = "preview"
API_URL = "https://api-staging.example.com"

[env.production.vars]
ENVIRONMENT = "production"
API_URL = "https://api.example.com"
```

### Step 6: Configure deployment

**Git integration (GitHub/GitLab):**

```bash
# Connect repository via Cloudflare Dashboard:
# 1. Go to Workers & Pages -> Create -> Pages
# 2. Connect to Git provider
# 3. Select repository and branch
# 4. Configure build settings:
#    - Build command: npm run build
#    - Build output directory: dist
#    - Root directory: / (or monorepo subdirectory)

# Framework build commands:
# Next.js:    npx @cloudflare/next-on-pages
# Astro:      npm run build
# Nuxt:       npm run build
# Remix:      npm run build
# SvelteKit:  npm run build
# SolidStart: npm run build
```

**Direct upload with wrangler:**

```bash
# Build locally and deploy
npm run build
npx wrangler pages deploy dist

# Deploy to a specific branch/preview
npx wrangler pages deploy dist --branch=feature-branch

# Deploy to production
npx wrangler pages deploy dist --branch=main

# List deployments
npx wrangler pages deployment list --project-name=my-pages-app

# Create a new Pages project
npx wrangler pages project create my-pages-app --production-branch=main
```

### Step 7: Environment variables and secrets

```bash
# Set production environment variables
npx wrangler pages secret put API_KEY --project-name=my-pages-app

# Set preview-only variables
npx wrangler pages secret put API_KEY --project-name=my-pages-app --env=preview

# List secrets
npx wrangler pages secret list --project-name=my-pages-app
```

Accessing environment variables in Pages Functions:

```typescript
export const onRequest: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.API_KEY;
  const dbUrl = context.env.DATABASE_URL;
  // ...
};
```

### Step 8: SPA fallback and static asset handling

For single-page applications, configure SPA fallback:

```json
// _routes.json - SPA pattern
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*", "/favicon.ico", "/robots.txt"]
}
```

Alternatively, use `_redirects` for SPA catch-all:

```
/* /index.html 200
```

### Step 9: Preview deployments and branch deploys

Cloudflare Pages automatically creates preview deployments for non-production branches:

- **Production**: `my-app.pages.dev` (from the production branch)
- **Preview**: `<commit-hash>.my-app.pages.dev` (from any other branch)
- **Branch preview**: `<branch-name>.my-app.pages.dev`

Control preview deployment behavior in the dashboard or via API:
- Enable/disable preview deployments
- Set branch inclusion/exclusion patterns
- Configure preview-specific environment variables

### Best practices

- **Use `_routes.json`** to explicitly control which routes invoke Functions (reduces unnecessary invocations)
- **Use framework adapters** instead of raw Pages Functions for full-stack frameworks
- **Set `compatibility_date`** and `nodejs_compat` flag for modern API access
- **Use `_headers`** for security headers applied at the edge (CSP, HSTS, etc.)
- **Leverage preview deployments** for pull request reviews and staging
- **Use environment-specific variables** to separate production and preview configs
- **Place static assets** in the build output directory for automatic CDN distribution
- **Use wrangler.toml** for bindings instead of dashboard-only configuration (infrastructure as code)

### Anti-patterns to avoid

- Do NOT put API keys or secrets in `_headers` or `_redirects` files (these are public)
- Do NOT use Pages Functions for compute-heavy tasks (use Workers with Queues instead)
- Do NOT skip `_routes.json` when using Functions (every request will invoke a Function otherwise)
- Do NOT deploy large node_modules in the output directory (bundle with your build tool)
- Do NOT rely on filesystem access in Pages Functions (use KV, R2, or D1 for storage)
- Do NOT hardcode environment-specific values (use environment variables per deployment environment)
- Do NOT use Pages for WebSocket-heavy workloads (use a dedicated Worker instead)

### Cost optimization

- **Free tier**: 500 builds/month, unlimited bandwidth, 100,000 Function invocations/day
- **Pro plan ($20/month)**: 5,000 builds/month, unlimited Function invocations
- Use `_routes.json` exclude patterns to serve static assets without Function invocations
- Cache API responses at the edge to reduce Function execution frequency
- Use static generation (SSG) where possible to avoid runtime compute costs
- Minimize build times by caching dependencies (automatically cached by Cloudflare)
- Use branch deploy controls to avoid unnecessary preview deployment builds
- Optimize images at build time rather than at runtime to reduce Function CPU usage
