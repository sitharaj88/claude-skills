# Arguments & Variables

Reference for passing and using arguments in Claude Code skills.

## Argument Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$ARGUMENTS` | All arguments as a single string | `"users CRUD"` |
| `$ARGUMENTS[0]` or `$0` | First argument | `"users"` |
| `$ARGUMENTS[1]` or `$1` | Second argument | `"CRUD"` |
| `$ARGUMENTS[2]` or `$2` | Third argument | — |

## How Arguments Are Passed

When a user invokes a skill:

```
/generate-endpoint users CRUD
```

The arguments are split by spaces:
- `$ARGUMENTS` = `"users CRUD"`
- `$0` = `"users"`
- `$1` = `"CRUD"`

## Using Arguments in SKILL.md

### Full arguments string

```markdown
Fix the issue described by: $ARGUMENTS
```

### Positional arguments

```markdown
Generate a `$1` endpoint for the `$0` resource.
```

With `/generate-endpoint users POST`:
> Generate a `POST` endpoint for the `users` resource.

### Optional arguments with defaults

Handle missing arguments gracefully in your instructions:

```markdown
### Step 1: Determine scope
If `$ARGUMENTS` specifies a focus area, use it. Otherwise, analyze everything.

Available focus areas: architecture, security, dependencies, quality, all (default).
```

## Argument Hint

The `argument-hint` frontmatter field shows users what arguments are expected:

```yaml
argument-hint: "[resource-name] [method: GET|POST|PUT|DELETE|CRUD]"
```

This appears in the autocomplete dropdown when the user types `/generate-endpoint`.

**Conventions:**
- Use `[brackets]` for argument names
- Show types or valid values with `:`
- Indicate optional args: `[optional-arg]`

## System Variables

| Variable | Description |
|----------|-------------|
| `${CLAUDE_SESSION_ID}` | Current Claude Code session ID |

## Examples by Skill Type

### Single argument (most common)

```yaml
argument-hint: "[file-path]"
---
Generate tests for `$ARGUMENTS`.
```

### Multiple positional arguments

```yaml
argument-hint: "[platform] [project-name]"
---
Scaffold a `$0` project named `$1`.
```

### Optional context

```yaml
argument-hint: "[optional context about the change]"
---
Generate a commit message for the staged changes.
If additional context was provided: $ARGUMENTS — incorporate it.
```

### Mixed required and optional

```yaml
argument-hint: "[resource] [method: GET|POST|PUT|DELETE|CRUD]"
---
- `$0` = Resource name (required)
- `$1` = HTTP method (optional, defaults to CRUD)
```
