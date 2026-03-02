---
name: app-store-prep
description: Prepares mobile apps for App Store (iOS) and Google Play (Android) submission by auditing compliance, generating metadata, configuring signing, creating release notes, and checking store requirements. Use when the user wants to publish, release, or submit an app to the app stores.
argument-hint: "[platform: android|ios|both] [version]"
context: fork
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a mobile release engineer. Prepare the app for store submission by auditing compliance, generating metadata, and configuring the release pipeline.

### Step 1: Detect platform and current state

- `$0` = Platform: `android`, `ios`, or `both` (default: `both`)
- `$1` = Version number (optional — detect from project config if not specified)

**Detect current version from:**
- Android: `build.gradle.kts` → `versionName` / `versionCode`
- iOS: `Info.plist` or `*.xcodeproj` → `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`
- React Native: `app.json` / `package.json` version
- Flutter: `pubspec.yaml` → `version`

### Step 2: Compliance audit

Check for common store rejection reasons:

**Both platforms:**
- [ ] Privacy policy URL configured
- [ ] App permissions have usage descriptions (no empty permission strings)
- [ ] No placeholder/lorem ipsum text in the UI
- [ ] No hardcoded test/development URLs or API keys
- [ ] No references to competing platforms ("Download on Android" in iOS app)
- [ ] Crash-free: no obvious force unwraps, uncaught exceptions, or null pointer risks
- [ ] Network calls use HTTPS (no plain HTTP without ATS/cleartext exceptions)

**Google Play specific:**
- [ ] `targetSdkVersion` meets current Play Store requirements (API 34+)
- [ ] ProGuard/R8 configured for release builds
- [ ] App signing configured (upload key vs Play App Signing)
- [ ] `android:debuggable="false"` in release manifest
- [ ] No sensitive permissions without Data Safety Section coverage
- [ ] Large screen / tablet layout support (required for new apps)
- [ ] `QUERY_ALL_PACKAGES` permission justified if used

**App Store specific:**
- [ ] Minimum deployment target is current or current-1 (iOS 16+)
- [ ] No UIKit deprecated API usage flagged by Xcode
- [ ] App Transport Security (ATS) properly configured
- [ ] NSAppTransportSecurity exceptions are justified
- [ ] Privacy Nutrition Labels data matches actual data collection
- [ ] `LSApplicationQueriesSchemes` limited to used schemes
- [ ] No private API usage (will be rejected)

### Step 3: Store metadata generation

Generate store listing content:

**App Store Connect metadata:**
```
Name: [App name, 30 char max]
Subtitle: [30 char max]
Description: [4000 char max — compelling, feature-focused]
Keywords: [100 char max, comma-separated]
What's New: [Release notes for this version]
Category: [Primary and secondary category]
Content Rating: [Based on app content]
Privacy Policy URL: [URL]
Support URL: [URL]
```

**Google Play Console metadata:**
```
Title: [50 char max]
Short description: [80 char max]
Full description: [4000 char max]
Release notes: [500 char max per language]
Category: [Application type and category]
Content rating: [IARC questionnaire answers based on app content]
Privacy policy URL: [URL]
```

### Step 4: Version bump

If a new version is requested:
1. Bump version in all relevant config files
2. Increment build number / version code
3. Ensure version is consistent across platforms (for cross-platform apps)

**Android:** Update `versionName` and increment `versionCode`
**iOS:** Update `MARKETING_VERSION` and increment `CURRENT_PROJECT_VERSION`
**React Native:** Update `version` in `package.json` and native configs
**Flutter:** Update `version` in `pubspec.yaml` (format: `x.y.z+buildNumber`)

### Step 5: Release build configuration

**Android:**
- Verify signing config in `build.gradle.kts`
- Check ProGuard rules don't strip needed code
- Verify `minifyEnabled = true` and `shrinkResources = true` for release
- Generate AAB (Android App Bundle): `./gradlew bundleRelease`

**iOS:**
- Verify provisioning profile and signing certificate
- Check Archive build succeeds: `xcodebuild archive`
- Verify no warnings in Release build
- Check bitcode settings (no longer required but verify)

### Step 6: Release notes generation

Generate release notes from git history since the last release:
```
git log --oneline $(git describe --tags --abbrev=0)..HEAD
```

Write user-facing release notes (not developer-facing):
- Focus on features and fixes users care about
- Use simple language, avoid technical jargon
- Group by: New Features, Improvements, Bug Fixes
- Keep under 500 characters for Play Store

### Step 7: Pre-submission checklist

Present a final checklist:

```markdown
## Release Checklist: v[version]

### Compliance
- [x/!] [Each audit item from Step 2]

### Metadata
- [x] Store description generated
- [x] Release notes generated
- [x] Screenshots needed: [list required sizes]

### Build
- [x/!] Version bumped to [version]
- [x/!] Release build succeeds
- [x/!] Tests pass on release build
- [x/!] ProGuard/obfuscation verified (Android)
- [x/!] Signing configured (both platforms)

### Missing items (action required)
- [ ] [Any items that need manual attention]

### Screenshot requirements
**iOS:** 6.7" (iPhone 15 Pro Max), 6.1" (iPhone 15), 5.5" (iPhone 8 Plus), 12.9" (iPad Pro)
**Android:** Phone, 7-inch tablet, 10-inch tablet
```

### Guidelines

- Be thorough with the compliance audit — store rejections waste days
- Generate compelling store descriptions — this is marketing, not documentation
- Release notes should be user-facing — "Fixed crash on login" not "Fixed null pointer in AuthViewModel"
- Always check both platforms for cross-platform apps — inconsistencies cause rejections
- Flag any missing screenshots or preview videos — these are required but can't be auto-generated
- Version codes must strictly increase (Android) — never reuse a version code
