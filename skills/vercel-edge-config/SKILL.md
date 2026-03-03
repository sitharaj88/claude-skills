---
name: vercel-edge-config
description: Generate Vercel Edge Config for ultra-low latency feature flags, A/B testing, configuration management, and maintenance mode. Use when the user wants to read configuration at the edge with near-zero latency.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(vercel *), Bash(npm *), Bash(npx *)
user-invocable: true
---

## Instructions

You are a Vercel Edge Config expert. Generate production-ready edge configuration patterns for feature flags, A/B tests, and runtime configuration.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: feature flags, configuration, A/B testing, maintenance mode, IP blocking, redirect maps
- **Read location**: Edge Middleware, Serverless Functions, Edge Functions, client-side
- **Update frequency**: how often configuration changes (real-time dashboard, API, CI/CD)
- **Flag complexity**: boolean, multivariate, percentage-based, user-targeted

### Step 2: Set up Edge Config

**Create Edge Config via Vercel Dashboard:**
```bash
# Vercel Dashboard > Storage > Edge Config > Create
# Environment variables auto-populated:
# EDGE_CONFIG - connection string for reading

# Pull env vars to local
vercel env pull .env.local
```

**Install the SDK:**
```bash
npm install @vercel/edge-config
```

**Basic usage:**
```typescript
import { get, getAll, has } from '@vercel/edge-config';

// Read a single value (< 1ms at the edge)
const value = await get('featureFlags');

// Read multiple values at once
const config = await getAll(['featureFlags', 'maintenanceMode', 'redirects']);

// Check existence without reading the value
const exists = await has('featureFlags');
```

**Custom Edge Config client (multiple stores):**
```typescript
import { createClient } from '@vercel/edge-config';

const edgeConfig = createClient(process.env.EDGE_CONFIG!);
const secondaryConfig = createClient(process.env.SECONDARY_EDGE_CONFIG!);

const value = await edgeConfig.get('key');
const otherValue = await secondaryConfig.get('key');
```

### Step 3: Feature flags

**Simple boolean feature flags:**
```typescript
import { get } from '@vercel/edge-config';

interface FeatureFlags {
  newDashboard: boolean;
  darkMode: boolean;
  betaFeatures: boolean;
  maintenanceMode: boolean;
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const flags = await get<FeatureFlags>('featureFlags');

  // Return defaults if Edge Config is unavailable
  return flags ?? {
    newDashboard: false,
    darkMode: false,
    betaFeatures: false,
    maintenanceMode: false,
  };
}
```

**Edge Config data structure for feature flags:**
```json
{
  "featureFlags": {
    "newDashboard": true,
    "darkMode": true,
    "betaFeatures": false,
    "maintenanceMode": false
  }
}
```

**Feature flags in middleware:**
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

**Feature flags in components (Server Component):**
```typescript
// app/dashboard/page.tsx
import { get } from '@vercel/edge-config';

export default async function DashboardPage() {
  const flags = await get<Record<string, boolean>>('featureFlags');

  return (
    <div>
      <h1>Dashboard</h1>
      {flags?.newDashboard && <NewDashboardWidget />}
      {flags?.betaFeatures && <BetaSection />}
    </div>
  );
}
```

### Step 4: Advanced feature flags with @vercel/flags

**Install Vercel Flags SDK:**
```bash
npm install @vercel/flags
```

**Define feature flags with targeting:**
```typescript
// flags.ts
import { flag } from '@vercel/flags/next';

export const showNewCheckout = flag<boolean>({
  key: 'new-checkout',
  decide: async () => {
    // Simple boolean from Edge Config
    const flags = await get<Record<string, boolean>>('featureFlags');
    return flags?.newCheckout ?? false;
  },
});

export const pricingTier = flag<'free' | 'pro' | 'enterprise'>({
  key: 'pricing-tier',
  decide: async ({ headers, cookies }) => {
    // Multivariate flag based on user context
    const userId = cookies.get('user-id')?.value;

    if (!userId) return 'free';

    const userTiers = await get<Record<string, string>>('userTiers');
    return (userTiers?.[userId] as 'free' | 'pro' | 'enterprise') ?? 'free';
  },
});
```

**Percentage-based rollout:**
```typescript
import { flag } from '@vercel/flags/next';
import { get } from '@vercel/edge-config';

export const newFeatureRollout = flag<boolean>({
  key: 'new-feature-rollout',
  decide: async ({ cookies }) => {
    const config = await get<{ percentage: number }>('newFeatureRollout');
    if (!config) return false;

    // Consistent hashing based on user ID
    const userId = cookies.get('user-id')?.value || 'anonymous';
    const hash = simpleHash(userId);
    return (hash % 100) < config.percentage;
  },
});

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

**Edge Config data for percentage rollout:**
```json
{
  "newFeatureRollout": {
    "percentage": 25,
    "excludedUsers": ["user-123"],
    "includedUsers": ["user-admin", "user-beta"]
  }
}
```

### Step 5: A/B testing

**A/B test with Edge Config and cookies:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

interface ABTest {
  enabled: boolean;
  variants: string[];
  weights: number[]; // Must sum to 100
}

export const config = {
  matcher: ['/pricing'],
};

export async function middleware(request: NextRequest) {
  const test = await get<ABTest>('ab-test-pricing');

  if (!test?.enabled) {
    return NextResponse.next();
  }

  // Check if user already has a variant assigned
  const existingVariant = request.cookies.get('ab-pricing')?.value;
  if (existingVariant && test.variants.includes(existingVariant)) {
    return NextResponse.rewrite(
      new URL(`/pricing/${existingVariant}`, request.url)
    );
  }

  // Assign a variant based on weights
  const variant = assignVariant(test.variants, test.weights);

  const response = NextResponse.rewrite(
    new URL(`/pricing/${variant}`, request.url)
  );

  response.cookies.set('ab-pricing', variant, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}

function assignVariant(variants: string[], weights: number[]): string {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (let i = 0; i < variants.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return variants[i];
    }
  }

  return variants[variants.length - 1];
}
```

**Edge Config data for A/B test:**
```json
{
  "ab-test-pricing": {
    "enabled": true,
    "variants": ["control", "variant-a", "variant-b"],
    "weights": [50, 25, 25]
  }
}
```

**Track A/B test results (analytics event):**
```typescript
// components/ABTestTracker.tsx
'use client';

import { useEffect } from 'react';

export function ABTestTracker({
  testName,
  variant,
}: {
  testName: string;
  variant: string;
}) {
  useEffect(() => {
    // Send to your analytics service
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        event: 'ab_test_view',
        properties: { testName, variant },
      }),
    });
  }, [testName, variant]);

  return null;
}
```

### Step 6: Maintenance mode

**Maintenance mode with custom page:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  allowedIPs: string[];
  allowedPaths: string[];
  estimatedEndTime?: string;
}

export async function middleware(request: NextRequest) {
  const maintenance = await get<MaintenanceConfig>('maintenance');

  if (!maintenance?.enabled) {
    return NextResponse.next();
  }

  // Allow certain paths (health checks, API webhooks)
  const path = request.nextUrl.pathname;
  if (maintenance.allowedPaths.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow certain IPs (admin access)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (ip && maintenance.allowedIPs.includes(ip)) {
    return NextResponse.next();
  }

  // Show maintenance page
  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|maintenance).*)'],
};
```

**Edge Config data for maintenance:**
```json
{
  "maintenance": {
    "enabled": false,
    "message": "We're performing scheduled maintenance. We'll be back shortly.",
    "allowedIPs": ["203.0.113.50", "198.51.100.25"],
    "allowedPaths": ["/api/health", "/api/webhooks"],
    "estimatedEndTime": "2025-01-15T18:00:00Z"
  }
}
```

**Maintenance page:**
```typescript
// app/maintenance/page.tsx
import { get } from '@vercel/edge-config';

export default async function MaintenancePage() {
  const config = await get<{ message: string; estimatedEndTime?: string }>('maintenance');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-3xl font-bold mb-4">Under Maintenance</h1>
        <p className="text-gray-600 mb-4">
          {config?.message || 'We are currently performing maintenance.'}
        </p>
        {config?.estimatedEndTime && (
          <p className="text-sm text-gray-500">
            Estimated return: {new Date(config.estimatedEndTime).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
```

### Step 7: IP blocking and security

**IP blocklist at the edge:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function middleware(request: NextRequest) {
  const blockedIPs = await get<string[]>('blockedIPs');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  if (ip && blockedIPs?.includes(ip)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}
```

**Country blocking:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function middleware(request: NextRequest) {
  const blockedCountries = await get<string[]>('blockedCountries');
  const country = request.geo?.country;

  if (country && blockedCountries?.includes(country)) {
    return NextResponse.rewrite(new URL('/geo-blocked', request.url));
  }

  return NextResponse.next();
}
```

**Edge Config data:**
```json
{
  "blockedIPs": ["192.0.2.1", "198.51.100.50", "203.0.113.100"],
  "blockedCountries": ["XX", "YY"]
}
```

### Step 8: Redirect maps

**Dynamic redirects from Edge Config:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

interface RedirectMap {
  [path: string]: {
    destination: string;
    permanent: boolean;
  };
}

export async function middleware(request: NextRequest) {
  const redirects = await get<RedirectMap>('redirects');
  const path = request.nextUrl.pathname;

  if (redirects && redirects[path]) {
    const { destination, permanent } = redirects[path];
    return NextResponse.redirect(
      new URL(destination, request.url),
      permanent ? 308 : 307
    );
  }

  return NextResponse.next();
}
```

**Edge Config data for redirects:**
```json
{
  "redirects": {
    "/old-blog": { "destination": "/blog", "permanent": true },
    "/old-pricing": { "destination": "/pricing", "permanent": true },
    "/docs/v1": { "destination": "/docs/v2", "permanent": false },
    "/careers": { "destination": "https://jobs.example.com", "permanent": false }
  }
}
```

### Step 9: Update Edge Config

**Update via Vercel API:**
```typescript
// Update Edge Config programmatically
async function updateEdgeConfig(
  items: Array<{ operation: 'create' | 'update' | 'delete'; key: string; value?: unknown }>
) {
  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update Edge Config: ${response.statusText}`);
  }

  return response.json();
}

// Usage examples
await updateEdgeConfig([
  { operation: 'update', key: 'featureFlags', value: { newDashboard: true, darkMode: true } },
]);

await updateEdgeConfig([
  { operation: 'update', key: 'maintenance', value: { enabled: true, message: 'Upgrading database...' } },
]);

await updateEdgeConfig([
  { operation: 'delete', key: 'deprecated-config' },
]);
```

**Admin API route for updating flags:**
```typescript
// app/api/admin/flags/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  // Authenticate admin
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key, value } = await request.json();

  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'update', key, value }],
      }),
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to update Edge Config' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
```

### Step 10: Integration with third-party flag providers

**LaunchDarkly integration:**
```typescript
import { get } from '@vercel/edge-config';

// LaunchDarkly can sync flags to Edge Config via Vercel integration
// Install: Vercel Dashboard > Integrations > LaunchDarkly

// Flags are automatically synced and available via Edge Config
const flags = await get('launchdarkly-flags');
```

**Statsig integration:**
```typescript
// Statsig syncs experiment configs to Edge Config
// Install: Vercel Dashboard > Integrations > Statsig

const experiments = await get('statsig-experiments');
```

**Supported integrations:**
| Provider | Sync Type | Configuration |
|----------|-----------|---------------|
| LaunchDarkly | Automatic | Vercel Integration |
| Statsig | Automatic | Vercel Integration |
| Optimizely | Automatic | Vercel Integration |
| Hypertune | Automatic | Vercel Integration |
| Custom | Manual | Vercel API |

### Step 11: Edge Config digest (change detection)

**Check if config has changed without reading all data:**
```typescript
import { get, has } from '@vercel/edge-config';
import { createClient } from '@vercel/edge-config';

const edgeConfig = createClient(process.env.EDGE_CONFIG!);

// Get digest (hash of current config state)
const digest = await edgeConfig.digest();
// Returns a string like "abc123def456"

// Compare with previously known digest to detect changes
// Useful for cache invalidation patterns
```

### Edge Config limits and pricing

| Feature | Limit |
|---------|-------|
| Max size per Edge Config | 512 KB |
| Max items | 1,000 |
| Read speed | < 1ms at the edge |
| Reads per second | 1,000 (soft limit) |
| Updates per second | 10 (soft limit) |
| Edge Configs per account | 1 (Hobby) / 10+ (Pro/Enterprise) |

### Best practices:
- Use Edge Config for data that is read frequently and updated infrequently
- Keep total config size small (under 512 KB); use only for flags and small configuration
- Read Edge Config in middleware for zero-latency decisions (< 1ms)
- Provide sensible defaults when Edge Config is unavailable (resilience)
- Use the digest endpoint to detect config changes without reading all data
- Structure flags as nested objects for logical grouping
- Use @vercel/flags for type-safe feature flag definitions
- Test flag combinations locally before deploying to production

### Anti-patterns to avoid:
- Do not use Edge Config as a database (512 KB limit, not designed for large datasets)
- Avoid storing user-specific data (use a database or Vercel KV instead)
- Do not update Edge Config on every request (rate limited, designed for infrequent writes)
- Avoid storing secrets in Edge Config (it is readable by edge code, not encrypted at rest for this purpose)
- Do not rely on Edge Config for critical authentication (have a fallback)
- Avoid deeply nested data structures (increases read latency and complexity)
- Do not use Edge Config for data that changes per-request (use KV or a database)

### Cost optimization:
- Edge Config reads are included in your Vercel plan (no per-read cost)
- Minimize Edge Config updates (writes to the Vercel API are rate-limited)
- Use a single Edge Config store to hold multiple configuration objects
- Batch configuration updates into a single API call
- Cache Edge Config reads in middleware using the digest for change detection
- Use Edge Config only for hot-path configuration; store infrequently accessed config in environment variables
- Reduce Edge Config size by removing unused flags and configs regularly
- Use environment variables for values that never change at runtime (cheaper, simpler)
