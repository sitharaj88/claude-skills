# React Application Template

## Tech stack
- **Language**: TypeScript 5.x (strict mode)
- **Framework**: React 19 with Vite 6
- **Routing**: React Router 7
- **State**: React Query (TanStack Query) for server state
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier
- **Styling**: Tailwind CSS 4 (or CSS Modules if user prefers)

## Directory structure

```
project-name/
├── src/
│   ├── main.tsx              # Entry point — React DOM render
│   ├── App.tsx               # Root component with router
│   ├── components/
│   │   └── ui/
│   │       └── Button.tsx    # Example shared UI component
│   ├── pages/
│   │   ├── Home.tsx          # Home page
│   │   └── NotFound.tsx      # 404 page
│   ├── hooks/
│   │   └── useMediaQuery.ts  # Example custom hook
│   ├── lib/
│   │   └── api.ts            # API client setup (fetch wrapper)
│   ├── types/
│   │   └── index.ts          # Shared type definitions
│   └── test/
│       └── setup.ts          # Test setup (Testing Library config)
├── public/
│   └── favicon.svg
├── index.html
├── .gitignore
├── .editorconfig
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── postcss.config.js
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
- `module: ESNext`
- `moduleResolution: bundler`
- Path alias: `@/*` → `src/*`

### package.json scripts
- `dev` — Vite dev server (`vite`)
- `build` — Production build (`tsc && vite build`)
- `preview` — Preview build (`vite preview`)
- `test` — Run tests (`vitest`)
- `lint` — ESLint check (`eslint src/`)
- `format` — Prettier format (`prettier --write src/`)

## Example code patterns

### App component
Root component with React Router setup, including Home and NotFound routes.

### Button component
A typed, reusable Button component demonstrating the project's component pattern — with variants prop (primary, secondary, ghost), sizes, and disabled state.

### API client
A typed fetch wrapper with base URL configuration, JSON parsing, and error handling. Demonstrates the pattern for making API calls.

### Custom hook
`useMediaQuery` — demonstrates custom hook pattern with TypeScript.
