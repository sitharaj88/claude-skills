# What are Claude Skills?

Claude Skills are **custom slash commands** for [Claude Code](https://claude.ai/code) — Anthropic's CLI tool for AI-assisted development. They extend Claude Code with specialized workflows, making complex multi-step tasks as simple as typing `/skill-name`.

## The Problem

Without skills, you'd repeatedly explain the same workflows to Claude:

> "Review this PR, check for security issues, look at performance, categorize findings by severity, format the output like this..."

> "Generate a commit message matching our conventional commits format, analyze the staged diff, detect the project's commit style..."

## The Solution

Skills capture these workflows as reusable, shareable commands:

```
/review-pr 42         → Full PR review with severity-rated findings
/smart-commit         → Conventional commit matching your project style
/security-audit       → OWASP Top 10 audit with remediation code
```

## How Skills Work

Each skill is a **directory** containing a `SKILL.md` file with two parts:

### 1. YAML Frontmatter — Metadata

```yaml
---
name: review-pr
description: Reviews a pull request for correctness, security, performance...
argument-hint: "[PR-number]"
context: fork
allowed-tools: Bash(gh *), Read, Grep, Glob
---
```

This tells Claude Code:
- **When** to suggest this skill (from the description)
- **What arguments** it accepts
- **Which tools** it can use (minimum privilege)
- **How to run** it (inline or in a forked context)

### 2. Markdown Body — Instructions

The body contains the actual workflow instructions that Claude follows — analysis steps, output format, decision trees, and quality checks.

## Key Capabilities

### Auto-Detection

Skills don't need configuration. They detect your project's stack by analyzing:
- Package files (`package.json`, `go.mod`, `pubspec.yaml`, etc.)
- Existing code patterns (component structure, test conventions, etc.)
- Configuration files (ESLint, TypeScript, testing frameworks)

### Convention Matching

Skills study your existing code to match your patterns exactly:
- If you use arrow functions, the generated code uses arrow functions
- If your tests use `describe`/`it` blocks, generated tests use `describe`/`it`
- If you follow conventional commits, generated messages follow conventional commits

### Dynamic Context

Skills can inject live data using shell commands:

```markdown
## Staged changes
!`git diff --staged`

## Recent commits
!`git log --oneline -10`
```

This data is loaded *before* the skill runs, giving Claude full context.

### Arguments

Skills accept arguments for flexibility:

```
/generate-endpoint users CRUD     → Full REST resource for users
/scaffold-mobile flutter my-app   → Flutter project named my-app
/migrate-code src/ javascript typescript → JS to TS migration
```

## Skill Scopes

| Scope | Location | Available in |
|-------|----------|-------------|
| Personal | `~/.claude/skills/` | All your projects |
| Project | `.claude/skills/` | This project only |

## Next Steps

- [Install the skills](/guide/installation) in under a minute
- [Browse all 28 skills](/skills/workflow/) to see what's available
- [Create your own skills](/guide/authoring) with the authoring guide
