# Review PR

Reviews pull requests for correctness, security, performance, and maintainability with severity-categorized feedback. Acts as a thorough, consistent code reviewer that catches issues humans often miss during manual review.

## Quick Start

```bash
/review-pr 42
```

Or pass a full pull request URL:

```bash
/review-pr https://github.com/org/repo/pull/42
```

## What It Does

1. **Fetches PR metadata** — pulls the title, description, changed files, diff, and existing comments using the `gh` CLI
2. **Runs the review checklist** — evaluates the changes against five dimensions: correctness, security, performance, maintainability, and testing
3. **Reads full files for context** — for large or complex diffs, reads the complete source files to understand surrounding logic
4. **Categorizes findings by severity** — assigns each issue a severity level: Critical, Warning, Suggestion, or Nitpick
5. **Produces a structured review** — outputs a markdown review with file:line references ready to post or share

## Arguments

| Parameter | Required | Description |
|-----------|----------|-------------|
| `$ARGUMENTS` | Yes | A PR number (e.g., `42`) or a full PR URL (e.g., `https://github.com/org/repo/pull/42`). |

::: tip
When you pass just a number, the skill uses the current repository context to resolve it. Use a full URL when reviewing PRs in other repositories.
:::

## Example

Review a pull request that adds a new caching layer:

```bash
/review-pr 187
```

The skill fetches the PR, analyzes the diff across all changed files, and produces:

```markdown
## Summary
Adds a Redis-backed caching layer for the `/api/products` endpoint.
7 files changed, 340 additions, 12 deletions.

## Critical Issues
- **Race condition in cache invalidation** (`src/cache/manager.ts:89`)
  The `delete` and `set` operations are not atomic. Under concurrent
  writes, stale data can persist after invalidation.

## Warnings
- **No TTL on cache entries** (`src/cache/manager.ts:45`)
  Entries are cached indefinitely. Memory will grow unbounded
  unless eviction is configured.
- **Sensitive data in cache keys** (`src/api/products.ts:112`)
  User IDs are embedded in plain text cache keys. Consider hashing.

## Suggestions
- Extract cache configuration into environment variables
  (`src/cache/config.ts:8-15`)
- Add cache hit/miss metrics for observability

## Nitpicks
- Inconsistent naming: `cacheManager` vs `CacheService` across files

## What Looks Good
- Clean separation between cache logic and business logic
- Comprehensive error handling with fallback to direct DB queries
- Good use of TypeScript generics for type-safe cache access
```

## How It Works

```
┌──────────────────────────────────────┐
│  1. Fetch PR data via gh CLI         │
│     Metadata, diff, files, comments  │
├──────────────────────────────────────┤
│  2. Review checklist evaluation      │
│     Correctness · Security ·         │
│     Performance · Maintainability ·  │
│     Testing                          │
├──────────────────────────────────────┤
│  3. Deep-read large files            │
│     Full file context for complex    │
│     diffs via Explore agent          │
├──────────────────────────────────────┤
│  4. Categorize findings              │
│     Critical → Warning →             │
│     Suggestion → Nitpick             │
├──────────────────────────────────────┤
│  5. Generate structured review       │
│     Markdown with file:line refs     │
└──────────────────────────────────────┘
```

### Review Dimensions

| Dimension | What It Checks |
|-----------|----------------|
| **Correctness** | Logic errors, off-by-one bugs, null/undefined handling, incorrect API usage |
| **Security** | Injection vulnerabilities, auth gaps, secret exposure, unsafe deserialization |
| **Performance** | N+1 queries, unnecessary re-renders, missing indexes, memory leaks |
| **Maintainability** | Code duplication, unclear naming, missing abstractions, tight coupling |
| **Testing** | Missing test coverage, untested edge cases, fragile assertions |

### Severity Levels

| Severity | Meaning | Action Required |
|----------|---------|-----------------|
| **Critical** | Bugs, security vulnerabilities, or data loss risks | Must fix before merge |
| **Warning** | Potential issues that could cause problems under certain conditions | Should fix before merge |
| **Suggestion** | Improvements to code quality, readability, or architecture | Consider for this or a follow-up PR |
| **Nitpick** | Style preferences, minor naming issues, formatting | Optional — author's discretion |

## Output Format

The review follows a consistent markdown structure:

| Section | Content |
|---------|---------|
| **Summary** | Brief overview of the PR's purpose and scope (files changed, additions/deletions) |
| **Critical Issues** | Must-fix items with file:line references and explanation |
| **Warnings** | Should-fix items with file:line references and explanation |
| **Suggestions** | Nice-to-have improvements |
| **Nitpicks** | Minor style or convention notes |
| **What Looks Good** | Positive observations about well-written code |

## Configuration

| Setting | Value |
|---------|-------|
| Context mode | `fork` (runs in a separate conversation context) |
| Agent | `Explore` (for reading full files during review) |
| Allowed tools | `Bash(gh *)`, `Read`, `Grep`, `Glob` |

::: warning
This skill requires the [GitHub CLI (`gh`)](https://cli.github.com/) to be installed and authenticated. Run `gh auth status` to verify your setup before using this skill.
:::
