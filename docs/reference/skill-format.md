# Skill File Format

Complete reference for the Claude Code skill file format.

## Directory Structure

```
skill-name/
├── SKILL.md              # Required — entry point
├── references/           # Optional — detailed reference material
│   ├── patterns.md
│   └── examples.md
├── templates/            # Optional — output templates
│   └── report.md
└── scripts/              # Optional — executable scripts
    └── validate.sh
```

### SKILL.md

The only required file. Contains YAML frontmatter and markdown instructions.

### Supporting Files

Additional markdown files that Claude reads on demand. Keep references **one level deep** from SKILL.md — avoid chains of file-to-file references.

### Scripts

Shell scripts that Claude can execute as part of the skill workflow. Must be referenced from SKILL.md.

## File Format

```markdown
---
# YAML frontmatter (metadata)
name: skill-name
description: What it does and when to use it.
---

# Markdown body (instructions)

## Instructions
...
```

### Frontmatter

YAML between `---` markers. See [Frontmatter Reference](/reference/frontmatter) for all fields.

### Body

Standard markdown processed by Claude as instructions. Supports:
- Headings, lists, tables, code blocks
- Dynamic context injection (`` !`command` ``)
- Argument substitution (`$ARGUMENTS`, `$0`, `$1`)
- References to supporting files (`[file.md](references/file.md)`)

## Naming Conventions

- **Characters**: lowercase letters, numbers, hyphens only
- **Max length**: 64 characters
- **Reserved words**: cannot contain "anthropic" or "claude"
- **No XML tags** in the name

**Recommended styles:**
- Action-oriented: `review-pr`, `generate-component`, `debug-issue`
- Gerund form: `testing-code`, `analyzing-codebase`

**Avoid:**
- Vague names: `helper`, `utils`, `tools`
- Overly generic: `code`, `files`, `data`

## Storage Locations

| Scope | Path | Priority |
|-------|------|----------|
| Personal | `~/.claude/skills/<name>/SKILL.md` | Lower |
| Project | `.claude/skills/<name>/SKILL.md` | Higher |

Project-scoped skills override personal ones with the same name.

## Context Budget

Skill descriptions are loaded into context at startup. The budget is **2% of the context window** (fallback: 16,000 characters). If you have many skills, keep descriptions concise to avoid exceeding the budget.

Run `/context` in Claude Code to check for warnings about excluded skills.
