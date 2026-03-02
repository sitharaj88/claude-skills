---
name: create-pr
description: Creates well-structured pull requests with descriptive titles, detailed summaries, linked issues, and test plans by analyzing branch commits and changes. Use when the user wants to open a pull request, submit changes for review, or create a PR from the current branch.
argument-hint: "[base-branch] [additional context]"
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(gh *), Read, Grep
user-invocable: true
---

## Current branch info

!`git branch --show-current`

## Commits on this branch

!`git log --oneline main..HEAD 2>/dev/null || git log --oneline master..HEAD 2>/dev/null || git log --oneline -20`

## Diff stats

!`git diff main...HEAD --stat 2>/dev/null || git diff master...HEAD --stat 2>/dev/null || git diff --stat HEAD~5`

## Instructions

You are creating a high-quality pull request. Analyze the commits and changes above to generate a PR that reviewers will appreciate.

### Step 1: Determine the base branch

- If `$ARGUMENTS` specifies a base branch (first argument), use that
- Otherwise, detect from `main` or `master` — whichever exists
- Verify the current branch is not the base branch

### Step 2: Analyze all changes

- Read the full diff: `git diff <base>...HEAD`
- Categorize commits: features, fixes, refactors, tests, docs, chores
- Identify the primary purpose of this branch
- Extract issue/ticket references from branch name or commit messages (e.g., `feat/123-login`, `Closes #45`)

### Step 3: Generate PR title

- Under 70 characters
- Format: `type: concise description` (e.g., `feat: add user authentication flow`)
- Match the project's PR title convention if one is visible from `gh pr list --limit 5`

### Step 4: Generate PR body

Use this structure:

```markdown
## Summary
- [Primary change — what and why]
- [Secondary change, if any]
- [Third change, if any]

## Changes
- **[category]**: description of what changed
- **[category]**: description of what changed

## Test plan
- [ ] [How to verify the primary change works]
- [ ] [How to verify edge cases]
- [ ] [How to verify nothing broke]

[Closes #issue-number if applicable]
```

### Step 5: Present for review

Show the user:
1. The PR title
2. The full PR body
3. Base branch → head branch
4. Ask for confirmation before creating

### Step 6: Push and create

On approval:
1. Push the branch: `git push -u origin HEAD`
2. Create the PR: `gh pr create --title "..." --body "..."`
3. Return the PR URL to the user

### Guidelines

- Read actual file changes (not just commit messages) to write accurate summaries
- The summary should explain **why** the changes were made, not just restate the diff
- Test plan items should be specific and actionable, not generic ("test that it works")
- If the user provided additional context via `$ARGUMENTS`, incorporate it
- If there are no commits ahead of base, inform the user — don't create an empty PR
