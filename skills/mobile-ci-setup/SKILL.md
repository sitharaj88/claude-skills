---
name: mobile-ci-setup
description: Sets up CI/CD pipelines for mobile apps with build, test, signing, and deployment automation using GitHub Actions, Fastlane, EAS Build, or Codemagic. Supports Android, iOS, React Native, and Flutter. Use when the user wants to set up mobile CI/CD, automate builds, configure Fastlane, or set up automated app deployment.
argument-hint: "[platform: android|ios|react-native|flutter] [ci: github-actions|fastlane|eas|codemagic]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a mobile DevOps engineer. Set up a complete CI/CD pipeline for `$ARGUMENTS`.

### Step 1: Detect platform and CI tool

- `$0` = Platform: `android`, `ios`, `react-native`, `flutter`
- `$1` = CI tool preference (optional):
  - `github-actions` — GitHub Actions workflows (default)
  - `fastlane` — Fastlane for build/deploy + GitHub Actions for trigger
  - `eas` — Expo Application Services (React Native / Expo only)
  - `codemagic` — Codemagic CI/CD

Auto-detect if not specified by checking for existing CI config, Fastlane directory, or Expo setup.

### Step 2: Study the project

Understand the build requirements:
- How is the project built? (`./gradlew`, `xcodebuild`, `npx expo`, `flutter build`)
- How are tests run? (`./gradlew test`, `xcodebuild test`, `jest`, `flutter test`)
- What's the linting setup? (`ktlint`, `swiftlint`, `eslint`, `flutter analyze`)
- Is there an existing CI config to extend?
- Are there environment variables or secrets needed?
- What's the deployment target? (TestFlight, Play Console, Firebase App Distribution)

### Step 3: Generate CI pipeline

#### GitHub Actions — Android

```yaml
# .github/workflows/android.yml
name: Android CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew ktlintCheck detekt

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew assembleRelease
      - uses: actions/upload-artifact@v4
        with:
          name: release-apk
          path: app/build/outputs/apk/release/
```

#### GitHub Actions — iOS

```yaml
# .github/workflows/ios.yml
name: iOS CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: swiftlint

  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          xcodebuild test \
            -project ProjectName.xcodeproj \
            -scheme ProjectName \
            -destination 'platform=iOS Simulator,name=iPhone 16' \
            -resultBundlePath TestResults

  build:
    needs: [lint, test]
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          xcodebuild archive \
            -project ProjectName.xcodeproj \
            -scheme ProjectName \
            -archivePath build/ProjectName.xcarchive \
            -destination 'generic/platform=iOS' \
            CODE_SIGNING_ALLOWED=NO
```

#### GitHub Actions — React Native

```yaml
# .github/workflows/react-native.yml
name: React Native CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage

  build-android:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - run: npm ci
      - run: cd android && ./gradlew assembleRelease

  build-ios:
    needs: lint-and-test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: cd ios && pod install
      - run: |
          xcodebuild build \
            -workspace ios/ProjectName.xcworkspace \
            -scheme ProjectName \
            -destination 'platform=iOS Simulator,name=iPhone 16' \
            CODE_SIGNING_ALLOWED=NO
```

#### GitHub Actions — Flutter

```yaml
# .github/workflows/flutter.yml
name: Flutter CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  analyze-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test --coverage

  build-android:
    needs: analyze-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter build apk --release

  build-ios:
    needs: analyze-and-test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter build ios --release --no-codesign
```

### Step 4: Fastlane setup (if requested or detected)

#### Android Fastfile

```ruby
# android/fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Run tests"
  lane :test do
    gradle(task: "test")
  end

  desc "Build and deploy to Play Store internal track"
  lane :deploy_internal do
    gradle(task: "bundleRelease")
    upload_to_play_store(
      track: "internal",
      aab: "app/build/outputs/bundle/release/app-release.aab",
      skip_upload_metadata: true,
      skip_upload_images: true
    )
  end

  desc "Promote internal to production"
  lane :promote_to_production do
    upload_to_play_store(
      track: "internal",
      track_promote_to: "production"
    )
  end
end
```

#### iOS Fastfile

```ruby
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Run tests"
  lane :test do
    run_tests(
      scheme: "ProjectName",
      device: "iPhone 16"
    )
  end

  desc "Build and deploy to TestFlight"
  lane :deploy_testflight do
    increment_build_number
    build_app(
      scheme: "ProjectName",
      export_method: "app-store"
    )
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end

  desc "Submit to App Store Review"
  lane :submit_review do
    deliver(
      submit_for_review: true,
      automatic_release: false,
      force: true
    )
  end
end
```

Generate corresponding `Appfile` and `Matchfile` (for iOS code signing with `match`).

### Step 5: Secrets and signing configuration

**Document required secrets** (don't generate actual values):

```markdown
## Required GitHub Secrets

### Android
- `ANDROID_KEYSTORE_BASE64` — Base64 encoded release keystore
- `ANDROID_KEYSTORE_PASSWORD` — Keystore password
- `ANDROID_KEY_ALIAS` — Key alias
- `ANDROID_KEY_PASSWORD` — Key password
- `PLAY_STORE_SERVICE_ACCOUNT_JSON` — Google Play service account (for Fastlane)

### iOS
- `APPLE_ID` — Apple ID email
- `APP_STORE_CONNECT_API_KEY_ID` — App Store Connect API key
- `APP_STORE_CONNECT_API_ISSUER_ID` — API issuer ID
- `APP_STORE_CONNECT_API_KEY` — API private key (p8 file content)
- `MATCH_PASSWORD` — Password for match certificate repo
- `MATCH_GIT_URL` — Git URL for match certificates

### General
- `FIREBASE_APP_ID_ANDROID` — For Firebase App Distribution (optional)
- `FIREBASE_APP_ID_IOS` — For Firebase App Distribution (optional)
```

### Step 6: Deploy workflow (release automation)

Generate a separate release workflow triggered by tags:

```yaml
on:
  push:
    tags:
      - 'v*'
```

This workflow:
1. Determines version from tag
2. Builds release artifacts for both platforms
3. Signs with production certificates
4. Deploys: Android to Play Store internal track, iOS to TestFlight
5. Creates GitHub Release with artifacts

### Step 7: Summary

```markdown
## CI/CD configured for [project-name]

### Pipelines
- **PR checks**: lint → test → build (both platforms)
- **Main branch**: lint → test → build → deploy to staging
- **Release tags**: build → sign → deploy to stores

### Files created
- `.github/workflows/ci.yml` — PR and main branch pipeline
- `.github/workflows/release.yml` — Release deployment
- `fastlane/Fastfile` — Build and deployment lanes
- `fastlane/Appfile` — App identifiers
- `fastlane/Matchfile` — iOS signing (if applicable)

### Setup steps
1. Add required secrets to GitHub repository settings
2. [Platform-specific setup steps]
3. Test with a PR to verify the CI pipeline works
```

### Guidelines

- CI should be fast: parallel jobs, dependency caching, incremental builds
- Always run lint and tests before building — fail fast
- Separate PR checks (build without signing) from release (build with signing)
- Use environment-specific build configs (staging, production)
- Cache aggressively: Gradle cache, CocoaPods cache, npm cache, pub cache
- Pin action versions for reproducibility (e.g., `actions/checkout@v4`, not `@latest`)
- Secret rotation: document how to rotate each secret
- Never echo secrets in CI logs — use masking
