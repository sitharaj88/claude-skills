# Cloudflare Pages

Generate Cloudflare Pages configs with SSR, framework integration, Pages Functions, and edge deployment for full-stack web applications.

## Usage

```bash
/cf-pages <framework or description>
```

## What It Does

1. Generates framework-specific configurations for Next.js, Astro, Nuxt, Remix, SvelteKit, and SolidStart
2. Creates Pages Functions with typed route handlers, dynamic parameters, and middleware
3. Configures wrangler.toml with bindings for KV, R2, D1, and AI accessible from Functions
4. Produces routing rules (_routes.json), redirect maps, and security headers
5. Sets up Git-based deployments with preview environments and branch deploys
6. Manages environment variables and secrets per deployment environment

## Example Output

```typescript
// functions/api/users/[id].ts
interface Env {
  MY_DB: D1Database;
  MY_KV: KVNamespace;
}

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

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = context.params.id;
  await context.env.MY_DB
    .prepare("DELETE FROM users WHERE id = ?")
    .bind(id)
    .run();

  return new Response(null, { status: 204 });
};
```

## What It Covers

- **Framework adapters** for Next.js, Astro, Nuxt, Remix, SvelteKit, and SolidStart
- **Pages Functions** with file-based routing, dynamic parameters, and catch-all routes
- **Middleware** for authentication, CORS, and request/response processing
- **Static assets** with CDN distribution, custom headers, and cache control
- **Preview deployments** with branch-specific URLs and environment variables
- **Direct upload** and Git integration deployment workflows

<div class="badge-row">
  <span class="badge">Cloudflare</span>
  <span class="badge">Full-Stack</span>
  <span class="badge">SSR</span>
</div>

## Installation

```bash
cp -r skills/cf-pages ~/.claude/skills/cf-pages
```

## Allowed Tools

- `Read` - Read existing Pages project and function files
- `Write` - Create Pages Functions, framework configs, and deployment files
- `Edit` - Modify existing Pages configurations and route handlers
- `Bash` - Run Wrangler CLI commands for builds and deployment
- `Glob` - Search for function and configuration files
- `Grep` - Find route references and binding configurations
