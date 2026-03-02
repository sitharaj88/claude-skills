---
name: migrate-code
description: Migrates code between frameworks, languages, patterns, or API versions — JavaScript to TypeScript, REST to GraphQL, class components to hooks, Vue Options to Composition API, Express to Fastify, and more. Preserves behavior while modernizing patterns. Use when the user asks to migrate, convert, upgrade, or modernize code from one pattern or framework to another.
argument-hint: "[file-or-directory] [from] [to]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a code migration expert. Migrate the code specified by `$ARGUMENTS` while preserving behavior and tests.

### Step 1: Parse the migration request

- `$0` = File path, directory, or glob pattern to migrate
- `$1` = Source pattern/framework (what to migrate FROM)
- `$2` = Target pattern/framework (what to migrate TO)

**Common migrations:**
| From | To | Scope |
|------|-----|-------|
| JavaScript | TypeScript | Add types, rename .js → .ts |
| Class components | Function + hooks | React modernization |
| Vue Options API | Composition API | Vue 3 migration |
| REST endpoints | GraphQL | API migration |
| Express | Fastify | Framework switch |
| CommonJS (require) | ESM (import) | Module system |
| Callbacks | async/await | Async pattern |
| Mocha/Chai | Vitest/Jest | Test framework |
| CSS/SCSS | Tailwind CSS | Styling approach |
| Redux | Zustand/Jotai | State management |
| Moment.js | date-fns/dayjs | Date library |
| Enzyme | Testing Library | Test library |

### Step 2: Analyze scope

Determine the full migration scope:
1. Find all files matching the migration criteria in `$0`
2. Count the total files and lines to migrate
3. Identify shared patterns across files (batch-convertible)
4. Identify unique/complex cases requiring manual attention
5. Find existing tests that must continue passing after migration

Present scope to user:
```markdown
## Migration scope: [from] → [to]

### Files to migrate
- [N] files, ~[N] lines of code
- Pattern 1: [N] files (batch-convertible)
- Pattern 2: [N] files (requires manual attention)

### Dependencies affected
- [packages to add]
- [packages to remove]

### Risk assessment
- Tests covering migrated code: [N] tests
- Files without test coverage: [list]
```

### Step 3: Set up the migration

**Install new dependencies** (if framework change):
- Add new packages
- Keep old packages temporarily (for incremental migration)

**Configure new tooling** (if needed):
- TypeScript: generate `tsconfig.json`
- ESM: update `package.json` type field
- New framework: add config files

### Step 4: Migrate incrementally

Process files one at a time (or in small batches of similar files):

#### JavaScript → TypeScript
1. Rename `.js` → `.ts` / `.jsx` → `.tsx`
2. Add type annotations to function parameters and return types
3. Define interfaces for object shapes (props, API responses, state)
4. Replace `any` with proper types — use `unknown` as last resort
5. Fix type errors without changing runtime behavior
6. Add type-only imports where needed

#### React Class → Hooks
1. Convert `class X extends Component` to `function X(props)`
2. Convert `this.state` to `useState` hooks
3. Convert `componentDidMount`/`componentDidUpdate` to `useEffect`
4. Convert `componentWillUnmount` cleanup to `useEffect` return
5. Convert class methods to functions (with `useCallback` if passed as props)
6. Convert `this.props` to destructured function parameters
7. Remove `this.` references throughout

#### Vue Options → Composition API
1. Convert `data()` to `ref()`/`reactive()`
2. Convert `computed` to `computed()` function
3. Convert `methods` to regular functions
4. Convert `watch` to `watch()`/`watchEffect()`
5. Convert lifecycle hooks: `mounted` → `onMounted()`, etc.
6. Convert `this.$emit` to `defineEmits()`
7. Convert `this.$refs` to `useTemplateRef()`

#### CommonJS → ESM
1. Convert `const x = require('y')` to `import x from 'y'`
2. Convert `module.exports =` to `export default` or named exports
3. Convert `exports.x =` to `export const x =`
4. Handle dynamic requires: `require(variable)` → dynamic `import()`
5. Update `__dirname`/`__filename` to `import.meta.url` equivalents
6. Update `package.json`: add `"type": "module"`

#### REST → GraphQL
1. Define GraphQL schema types from existing response types
2. Create resolvers mapping to existing service/repository layer
3. Convert REST routes to GraphQL queries (GET) and mutations (POST/PUT/DELETE)
4. Handle pagination (REST offset → GraphQL cursor-based)
5. Set up DataLoader for N+1 prevention
6. Generate client-side queries/mutations

### Step 5: Run tests after each file

After migrating each file (or small batch):
1. Run the test suite
2. If tests fail → diagnose whether it's a migration error or a pre-existing issue
3. Fix migration errors immediately
4. Document pre-existing issues separately

### Step 6: Clean up

After all files are migrated:
1. Remove old dependencies that are no longer used
2. Remove old config files
3. Update build scripts and CI config
4. Run the full test suite
5. Run linter/formatter on migrated files

### Step 7: Summary

```markdown
## Migration complete: [from] → [to]

### Files migrated
- [N] files successfully migrated
- [N] files skipped (reason)

### Dependencies
- Added: [list]
- Removed: [list]

### Breaking changes
- [Any API changes callers need to update]

### Manual attention needed
- [Files that need human review]
- [Edge cases that couldn't be auto-migrated]

### Tests
- [N] tests passing
- [N] tests updated for new API
- [N] new tests added
```

### Guidelines

- Never change behavior — migration is about form, not function
- Migrate incrementally — one file at a time, test between each
- Keep the old code working until the new code is verified — don't break the build mid-migration
- For large migrations, suggest a gradual approach (migrate feature by feature, not all at once)
- If migration reveals bugs in the original code, report them but don't fix them (that's a separate task)
- Preserve git history readability — consider separate commits for "rename files" vs "add types" vs "convert patterns"
- Always check that imports/exports still resolve after migration
