# React Native Project Template (Expo)

## Tech stack
- **Framework**: Expo SDK 52+ (managed workflow preferred)
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State management**: TanStack Query for server state + Zustand for client state
- **Styling**: NativeWind (Tailwind for RN) or StyleSheet
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Native Testing Library, Maestro for E2E
- **Linting**: ESLint + Prettier

## Directory structure

```
project-name/
├── app/                                    # Expo Router file-based routes
│   ├── _layout.tsx                         # Root layout (providers, navigation)
│   ├── index.tsx                           # Home screen (/)
│   ├── (tabs)/                             # Tab navigator group
│   │   ├── _layout.tsx                     # Tab layout
│   │   ├── index.tsx                       # First tab
│   │   └── settings.tsx                    # Settings tab
│   └── [id].tsx                            # Dynamic route example
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Button.tsx                  # Shared button component
│   │       ├── Input.tsx                   # Shared input component
│   │       └── LoadingScreen.tsx           # Full-screen loader
│   ├── features/
│   │   └── home/
│   │       ├── HomeContent.tsx             # Screen content component
│   │       ├── useHome.ts                  # Feature hook
│   │       └── home.types.ts              # Feature types
│   ├── hooks/
│   │   ├── useAuth.ts                      # Auth state hook
│   │   └── useAppState.ts                  # App state (foreground/background)
│   ├── lib/
│   │   ├── api.ts                          # API client (fetch wrapper or axios)
│   │   ├── storage.ts                      # AsyncStorage/SecureStore wrapper
│   │   └── queryClient.ts                  # TanStack Query client config
│   ├── stores/
│   │   └── authStore.ts                    # Zustand store for auth state
│   ├── types/
│   │   └── api.ts                          # API response types
│   └── constants/
│       ├── colors.ts                       # Theme colors
│       └── layout.ts                       # Spacing, sizing constants
├── __tests__/
│   └── features/home/
│       └── HomeContent.test.tsx
├── e2e/
│   └── home.yaml                           # Maestro E2E flow
├── assets/                                 # Images, fonts
├── app.json                                # Expo config
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── package.json
├── .gitignore
├── .env.example
├── README.md
└── .github/workflows/ci.yml
```

## Key configuration

### app.json / app.config.ts
- App name, slug, version
- iOS/Android bundle identifiers
- Expo plugins for native modules
- Environment-specific config via `app.config.ts`

### tsconfig.json
- `strict: true`
- Path alias: `@/*` → `src/*`
- `jsx: react-jsx`

### Package scripts
- `npx expo start` — Dev server
- `npx expo run:ios` — iOS build
- `npx expo run:android` — Android build
- `npx jest` — Unit/component tests
- `maestro test e2e/` — E2E tests
- `eas build` — Cloud build
- `eas submit` — Store submission

## Architecture pattern

```
Screen (Expo Router) → Feature Component → Custom Hook → API Client / Store
```

- **Screens are thin**: Route files in `app/` delegate to feature components in `src/features/`
- **Hooks for logic**: Every screen has a custom hook that encapsulates data fetching, mutations, and navigation
- **TanStack Query for server state**: No manual loading/error state management
- **Zustand for client state**: Minimal global state (auth, theme, preferences)
