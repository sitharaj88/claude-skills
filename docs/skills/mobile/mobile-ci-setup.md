# Mobile CI Setup

Sets up CI/CD pipelines for mobile projects with GitHub Actions, Fastlane, EAS Build, or Codemagic. The skill generates build, test, sign, and deploy workflows tailored to your platform, including secret management and store deployment configuration.

## Quick Start

```bash
# Set up GitHub Actions for a Flutter project
/mobile-ci-setup flutter github-actions

# Set up EAS Build for React Native
/mobile-ci-setup react-native eas

# Set up Fastlane for iOS
/mobile-ci-setup ios fastlane

# Set up Codemagic for Android
/mobile-ci-setup android codemagic
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `platform` | `$0` | Yes | Target platform: `android`, `ios`, `react-native`, or `flutter` |
| `ci-tool` | `$1` | Yes | CI/CD tool: `github-actions`, `fastlane`, `eas`, or `codemagic` |

::: tip
You can combine CI tools. For example, use `github-actions` for your primary pipeline and add `fastlane` for deployment lanes. Run the skill twice with different CI tool arguments and it will detect the existing setup and integrate rather than overwrite.
:::

## How It Works

1. **Detects platform and CI tool** -- Identifies the project platform and validates compatibility with the selected CI tool.
2. **Studies project** -- Reads build configuration, dependency files, test setup, and existing CI configuration to understand the project structure.
3. **Generates CI pipeline** -- Creates workflow files with stages for linting, testing, building, and optional deployment, tuned to the platform's build requirements.
4. **Fastlane setup** -- If Fastlane is selected (or combined with another tool), generates `Fastfile`, `Appfile`, `Matchfile`, and platform-specific lanes for build, test, and deploy.
5. **Secrets and signing configuration** -- Documents required secrets, generates signing configuration templates, and sets up keystore or certificate references for the CI environment.
6. **Deploy workflow** -- Creates deployment workflows for store submission (Google Play internal track, TestFlight, EAS Submit) triggered by tags or manual dispatch.
7. **Summary** -- Presents all generated files, required secrets to configure, and next steps.

## Pipeline Stages

### GitHub Actions

| Platform | Lint | Test | Build | Deploy |
|----------|------|------|-------|--------|
| **Android** | `ktlint` + Android Lint | JUnit + Compose UI Test | `./gradlew assembleRelease` (signed AAB) | Play Console (internal track) via Fastlane or `r0adkll/upload-google-play` |
| **iOS** | SwiftLint | XCTest | `xcodebuild archive` + `exportArchive` | TestFlight via Fastlane or `apple-actions/upload-testflight-build` |
| **React Native** | ESLint + TypeScript check | Jest + Detox | `eas build` or `npx react-native build-android` / `xcodebuild` | EAS Submit or Fastlane |
| **Flutter** | `flutter analyze` + `dart format` | `flutter test` + integration_test | `flutter build appbundle` / `flutter build ipa` | Fastlane or `flutter-actions/setup-flutter` |

### Fastlane Lanes

| Lane | Description |
|------|-------------|
| `test` | Runs the full test suite with coverage reporting |
| `beta` | Builds and deploys to TestFlight (iOS) or internal track (Android) |
| `release` | Builds production, signs, and submits to the store |
| `screenshots` | Captures store screenshots using snapshot (iOS) or screengrab (Android) |
| `certificates` | Manages signing certificates via `match` (iOS) or keystore setup (Android) |

## Required Secrets

### Android Signing

| Secret | Description | Where to Get It |
|--------|-------------|----------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release keystore file | `base64 release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Password for the keystore | Set during keystore creation |
| `ANDROID_KEY_ALIAS` | Alias of the signing key | Set during keystore creation |
| `ANDROID_KEY_PASSWORD` | Password for the specific key alias | Set during keystore creation |
| `PLAY_SERVICE_ACCOUNT_JSON` | Google Play API service account credentials | Google Cloud Console > Service Accounts |

### iOS Signing

| Secret | Description | Where to Get It |
|--------|-------------|----------------|
| `IOS_CERTIFICATE_P12_BASE64` | Base64-encoded distribution certificate | Keychain Access > Export |
| `IOS_CERTIFICATE_PASSWORD` | Password for the P12 certificate | Set during export |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64-encoded provisioning profile | Apple Developer Portal |
| `MATCH_PASSWORD` | Encryption password for Fastlane Match (if using Match) | Set during `fastlane match init` |
| `APP_STORE_CONNECT_API_KEY` | App Store Connect API key (JSON) | App Store Connect > Users and Access > Keys |

### Store Credentials

| Secret | Description | Where to Get It |
|--------|-------------|----------------|
| `APPLE_ID` | Apple ID email for App Store submissions | Your Apple Developer account |
| `APP_SPECIFIC_PASSWORD` | App-specific password for Apple ID | appleid.apple.com > Security |
| `EXPO_TOKEN` | Expo access token for EAS Build and Submit | expo.dev > Account Settings > Access Tokens |

## Example

Running the following command in a Flutter project:

```bash
/mobile-ci-setup flutter github-actions
```

Generates the following CI/CD configuration:

```
.github/
  workflows/
    ci.yml                       # PR and push pipeline (lint, test, build)
    deploy-android.yml           # Android release to Play Store (manual dispatch)
    deploy-ios.yml               # iOS release to TestFlight (manual dispatch)

fastlane/
  Fastfile                       # Lanes: test, beta_android, beta_ios, release
  Appfile                        # App identifiers and credentials
  Matchfile                      # Match configuration for iOS signing (if iOS)

.github/
  SECRETS_SETUP.md               # Guide for configuring required secrets
```

The generated `ci.yml` includes:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true
      - run: flutter pub get
      - run: dart format --set-exit-if-changed .
      - run: flutter analyze --fatal-infos

  test:
    runs-on: ubuntu-latest
    needs: analyze
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true
      - run: flutter pub get
      - run: flutter test --coverage
      - uses: codecov/codecov-action@v4
        with:
          file: coverage/lcov.info

  build-android:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true
      - run: flutter pub get
      - run: flutter build appbundle --release

  build-ios:
    runs-on: macos-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true
      - run: flutter pub get
      - run: flutter build ios --release --no-codesign
```

::: warning
CI pipelines require secrets to be configured in your repository settings before signing and deployment workflows will succeed. The skill generates a `SECRETS_SETUP.md` guide with step-by-step instructions for each required secret. Do not commit actual signing keys or credentials to your repository.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Bash` |

This skill operates in inline context mode with shell access. It reads your project configuration to determine build settings, generates CI workflow files and Fastlane configuration, and may run commands to verify tool availability (e.g., `fastlane --version`, `eas --version`).
