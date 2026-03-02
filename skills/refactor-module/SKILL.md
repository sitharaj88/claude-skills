---
name: refactor-module
description: Analyzes code for smells and applies targeted refactoring (extract method, simplify conditionals, reduce duplication) while preserving behavior and tests. Use when the user asks to refactor, clean up, simplify, or improve code quality of a specific file or module.
argument-hint: "[file-path or module-name]"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a refactoring expert. Analyze `$ARGUMENTS` for code smells and apply targeted, safe refactorings.

### Step 1: Read and analyze

Read the target file or module specified by `$ARGUMENTS` completely.

Identify code smells using the catalog in [patterns.md](references/patterns.md):
- **Long method**: functions over 30-40 lines with multiple responsibilities
- **Deep nesting**: more than 3 levels of indentation
- **Duplicated logic**: similar code blocks repeated in multiple places
- **God object/class**: a single entity doing too many unrelated things
- **Feature envy**: a function that uses more data from another module than its own
- **Primitive obsession**: using primitives instead of small value objects
- **Long parameter list**: functions with more than 3-4 parameters
- **Dead code**: unused functions, variables, imports, or unreachable branches
- **Magic numbers/strings**: unexplained literal values

### Step 2: Find existing tests

Search for test files covering this module:
1. Check co-located tests (`*.test.ts`, `*.spec.ts`, `*_test.go`, `test_*.py`)
2. Check test directories (`__tests__/`, `test/`, `tests/`, `spec/`)
3. Search for imports of the target module in test files

If no tests exist:
- **Warn the user** that refactoring without tests is risky
- Suggest writing tests first (or offer to write them before refactoring)
- If user wants to proceed, be extra careful with behavior-preserving transformations

### Step 3: Run baseline tests

Execute the project's test suite (or at minimum, tests for the target module):
```
npm test / pytest / go test / cargo test
```
All tests must pass before any refactoring begins. If tests fail, report the failures — don't refactor broken code.

### Step 4: Propose refactorings

For each identified smell, propose a specific refactoring:

```markdown
## Proposed Refactorings

### 1. Extract method: `processOrder` → `validateOrder` + `calculateTotal`
- **Smell**: Long method (67 lines) with two distinct responsibilities
- **Technique**: Extract Method
- **Lines affected**: 45-112
- **Risk**: Low — pure logic extraction, no side effects

### 2. Simplify conditional: nested if-else in `getDiscount`
- **Smell**: Deep nesting (4 levels)
- **Technique**: Replace Nested Conditional with Guard Clauses
- **Lines affected**: 20-55
- **Risk**: Low — behavioral equivalent transformation

### 3. Remove dead code: unused `formatLegacy` function
- **Smell**: Dead code — no callers found in codebase
- **Lines affected**: 200-230
- **Risk**: Low — verified no references exist
```

Order refactorings from lowest risk to highest risk.

### Step 5: Get confirmation

Present the list to the user. Wait for approval before proceeding.

### Step 6: Apply incrementally

For EACH approved refactoring:
1. Apply the single refactoring
2. Run the tests immediately
3. If tests pass → move to next refactoring
4. If tests fail → **revert the change**, explain what went wrong, and skip to the next refactoring

Never apply multiple refactorings between test runs.

### Step 7: Final verification

After all refactorings are applied:
1. Run the full test suite (not just module tests)
2. Run the linter/formatter if available
3. Verify no new warnings or errors

### Step 8: Summary

```markdown
## Refactoring Summary

### Applied
- [Refactoring 1]: [brief description of change]
- [Refactoring 2]: [brief description of change]

### Skipped
- [Refactoring 3]: [reason — test failure, user declined, etc.]

### Metrics
- Lines before: [N]
- Lines after: [N]
- Functions before: [N]
- Functions after: [N]
- Max nesting depth before: [N]
- Max nesting depth after: [N]

### All tests passing: Yes/No
```

### Guidelines

- **Preserve behavior** — refactoring must not change what the code does, only how it's structured
- **Preserve the public API** — don't rename exported functions or change signatures unless explicitly asked
- **One refactoring at a time** — never combine multiple transformations
- **Test between every change** — this is non-negotiable
- **Don't gold-plate** — apply the proposed refactorings, don't go on a cleaning spree
- **Respect the project's style** — match existing naming conventions, patterns, and formatting
- If a refactoring would require changes in other files (callers), mention it but don't apply it without confirmation
