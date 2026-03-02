# Generate Changelog

Generates changelogs from git history in Keep a Changelog format with PR and issue links. This skill parses your commit messages, enriches them with pull request metadata, and groups changes into standardized categories for clear release communication.

## Quick Start

Auto-detect the range since the last tag:

```bash
/generate-changelog
```

Generate a changelog for a specific version range:

```bash
/generate-changelog v1.2.0..v1.3.0
```

Generate a changelog since the last tag:

```bash
/generate-changelog since-last-tag
```

## Arguments

| Argument | Description | Default |
|---|---|---|
| `$ARGUMENTS` | Version range, `since-last-tag`, or empty | Auto-detect from latest tag to HEAD |

Range formats:

- **`v1.2.0..v1.3.0`** -- Explicit tag-to-tag range
- **`since-last-tag`** -- From the most recent tag to the current HEAD
- **Empty** -- Automatically determines the range by finding the latest tag and comparing to HEAD

## How It Works

1. **Determine range** -- Identifies the commit range to process, either from the provided argument or by auto-detecting the latest git tag
2. **Parse commits by type** -- Analyzes commit messages using conventional commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, etc.)
3. **Enrich with PR titles** -- Cross-references commit SHAs with merged pull requests to attach PR numbers, titles, and links
4. **Group into categories** -- Sorts changes into Keep a Changelog sections:
   - **Added** -- New features
   - **Fixed** -- Bug fixes
   - **Changed** -- Modifications to existing functionality
   - **Deprecated** -- Features marked for future removal
   - **Removed** -- Features that have been removed
   - **Security** -- Vulnerability fixes and security improvements
5. **Format as Keep a Changelog** -- Renders the grouped entries following the [Keep a Changelog](https://keepachangelog.com) specification
6. **Output** -- Displays the changelog in the conversation or writes to a file

### Dynamic Context

This skill automatically injects contextual information before execution:

- **Latest git tag** -- Retrieved via `git describe --tags --abbrev=0`
- **Recent commits** -- The last 50 commits from `git log --oneline` are provided as context

This dynamic context ensures accurate range detection without requiring manual input.

## Output Format

```markdown
# Changelog

## [1.3.0] - 2026-03-02

### Added
- User profile avatar upload ([#142](https://github.com/org/repo/pull/142))
- Dark mode support for dashboard ([#138](https://github.com/org/repo/pull/138))

### Fixed
- Pagination reset on filter change ([#145](https://github.com/org/repo/pull/145))
- Memory leak in WebSocket handler ([#140](https://github.com/org/repo/pull/140))

### Changed
- Upgraded authentication flow to OAuth 2.1 ([#139](https://github.com/org/repo/pull/139))

### Security
- Patched XSS vulnerability in comment rendering ([#144](https://github.com/org/repo/pull/144))
```

::: tip
Use conventional commit messages (`feat:`, `fix:`, `chore:`, etc.) consistently across your team to get the most accurate and well-categorized changelog output.
:::

::: warning
PR enrichment relies on git history containing merge commit references or GitHub metadata. Squash-merged PRs without references in the commit message may not be linked automatically.
:::

## Configuration

| Setting | Value |
|---|---|
| **Context mode** | `fork` -- runs in an isolated context so changelog generation does not affect your working conversation |

This skill uses dynamic context injection to automatically provide the latest tag and recent commit history. No special agent is required since it operates primarily on git metadata.
