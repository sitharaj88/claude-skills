---
name: generate-changelog
description: Generates a changelog from git history, grouping changes by type (features, fixes, breaking changes) and linking to PRs and issues. Follows Keep a Changelog format. Use when the user asks to generate a changelog, release notes, or summarize changes between versions.
argument-hint: "[version-range or 'since-last-tag']"
disable-model-invocation: true
context: fork
allowed-tools: Bash(git *), Bash(gh *), Read
user-invocable: true
---

## Latest tag

!`git describe --tags --abbrev=0 2>/dev/null || echo "no-tags"`

## Recent commits

!`git log --oneline --no-decorate $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~50")..HEAD 2>/dev/null || git log --oneline -50`

## Instructions

You are a release notes expert. Generate a clean, well-organized changelog from the git history above.

### Step 1: Determine the range

- If `$ARGUMENTS` specifies a range (e.g., `v1.2.0..v1.3.0`), use it
- If `$ARGUMENTS` is `since-last-tag` or empty, use latest tag to HEAD
- If no tags exist, use the last 50 commits

Fetch the full commit details for the range:
```
git log <range> --format="%H %s" --no-decorate
```

### Step 2: Parse and categorize commits

For each commit, categorize by prefix:

| Prefix | Category |
|--------|----------|
| `feat` | Added |
| `fix` | Fixed |
| `refactor`, `perf` | Changed |
| `deprecate` | Deprecated |
| `remove` | Removed |
| `security` | Security |
| `docs` | Documentation |
| `test`, `ci`, `build`, `chore` | Internal (omit from public changelog unless significant) |

For commits without conventional prefixes, infer the category from the message content.

**Breaking changes**: Look for `BREAKING CHANGE` in commit bodies or `!` after the type (e.g., `feat!:`). These get their own top-level section.

### Step 3: Extract PR and issue references

- Parse `(#123)` patterns from commit messages
- For commits that reference PRs, fetch the PR title for a better description: `gh pr view <number> --json title --jq .title`
- Collect issue references (`Closes #45`, `Fixes #67`) for linking

### Step 4: Write human-readable descriptions

For each entry:
- Rewrite the commit message into a clear, user-facing description
- Remove commit prefixes and scopes — those are for categorization only
- Start with a verb: "Add", "Fix", "Update", "Remove", "Improve"
- Include the PR link if available: `([#123](../../pull/123))`

### Step 5: Format the changelog

Use Keep a Changelog format:

```markdown
## [version] - YYYY-MM-DD

### Breaking Changes
- Description of breaking change ([#PR](../../pull/PR))

### Added
- New feature description ([#PR](../../pull/PR))

### Fixed
- Bug fix description ([#PR](../../pull/PR))

### Changed
- Change description ([#PR](../../pull/PR))

### Deprecated
- Deprecated feature ([#PR](../../pull/PR))

### Removed
- Removed feature ([#PR](../../pull/PR))

### Security
- Security fix ([#PR](../../pull/PR))
```

### Step 6: Output

- If `CHANGELOG.md` exists in the project, show the new section to prepend
- If no `CHANGELOG.md` exists, generate the full file with header:
  ```
  # Changelog

  All notable changes to this project will be documented in this file.

  The format is based on [Keep a Changelog](https://keepachangelog.com/).
  ```
- Present the output to the user — don't write to file without confirmation

### Guidelines

- Omit empty categories (don't include a "### Removed" section with no entries)
- Group related changes if multiple commits address the same feature
- Merge/squash commits should be deduplicated (don't list both the squash and individual commits)
- Internal changes (CI, tests, chore) should only appear if they affect users
- If the version is unknown, use `[Unreleased]` as the version header
