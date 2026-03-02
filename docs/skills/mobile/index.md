# Mobile Development Skills

Six skills covering the complete mobile development lifecycle across all major platforms.

<div class="badge-row">
  <span class="badge">Android (Kotlin/Compose)</span>
  <span class="badge">iOS (Swift/SwiftUI)</span>
  <span class="badge">React Native (Expo)</span>
  <span class="badge">Flutter (Dart)</span>
</div>

<div class="skill-grid">
  <a href="generate-screen" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Generate Screen</h3>
    <span class="command">/generate-screen [Name] [type]</span>
    <p>Creates mobile screens with navigation, state management, and platform-native UI patterns.</p>
  </a>
  <a href="scaffold-mobile" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Scaffold Mobile</h3>
    <span class="command">/scaffold-mobile [platform] [name]</span>
    <p>Scaffolds production-ready mobile projects with architecture, navigation, DI, and CI/CD.</p>
  </a>
  <a href="mobile-test-writer" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Mobile Test Writer</h3>
    <span class="command">/mobile-test-writer [file] [type]</span>
    <p>Generates Espresso, XCTest, RNTL/Detox, and Flutter widget/integration tests.</p>
  </a>
  <a href="generate-native-bridge" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Native Bridge</h3>
    <span class="command">/generate-native-bridge [capability]</span>
    <p>Creates RN Turbo Modules, Flutter Platform Channels, and KMP shared code.</p>
  </a>
  <a href="app-store-prep" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>App Store Prep</h3>
    <span class="command">/app-store-prep [platform]</span>
    <p>Audits compliance, generates store metadata, configures signing, and creates release checklists.</p>
  </a>
  <a href="mobile-ci-setup" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Mobile CI Setup</h3>
    <span class="command">/mobile-ci-setup [platform]</span>
    <p>Sets up CI/CD with GitHub Actions, Fastlane, and EAS Build automation.</p>
  </a>
</div>

## Platform Detection

All mobile skills auto-detect your platform:

| Indicator | Platform |
|-----------|----------|
| `build.gradle.kts` + `AndroidManifest.xml` | Android Native |
| `*.xcodeproj` + `import SwiftUI` | iOS Native |
| `react-native` in `package.json` | React Native |
| `pubspec.yaml` with Flutter SDK | Flutter |

## Architecture Support

Each platform uses idiomatic architecture:

| Platform | Architecture | State | Navigation | DI |
|----------|-------------|-------|------------|-----|
| Android | MVVM + Clean | ViewModel + StateFlow | Compose Navigation | Hilt |
| iOS | MVVM | @Observable | NavigationStack | Environment |
| React Native | Hooks | TanStack Query + Zustand | Expo Router | Context |
| Flutter | BLoC / Riverpod | BLoC State / Riverpod | GoRouter | get_it |

## Screen Types

The `/generate-screen` skill supports these screen variants:

| Type | What It Generates |
|------|-------------------|
| `list` | Scrollable list with pull-to-refresh and pagination |
| `detail` | Single entity detail view with sections |
| `form` | Input form with validation and submission |
| `settings` | Settings/preferences with toggles and navigation |
| `auth` | Login/signup with validation and OAuth |
| `dashboard` | Summary view with cards and quick actions |
