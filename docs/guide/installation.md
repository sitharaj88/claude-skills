# Installation

Multiple ways to install skills depending on your needs.

## Quick Install (Recommended)

```bash
git clone https://github.com/sitharaj88/claude-skills.git
cd claude-skills
./install.sh --all
```

This symlinks all 28 skills to `~/.claude/skills/`, making them available in every project.

## Install Methods

### Install all skills

```bash
./install.sh --all
```

### Install specific skill

```bash
./install.sh --skill smart-commit
./install.sh --skill review-pr
./install.sh --skill security-audit
```

### Interactive picker

```bash
./install.sh --pick
```

Shows a numbered list of all skills. Enter numbers (comma-separated) or `all`.

### Project scope

Install to the current project only (`.claude/skills/`):

```bash
./install.sh --scope project --all
./install.sh --scope project --skill smart-commit
```

### Manual symlink

```bash
# Personal scope (all projects)
ln -s /path/to/claude-skills/skills/smart-commit ~/.claude/skills/smart-commit

# Project scope
ln -s /path/to/claude-skills/skills/smart-commit .claude/skills/smart-commit
```

## Scope Priority

When the same skill exists at multiple scopes:

```
Personal (~/.claude/skills/)  ←  Lower priority
Project  (.claude/skills/)    ←  Higher priority
```

Project-scoped skills override personal ones. This lets you customize a skill for a specific project.

## Uninstall

Remove all symlinked skills:

```bash
./install.sh --uninstall
```

This only removes symlinks created by the installer — it won't touch skills you copied manually.

## Updating

Pull the latest changes and the symlinks automatically point to updated skills:

```bash
cd claude-skills
git pull
```

No reinstall needed — symlinks resolve to the latest files.

## Verifying Installation

Check that skills are recognized by Claude Code:

```bash
# List your installed skills
ls ~/.claude/skills/
```

Then in Claude Code, type `/` and you should see the skills in the autocomplete menu.

## Troubleshooting

### Skills don't appear in Claude Code

1. Verify the symlinks exist: `ls -la ~/.claude/skills/`
2. Verify each symlink has a `SKILL.md`: `ls ~/.claude/skills/smart-commit/SKILL.md`
3. Restart Claude Code

### Permission errors during install

```bash
# Ensure the skills directory exists
mkdir -p ~/.claude/skills
```

### Symlink conflicts

If a skill directory already exists and isn't a symlink:

```bash
# Back up and remove the existing one
mv ~/.claude/skills/smart-commit ~/.claude/skills/smart-commit.bak
./install.sh --skill smart-commit
```
