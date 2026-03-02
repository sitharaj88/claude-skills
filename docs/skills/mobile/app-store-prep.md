# App Store Prep

Audits your mobile app for store compliance, generates store metadata, configures signing, bumps versions, and creates comprehensive release checklists. This skill covers both Google Play and Apple App Store requirements, catching common rejection reasons before you submit.

## Quick Start

```bash
# Prepare for both stores
/app-store-prep both 2.1.0

# Prepare for iOS App Store only
/app-store-prep ios

# Prepare for Google Play only with version
/app-store-prep android 3.0.0
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `platform` | `$0` | Yes | Target store: `android` (Google Play), `ios` (App Store), or `both` |
| `version` | `$1` | No | Version string for the release (e.g., `2.1.0`). If omitted, the current version is used and only the build number is incremented. |

::: tip
Run this skill early in your release cycle -- ideally before your final QA pass. The compliance audit catches issues like missing privacy manifests or incorrect permission declarations that can take time to fix.
:::

## How It Works

1. **Detects platform and version** -- Identifies the project type (native Android, native iOS, React Native, Flutter) and reads the current version from build configuration files.
2. **Compliance audit** -- Runs a comprehensive check against common rejection reasons, covering both universal requirements and platform-specific rules.
3. **Store metadata generation** -- Creates or updates store listing metadata files including descriptions, keywords, categories, and screenshot specifications.
4. **Version bump** -- Updates version numbers across all relevant configuration files (`build.gradle.kts`, `Info.plist`, `pubspec.yaml`, `package.json`, etc.).
5. **Release build configuration** -- Verifies signing configuration, ProGuard/R8 rules (Android), entitlements (iOS), and build variants are correctly set for production.
6. **Release notes** -- Generates release notes from recent commit history, formatted for each store's requirements.
7. **Pre-submission checklist** -- Produces a detailed checklist covering every step from final build to store submission.

## Compliance Checks

### Google Play Specific

| Check | Description | Severity |
|-------|-------------|----------|
| **Target API level** | Verifies `targetSdk` meets Google Play's current minimum requirement | Blocker |
| **Data safety form** | Checks for data collection declarations and privacy policy URL | Blocker |
| **64-bit support** | Confirms native libraries include `arm64-v8a` and `x86_64` ABIs | Blocker |
| **Deobfuscation mapping** | Verifies ProGuard/R8 mapping file generation is enabled | Warning |
| **App bundle format** | Confirms the project builds AAB (not just APK) for Play submission | Warning |
| **Content rating** | Checks for content rating questionnaire readiness | Warning |
| **Permissions justification** | Flags permissions that require additional justification in Play Console | Warning |

### App Store Specific

| Check | Description | Severity |
|-------|-------------|----------|
| **Privacy manifest** | Verifies `PrivacyInfo.xcprivacy` exists with required API declarations | Blocker |
| **Required device capabilities** | Checks `UIRequiredDeviceCapabilities` in Info.plist | Blocker |
| **App Transport Security** | Flags any ATS exceptions that may trigger review | Warning |
| **Entitlements** | Validates signing entitlements match declared capabilities | Blocker |
| **Launch storyboard** | Confirms a launch storyboard (not launch images) is configured | Warning |
| **IPv6 compatibility** | Checks for hardcoded IPv4 addresses in networking code | Warning |
| **IDFA usage** | Detects AdSupport or ATT framework usage and verifies declaration | Warning |

## Store Metadata

| Field | App Store Connect | Google Play Console |
|-------|------------------|-------------------|
| **App name** | 30 characters max | 30 characters max |
| **Subtitle / Short description** | 30 characters max | 80 characters max |
| **Description** | 4000 characters max | 4000 characters max |
| **Keywords** | 100 characters (comma-separated) | N/A (extracted from description) |
| **Category** | Primary + Secondary | Category + Tags |
| **Screenshots** | 6.7", 6.5", 5.5" iPhone + iPad sizes | Phone + 7" tablet + 10" tablet |
| **Privacy policy URL** | Required | Required |
| **Support URL** | Required | Required (email) |
| **What's New** | 4000 characters max | 500 characters max |

## Example

Running the following command in a Flutter project:

```bash
/app-store-prep both 2.1.0
```

The skill performs a full audit and generates:

```
store/
  android/
    release-notes/
      en-US.txt                  # Google Play release notes
    store-listing.json           # Title, descriptions, categorization
  ios/
    release-notes/
      en-US.txt                  # App Store What's New text
    app-store-metadata.json      # Name, subtitle, keywords, description
  screenshots/
    SCREENSHOT_SPECS.md          # Required sizes and guidelines

RELEASE_CHECKLIST.md             # Step-by-step submission checklist
```

The compliance audit output looks like:

```
--- Compliance Audit: Google Play ---
[PASS] Target SDK: 35 (minimum: 34)
[PASS] 64-bit libraries: arm64-v8a present
[PASS] App bundle: AAB build configured
[WARN] Data safety: No privacy policy URL found in build config
[PASS] ProGuard mapping: R8 mapping enabled

--- Compliance Audit: App Store ---
[PASS] Privacy manifest: PrivacyInfo.xcprivacy found
[PASS] Launch storyboard: LaunchScreen.storyboard configured
[WARN] ATS exception: localhost exception found (acceptable for debug)
[PASS] Entitlements: Push notifications entitlement matches capability
```

::: warning
This skill reads and modifies build configuration files (Gradle, Xcode project, pubspec.yaml). It will update version numbers and may modify signing configuration. Review all changes before building your release candidate, especially signing-related modifications.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `fork` |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Bash`, `Write`, `Edit` |

This skill operates in fork context mode with shell access. It needs `Bash` to inspect build configurations, validate signing setup, and generate release notes from git history. The `Grep` and `Glob` tools are used to scan the codebase for compliance issues.
