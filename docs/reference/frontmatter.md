# Frontmatter Fields

Complete reference for all YAML frontmatter fields in SKILL.md.

## Required Fields

### `description`

What the skill does and when to use it. Claude uses this for skill discovery.

```yaml
description: Reviews a pull request for correctness, security, performance,
  and maintainability. Use when the user asks to review a PR or give feedback
  on pull request changes.
```

**Rules:**
- Max 1024 characters
- Write in third person ("Reviews..." not "I review...")
- Include both **what** it does and **when** to use it
- Include key terms users would naturally say
- Be specific, not vague

## Optional Fields

### `name`

The skill's display name and slash command. If omitted, the directory name is used.

```yaml
name: review-pr
```

**Rules:**
- Lowercase letters, numbers, and hyphens only
- Max 64 characters
- Cannot contain "anthropic" or "claude"

### `argument-hint`

Hint shown in the autocomplete menu when the user types `/skill-name`.

```yaml
argument-hint: "[PR-number-or-URL]"
```

Use square brackets for argument names. Show required and optional args.

### `disable-model-invocation`

When `true`, Claude cannot auto-invoke this skill — it only runs when the user explicitly types the slash command.

```yaml
disable-model-invocation: true
```

**Default:** `false` (Claude can auto-invoke based on the description)

::: tip When to Set This
Set to `true` for skills with side effects (creating files, making commits, pushing code). This prevents Claude from accidentally running destructive operations.
:::

### `user-invocable`

When `false`, the skill doesn't appear in the `/` autocomplete menu. Only Claude can invoke it programmatically.

```yaml
user-invocable: false
```

**Default:** `true`

### `allowed-tools`

Tools Claude can use without asking permission when this skill is active.

```yaml
allowed-tools: Read, Grep, Glob, Bash(git *), Write, Edit
```

**Available tools:** `Read`, `Grep`, `Glob`, `Bash`, `Write`, `Edit`, `WebFetch`, `WebSearch`

**Bash prefix restriction:**
```yaml
allowed-tools: Bash(git *), Bash(gh *)
```
This restricts Bash to commands starting with `git` or `gh`.

### `context`

Execution context mode. Set to `fork` to run the skill in an isolated subagent.

```yaml
context: fork
```

| Value | Behavior |
|-------|----------|
| (default) | Runs inline, sees conversation history |
| `fork` | Runs in isolated subagent, fresh context window |

**Use `fork`** for: heavy analysis, large file reads, self-contained tasks that produce a deliverable.

### `agent`

Which subagent type to use when `context: fork` is set.

```yaml
agent: Explore
```

| Agent | Best For |
|-------|----------|
| `Explore` | Read-only analysis, codebase exploration |
| `Plan` | Implementation planning |
| `general-purpose` | Full-capability tasks |

### `model`

Override the model used when this skill runs.

```yaml
model: claude-sonnet-4-20250514
```

Useful for cost optimization — use a smaller model for simple tasks.

### `hooks`

Lifecycle hooks scoped to this skill.

```yaml
hooks:
  pre-invoke: "./scripts/validate-args.sh"
  post-invoke: "./scripts/cleanup.sh"
```

## Complete Example

```yaml
---
name: review-pr
description: Reviews a pull request for correctness, security, performance,
  and maintainability. Fetches PR diff and comments, categorizes findings
  by severity. Use when the user asks to review a PR, check PR quality,
  or give feedback on pull request changes.
argument-hint: "[PR-number-or-URL]"
context: fork
agent: Explore
allowed-tools: Bash(gh *), Read, Grep, Glob
disable-model-invocation: true
user-invocable: true
---
```
