# Debug Issue

Systematically diagnoses bugs using hypothesis-driven debugging with structured investigation. Instead of random print-statement debugging, this skill follows a disciplined process: reproduce, hypothesize, investigate, and diagnose.

## Quick Start

```bash
/debug-issue "TypeError: Cannot read property 'id' of undefined at UserService.ts:45"
```

Or pass a GitHub issue number:

```bash
/debug-issue 203
```

## What It Does

1. **Parses the error or symptom** — extracts file names, line numbers, error types, and relevant identifiers from the provided description
2. **Searches the codebase** — locates error messages, function definitions, stack trace references, and related code paths
3. **Forms ranked hypotheses** — generates 2-3 candidate root causes, each with supporting evidence and counter-evidence
4. **Investigates the top hypothesis** — reads source files, checks `git blame` for recent changes, and traces data flow through the affected code
5. **Presents the root cause diagnosis** — delivers a clear explanation with file:line evidence pointing to the exact source of the bug
6. **Recommends a fix and prevention strategy** — suggests a concrete code change and a way to prevent similar issues in the future

## Arguments

| Parameter | Required | Description |
|-----------|----------|-------------|
| `$ARGUMENTS` | Yes | An error message, bug description, stack trace excerpt, or a GitHub issue number. The more detail you provide, the faster the diagnosis. |

::: tip
Paste the full error message or stack trace for best results. The skill extracts file paths, line numbers, and function names to jump straight to the relevant code.
:::

## Example

A user reports that the dashboard crashes intermittently:

```bash
/debug-issue "TypeError: Cannot read property 'id' of undefined at UserService.ts:45"
```

The skill investigates and produces:

```markdown
## Diagnosis

**Root Cause**: The `getUserById` method at `src/services/UserService.ts:45`
assumes the database query always returns a result. When a user is deleted
but their session token remains valid, the query returns `null`, and the
subsequent `.id` access throws.

**Evidence**:
- `src/services/UserService.ts:45` — no null check after `db.users.findOne()`
- `src/middleware/auth.ts:23` — session tokens are not invalidated on user deletion
- `git blame` shows the null check was removed in commit `a3f8b2c` (Mar 12)
  during a refactor

## Hypotheses Investigated

| # | Hypothesis | Verdict |
|---|-----------|---------|
| 1 | Null return from DB query after user deletion | **Confirmed** |
| 2 | Race condition between concurrent requests | Ruled out — single query path |
| 3 | Stale cache serving deleted user data | Ruled out — no caching layer on this path |

## Recommended Fix

Add a null check after the database query and invalidate sessions on user deletion:

**File**: `src/services/UserService.ts:44-48`
```ts
const user = await db.users.findOne({ id: userId });
if (!user) {
  throw new NotFoundError(`User ${userId} not found`);
}
return user;
```

**Prevention**: Add a `ON DELETE CASCADE` trigger or a session cleanup job
that runs on user deletion to prevent orphaned sessions.
```

## How It Works

```
┌─────────────────────────────────────────┐
│  1. Parse error / symptom               │
│     Extract files, lines, identifiers   │
├─────────────────────────────────────────┤
│  2. Search codebase                     │
│     Error messages, function names,     │
│     stack trace references              │
├─────────────────────────────────────────┤
│  3. Form hypotheses (2-3)               │
│     Rank by likelihood with evidence    │
├─────────────────────────────────────────┤
│  4. Investigate top hypothesis          │
│     Read files · git blame ·            │
│     Trace data flow                     │
├─────────────────────────────────────────┤
│  5. Present root cause diagnosis        │
│     File:line evidence + explanation    │
├─────────────────────────────────────────┤
│  6. Recommend fix + prevention          │
│     Concrete code change + strategy     │
└─────────────────────────────────────────┘
```

### Built-in Debugging Strategies

The skill includes a reference library of common bug patterns it checks against:

| Pattern | What It Looks For |
|---------|-------------------|
| **Race conditions** | Shared mutable state, missing locks, unguarded concurrent access |
| **State management bugs** | Stale closures, incorrect reducer logic, missing state resets |
| **Async pitfalls** | Unhandled promise rejections, missing `await`, callback ordering |
| **Configuration issues** | Environment variable mismatches, missing defaults, wrong file paths |
| **Type coercion** | Implicit conversions, loose equality comparisons, `NaN` propagation |
| **Dependency problems** | Version conflicts, missing peer dependencies, circular imports |

## Output Format

The diagnosis follows a structured format:

| Section | Content |
|---------|---------|
| **Diagnosis** | Root cause explanation with file:line evidence |
| **Hypotheses Investigated** | Table of hypotheses with verdicts (Confirmed / Ruled out) |
| **Recommended Fix** | Concrete code change with file path and line range |
| **Prevention** | Strategy to avoid similar bugs in the future |

## Configuration

| Setting | Value |
|---------|-------|
| Context mode | `fork` (runs in a separate conversation to avoid polluting your session) |
| Allowed tools | `Read`, `Grep`, `Glob`, `Bash(git log *)`, `Bash(git blame *)`, `Bash(git diff *)` |
| References | `references/strategies.md` — built-in debugging pattern library |

::: warning
This skill operates in read-only mode. It will diagnose the issue and recommend a fix, but it will not modify any files. Apply the suggested changes yourself after reviewing the diagnosis.
:::
