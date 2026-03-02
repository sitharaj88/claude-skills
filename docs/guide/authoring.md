# Authoring Guide

Learn how to create your own Claude Code skills from scratch.

## Skill Structure

Every skill is a directory with a `SKILL.md` file:

```
my-skill/
├── SKILL.md              # Required — main instructions
├── references/           # Optional — detailed reference material
│   └── patterns.md
└── templates/            # Optional — output templates
    └── report.md
```

## SKILL.md Format

A skill file has two parts: **YAML frontmatter** and **markdown body**.

```markdown
---
name: my-skill
description: Does X when the user asks for Y.
argument-hint: "[required-arg] [optional-arg]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
user-invocable: true
---

## Instructions

You are an expert at X. Do Y for `$ARGUMENTS`.

### Step 1: Analyze
...

### Step 2: Generate
...
```

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Skill name and slash command. Lowercase, hyphens only. Max 64 chars. Defaults to directory name. |
| `description` | Yes | What the skill does and when to use it. Claude uses this for discovery. Max 1024 chars. |
| `argument-hint` | No | Hint shown in autocomplete, e.g., `[file-path]` |
| `disable-model-invocation` | No | Set `true` to prevent auto-invocation. Default: `false` |
| `user-invocable` | No | Set `false` to hide from `/` menu. Default: `true` |
| `allowed-tools` | No | Tools Claude can use without asking permission |
| `context` | No | Set to `fork` for isolated execution |
| `agent` | No | Subagent type when `context: fork` (`Explore`, `Plan`, etc.) |
| `model` | No | Model override for this skill |

See the [Frontmatter Reference](/reference/frontmatter) for full details.

## Writing the Description

The description is the most important field — it determines when Claude suggests your skill.

::: tip Good Description
```yaml
description: Reviews a pull request for correctness, security, performance,
  and maintainability. Fetches PR diff and comments, categorizes findings by
  severity. Use when the user asks to review a PR, check PR quality, or give
  feedback on pull request changes.
```
:::

::: warning Bad Description
```yaml
description: Helps with PRs
```
:::

**Rules:**
- Write in **third person** ("Reviews..." not "I can review...")
- Include both **what** it does and **when** to use it
- Include key terms users would naturally say
- Max 1024 characters

## Writing Instructions

The markdown body is your prompt to Claude. Keep these principles in mind:

### Be Concise

Only add context Claude doesn't already know. If Claude knows how to write Python, don't explain Python.

```markdown
<!-- Good: 50 tokens -->
## Extract PDF text
Use pdfplumber for text extraction.

<!-- Bad: 150 tokens -->
## Extract PDF text
PDFs are a common document format. There are many Python libraries
for working with PDFs. We'll use pdfplumber because it handles
both text and tables well...
```

### Use Progressive Disclosure

Keep `SKILL.md` under **500 lines**. Move reference material to supporting files:

```markdown
## For detailed patterns, see [patterns.md](references/patterns.md)
```

Claude loads `SKILL.md` first, then reads supporting files only when needed.

### Set Degrees of Freedom

Match specificity to how fragile the task is:

| Freedom | When | How |
|---------|------|-----|
| High | Multiple valid approaches | Give general direction |
| Medium | Preferred pattern with variation | Provide pseudocode |
| Low | Must be exact | Provide exact scripts |

### Add Feedback Loops

For complex tasks, build in validation:

```markdown
### Step 5: Run and iterate
1. Run the generated tests
2. If tests fail, diagnose whether it's a test bug or a real bug
3. Fix test bugs and re-run
4. Repeat until all tests pass
```

## Arguments

Skills accept arguments via `$ARGUMENTS`:

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments as a single string |
| `$0`, `$1`, `$2` | Positional arguments (0-indexed) |

```markdown
Generate tests for `$ARGUMENTS`.
```

Invoking `/test-writer src/utils/parser.ts` replaces `$ARGUMENTS` with `src/utils/parser.ts`.

See the [Arguments Reference](/reference/arguments) for full details.

## Dynamic Context Injection

Inject live data before the skill runs using `` !`command` ``:

```markdown
## Current git status
!`git status --short`

## Package dependencies
!`cat package.json | jq '.dependencies'`
```

The shell command runs immediately and its output replaces the placeholder.

See the [Dynamic Context Reference](/reference/dynamic-context) for full details.

## Choosing Context Mode

| Mode | When to Use | Effect |
|------|------------|--------|
| Inline (default) | Interactive tasks, quick actions | Runs in main conversation, sees chat history |
| `context: fork` | Heavy analysis, large file reads | Runs in isolated subagent, fresh context |

**Use `context: fork`** for: code reviews, codebase analysis, documentation generation, feature implementation.

**Keep inline** for: commits, component generation, refactoring, test writing.

## Tool Permissions

Restrict tools to the minimum needed:

```yaml
# Read-only analysis
allowed-tools: Read, Grep, Glob

# Git operations only
allowed-tools: Bash(git *), Bash(gh *)

# Full access for code generation
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
```

The `Bash(prefix *)` syntax restricts Bash to commands starting with that prefix.

## Testing Your Skill

1. Place the skill in `~/.claude/skills/my-skill/SKILL.md`
2. Open a **fresh** Claude Code session (skills are loaded at startup)
3. Type `/my-skill` with test arguments
4. Verify it behaves as expected
5. Test with different project types if the skill is framework-agnostic
6. Test with different models (Opus, Sonnet) — what works for Opus may need more detail for Haiku

## Checklist

Before shipping a skill:

- [ ] Description is specific and includes both what and when
- [ ] Description is in third person
- [ ] SKILL.md body is under 500 lines
- [ ] Detailed references are in supporting files
- [ ] No time-sensitive information (dates, version numbers that will change)
- [ ] Consistent terminology throughout
- [ ] Examples are concrete, not abstract
- [ ] Tested with a fresh Claude Code session
