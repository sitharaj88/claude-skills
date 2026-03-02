# Smart Commit

Generates conventional commit messages by analyzing your staged git changes and matching your project's existing commit style. No more agonizing over commit wording — just stage your changes and let the skill craft a precise, convention-compliant message.

## Quick Start

```bash
/smart-commit
```

Or provide optional context about what the change addresses:

```bash
/smart-commit fixing the auth timeout issue
```

## What It Does

1. **Reads your staged diff** — captures exactly what you are about to commit via `git diff --staged`
2. **Studies recent history** — pulls the last 15 commit messages with `git log --oneline -15` to learn your project's style
3. **Detects the commit convention** — identifies whether your project uses Conventional Commits, Gitmoji, Angular, or a simple format
4. **Analyzes the diff** — determines the change type (`feat`, `fix`, `refactor`, `docs`, etc.) and infers the scope from affected files
5. **Generates the message** — produces a subject line (imperative mood, under 72 characters) and an optional body with details
6. **Asks for confirmation** — presents the proposed message and waits for your approval before running `git commit`

## Arguments

| Parameter | Required | Description |
|-----------|----------|-------------|
| `$ARGUMENTS` | No | Optional free-text context about the change. Helps the skill understand *why* the change was made, not just *what* changed. |

::: tip
Providing context is especially useful when the diff alone does not convey intent. For example, a one-line config change might be a bug fix, a feature toggle, or a rollback — the context disambiguates.
:::

## Example

Suppose you have staged changes that add retry logic to an HTTP client:

```bash
# Stage your changes
git add src/http/client.ts src/http/retry.ts

# Generate and apply the commit
/smart-commit added retry with exponential backoff for transient failures
```

The skill analyzes the diff, detects your project uses Conventional Commits, and proposes:

```
feat(http): add retry with exponential backoff for transient failures

Introduce a configurable retry mechanism for transient HTTP errors
(5xx, timeouts). Uses exponential backoff with jitter, defaulting
to 3 attempts with a 1-second base delay.
```

You review the message, confirm, and the commit is created.

## How It Works

```
┌─────────────────────────────────┐
│  1. Read staged diff            │
│     git diff --staged           │
├─────────────────────────────────┤
│  2. Read recent commit history  │
│     git log --oneline -15       │
├─────────────────────────────────┤
│  3. Detect commit convention    │
│     Conventional / Gitmoji /    │
│     Angular / Simple            │
├─────────────────────────────────┤
│  4. Analyze changes             │
│     Type + Scope + Description  │
├─────────────────────────────────┤
│  5. Generate commit message     │
│     Subject (≤72 chars) + Body  │
├─────────────────────────────────┤
│  6. Confirm and commit          │
│     git commit -m "..."         │
└─────────────────────────────────┘
```

### Convention Detection

The skill inspects your recent commit messages and classifies the convention:

| Convention | Pattern Example | Detection Signal |
|------------|----------------|------------------|
| Conventional Commits | `feat(auth): add SSO support` | `type(scope): description` |
| Gitmoji | `:sparkles: add SSO support` | Leading emoji or emoji shortcode |
| Angular | `feat(auth): add SSO support` | Angular-style types with scope |
| Simple | `Add SSO support` | No structured prefix detected |

## Configuration

| Setting | Value |
|---------|-------|
| Context mode | `inline` (no fork — runs in your current conversation) |
| Allowed tools | `Bash(git *)` |

::: warning
This skill only has access to git commands. It cannot read or modify files directly. Make sure your changes are fully staged before invoking the skill — unstaged changes will not be included in the analysis.
:::
