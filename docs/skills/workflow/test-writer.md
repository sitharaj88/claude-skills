# Test Writer

Generates comprehensive test suites that match your project's testing framework and conventions. The skill studies your existing tests to learn your style, then produces well-structured tests that feel like a natural extension of your codebase.

## Quick Start

```bash
/test-writer src/utils/parser.ts
```

Or target a specific function by name:

```bash
/test-writer calculateTotal
```

## What It Does

1. **Detects the testing framework** — identifies which test runner and assertion library your project uses
2. **Studies existing test conventions** — reads 2-3 of your existing test files to learn naming patterns, structure, assertion style, and mocking approach
3. **Analyzes the target code** — maps out inputs, outputs, dependencies, branches, and edge cases in the code under test
4. **Generates tests in priority order** — writes tests starting with happy paths, then edge cases, error conditions, and integration points
5. **Runs and iterates** — executes the generated tests, fixes any failures, and re-runs until all tests pass

## Arguments

| Parameter | Required | Description |
|-----------|----------|-------------|
| `$ARGUMENTS` | Yes | A file path (e.g., `src/utils/parser.ts`) or a function/class name (e.g., `calculateTotal`). When given a name, the skill searches the codebase to locate it. |

::: tip
Passing a file path is faster because the skill can skip the search step. Use a function name when you are not sure where it lives or when the function spans multiple files.
:::

## Example

Generate tests for a price calculation utility:

```bash
/test-writer src/utils/pricing.ts
```

The skill detects your project uses Vitest, studies your existing test conventions, and generates:

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
  calculateTotal,
  applyDiscount,
  calculateTax,
} from '../utils/pricing';

describe('calculateTotal', () => {
  // Happy path
  it('should return the sum of item prices', () => {
    const items = [
      { name: 'Widget', price: 9.99, quantity: 2 },
      { name: 'Gadget', price: 24.99, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(44.97);
  });

  it('should return 0 for an empty cart', () => {
    expect(calculateTotal([])).toBe(0);
  });

  // Edge cases
  it('should handle fractional quantities', () => {
    const items = [{ name: 'Bulk Sand', price: 10.0, quantity: 0.5 }];
    expect(calculateTotal(items)).toBe(5.0);
  });

  it('should handle items with zero price', () => {
    const items = [{ name: 'Free Sample', price: 0, quantity: 3 }];
    expect(calculateTotal(items)).toBe(0);
  });

  // Error conditions
  it('should throw for negative quantities', () => {
    const items = [{ name: 'Widget', price: 9.99, quantity: -1 }];
    expect(() => calculateTotal(items)).toThrow('Invalid quantity');
  });
});

describe('applyDiscount', () => {
  it('should apply a percentage discount', () => {
    expect(applyDiscount(100, { type: 'percent', value: 15 })).toBe(85);
  });

  it('should not reduce the total below zero', () => {
    expect(applyDiscount(10, { type: 'fixed', value: 25 })).toBe(0);
  });
});
```

The skill then runs the tests, verifies they pass, and presents the results.

## How It Works

```
┌──────────────────────────────────────────┐
│  1. Detect testing framework             │
│     Package.json, config files, imports  │
├──────────────────────────────────────────┤
│  2. Study existing test conventions      │
│     Read 2-3 test files for patterns     │
├──────────────────────────────────────────┤
│  3. Analyze target code                  │
│     Inputs · Outputs · Dependencies ·    │
│     Branches · Edge cases                │
├──────────────────────────────────────────┤
│  4. Generate tests by priority           │
│     Happy path → Edge cases →            │
│     Error conditions → Integration       │
├──────────────────────────────────────────┤
│  5. Run tests and iterate                │
│     Execute → Fix failures → Re-run      │
│     until all tests pass                 │
└──────────────────────────────────────────┘
```

### Test Priority Order

Tests are generated in a deliberate priority order to maximize coverage value:

| Priority | Category | Count | Purpose |
|----------|----------|-------|---------|
| 1 | **Happy path** | 2-3 tests | Verify the core functionality works as expected |
| 2 | **Edge cases** | 2-4 tests | Cover boundary values, empty inputs, large data, special characters |
| 3 | **Error conditions** | 2-3 tests | Confirm proper error handling and validation |
| 4 | **Integration points** | 1-2 tests | Test interactions with dependencies and external services |

### Supported Frameworks

The skill automatically detects and generates tests for the following frameworks:

| Language | Frameworks |
|----------|------------|
| JavaScript / TypeScript | Jest, Vitest, Mocha |
| Python | pytest, unittest |
| Go | go test |
| Rust | cargo test |
| Ruby | RSpec, Minitest |
| Swift / Objective-C | XCTest |

::: tip
The skill adapts to your project's conventions. If your tests use `describe`/`it` blocks, the generated tests will too. If they use `test()` functions, the output matches that style. Assertion libraries (`expect`, `assert`, `should`) are detected and respected.
:::

## Configuration

| Setting | Value |
|---------|-------|
| Context mode | `inline` (runs in your current conversation) |
| Allowed tools | `Read`, `Grep`, `Glob`, `Bash`, `Write`, `Edit` |

::: warning
This skill has write access and will create or modify test files in your project. It will also execute tests using your project's test runner. Review the generated tests before committing them.
:::
