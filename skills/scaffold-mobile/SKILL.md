---
name: scaffold-mobile
description: Scaffolds production-ready mobile projects for Android (Kotlin/Compose), iOS (Swift/SwiftUI), React Native (Expo or bare), and Flutter with architecture, navigation, CI/CD, and testing setup. Use when the user wants to create a new mobile app, start a mobile project, or initialize a mobile codebase.
argument-hint: "[platform: android|ios|react-native|flutter] [project-name]"
context: fork
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob
user-invocable: true
---

## Instructions

You are a mobile project architect. Scaffold a complete, production-ready mobile project for `$ARGUMENTS`.

### Step 1: Parse arguments

- `$0` = Platform (required): `android`, `ios`, `react-native`, `flutter`
- `$1` = Project name (required)

### Step 2: Platform-specific scaffolding

Read the appropriate template for detailed guidance:
- Android: [templates/android.md](templates/android.md)
- iOS: [templates/ios.md](templates/ios.md)
- React Native: [templates/react-native.md](templates/react-native.md)
- Flutter: [templates/flutter.md](templates/flutter.md)

### Step 3: Core files (all mobile platforms)

Every mobile project gets:

**`.gitignore`** — Platform-appropriate ignores (build dirs, IDE files, pods, generated code)

**`.editorconfig`** — Consistent formatting

**`README.md`** — Sections: Overview, Prerequisites, Setup, Running, Testing, Building, Deployment

**`.github/workflows/ci.yml`** — Platform-appropriate CI pipeline

**`fastlane/`** (if applicable) — Fastlane setup for build/deployment automation

### Step 4: Architecture setup

Scaffold the chosen architecture with:
- Feature-based directory structure (not layer-based)
- Navigation framework configured with example routes
- State management wired with example feature
- Dependency injection container configured
- Network layer with example API client
- Example feature demonstrating the full pattern (screen + logic + data)

### Step 5: Quality tooling

- **Linting**: Platform linter configured with strict rules
- **Formatting**: Code formatter configured
- **Testing**: Unit test, widget/UI test, and integration test examples
- **Static analysis**: Platform-specific analysis tools

### Step 6: Initialize and verify

1. Create the project using platform CLI tools
2. Apply the architecture scaffolding
3. Build the project — verify it compiles
4. Run example tests — verify they pass
5. Run linter — verify no warnings

### Step 7: Summary

```markdown
## Mobile project scaffolded: [name]

### Platform
[Android/iOS/React Native/Flutter] with [architecture]

### Structure
[tree output of key directories]

### Included
- Architecture: [MVVM/Clean/BLoC/etc.]
- Navigation: [framework]
- State management: [framework]
- DI: [framework]
- Testing: [framework]
- CI/CD: [GitHub Actions + Fastlane]
- Linting: [tool]

### Next steps
1. [Platform-specific setup steps]
2. Start building features in `features/` directory
3. Follow the example feature pattern
```

### Guidelines

- Use the LATEST stable versions of all dependencies
- Feature-based architecture (group by feature, not by layer)
- Include ONE complete example feature that demonstrates the full pattern
- Every generated file should be functional — no empty placeholders
- Configure strict linting from day one
- Include proper `.gitignore` — mobile projects have many generated files
