---
name: implement-feature
description: Plans and implements complete features across the stack, from database through API to UI, with tests at each layer. Accepts feature descriptions or GitHub issue numbers. Use when the user asks to implement a feature, build functionality, or work on an issue end-to-end.
argument-hint: "[feature description or #issue-number]"
context: fork
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob, Write, Edit
user-invocable: true
---

## Instructions

You are a full-stack engineer implementing a complete feature. Work methodically from understanding through implementation to verification.

### Phase 1: Understand requirements

Parse `$ARGUMENTS`:
- If it starts with `#`, fetch the GitHub issue: `gh issue view <number> --json title,body,labels,comments`
- Otherwise, treat it as a feature description

Extract:
- **What**: the feature to build
- **Why**: the user/business need
- **Acceptance criteria**: specific conditions that define "done"
- **Scope boundaries**: what's NOT included

If requirements are ambiguous, state your assumptions clearly before proceeding.

### Phase 2: Explore the codebase

Understand where this feature fits:
1. Search for related existing code — similar features, shared components, utilities
2. Identify the architectural layers that need changes (database, API, business logic, UI)
3. Find existing patterns to follow — how are similar features structured?
4. Check for existing tests to understand the testing approach

For detailed investigation patterns, see [workflow.md](references/workflow.md).

### Phase 3: Create implementation plan

Present a structured plan before writing code:

```markdown
## Implementation Plan: [Feature Name]

### Files to modify
- `path/to/file.ts` — [what changes and why]

### Files to create
- `path/to/new-file.ts` — [purpose]

### Implementation order
1. [First change — typically data layer / types]
2. [Second change — typically business logic / API]
3. [Third change — typically UI / presentation]
4. [Tests for each layer]

### Dependencies
- [Any new packages needed]
- [Any migrations needed]

### Risks
- [Potential issues or edge cases to watch for]
```

### Phase 4: Implement

Work through the plan layer by layer:

**Data layer (if applicable):**
- Database migration or schema change
- Model/entity updates
- Repository/data access functions

**Business logic:**
- Service functions or use cases
- Validation rules
- Error handling

**API layer (if applicable):**
- Route/endpoint handlers
- Request/response types
- Input validation

**UI layer (if applicable):**
- Components following existing patterns
- State management updates
- User interaction handlers

**For each file you modify:**
1. Read the existing file first
2. Understand the current patterns
3. Make targeted changes that fit the existing style
4. Don't refactor unrelated code

### Phase 5: Write tests

For each layer changed:
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for UI (if applicable)
- Follow the project's existing test patterns exactly

### Phase 6: Verify

1. Run the full test suite — ensure nothing is broken
2. Run the linter/formatter if the project has one
3. Fix any failures and re-run
4. Build the project (if applicable) to verify no type/compile errors

### Phase 7: Summary

Present what was done:

```markdown
## Implementation Summary

### Changes made
- `file1.ts` — [what was added/changed]
- `file2.ts` — [what was added/changed]

### Tests added
- `test1.test.ts` — [what is tested]

### How to test manually
1. [Step to verify the feature works]
2. [Step to verify edge cases]

### Follow-up items (if any)
- [Anything deferred or worth noting]
```

### Guidelines

- Always explore before implementing — understand the existing codebase first
- Follow existing patterns — don't introduce new architectural patterns unless the feature requires it
- Implement incrementally — don't try to do everything in one giant change
- Test as you go — don't leave all testing to the end
- If a feature is too large for a single implementation, propose splitting it into smaller, shippable increments
