# Vercel Deploy

Generate Vercel project configs with deployments, domains, environment variables, and framework-specific settings for production-ready applications.

## Usage

```bash
/vercel-deploy <framework or deployment description>
```

## What It Does

1. Detects project framework (Next.js, Nuxt, Astro, Remix, SvelteKit, Vite, Angular) and generates appropriate `vercel.json` configuration
2. Configures environment variables with proper scoping across production, preview, and development
3. Sets up custom domains with DNS configuration, SSL, and www-to-apex redirects
4. Creates monorepo configurations for Turborepo and Nx workspaces
5. Configures security headers, redirects, rewrites, and cron jobs
6. Sets up deployment protection, Git integration, and analytics with Speed Insights

## Example Output

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "redirects": [
    { "source": "/old-page", "destination": "/new-page", "permanent": true }
  ],
  "crons": [
    { "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }
  ]
}
```

## What It Covers

- **Framework detection** with auto-configured build commands and output directories
- **Environment management** with scoped variables for production, preview, and development
- **Custom domains** with DNS records, SSL certificates, and redirect rules
- **Monorepo support** with Turborepo and Nx workspace configurations
- **Security headers** with Content-Type, Frame-Options, XSS, and Referrer-Policy
- **Deployment strategies** with preview deployments, rollbacks, and deploy hooks
- **Cost optimization** with build skipping, ISR caching, and Edge Functions

<div class="badge-row">
  <span class="badge">Vercel</span>
  <span class="badge">Deployment</span>
  <span class="badge">Configuration</span>
</div>

## Installation

```bash
cp -r skills/vercel-deploy ~/.claude/skills/vercel-deploy
```

## Allowed Tools

- `Read` - Read existing project configuration and package.json files
- `Write` - Create vercel.json, environment templates, and deployment configs
- `Edit` - Modify existing Vercel project settings and configurations
- `Bash` - Run Vercel CLI, npm, npx, and git commands
- `Glob` - Search for framework config files and project structure
- `Grep` - Find framework dependencies and configuration references
