# Generate Screen

Creates mobile screens with navigation, state management, and platform-native UI for Compose, SwiftUI, React Native, and Flutter. The skill detects your mobile platform, studies your existing screens to learn architectural patterns, and generates a complete screen module -- component, view model or state holder, styles, and navigation registration -- that drops seamlessly into your codebase.

## Quick Start

```bash
# Generate a list screen
/generate-screen OrderHistory list

# Generate an authentication screen
/generate-screen LoginScreen auth

# Generate a dashboard with default type
/generate-screen Analytics dashboard

# Generate a settings screen
/generate-screen AppPreferences settings
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `ScreenName` | `$0` | Yes | Name of the screen in **PascalCase** (e.g., `OrderHistory`, `LoginScreen`) |
| `type` | `$1` | No | Screen type: `list`, `detail`, `form`, `settings`, `auth`, or `dashboard` |

::: tip
The screen name must be in PascalCase. The skill will adapt casing for filenames and class names to match your platform's conventions -- for example, `order_history_screen.dart` in Flutter or `OrderHistoryScreen.kt` in Android.
:::

## How It Works

1. **Detects platform** -- Identifies whether the project is Android (Compose), iOS (SwiftUI), React Native, or Flutter by inspecting build files, project structure, and dependencies.
2. **Studies existing screens** -- Reads 2-3 existing screens in your project to learn patterns including navigation setup, state management approach, dependency injection, and file organization.
3. **Parses request** -- Resolves the screen name and type, determining which template pattern to apply and what data-layer stubs to include.
4. **Generates screen files** -- Creates all files for the screen module: the UI component, view model or state holder, styles or theme extensions, and navigation route definition.
5. **Registers in navigation** -- Adds the new screen to your app's navigation graph, router configuration, or route table so it is immediately reachable.
6. **Verifies correctness** -- Confirms that all imports resolve, types are correct, and the navigation registration is valid.

## Platform Support

| Platform | Architecture | UI Layer | State Management | Navigation |
|----------|-------------|----------|-----------------|------------|
| **Android** | MVVM | Jetpack Compose | ViewModel + StateFlow | Navigation Compose |
| **iOS** | MVVM | SwiftUI | ObservableObject / `@Observable` | NavigationStack |
| **React Native** | Hooks | React Native components | useState / Zustand / Redux | Expo Router / React Navigation |
| **Flutter** | BLoC | Flutter Widgets | BLoC / Cubit | GoRouter |

## Screen Types

| Type | Description | Generated Elements |
|------|-------------|-------------------|
| `list` | Scrollable list with pull-to-refresh, empty state, and pagination | List component, item row, loading/error states, data fetching logic |
| `detail` | Single-item detail view with sections and actions | Header, content sections, action buttons, back navigation |
| `form` | Input form with validation and submission | Form fields, validation rules, submit handler, success/error feedback |
| `settings` | Grouped preference toggles and options | Setting groups, toggle switches, selection pickers, persistence logic |
| `auth` | Login or registration screen | Input fields, auth provider integration, error display, session handling |
| `dashboard` | Multi-widget overview with summary cards | Card grid, chart placeholders, summary statistics, refresh mechanism |

## Example

Suppose you have an Android Compose project and run:

```bash
/generate-screen OrderHistory list
```

The skill examines your existing screens, then generates:

```
feature/orderhistory/
  OrderHistoryScreen.kt          # Compose UI with LazyColumn, pull-to-refresh, empty state
  OrderHistoryViewModel.kt       # ViewModel with StateFlow, pagination, data loading
  OrderHistoryNavigation.kt      # NavGraphBuilder extension for route registration
  OrderHistoryItem.kt            # Individual row composable
  OrderHistoryUiState.kt         # Sealed interface for Loading, Success, Error states
```

The generated `OrderHistoryScreen.kt` follows the MVVM patterns found in your codebase -- matching your preferred Hilt injection style, Compose theming conventions, and navigation argument handling.

::: warning
If the skill cannot find at least one existing screen to use as a reference, it will fall back to sensible defaults for the detected platform. Review the generated files to ensure they align with your project standards, particularly around dependency injection and navigation setup.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit` |

This skill operates in inline context mode, meaning it runs within your current conversation and has read/write access to your project files. It does not execute shell commands -- it generates source files and updates navigation configuration only.
