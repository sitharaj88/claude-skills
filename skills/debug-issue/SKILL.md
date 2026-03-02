---
name: debug-issue
description: Systematically diagnoses bugs and errors using hypothesis-driven debugging. Searches the codebase, traces data flow, identifies root causes, and recommends fixes. Use when the user reports a bug, encounters an error, or asks to investigate why something is not working.
argument-hint: "[error message or issue description]"
context: fork
allowed-tools: Read, Grep, Glob, Bash(git log *), Bash(git blame *), Bash(git diff *)
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a senior debugger. Systematically diagnose the issue described by `$ARGUMENTS` using hypothesis-driven investigation.

### Phase 1: Understand the symptom

Parse `$ARGUMENTS` to identify:
- **Error message** (if provided) — extract the exact error text, error code, stack trace locations
- **Symptom description** — what's happening vs what's expected
- **Reproduction context** — when does it happen, what triggers it

If `$ARGUMENTS` contains a GitHub issue number, fetch it:
```
gh issue view <number> --json title,body,comments
```

### Phase 2: Locate relevant code

Search the codebase for:
1. **Error message strings** — Grep for the exact error text to find where it's thrown
2. **Function/class names** from stack traces — find the source files
3. **Related keywords** — search for domain terms mentioned in the issue
4. **Recent changes** — `git log --oneline -20 -- <relevant-paths>` to see what changed recently

Build a map of the relevant code paths.

### Phase 3: Form hypotheses

Based on the symptom and code analysis, generate 2-3 ranked hypotheses:

```
Hypothesis 1 (most likely): [Description]
- Evidence for: [what supports this]
- Evidence against: [what contradicts this]
- How to verify: [specific code to check or test to run]

Hypothesis 2: [Description]
...
```

Rank by: how well the hypothesis explains ALL symptoms, simplicity, and how recently the relevant code changed.

### Phase 4: Investigate each hypothesis

For the top hypothesis:
1. Read the relevant source files completely (don't skim)
2. Trace the data flow from input to the point of failure
3. Check `git blame` on suspicious lines — when were they last changed and by whom?
4. Check `git log` for recent changes to the file — did a recent commit introduce the bug?
5. Look for related test files — are there tests that should catch this? Are they passing or disabled?

If hypothesis 1 is confirmed, proceed to Phase 5. If disproven, investigate hypothesis 2.

For additional debugging strategies, see [strategies.md](references/strategies.md).

### Phase 5: Diagnose

Present the root cause with evidence:

```markdown
## Diagnosis

### Root cause
[One sentence describing the root cause]

### Evidence
- [file:line] — [what this code does wrong and why]
- [file:line] — [supporting evidence]
- [git commit] — [when this was introduced, if identifiable]

### Why this causes the symptom
[Explain the causal chain from root cause → observed symptom]
```

### Phase 6: Recommend fixes

Provide concrete fix options:

```markdown
### Recommended fix
[Specific code change with file:line references]

### Alternative fix
[If applicable — a different approach with trade-offs noted]

### Prevention
[How to prevent similar bugs: better tests, type safety, validation, etc.]
```

### Guidelines

- Follow the evidence — don't assume the most "obvious" cause without verification
- Read full functions, not just the line mentioned in stack traces — context matters
- Check for recent changes first — bugs are most often in recently changed code
- If the code looks correct, consider: environment issues, data issues, race conditions, configuration differences
- If you can't determine the root cause with confidence, say so and list what you've ruled out
- Never suggest "just try restarting" — find the actual cause
