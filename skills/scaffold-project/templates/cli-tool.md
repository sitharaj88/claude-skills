# CLI Tool Template

## Tech stack
- **Language**: TypeScript 5.x (strict mode) or Go 1.22+
- **CLI framework (TS)**: Commander.js or yargs
- **CLI framework (Go)**: cobra
- **Testing**: Vitest (TS) or `go test` (Go)
- **Linting**: ESLint (TS) or golangci-lint (Go)
- **Build**: esbuild bundle to single file (TS) or `go build` (Go)

## Directory structure (TypeScript)

```
project-name/
├── src/
│   ├── index.ts              # Entry point — CLI setup and command registration
│   ├── commands/
│   │   ├── index.ts          # Command registry
│   │   └── hello.ts          # Example command: greet the user
│   ├── lib/
│   │   ├── config.ts         # Config file loading (~/.project-name/config.json)
│   │   └── output.ts         # Formatted output helpers (table, JSON, plain text)
│   └── types/
│       └── index.ts          # Shared types
├── test/
│   ├── commands/
│   │   └── hello.test.ts     # Command tests
│   └── lib/
│       └── config.test.ts    # Config tests
├── .gitignore
├── .editorconfig
├── .eslintrc.cjs
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── README.md
└── .github/
    └── workflows/
        └── ci.yml
```

## Directory structure (Go)

```
project-name/
├── main.go                   # Entry point
├── cmd/
│   ├── root.go               # Root command setup
│   └── hello.go              # Example command
├── internal/
│   ├── config/
│   │   └── config.go         # Config file loading
│   └── output/
│       └── output.go         # Formatted output helpers
├── .gitignore
├── .editorconfig
├── .golangci.yml
├── go.mod
├── go.sum
├── Makefile
├── README.md
└── .github/
    └── workflows/
        └── ci.yml
```

## Key configuration

### package.json (TypeScript)
- `bin` field pointing to the built entry point
- Scripts: `dev`, `build`, `test`, `lint`
- `type: module`

### package.json scripts
- `dev` — Run with tsx (`tsx src/index.ts`)
- `build` — Bundle with esbuild (`esbuild src/index.ts --bundle --platform=node --outfile=dist/cli.js`)
- `test` — Run tests (`vitest`)
- `lint` — ESLint check

## Example code patterns

### Hello command
A simple command that accepts a `--name` flag and prints a greeting. Demonstrates:
- Flag/argument parsing
- Output formatting
- Error handling

### Config loading
Load config from `~/.project-name/config.json` with sensible defaults. Demonstrates:
- Config file path resolution
- JSON parsing with validation
- Default values

### Output formatting
Helper that supports `--format` flag (table, json, plain). Demonstrates:
- Multiple output formats from the same data
- Piping-friendly output (no colors when stdout is not a TTY)
