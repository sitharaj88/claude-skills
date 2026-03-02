# Node.js API Template

## Tech stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x (strict mode)
- **Framework**: Express 4.x or Fastify 4.x (prefer Fastify for new projects)
- **Validation**: Zod
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Database**: Prisma (optional — include if user mentions DB)

## Directory structure

```
project-name/
├── src/
│   ├── index.ts              # Entry point — starts the server
│   ├── app.ts                # App setup — middleware, routes, error handler
│   ├── config/
│   │   └── env.ts            # Environment variable validation with Zod
│   ├── routes/
│   │   ├── index.ts          # Route registration
│   │   └── health.ts         # GET /health endpoint
│   ├── middleware/
│   │   └── error-handler.ts  # Centralized error handling
│   └── lib/
│       └── logger.ts         # Structured logger setup
├── test/
│   ├── setup.ts              # Test setup and helpers
│   └── routes/
│       └── health.test.ts    # Health endpoint test
├── .env.example              # Example environment variables
├── .gitignore
├── .editorconfig
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── README.md
└── .github/
    └── workflows/
        └── ci.yml
```

## Key configuration

### tsconfig.json
- `strict: true`
- `target: ES2022`
- `module: NodeNext`
- `moduleResolution: NodeNext`
- `outDir: dist`
- `rootDir: src`

### package.json scripts
- `dev` — Run with watch mode (`tsx watch src/index.ts`)
- `build` — TypeScript compile (`tsc`)
- `start` — Run compiled code (`node dist/index.js`)
- `test` — Run tests (`vitest`)
- `lint` — ESLint check (`eslint src/`)
- `format` — Prettier format (`prettier --write src/`)

### .env.example
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

## Example code patterns

### Health endpoint
A working `/health` endpoint that returns `{ status: "ok", timestamp: "..." }`.

### Error handler
Centralized error handler that catches thrown errors and returns consistent JSON error responses with appropriate HTTP status codes.

### Config validation
Validate all environment variables at startup using Zod — fail fast with clear error messages if required vars are missing.
