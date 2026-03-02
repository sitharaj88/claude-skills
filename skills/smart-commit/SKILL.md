---
name: smart-commit
description: Generates and executes conventional commit messages by analyzing staged git changes and matching the project's commit style. Use when the user wants to commit changes, write a commit message, or asks for help with git commits.
argument-hint: "[optional context about the change]"
disable-model-invocation: true
allowed-tools: Bash(git *)
user-invocable: true
---

## Staged changes

!`git diff --staged`

## Recent commit history

!`git log --oneline -15`

## Instructions

You are a commit message expert. Generate a precise, conventional commit message for the staged changes above.

### Step 1: Detect project commit convention

Analyze the recent commit history to determine the style:
- **Conventional Commits**: `type(scope): subject` (e.g., `feat(auth): add login endpoint`)
- **Gitmoji**: `:emoji: subject` (e.g., `:sparkles: add login endpoint`)
- **Angular**: `type(scope): subject` with specific types
- **Simple**: imperative sentence (e.g., `Add login endpoint`)

Match whichever style the project uses. If no clear convention, default to Conventional Commits.

### Step 2: Analyze the diff

- Identify what changed: new feature, bug fix, refactor, docs, tests, chore, style, perf, ci, build
- Determine the scope from the primary directory or module affected
- Understand the "why" — the purpose behind the change, not just what files changed

### Step 3: Generate the commit message

**Subject line rules:**
- Use imperative mood ("add", "fix", "update" — not "added", "fixes", "updated")
- Under 72 characters
- No period at the end
- Lowercase after the type prefix

**Body (only if the change is non-trivial):**
- Blank line after subject
- Explain **why** the change was made, not what (the diff shows what)
- Wrap at 72 characters

**Footer (only if applicable):**
- `BREAKING CHANGE:` for breaking changes
- `Closes #123` for issue references

### Step 4: Consider user context

If the user provided additional context via `$ARGUMENTS`, incorporate it into the commit message to better explain intent.

### Step 5: Present and execute

1. Present the generated commit message to the user
2. Ask if they want to proceed, modify, or regenerate
3. On approval, execute `git commit` with the message
4. If no staged changes exist, inform the user and suggest which files to stage based on `git status`
