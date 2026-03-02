---
name: performance-audit
description: Analyzes application code for performance bottlenecks including slow queries, memory leaks, bundle size issues, rendering problems, and algorithmic inefficiencies. Produces a prioritized report with optimization recommendations. Use when the user asks to optimize performance, find bottlenecks, reduce load times, fix memory leaks, or improve speed.
argument-hint: "[scope: backend|frontend|database|bundle|memory|all]"
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, Bash
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a performance engineer. Analyze the codebase for performance bottlenecks and provide actionable optimization recommendations.

### Step 1: Scope the audit

- `$ARGUMENTS` specifies the focus (optional):
  - `backend` — Server-side performance (API response times, async handling, caching)
  - `frontend` — Client-side performance (rendering, bundle size, Core Web Vitals)
  - `database` — Query optimization, N+1 problems, indexing, connection management
  - `bundle` — JavaScript/CSS bundle size analysis and optimization
  - `memory` — Memory leak detection and optimization
  - `all` — Full performance audit (default)

### Step 2: Detect the stack

Identify performance-relevant details:
- Framework and its performance features (SSR, ISR, streaming, caching)
- Database and ORM (query builder, eager/lazy loading, connection pooling)
- Build tool (webpack, vite, esbuild — bundling and tree-shaking config)
- Caching layer (Redis, in-memory, CDN)
- Image handling (optimization, lazy loading, responsive images)

### Step 3: Backend performance analysis

**API response time patterns:**
- Search for synchronous blocking operations in async handlers
- Identify sequential API/DB calls that could be parallelized (`Promise.all`, `asyncio.gather`)
- Look for missing pagination on list endpoints (unbounded queries)
- Check for computation in request hot paths that could be cached or offloaded

**Caching opportunities:**
- Identify frequently-read, rarely-changed data without caching
- Check for missing HTTP cache headers on static/semi-static responses
- Look for repeated identical computations or queries within request lifecycle
- Verify cache invalidation patterns (stale data risks)

**Async and concurrency:**
- Missing `await` causing fire-and-forget behavior
- Blocking the event loop (Node.js: CPU-intensive in main thread)
- Thread pool exhaustion (Go: goroutine leaks, Java: thread pool sizing)
- Missing timeouts on external service calls

**Connection management:**
- Database connection pool configuration (too small → queuing, too large → resource exhaustion)
- HTTP client connection reuse (keep-alive, connection pooling)
- Missing connection timeouts and retry policies

### Step 4: Database performance analysis

**N+1 query detection:**
- Search for database queries inside loops
- Look for ORM lazy-loading in list rendering contexts
- Identify endpoints that fetch related data without joins/includes
```
// N+1 pattern (bad):
const users = await db.user.findMany();
for (const user of users) {
  user.posts = await db.post.findMany({ where: { userId: user.id } });
}

// Fixed:
const users = await db.user.findMany({ include: { posts: true } });
```

**Missing indexes:**
- Find `WHERE` clauses on columns likely without indexes
- Check for sorting (`ORDER BY`) on unindexed columns
- Look for `JOIN` conditions on non-indexed foreign keys
- Find `LIKE '%term%'` patterns (can't use B-tree indexes)

**Query complexity:**
- Identify `SELECT *` where only specific columns are needed
- Look for missing `LIMIT` on queries that could return large result sets
- Check for expensive subqueries that could be JOINs
- Find repeated identical queries in the same request

### Step 5: Frontend performance analysis

**Rendering performance:**
- Unnecessary re-renders: missing `React.memo`, missing `useMemo`/`useCallback` on expensive computations
- Large list rendering without virtualization (`react-window`, `react-virtualized`)
- Heavy computation in render path (should be in `useMemo` or web worker)
- Missing `key` prop on lists or non-stable keys (index as key)

**Loading performance:**
- Missing code splitting (large single-chunk bundles)
- Missing lazy loading for below-fold content and images
- Render-blocking resources (CSS/JS in `<head>` without async/defer)
- Missing preloading/prefetching for critical resources
- Unoptimized images (no srcset, no WebP/AVIF, no size constraints)

**Bundle size:**
- Large dependencies that could be replaced (moment.js → date-fns, lodash → lodash-es or native)
- Missing tree-shaking (barrel imports pulling entire libraries)
- Duplicate dependencies in the bundle
- Dev-only code shipped to production (console.log, debug utilities)

### Step 6: Memory analysis

**Memory leak patterns:**
- Event listeners not cleaned up (missing `removeEventListener`, missing `useEffect` cleanup)
- Subscriptions not unsubscribed (observables, WebSocket connections, intervals)
- Growing caches without eviction policy (unbounded `Map` or object accumulation)
- Closures retaining references to large objects
- DOM detached nodes (elements removed from DOM but still referenced in JS)
- Global state accumulation (Redux store growing without cleanup)

**Server-side memory:**
- Response body buffering (streaming instead of loading entire response in memory)
- Large file processing without streaming (reading entire file vs stream processing)
- Session storage growing without expiration
- In-memory caches without size limits or TTL

### Step 7: Generate report

```markdown
# Performance Audit Report

## Summary
| Category | Findings | Estimated Impact |
|----------|----------|-----------------|
| Backend | [N] issues | High/Medium/Low |
| Database | [N] issues | High/Medium/Low |
| Frontend | [N] issues | High/Medium/Low |
| Bundle | [N] issues | High/Medium/Low |
| Memory | [N] issues | High/Medium/Low |

## Critical Performance Issues

### [PERF-001] N+1 query in /api/users endpoint
- **Category**: Database
- **Location**: [src/routes/users.ts:23](src/routes/users.ts#L23)
- **Impact**: ~[N] additional queries per request, estimated [X]ms added latency
- **Current**: [code snippet showing the problem]
- **Recommended**: [code snippet showing the fix]
- **Expected improvement**: Reduce from [N] queries to 1, ~[X]% faster

### [PERF-002] ...

## Optimization Recommendations (prioritized by impact)
1. **[Highest impact fix]** — Estimated improvement: [X]%
2. **[Second highest]** — Estimated improvement: [X]%
3. **[Third highest]** — Estimated improvement: [X]%

## Quick Wins (low effort, immediate improvement)
- [Simple change with good payoff]

## Architecture Recommendations (longer term)
- [Larger changes that would significantly improve performance]
```

### Guidelines

- Quantify impact where possible — "~100ms per request" is better than "slow"
- Provide before/after code for every recommendation
- Prioritize by impact × frequency — a 10ms savings on an endpoint called 10K/min matters more than a 1s savings on an endpoint called once/hour
- Don't optimize prematurely — only flag patterns that are actually problematic, not theoretical concerns
- Consider the scale — suggestions should match the project's actual traffic and data volumes
- Distinguish between must-fix (N+1 queries, memory leaks) and nice-to-have (micro-optimizations)
