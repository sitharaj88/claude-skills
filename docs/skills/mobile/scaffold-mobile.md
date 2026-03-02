# Scaffold Mobile

Scaffolds production-ready mobile projects with architecture, navigation, dependency injection, and CI/CD pipelines. Each generated project follows platform-specific best practices with a feature-based directory structure, quality tooling, and everything needed to start building immediately.

## Quick Start

```bash
# Scaffold an Android app
/scaffold-mobile android my-app

# Scaffold a Flutter app
/scaffold-mobile flutter my-app

# Scaffold an iOS app
/scaffold-mobile ios my-app

# Scaffold a React Native app
/scaffold-mobile react-native my-app
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `platform` | `$0` | Yes | Target platform: `android`, `ios`, `react-native`, or `flutter` |
| `project-name` | `$1` | Yes | Name for the project directory and application (kebab-case recommended) |

::: tip
The project name is used as both the directory name and the application identifier base. Use kebab-case for the name -- the skill will convert it to the appropriate format for each platform (e.g., `com.example.myapp` for Android, `MyApp` for display names).
:::

## How It Works

1. **Parses arguments** -- Validates the platform selection and project name, resolving naming conventions for the target platform.
2. **Platform-specific scaffolding** -- Uses built-in templates from the `templates/` directory (`android.md`, `ios.md`, `react-native.md`, `flutter.md`) to generate the project structure.
3. **Generates core files** -- Creates foundational files including `.gitignore`, `.editorconfig`, CI workflow, `README.md`, and environment configuration.
4. **Architecture setup** -- Establishes a feature-based architecture with core modules, shared utilities, navigation infrastructure, and dependency injection wiring.
5. **Quality tooling** -- Configures linting, formatting, static analysis, and testing infrastructure appropriate to the platform.
6. **Initializes and verifies** -- Runs the build tool to install dependencies, confirms the project compiles, and verifies that the test suite executes successfully.
7. **Summary** -- Presents a summary of all generated files, configured tools, and next steps for development.

## Templates

The skill uses platform-specific template files to drive generation:

| Template File | Platform | Description |
|--------------|----------|-------------|
| `android.md` | Android | Kotlin + Compose project with Gradle KTS build files |
| `ios.md` | iOS | Swift + SwiftUI project with SPM or CocoaPods |
| `react-native.md` | React Native | TypeScript + Expo project with modular structure |
| `flutter.md` | Flutter | Dart project with feature-first package organization |

## Platform Architecture

| Platform | Architecture | State Management | Navigation | DI | Testing |
|----------|-------------|-----------------|------------|-----|---------|
| **Android** | MVVM + Clean Architecture | ViewModel + StateFlow | Navigation Compose | Hilt | JUnit5 + MockK + Compose UI Test |
| **iOS** | MVVM + Clean Architecture | Combine / `@Observable` | NavigationStack | Swift DI / Swinject | XCTest + ViewInspector |
| **React Native** | Feature modules + Hooks | Zustand / Redux Toolkit | Expo Router | Context + custom hooks | Jest + RNTL + Detox |
| **Flutter** | BLoC + Clean Architecture | BLoC / Cubit | GoRouter | get_it + injectable | flutter_test + bloc_test |

## Generated Structure

Every scaffolded project includes a feature-based directory layout. Here is the Android example:

```
my-app/
  .github/
    workflows/
      ci.yml                    # GitHub Actions CI pipeline
  .gitignore
  .editorconfig
  app/
    src/main/
      java/com/example/myapp/
        core/
          di/                   # Hilt modules
          network/              # Retrofit setup, interceptors
          database/             # Room database, DAOs
          ui/
            theme/              # Material 3 theme, typography, colors
            components/         # Shared composables
        features/
          home/                 # Example feature module
            HomeScreen.kt
            HomeViewModel.kt
            HomeNavigation.kt
        navigation/
          AppNavHost.kt         # Root navigation graph
          Screen.kt             # Route definitions
        MyApp.kt                # Application class
    build.gradle.kts            # App-level build configuration
  build.gradle.kts              # Root build configuration
  gradle.properties
  settings.gradle.kts
```

## Example

Running the following command:

```bash
/scaffold-mobile flutter my-app
```

Produces a complete Flutter project:

```
my-app/
  .github/workflows/ci.yml
  .gitignore
  .editorconfig
  analysis_options.yaml          # Strict lint rules
  pubspec.yaml                   # Dependencies with BLoC, GoRouter, get_it
  lib/
    app.dart                     # MaterialApp with GoRouter
    core/
      di/
        injection.dart           # get_it service locator setup
      network/
        api_client.dart          # Dio HTTP client
      theme/
        app_theme.dart           # Material 3 theme data
    features/
      home/
        bloc/
          home_bloc.dart         # BLoC with events and states
        view/
          home_page.dart         # Screen widget
        widgets/                 # Feature-specific widgets
    l10n/
      app_en.arb                 # Localization strings
  test/
    features/home/
      bloc/home_bloc_test.dart   # BLoC unit test
  integration_test/
    app_test.dart                # Integration test entry point
```

After generation, the skill runs `flutter pub get`, verifies the build, executes the test suite, and runs `flutter analyze` to confirm everything is clean.

::: warning
This skill executes shell commands during scaffolding, including package installation, build verification, and static analysis. It will create a new directory in your current working directory. Make sure you are in the intended parent directory before running the command.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `fork` |
| **Allowed tools** | `Bash`, `Read`, `Write`, `Edit`, `Glob` |

This skill operates in fork context mode with shell access. It needs `Bash` to initialize the project, install dependencies, and verify the build. The `Glob` tool is used to discover template files during generation.
