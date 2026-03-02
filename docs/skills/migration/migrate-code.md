# Migrate Code

Migrates between frameworks, languages, and patterns -- JavaScript to TypeScript, class components to hooks, REST to GraphQL, and more. This skill performs incremental migrations with testing between each file to ensure nothing breaks along the way.

## Quick Start

```bash
# Migrate a directory from JavaScript to TypeScript
/migrate-code src/ javascript typescript

# Convert class components to hooks
/migrate-code src/components/ class-components hooks

# Migrate from REST to GraphQL
/migrate-code src/api/ rest graphql
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `path` | `$0` | Yes | File or directory path to migrate |
| `from` | `$1` | Yes | Source pattern, framework, or language |
| `to` | `$2` | Yes | Target pattern, framework, or language |

::: tip
Specify a single file to migrate incrementally, or a directory to migrate all applicable files within it. Directory migrations process one file at a time with verification between each, so you can stop at any point with a partially migrated but working codebase.
:::

## How It Works

1. **Parse request** -- Identifies the migration type from the `from` and `to` arguments and validates that the combination is supported.
2. **Analyze scope** -- Scans the target path to inventory all files that need migration, builds a dependency graph to determine the optimal migration order (leaf nodes first, shared modules last).
3. **Set up migration** -- Installs any required dependencies, configuration files, or build tool changes needed for the target pattern (e.g., `tsconfig.json` for TypeScript, GraphQL schema for REST-to-GraphQL).
4. **Migrate incrementally** -- Processes one file at a time, converting code to the target pattern while preserving behavior. Runs available tests between each file to catch regressions immediately.
5. **Clean up** -- Removes unused dependencies, deletes obsolete configuration, and updates import paths across the codebase.
6. **Summary** -- Reports the number of files migrated, any issues encountered, and remaining manual steps.

```
┌──────────────────────────────────────────┐
│  1. Parse request                        │
│     Validate from/to combination         │
├──────────────────────────────────────────┤
│  2. Analyze scope                        │
│     Inventory files, build dep graph     │
├──────────────────────────────────────────┤
│  3. Set up migration                     │
│     Install deps, add config files       │
├──────────────────────────────────────────┤
│  4. Migrate incrementally                │
│     ┌─────────────────────────────┐      │
│     │  For each file:             │      │
│     │    Convert code             │      │
│     │    Update imports           │      │
│     │    Run tests                │──┐   │
│     │    Commit if tests pass     │  │   │
│     └─────────────────────────────┘  │   │
│              ▲                        │   │
│              └── next file ───────────┘   │
├──────────────────────────────────────────┤
│  5. Clean up                             │
│     Remove old deps, update configs      │
├──────────────────────────────────────────┤
│  6. Summary                              │
│     Files migrated, issues, next steps   │
└──────────────────────────────────────────┘
```

## Supported Migrations

| From | To | Description |
|------|----|-------------|
| `javascript` | `typescript` | Add type annotations, generate `tsconfig.json`, rename `.js` to `.ts`/`.tsx` |
| `typescript` | `javascript` | Strip types, remove `tsconfig.json`, rename `.ts` to `.js` |
| `class-components` | `hooks` | Convert React class components to functional components with hooks |
| `hooks` | `class-components` | Convert functional components back to class components |
| `rest` | `graphql` | Generate GraphQL schema from REST endpoints, create resolvers, update clients |
| `graphql` | `rest` | Generate REST endpoints from GraphQL schema, create controllers |
| `express` | `fastify` | Migrate Express routes, middleware, and plugins to Fastify equivalents |
| `jest` | `vitest` | Convert Jest test files, configuration, and mocks to Vitest |
| `webpack` | `vite` | Migrate Webpack config to Vite, update plugins, adjust build scripts |
| `css-modules` | `tailwind` | Replace CSS module classes with Tailwind utility classes |
| `redux` | `zustand` | Convert Redux slices, actions, and selectors to Zustand stores |
| `mongoose` | `prisma` | Migrate Mongoose schemas to Prisma schema, update queries |
| `cra` | `nextjs` | Migrate Create React App to Next.js with pages/app router |
| `vue-options` | `vue-composition` | Convert Vue Options API to Composition API with `<script setup>` |

::: warning
Some migrations require manual review after completion. For example, migrating from REST to GraphQL may require adjusting authorization logic that cannot be automatically inferred. The summary report will list all items requiring manual attention.
:::

## Example

Suppose you have a React project with class components and run:

```bash
/migrate-code src/components/ class-components hooks
```

The skill inventories the directory, finds 15 class components, and processes them one at a time:

```
Migration: class-components -> hooks
Scope: src/components/ (15 files)

[1/15]  UserProfile.jsx      Converted    Tests pass
[2/15]  DataTable.jsx         Converted    Tests pass
[3/15]  LoginForm.jsx         Converted    Tests pass
...
[14/15] Dashboard.jsx         Converted    Tests pass
[15/15] App.jsx               Converted    Tests pass

Summary:
  Migrated:      15 files
  Skipped:       0 files
  Test failures: 0

Changes:
  - Converted lifecycle methods to useEffect hooks
  - Replaced this.state with useState
  - Replaced this.props with function parameters
  - Removed constructor methods
  - Updated refs from createRef to useRef

Manual review recommended:
  - src/components/Dashboard.jsx: Complex componentDidUpdate logic
    split across multiple useEffect hooks -- verify dependency arrays
```

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` -- runs within your current conversation |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Bash` |

This skill has read/write access to your project files and can execute shell commands to install dependencies, run tests, and verify the migration. It modifies files in place and may create new configuration files required by the target pattern.
