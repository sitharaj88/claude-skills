# Performance Audit

Identifies N+1 queries, memory leaks, bundle bloat, rendering issues, and missing caching opportunities across your codebase. This skill performs a comprehensive static analysis of backend, frontend, and database performance, producing a prioritized report with specific file:line references and fix suggestions.

## Quick Start

```bash
# Full performance audit across all areas
/performance-audit

# Focus on database performance only
/performance-audit database

# Audit frontend bundle and rendering
/performance-audit frontend
```

## Arguments

| Argument | Required | Description | Default |
|----------|----------|-------------|---------|
| `$ARGUMENTS` | No | Focus area for the audit | `all` |

Supported scopes:

- **`all`** -- Comprehensive audit across every focus area (default)
- **`backend`** -- API response times, middleware overhead, async patterns, connection pooling
- **`frontend`** -- Bundle size, tree-shaking, lazy loading, rendering performance, image optimization
- **`database`** -- N+1 queries, missing indexes, unoptimized queries, connection management
- **`bundle`** -- JavaScript/CSS bundle analysis, code splitting, dead code, dependency weight
- **`memory`** -- Memory leak patterns, unbounded caches, event listener cleanup, stream handling

::: tip
Start with `/performance-audit` for a full sweep, then use a focused scope to investigate specific problem areas in depth. The full audit identifies the highest-impact issues across all categories.
:::

## How It Works

1. **Scope** -- Determines which performance categories to analyze based on the provided scope argument.
2. **Detect stack** -- Identifies your language, framework, ORM, bundler, and rendering library to apply stack-specific analysis rules.
3. **Backend analysis** -- Examines API routes for synchronous bottlenecks, missing caching, inefficient middleware chains, and suboptimal async patterns.
4. **Database analysis** -- Scans ORM usage for N+1 query patterns, missing eager loading, absent indexes on queried columns, and unoptimized raw queries.
5. **Frontend analysis** -- Analyzes bundle configuration for code splitting, tree-shaking effectiveness, large dependency imports, and rendering performance anti-patterns.
6. **Memory analysis** -- Identifies patterns that cause memory leaks including unclosed streams, growing event listener registrations, unbounded caches, and circular references.
7. **Report** -- Produces a prioritized report with estimated performance impact, file:line references, and concrete fix suggestions.

## Audit Scope Details

| Focus Area | What Is Analyzed | Common Findings |
|------------|-----------------|-----------------|
| **Backend** | Route handlers, middleware, async patterns, caching | Synchronous file I/O in request path, missing response caching, sequential awaits that should be parallel |
| **Database** | ORM queries, raw SQL, indexes, connection pools | N+1 queries in loops, missing `include`/`joinedload`, full table scans, exhausted connection pools |
| **Frontend** | Bundle config, component rendering, asset loading | Importing entire lodash instead of per-function, missing `React.memo` on expensive components, unoptimized images |
| **Bundle** | Webpack/Vite/esbuild config, dependency tree | No code splitting on routes, barrel file re-exports pulling in unused code, duplicate dependencies |
| **Memory** | Event listeners, caches, streams, closures | `setInterval` without cleanup, growing Map used as cache without eviction, unclosed database connections |

## Common Findings Table

| Finding | Impact | Difficulty to Fix |
|---------|--------|-------------------|
| **N+1 queries** | High -- multiplies database round trips | Low -- add eager loading |
| **Missing index** | High -- full table scans on large tables | Low -- add database index |
| **Bundle importing full library** | Medium -- inflates download size | Low -- switch to named imports |
| **Synchronous file I/O** | High -- blocks event loop / request thread | Medium -- switch to async API |
| **Missing response caching** | Medium -- repeated expensive computations | Medium -- add cache layer |
| **Unoptimized images** | Medium -- slow page loads | Low -- add compression/resizing |
| **Memory leak in event listeners** | High -- gradual memory growth, eventual crash | Medium -- add cleanup in teardown |
| **Sequential awaits** | Medium -- unnecessary latency | Low -- use `Promise.all` |
| **Missing code splitting** | Medium -- large initial bundle | Medium -- add dynamic imports |
| **Unbounded in-memory cache** | High -- memory growth over time | Low -- add TTL or LRU eviction |

::: warning
This audit performs static analysis only. It identifies patterns that are likely to cause performance issues but cannot measure actual runtime performance. Findings such as "N+1 query" are based on code patterns and may not apply if the data set is small. Complement this audit with runtime profiling and load testing.
:::

## Example

Running `/performance-audit database` on a Django project produces:

```markdown
## Performance Audit Report -- Database Focus

### Critical Impact (2)
1. **N+1 Query** -- `src/views/orders.py:34`
   Accessing `order.customer.name` inside a loop over 100+ orders.
   Each iteration triggers a separate SELECT query.
   Fix: Add `select_related('customer')` to the queryset.

2. **Missing Index** -- `src/models/order.py:18`
   `Order.status` is used in WHERE clauses and ORDER BY but has no index.
   Fix: Add `db_index=True` to the `status` field, then run `makemigrations`.

### High Impact (2)
1. **Unbounded QuerySet** -- `src/views/products.py:12`
   `Product.objects.all()` without pagination on a table with 50K+ rows.
   Fix: Add `.paginate()` or limit with `[:100]`.

2. **Missing Connection Pooling** -- `src/settings.py:45`
   Default database connection settings without `CONN_MAX_AGE` or pgBouncer.
   Fix: Set `CONN_MAX_AGE = 600` or configure connection pooling.

### Summary
- Estimated improvement: 60-80% reduction in database queries for order views
- 4 findings across 4 files
```

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `fork` -- runs in an isolated context so the audit does not affect your working conversation |
| **Agent** | `Explore` -- uses a read-only exploration agent for safe, non-destructive analysis |

This skill does not modify any files in your project. All findings are returned as a report within the conversation. The forked context ensures that extensive file scanning does not consume your main conversation's context window.
