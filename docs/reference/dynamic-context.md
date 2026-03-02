# Dynamic Context Injection

Reference for injecting live data into skills using shell commands.

## Syntax

Use `` !`command` `` in your SKILL.md to run a shell command and inject its output:

```markdown
## Current git status
!`git status --short`

## Package dependencies
!`jq '.dependencies' package.json`
```

## How It Works

1. Before the skill content is sent to Claude, each `` !`command` `` is executed
2. The command's stdout replaces the placeholder
3. Claude sees the output as static text — it doesn't know a command was run

```
SKILL.md (template)          →  Processed content (sent to Claude)
─────────────────────────       ──────────────────────────────────
## Staged changes               ## Staged changes
!`git diff --staged`            diff --git a/src/app.ts b/src/app.ts
                                +import { auth } from './auth'
                                +app.use('/api', auth, router)
```

## Common Patterns

### Git context

```markdown
## Staged diff
!`git diff --staged`

## Recent commits
!`git log --oneline -15`

## Current branch
!`git branch --show-current`

## Changes since last tag
!`git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~20")..HEAD`
```

### GitHub context

```markdown
## PR details
!`gh pr view $ARGUMENTS --json title,body,labels`

## PR diff
!`gh pr diff $ARGUMENTS`

## Issue details
!`gh issue view $ARGUMENTS --json title,body,comments`
```

### Project context

```markdown
## Package info
!`cat package.json | jq '{name, version, dependencies}'`

## Directory structure
!`find src -type f -name "*.ts" | head -30`

## Environment variables
!`cat .env.example 2>/dev/null || echo "No .env.example found"`
```

## Error Handling

If a command fails, the error output is included in the context. Use fallbacks:

```markdown
## Latest tag
!`git describe --tags --abbrev=0 2>/dev/null || echo "no-tags"`
```

The `2>/dev/null || echo "fallback"` pattern suppresses errors and provides a default.

## Combining with Arguments

Arguments are substituted **before** command execution:

```markdown
## PR diff
!`gh pr diff $ARGUMENTS`
```

With `/review-pr 42`, this becomes:
```
gh pr diff 42
```

## Performance Considerations

- Commands run **before** Claude sees the content — they add startup latency
- Keep commands fast (under 2 seconds)
- Avoid commands that produce very large output — it consumes context window
- Use `| head -N` to limit output for potentially large results
- Use `jq` to extract only the fields you need from JSON

## Security Notes

::: warning
Dynamic context injection executes shell commands with the user's permissions. Never include user-provided input directly in commands without validation. The `$ARGUMENTS` variable is safe because it comes from the user's own input.
:::

## Limitations

- Commands run in the project's working directory
- No interactive commands (no `stdin` input)
- Output is text-only (no binary data)
- Commands timeout after a few seconds
- Large outputs may be truncated
