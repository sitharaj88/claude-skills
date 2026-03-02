---
name: scaffold-project
description: Scaffolds complete project structures with directories, configuration files, testing setup, CI/CD, and boilerplate for various project types. Use when the user wants to create a new project, start a new application, initialize a codebase, or set up a project from scratch.
argument-hint: "[project-type] [project-name]"
context: fork
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob
user-invocable: true
---

## Instructions

You are a project scaffolding expert. Create a complete, production-ready project structure for `$ARGUMENTS`.

### Step 1: Parse arguments

- `$0` = Project type (required)
- `$1` = Project name (required)

**Supported project types:**
- `node-api` — Node.js/TypeScript REST API (see [templates/node-api.md](templates/node-api.md))
- `react-app` — React/TypeScript SPA (see [templates/react-app.md](templates/react-app.md))
- `cli-tool` — Command-line tool (see [templates/cli-tool.md](templates/cli-tool.md))

If the type doesn't match a template, infer the best structure from the name and create a sensible default.

### Step 2: Create the project directory

```
mkdir -p $1 && cd $1
```

### Step 3: Generate core files (all project types)

Every project gets these foundational files:

**`.gitignore`** — Language-appropriate ignores (node_modules, __pycache__, target/, etc.)

**`.editorconfig`** — Consistent formatting across editors:
```ini
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

**`README.md`** — With sections: Overview, Prerequisites, Setup, Development, Testing, Deployment

**`.github/workflows/ci.yml`** — CI pipeline: install, lint, test, build

### Step 4: Generate type-specific files

Read the appropriate template from `templates/` for detailed file lists and content.

Follow the template's file structure exactly, adapting the project name throughout.

### Step 5: Initialize the project

Run the appropriate initialization commands:
- `git init`
- `npm init -y` / `go mod init` / `cargo init` / etc.
- Install dependencies listed in the template
- Run the formatter/linter to ensure clean initial state

### Step 6: Verify the scaffold

1. Build the project — verify it compiles/transpiles without errors
2. Run tests — verify the example tests pass
3. Run the linter — verify no lint errors

### Step 7: Present summary

```markdown
## Project scaffolded: [name]

### Structure
[tree output of the created directory]

### Included
- [Framework and version]
- [Testing: framework]
- [Linting: tool and config]
- [CI/CD: GitHub Actions]
- [Type safety: TypeScript strict / mypy / etc.]

### Next steps
1. `cd [name]`
2. Review and update `README.md`
3. Start developing in `src/`
```

### Guidelines

- Use the LATEST stable versions of all tools and dependencies
- Enable strict mode for type checking (TypeScript strict, mypy strict, etc.)
- Include only essential dependencies — no kitchen sink
- Every generated file should be non-trivial — no empty placeholder files
- Example code should actually work and demonstrate the project's patterns
- CI should test the same things a developer would run locally
