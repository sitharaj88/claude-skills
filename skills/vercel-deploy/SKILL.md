---
name: vercel-deploy
description: Generate Vercel project configs with deployments, domains, environment variables, and framework-specific settings. Use when the user wants to deploy applications to Vercel or configure project settings.
argument-hint: "[framework]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(vercel *), Bash(npm *), Bash(npx *), Bash(git *)
user-invocable: true
---

## Instructions

You are a Vercel deployment expert. Generate production-ready Vercel project configurations with proper framework detection, environment management, and deployment strategies.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Framework**: Next.js, Nuxt, Astro, Remix, SvelteKit, Vite, Angular, Gatsby, Hugo, Eleventy
- **Deployment type**: production, preview, development
- **Domain requirements**: custom domain, subdomain, redirect rules
- **Monorepo**: Turborepo, Nx, or standalone project
- **Environment**: environment variable scopes and secrets

### Step 2: Detect framework and project structure

Scan the project to auto-detect the framework:

```bash
# Check package.json for framework dependencies
cat package.json | grep -E "next|nuxt|astro|@remix-run|@sveltejs|vite|@angular"
```

**Framework detection map:**
| File/Dependency | Framework | Build Command | Output Dir |
|----------------|-----------|---------------|------------|
| `next.config.*` | Next.js | `next build` | `.next` |
| `nuxt.config.*` | Nuxt | `nuxt build` | `.output` |
| `astro.config.*` | Astro | `astro build` | `dist` |
| `remix.config.*` | Remix | `remix build` | `build` |
| `svelte.config.*` | SvelteKit | `vite build` | `.svelte-kit` |
| `vite.config.*` | Vite | `vite build` | `dist` |
| `angular.json` | Angular | `ng build` | `dist/<project>` |

### Step 3: Generate vercel.json configuration

Create the `vercel.json` file with framework-appropriate settings:

**Basic vercel.json:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

**Full-featured vercel.json:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Cache-Control", "value": "s-maxage=0" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "redirects": [
    { "source": "/old-page", "destination": "/new-page", "permanent": true },
    { "source": "/blog/:slug", "destination": "/posts/:slug", "permanent": true }
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.example.com/:path*" },
    { "source": "/:path*", "destination": "/index.html" }
  ],
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Step 4: Configure environment variables

Set up environment variables for each scope:

**Using Vercel CLI:**
```bash
# Add environment variables per scope
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development

# Pull environment variables to local .env
vercel env pull .env.local

# List all environment variables
vercel env ls
```

**Environment variable scopes:**
| Scope | Description | Access |
|-------|-------------|--------|
| `production` | Live production deployment | Main branch only |
| `preview` | Preview deployments | All non-production branches |
| `development` | Local `vercel dev` | Local development only |

**Generate .env.example:**
```bash
# Database
DATABASE_URL=postgresql://...
# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://yourdomain.com
# Third-party APIs
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Vercel-specific (auto-populated)
# VERCEL_URL - deployment URL
# VERCEL_ENV - production | preview | development
# VERCEL_GIT_COMMIT_SHA - commit hash
```

### Step 5: Configure custom domains and DNS

**Add custom domains via CLI:**
```bash
# Add production domain
vercel domains add example.com
vercel domains add www.example.com

# Verify DNS configuration
vercel domains inspect example.com
```

**DNS configuration patterns:**
| Record Type | Name | Value | Purpose |
|------------|------|-------|---------|
| `A` | `@` | `76.76.21.21` | Root domain |
| `CNAME` | `www` | `cname.vercel-dns.com` | www subdomain |
| `CNAME` | `*` | `cname.vercel-dns.com` | Wildcard subdomain |

**Redirect www to apex (or vice versa) in vercel.json:**
```json
{
  "redirects": [
    {
      "source": "/:path((?!api/).*)",
      "has": [{ "type": "host", "value": "www.example.com" }],
      "destination": "https://example.com/:path",
      "permanent": true
    }
  ]
}
```

### Step 6: Configure Git integration

**GitHub / GitLab / Bitbucket integration:**
- Connect repository from Vercel Dashboard or CLI
- Auto-deploy on push to any branch
- Preview deployments for every pull request
- Comment with preview URL on PRs

**Branch-based deployment configuration:**
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "staging": true,
      "develop": true
    }
  }
}
```

**Ignored build step (skip unnecessary builds):**
Create `vercel-build-skip.sh` or use vercel.json:
```json
{
  "ignoreCommand": "git diff HEAD^ HEAD --quiet -- . ':!docs' ':!README.md'"
}
```

### Step 7: Monorepo configuration

**Turborepo setup:**
```json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=web",
  "installCommand": "cd ../.. && npm install",
  "rootDirectory": "apps/web"
}
```

**Nx setup:**
```json
{
  "buildCommand": "cd ../.. && npx nx build web",
  "installCommand": "cd ../.. && npm install",
  "rootDirectory": "apps/web"
}
```

**Configure root directory in Vercel Dashboard:**
- Set "Root Directory" to the app within the monorepo
- Vercel auto-detects Turborepo and Nx workspaces
- Each app gets its own Vercel project

### Step 8: Deployment protection

**Password protection (Pro plan):**
```json
{
  "protectionBypass": {
    "<secret>": {
      "scope": "automation"
    }
  }
}
```

**Vercel Authentication (Enterprise):**
- Restrict preview deployments to team members
- SSO integration for deployment access
- Configure in Project Settings > Deployment Protection

**Protection options:**
| Option | Plan | Scope |
|--------|------|-------|
| Password | Pro | Preview deployments |
| Vercel Authentication | Pro | Preview deployments |
| Trusted IPs | Enterprise | All deployments |
| Standard Protection | All | Preview deployments |

### Step 9: Deployment via CLI

**Common deployment commands:**
```bash
# Link project (first time)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy with specific environment
vercel --env DATABASE_URL=postgresql://...

# Deploy and get JSON output
vercel --prod --json

# Promote a preview deployment to production
vercel promote <deployment-url>

# Rollback to previous deployment
vercel rollback
```

### Step 10: Analytics and monitoring

**Enable Web Analytics:**
```typescript
// app/layout.tsx (Next.js App Router)
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Enable Speed Insights:**
```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Deployment hooks (trigger builds from external services):**
```bash
# Create a deploy hook URL from Dashboard > Settings > Git > Deploy Hooks
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_xxxxx/yyyyyy
```

### Best practices:
- Use `vercel.json` `$schema` for IDE autocompletion and validation
- Set environment variables per scope, never commit secrets to code
- Use `.vercelignore` to exclude unnecessary files from deployment
- Configure `ignoreCommand` to skip builds for documentation-only changes
- Enable Speed Insights and Web Analytics for production monitoring
- Use preview deployments for every PR to catch issues before production
- Pin framework versions in `package.json` to avoid unexpected build failures
- Set security headers in `vercel.json` for all routes
- Use `rewrites` instead of `redirects` for API proxying to avoid exposing backend URLs
- Configure deployment protection on preview deployments in team projects

### Anti-patterns to avoid:
- Never store secrets in `vercel.json` (use environment variables instead)
- Do not use `redirects` for internal API proxying (use `rewrites`)
- Avoid wildcard CORS headers in production (`Access-Control-Allow-Origin: *`)
- Do not deploy without environment variable scoping (production vs preview)
- Avoid skipping preview deployments; they are your safety net
- Do not use root directory installs in monorepos (configure `rootDirectory`)
- Never hardcode deployment URLs; use `VERCEL_URL` or `VERCEL_PROJECT_PRODUCTION_URL`

### Cost optimization:
- Use `ignoreCommand` to skip builds for irrelevant changes (saves build minutes)
- Set appropriate function regions close to your database for lower latency
- Use ISR and caching to reduce serverless function invocations
- Monitor usage in Vercel Dashboard > Usage to track spend
- Use Edge Functions for lightweight operations (cheaper than Serverless)
- Set `maxDuration` on functions to prevent runaway costs
- Use `stale-while-revalidate` caching headers to reduce origin hits
