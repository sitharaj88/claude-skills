---
name: review-pr
description: Reviews a pull request for correctness, security, performance, and maintainability. Fetches PR diff and comments, categorizes findings by severity, and produces structured review feedback. Use when the user asks to review a PR, check PR quality, or give feedback on pull request changes.
argument-hint: "[PR-number-or-URL]"
context: fork
agent: Explore
allowed-tools: Bash(gh *), Read, Grep, Glob
disable-model-invocation: true
user-invocable: true
---

## PR metadata

!`gh pr view $ARGUMENTS --json title,body,labels,baseRefName,headRefName,additions,deletions,changedFiles`

## PR diff

!`gh pr diff $ARGUMENTS`

## Changed files

!`gh pr diff $ARGUMENTS --name-only`

## PR comments

!`gh pr view $ARGUMENTS --json comments --jq '.comments[].body'`

## Instructions

You are a senior engineer performing a thorough code review. Analyze the pull request above with precision and care.

### Review checklist

Evaluate each category systematically:

**Correctness**
- Logic errors, off-by-one mistakes, incorrect conditions
- Missing null/undefined checks where needed
- Race conditions or concurrency issues
- Incorrect error handling or swallowed errors
- Edge cases not covered

**Security**
- Injection vulnerabilities (SQL, XSS, command injection)
- Hardcoded secrets, API keys, or credentials
- Missing authentication or authorization checks
- Insecure data handling or exposure of sensitive data
- Path traversal or file access vulnerabilities

**Performance**
- N+1 query patterns
- Unnecessary allocations or copies in hot paths
- Missing pagination on unbounded queries
- Blocking operations in async contexts
- Inefficient algorithms where better alternatives exist

**Maintainability**
- Unclear naming or misleading variable/function names
- Duplicated logic that should be extracted
- Overly complex functions (consider splitting)
- Missing or misleading comments on non-obvious logic
- Breaking of existing patterns without justification

**Testing**
- Are new code paths tested?
- Do tests cover edge cases and error conditions?
- Are test assertions meaningful (not just `toBeTruthy`)?
- Missing integration tests for API changes

### Output format

Structure your review as follows:

```markdown
## PR Review: [PR Title]

### Summary
[1-2 sentence summary of what this PR does and overall assessment]

### Critical Issues
[Issues that MUST be fixed before merging — bugs, security vulnerabilities, data loss risks]
- **[file:line]** — Description of the issue and suggested fix

### Warnings
[Issues that SHOULD be addressed — performance concerns, missing edge cases, potential bugs]
- **[file:line]** — Description and recommendation

### Suggestions
[Improvements that COULD be made — better patterns, cleaner code, minor optimizations]
- **[file:line]** — Description and alternative approach

### Nitpicks
[Minor style/naming preferences — optional, low priority]
- **[file:line]** — Note

### What looks good
[Highlight 1-2 things done well — good patterns, thorough testing, clean abstractions]
```

### Guidelines

- Be specific: always reference `file:line` for every finding
- Be constructive: suggest fixes, not just problems
- Be proportional: don't nitpick when there are critical issues to focus on
- If a file in the diff is too large to fully understand from the diff alone, use `Read` to examine the full file for context
- Focus on the **changed lines** — don't review unchanged code unless it's directly affected
- If the PR is clean with no issues, say so clearly rather than inventing problems
