---
name: generate-screen
description: Generates mobile screens/pages with navigation integration, state management, and platform-native UI patterns for Android (Jetpack Compose), iOS (SwiftUI), React Native, and Flutter. Use when the user asks to create a new screen, page, view, or mobile UI flow.
argument-hint: "[ScreenName] [type: list|detail|form|settings|auth|dashboard]"
allowed-tools: Read, Grep, Glob, Write, Edit
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a senior mobile engineer. Generate a complete, production-quality screen for `$ARGUMENTS`, precisely matching the project's mobile platform and conventions.

### Step 1: Detect the mobile platform

Search for platform indicators:

**Android Native (Kotlin)**
- `build.gradle.kts` or `build.gradle` with Android plugin
- `AndroidManifest.xml`
- Jetpack Compose: `androidx.compose` dependencies
- XML Views: `res/layout/*.xml` files
- Determine: Compose vs XML Views, Material 2 vs Material 3

**iOS Native (Swift)**
- `*.xcodeproj` or `*.xcworkspace`
- SwiftUI: `import SwiftUI`, `struct *View: View`
- UIKit: `UIViewController` subclasses, storyboards, XIBs
- Determine: SwiftUI vs UIKit, programmatic vs storyboard

**React Native**
- `react-native` in `package.json`
- Expo: `expo` in `package.json`, `app.json` with expo config
- Determine: Expo vs bare RN, navigation library (React Navigation, Expo Router)

**Flutter**
- `pubspec.yaml` with `flutter` SDK dependency
- `lib/` directory with `.dart` files
- Determine: state management (BLoC, Riverpod, Provider, GetX, MobX)

### Step 2: Study existing screen patterns

Find 2-3 existing screens. For each, analyze:

**File structure:**
- Single file per screen vs directory (screen + viewmodel/bloc + widgets)
- File naming: `PascalCase.kt`, `snake_case.dart`, `PascalCase.swift`, `PascalCase.tsx`
- Co-located tests, viewmodels, blocs, or state files

**Architecture pattern:**
- **Android**: MVVM with ViewModel, MVI, Clean Architecture layers
- **iOS**: MVVM with ObservableObject, TCA (The Composable Architecture), VIPER
- **React Native**: Component + hook pattern, Redux slice, MobX store
- **Flutter**: BLoC pattern, Riverpod providers, StatefulWidget, GetX controller

**Navigation pattern:**
- **Android**: Navigation Component routes, Compose Navigation `NavHost`
- **iOS**: `NavigationStack`/`NavigationLink`, `UINavigationController`, coordinator pattern
- **React Native**: React Navigation stack/tab/drawer, Expo Router file-based routing
- **Flutter**: GoRouter, Navigator 2.0, auto_route, GetX routing

**UI patterns:**
- Design system: Material Design, Cupertino, custom components
- Theming: how colors, typography, spacing are applied
- Loading/error/empty states: how each state is handled
- List rendering: `LazyColumn`, `List`, `FlatList`, `ListView.builder`

**Dependency injection:**
- **Android**: Hilt/Dagger, Koin, manual DI
- **iOS**: Environment objects, dependency containers
- **React Native**: Context providers, prop drilling
- **Flutter**: Provider, get_it, Riverpod

### Step 3: Parse the screen request

From `$ARGUMENTS`:
- `$0` = Screen name (e.g., `UserProfile`, `OrderHistory`, `Settings`)
- `$1` = Optional screen type hint:
  - `list` — Scrollable list with items, pull-to-refresh, pagination
  - `detail` — Single entity detail view with sections
  - `form` — Input form with validation and submission
  - `settings` — Settings/preferences with toggles and navigation rows
  - `auth` — Login/signup with input fields, validation, OAuth buttons
  - `dashboard` — Summary view with cards, charts, quick actions

If no type specified, infer from the screen name.

### Step 4: Generate screen files

Create all files following detected patterns:

#### Android (Jetpack Compose)

```
feature/screenname/
├── ScreenNameScreen.kt          # @Composable screen
├── ScreenNameViewModel.kt       # ViewModel with UiState
├── ScreenNameUiState.kt         # Sealed interface for states
└── navigation/
    └── ScreenNameNavigation.kt  # NavGraphBuilder extension
```

**Screen composable:**
- Accept `ViewModel` via `hiltViewModel()` or project's DI pattern
- Collect state with `collectAsStateWithLifecycle()`
- Handle Loading/Success/Error states
- Preview annotations with sample data

**ViewModel:**
- Expose `UiState` via `StateFlow`
- Handle user actions via sealed `Event` class or function params
- Use `viewModelScope` for coroutines
- Inject repository/use case via constructor

#### iOS (SwiftUI)

```
Features/ScreenName/
├── ScreenNameView.swift         # SwiftUI View
├── ScreenNameViewModel.swift    # ObservableObject
└── ScreenNameModel.swift        # Data models (if needed)
```

**View:**
- `@StateObject` or `@ObservedObject` for ViewModel
- `NavigationStack` integration if applicable
- `.task {}` or `.onAppear {}` for data loading
- Preview provider with sample data

**ViewModel:**
- `@Published` properties for state
- `@MainActor` for UI updates
- Async/await for data fetching
- Structured concurrency with `Task`

#### React Native

```
screens/ScreenName/
├── ScreenNameScreen.tsx         # Screen component
├── useScreenName.ts             # Custom hook for logic
├── ScreenName.styles.ts         # StyleSheet (or styled-components)
└── ScreenName.types.ts          # TypeScript interfaces
```

**Screen component:**
- Typed navigation props (`NativeStackScreenProps` or Expo Router params)
- Custom hook for business logic separation
- `SafeAreaView` wrapper
- Handle keyboard avoidance for forms
- Loading/error states with proper UX

**Custom hook:**
- Data fetching (React Query/SWR or fetch)
- Form state (React Hook Form or useState)
- Navigation actions
- Return typed state and handlers

#### Flutter

```
lib/features/screen_name/
├── screen_name_screen.dart      # Screen widget
├── screen_name_state.dart       # State class (BLoC state / Riverpod state)
├── screen_name_controller.dart  # BLoC / Controller / Notifier
└── widgets/
    └── screen_name_body.dart    # Extracted body widget
```

**Screen widget:**
- `BlocProvider`/`ProviderScope` wrapper (per project pattern)
- `BlocBuilder`/`Consumer` for state rendering
- Handle loading/error/data states
- Scaffold with AppBar matching project theme

**State management:**
- Immutable state class with `copyWith`
- Events/actions as sealed classes (BLoC) or methods (Riverpod)
- Repository injection for data access

### Step 5: Navigation integration

Register the new screen in the navigation system:
- **Android**: Add route to `NavHost` or navigation graph
- **iOS**: Add to `NavigationStack` or router
- **React Native**: Add to navigator stack or Expo Router file-based route
- **Flutter**: Add route to `GoRouter` config or navigator

Present the navigation registration as a separate change for user approval.

### Step 6: Verify

- Check all imports resolve correctly
- Verify type safety (no `any`, no force unwraps unless project uses them)
- Confirm navigation route doesn't conflict with existing routes
- Ensure the screen handles all states: loading, data, error, empty

### Guidelines

- Match the platform's design guidelines: Material 3 for Android, Human Interface Guidelines for iOS
- Always handle loading, error, and empty states — never assume data is available
- Include accessibility: content descriptions (Android), accessibility labels (iOS), accessible props (RN), semantics (Flutter)
- Use the platform's native patterns — don't fight the framework
- Keep screens thin — business logic belongs in ViewModel/BLoC/hook, not the UI layer
- For forms: include real-time validation, proper keyboard types, and clear error messages
