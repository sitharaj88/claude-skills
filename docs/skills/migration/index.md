# Migration & Conversion Skills

Tools for modernizing codebases by migrating between frameworks, languages, and patterns.

<div class="skill-grid">
  <a href="migrate-code" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Migrate Code</h3>
    <span class="command">/migrate-code [path] [from] [to]</span>
    <p>Migrates between frameworks and patterns — JS to TS, class to hooks, REST to GraphQL, and more.</p>
  </a>
</div>

## Supported Migrations

| From | To | Scope |
|------|-----|-------|
| JavaScript | TypeScript | Add types, rename files, strict mode |
| Class components | Function + hooks | React modernization |
| Vue Options API | Composition API | Vue 3 migration |
| REST endpoints | GraphQL | API layer migration |
| Express | Fastify | Framework switch |
| CommonJS (`require`) | ESM (`import`) | Module system |
| Callbacks | async/await | Async pattern modernization |
| Mocha/Chai | Vitest/Jest | Test framework migration |
| CSS/SCSS | Tailwind CSS | Styling approach |
| Redux | Zustand/Jotai | State management |
| Moment.js | date-fns/dayjs | Date library replacement |
| Enzyme | Testing Library | Test library |

## How Migration Works

```
1. Scope     →  2. Set up      →  3. Migrate       →  4. Clean up
   Find all       Install new       One file at a       Remove old
   affected        deps, keep       time, run tests     deps and
   files           old ones         after each          config
```

Migrations are:
- **Incremental** — one file at a time, tested between each change
- **Behavior-preserving** — the code does the same thing, just in a different form
- **Reversible** — git history tracks every change

## Usage Examples

### JavaScript to TypeScript

```
/migrate-code src/ javascript typescript
```

Renames files, adds type annotations, creates `tsconfig.json`, and fixes all type errors.

### React Class to Hooks

```
/migrate-code src/components/ class-components hooks
```

Converts `this.state` to `useState`, lifecycle methods to `useEffect`, and class methods to functions.

### CommonJS to ESM

```
/migrate-code src/ commonjs esm
```

Converts `require` to `import`, `module.exports` to `export`, updates `package.json` and config files.
