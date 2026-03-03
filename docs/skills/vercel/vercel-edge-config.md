# Vercel Edge Config

Generate Vercel Edge Config for ultra-low latency feature flags, A/B testing, configuration management, and maintenance mode at the edge.

## Usage

```bash
/vercel-edge-config <operation or description>
```

## What It Does

1. Sets up Edge Config with SDK installation and connection string configuration for sub-millisecond reads
2. Implements feature flags with boolean toggles, percentage-based rollouts, and user targeting
3. Creates A/B testing middleware with variant assignment, weighted distribution, and cookie persistence
4. Builds maintenance mode with IP allowlists, path exclusions, and estimated return time display
5. Configures IP blocking and country-based geolocation restrictions at the edge
6. Generates dynamic redirect maps and admin API routes for programmatic config updates

## Example Output

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export const config = {
  matcher: ['/dashboard/:path*'],
};

export async function middleware(request: NextRequest) {
  const flags = await get<Record<string, boolean>>('featureFlags');

  // Maintenance mode
  if (flags?.maintenanceMode) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  // Feature flag for new dashboard
  if (flags?.newDashboard) {
    return NextResponse.rewrite(new URL('/dashboard-v2', request.url));
  }

  return NextResponse.next();
}
```

## What It Covers

- **Feature flags** with boolean, multivariate, and percentage-based rollout patterns
- **A/B testing** with variant assignment, weighted splits, cookie persistence, and analytics tracking
- **Maintenance mode** with IP allowlists, path exclusions, and custom maintenance pages
- **IP blocking** and country-based geolocation restrictions at the edge
- **Dynamic redirects** with configurable redirect maps managed via Edge Config
- **Programmatic updates** via Vercel API with admin routes for flag management
- **Third-party integrations** with LaunchDarkly, Statsig, Optimizely, and Hypertune
- **Change detection** with Edge Config digest for cache invalidation patterns

<div class="badge-row">
  <span class="badge">Vercel</span>
  <span class="badge">Edge</span>
  <span class="badge">Feature Flags</span>
</div>

## Installation

```bash
cp -r skills/vercel-edge-config ~/.claude/skills/vercel-edge-config
```

## Allowed Tools

- `Read` - Read existing Edge Config usage and middleware configurations
- `Write` - Create feature flag logic, middleware, and admin API routes
- `Edit` - Modify existing Edge Config patterns and flag definitions
- `Bash` - Run Vercel CLI, npm, and npx commands
- `Glob` - Search for middleware and configuration files
- `Grep` - Find Edge Config references and feature flag patterns
