# Refactor Module

Detects code smells and applies incremental, test-verified refactorings while preserving behavior. This skill analyzes a target file or module, identifies structural issues, proposes safe transformations, and applies them one at a time with test verification after each change.

## Quick Start

Refactor a specific file:

```bash
/refactor-module src/services/OrderService.ts
```

Refactor a module by name:

```bash
/refactor-module auth-middleware
```

## Arguments

| Argument | Description | Required |
|---|---|---|
| `$ARGUMENTS` | File path or module name to refactor | Yes |

The skill accepts either an exact file path or a module name. When a module name is provided, it searches the codebase to locate the corresponding file(s).

## How It Works

1. **Read and analyze** -- Reads the target file and performs static analysis to identify code smells and structural issues
2. **Find existing tests** -- Locates related test files by convention (`*.test.*`, `*.spec.*`, `__tests__/`) and import analysis
3. **Run baseline tests** -- Executes the existing test suite to establish a green baseline before any changes
4. **Propose refactorings** -- Presents a list of recommended refactorings, each with:
   - Description of the code smell
   - Proposed transformation
   - Risk level (low / medium / high)
   - Expected benefit
5. **Get user confirmation** -- Pauses to let you approve, modify, or reject the proposed refactoring plan
6. **Apply one at a time** -- Applies each approved refactoring individually, running the test suite after every change to verify behavior is preserved
7. **Final verification** -- Runs the full test suite one last time and provides a summary of all changes made

### Code Smells Detected

The skill identifies the following code smells:

| Code Smell | Description |
|---|---|
| **Long method** | Functions exceeding a reasonable length that should be decomposed |
| **Deep nesting** | Excessive levels of conditional or loop nesting |
| **Duplicated logic** | Repeated code blocks that can be extracted into shared functions |
| **God object** | Classes or modules with too many responsibilities |
| **Feature envy** | Methods that use another module's data more than their own |
| **Primitive obsession** | Overuse of primitives instead of small domain objects |
| **Long parameter list** | Functions with too many parameters that should be grouped |
| **Dead code** | Unused functions, variables, or unreachable branches |
| **Magic numbers** | Unexplained numeric literals that should be named constants |

### Reference Material

This skill includes `references/patterns.md`, a bundled reference containing a full code smell catalog and refactoring recipes. Each recipe provides:

- The smell pattern to detect
- Step-by-step transformation instructions
- Before and after code examples
- Risk assessment and common pitfalls

## Output Format

The skill works interactively, producing output at each stage:

```markdown
## Analysis: src/services/OrderService.ts

### Code Smells Found
1. **Long method** (line 45-120) - `processOrder` is 75 lines long
   Risk: Low | Refactoring: Extract Method
2. **Magic numbers** (lines 67, 89, 103) - Unexplained numeric literals
   Risk: Low | Refactoring: Replace Magic Number with Named Constant
3. **Deep nesting** (line 78-105) - 5 levels of nesting in validation block
   Risk: Medium | Refactoring: Replace Nested Conditionals with Guard Clauses

### Proposed Plan
Apply refactorings in order: #2 → #3 → #1

Proceed with this plan? (y/n)
```

After completion:

```markdown
## Refactoring Summary

| # | Refactoring                  | Status  | Tests |
|---|------------------------------|---------|-------|
| 1 | Extract named constants      | Applied | Pass  |
| 2 | Replace nesting with guards  | Applied | Pass  |
| 3 | Extract `validateOrder`      | Applied | Pass  |

All tests passing. 3 of 3 refactorings applied successfully.
```

::: tip
Always ensure your test suite is passing before running this skill. A green baseline is essential for verifying that refactorings preserve existing behavior.
:::

::: warning
This skill modifies your source files. Each change is verified against the test suite, but if your tests have low coverage, behavioral regressions in untested paths may go undetected. Consider increasing test coverage for critical modules before refactoring.
:::

## Configuration

| Setting | Value |
|---|---|
| **Context mode** | `inline` -- runs within your current conversation context so changes are applied directly to your working files |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Bash`, `Write`, `Edit` |

Unlike the other analysis skills, this skill operates in `inline` mode with write access because it actively modifies files. The allowed tools are explicitly scoped to prevent unintended side effects while enabling the read-analyze-edit-test workflow.
