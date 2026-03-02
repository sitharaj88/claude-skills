# Scaffold Project

Scaffolds production-ready projects with configuration, CI/CD pipelines, testing infrastructure, and linting setup. Each generated project includes everything needed to start developing immediately -- no manual boilerplate setup required.

## Quick Start

```bash
# Scaffold a Node.js API service
/scaffold-project node-api my-service

# Scaffold a React application
/scaffold-project react-app dashboard

# Scaffold a CLI tool
/scaffold-project cli-tool my-cli
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `project-type` | `$0` | Yes | Type of project: `node-api`, `react-app`, or `cli-tool` |
| `project-name` | `$1` | Yes | Name for the project directory and package (kebab-case recommended) |

::: tip
The project name is used as both the directory name and the package name in `package.json` (or equivalent). Use kebab-case to ensure compatibility across package managers and registries.
:::

## How It Works

1. **Creates project directory** -- Sets up the project root with a proper directory structure tailored to the selected project type.
2. **Generates core files** -- Produces foundational configuration files: `.gitignore`, `.editorconfig`, `README.md`, and a CI workflow (GitHub Actions).
3. **Generates type-specific files** -- Uses built-in templates from the `templates/` directory to create framework-specific source files, configuration, and boilerplate.
4. **Initializes the project** -- Runs `git init`, sets up the package manager, and installs all dependencies.
5. **Verifies everything works** -- Confirms the build passes, tests run successfully, and the linter reports no issues.

## Available Templates

| Template | Stack | Includes |
|----------|-------|----------|
| **node-api** | Fastify + TypeScript + Vitest | REST API structure, request validation (Zod), error handling, Docker setup, health check endpoint, structured logging |
| **react-app** | Vite + React + Tailwind CSS | Component library setup, routing (React Router), state management stub, testing (Vitest + Testing Library), Storybook config |
| **cli-tool** | Commander.js (Node) or Cobra (Go) | Command structure, argument parsing, help generation, configuration file support, colored output |

## Generated Structure

Every scaffolded project includes these common files regardless of template:

```
my-project/
  .github/
    workflows/
      ci.yml              # GitHub Actions CI pipeline
  .gitignore               # Language-appropriate ignores
  .editorconfig            # Consistent editor settings
  .eslintrc.cjs            # ESLint configuration (or equivalent linter)
  .prettierrc              # Code formatting rules
  README.md                # Project overview with setup instructions
  package.json             # Dependencies and scripts
  tsconfig.json            # TypeScript configuration
```

## Example

Running the following command:

```bash
/scaffold-project node-api my-service
```

Produces a complete API project:

```
my-service/
  .github/workflows/ci.yml
  .gitignore
  .editorconfig
  .eslintrc.cjs
  .prettierrc
  Dockerfile
  docker-compose.yml
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    app.ts                 # Fastify app setup with plugins
    server.ts              # Entry point with graceful shutdown
    config/
      index.ts             # Environment-based configuration
    routes/
      health.ts            # Health check endpoint
    plugins/
      error-handler.ts     # Centralized error handling
    lib/
      logger.ts            # Structured logging setup
  test/
    health.test.ts         # Integration test for health endpoint
    helpers/
      setup.ts             # Test server setup utility
```

After generation, the skill runs `npm install`, verifies the build, executes the test suite, and runs the linter to confirm everything is clean.

::: warning
This skill executes shell commands during scaffolding, including `git init`, package installation, and build verification. It will create a new directory in your current working directory. Make sure you are in the intended parent directory before running the command.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `fork` |
| **Allowed tools** | `Bash`, `Read`, `Write`, `Edit`, `Glob` |

This skill operates in fork context mode with shell access. It needs `Bash` to initialize the project, install dependencies, and verify the build. The `Glob` tool is used to discover template files during generation.
