# Create PR

Creates well-structured pull requests with descriptive titles, detailed summaries, linked issues, and test plans. Turns your branch of commits into a polished PR that reviewers can understand at a glance.

## Quick Start

```bash
/create-pr
```

Or specify a base branch and additional context:

```bash
/create-pr develop
```

## What It Does

1. **Reads branch info** — gathers the current branch name, commit history, and diff stats via dynamic context injection
2. **Determines the base branch** — uses the branch from your arguments, or auto-detects `main` or `master`
3. **Analyzes all commits** — categorizes each commit (features, fixes, refactors, docs, tests, etc.) and identifies the scope of changes
4. **Generates the PR title and body** — crafts a title under 70 characters and a structured body with summary, detailed changes, and a test plan
5. **Presents the draft for review** — shows you the proposed PR before any action is taken
6. **Pushes and creates the PR** — pushes the branch to the remote and runs `gh pr create` with the finalized content
7. **Returns the PR URL** — gives you a direct link to the newly created pull request

## Arguments

| Parameter | Required | Description |
|-----------|----------|-------------|
| `$ARGUMENTS` | No | Optional base branch name (e.g., `develop`, `release/v2`) and/or free-text context to include in the PR description. |

::: tip
If your branch name follows a convention like `feat/AUTH-123-add-sso` or `fix/issue-456`, the skill will extract the issue reference and link it in the PR body automatically.
:::

## Example

You are on a feature branch with 4 commits that add a new notification system:

```bash
/create-pr
```

The skill analyzes your commits and diff, then proposes:

```markdown
Title: Add in-app notification system with preferences

Body:
## Summary
Introduces a real-time in-app notification system that supports
email and push channels with per-user preference controls.

## Changes
- **feat**: Add `NotificationService` with channel routing logic
- **feat**: Add user notification preferences API endpoints
- **feat**: Add notification bell component with unread badge
- **fix**: Correct WebSocket reconnection logic on token refresh
- **test**: Add unit and integration tests for notification delivery

## Test Plan
- [ ] Verify notifications appear in real-time via WebSocket
- [ ] Confirm preference changes are persisted and respected
- [ ] Test fallback behavior when WebSocket connection drops
- [ ] Validate notification badge count accuracy

Closes #234
```

After you approve, the skill pushes the branch and creates the PR:

```
Pull request created: https://github.com/org/repo/pull/312
```

## How It Works

```
┌─────────────────────────────────────┐
│  1. Gather branch context           │
│     Branch name, commits, diff      │
├─────────────────────────────────────┤
│  2. Determine base branch           │
│     From args or auto-detect        │
│     main / master                   │
├─────────────────────────────────────┤
│  3. Analyze commits                 │
│     Categorize by type and scope    │
├─────────────────────────────────────┤
│  4. Generate title + body           │
│     Title ≤70 chars                 │
│     Summary · Changes · Test Plan   │
├─────────────────────────────────────┤
│  5. Present draft for approval      │
│     User reviews before creation    │
├─────────────────────────────────────┤
│  6. Push branch + create PR         │
│     git push -u + gh pr create      │
├─────────────────────────────────────┤
│  7. Return PR URL                   │
└─────────────────────────────────────┘
```

### PR Body Structure

The generated PR body follows a consistent structure:

| Section | Content |
|---------|---------|
| **Summary** | 1-3 sentence overview of the change and its motivation |
| **Changes** | Bullet list of commits grouped by type (feat, fix, refactor, etc.) |
| **Test Plan** | Checklist of manual and automated verification steps |
| **Linked Issues** | Auto-detected issue references (e.g., `Closes #123`) |

## Configuration

| Setting | Value |
|---------|-------|
| Context mode | `inline` (runs in your current conversation) |
| Allowed tools | `Bash(git *)`, `Bash(gh *)`, `Read`, `Grep` |

::: warning
This skill requires the [GitHub CLI (`gh`)](https://cli.github.com/) to be installed and authenticated. It also needs push access to the remote repository. Run `gh auth status` and verify your remote with `git remote -v` before using this skill.
:::

::: tip
The skill always shows you the full PR draft before pushing or creating anything. You can request edits to the title, body, or test plan before confirming.
:::
