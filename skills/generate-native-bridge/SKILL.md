---
name: generate-native-bridge
description: Generates native platform bridges for cross-platform mobile apps — React Native Native Modules (Turbo Modules), Flutter Platform Channels and FFI, and Kotlin Multiplatform shared code. Use when the user needs to access native platform APIs, create a native module, set up platform channels, or bridge native code to a cross-platform framework.
argument-hint: "[capability: camera|biometrics|notifications|bluetooth|custom] [platform: rn|flutter|kmp]"
allowed-tools: Read, Grep, Glob, Write, Edit
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a native mobile engineer specializing in platform bridges. Generate a complete, production-quality native bridge for `$ARGUMENTS`.

### Step 1: Parse the request

- `$0` = Capability to bridge (e.g., `camera`, `biometrics`, `notifications`, `bluetooth`, `nfc`, or a custom description)
- `$1` = Framework (optional — auto-detect if not specified):
  - `rn` — React Native (Turbo Module or legacy Native Module)
  - `flutter` — Flutter Platform Channel or FFI
  - `kmp` — Kotlin Multiplatform

### Step 2: Detect the cross-platform framework

If not specified in `$1`:
- **React Native**: `react-native` in `package.json`, check for New Architecture (`newArchEnabled`)
- **Flutter**: `pubspec.yaml` with `flutter` SDK
- **KMP**: `kotlin-multiplatform` plugin in `build.gradle.kts`

Also detect:
- React Native: Old Architecture vs New Architecture (Turbo Modules + Fabric)
- Flutter: MethodChannel vs dart:ffi preference
- Expo: Whether using Expo Modules API

### Step 3: Study existing bridges

Search for existing native modules/channels in the project:
- **RN**: `*.java`/`*.kt` in `android/`, `*.m`/`*.mm`/`*.swift` in `ios/`, `TurboModule` references
- **Flutter**: `MethodChannel` in `*.dart`, platform-specific code in `android/`/`ios/`
- **Expo**: `expo-modules-core` imports, `expo-module.config.json`

Match existing patterns for module registration, error handling, and type marshaling.

### Step 4: Generate the bridge

#### React Native — Turbo Module (New Architecture)

**JavaScript/TypeScript spec:**
```
specs/NativeModuleName.ts — TurboModule spec with typed methods
```

**Android (Kotlin):**
```
android/src/main/java/com/project/module/
├── ModuleNameModule.kt           # TurboModule implementation
├── ModuleNamePackage.kt          # ReactPackage registration
└── ModuleNameSpec.kt             # Generated spec (codegen)
```

**iOS (Swift/ObjC):**
```
ios/ModuleName/
├── ModuleName.swift              # Module implementation
├── ModuleName.mm                 # ObjC++ bridge for Swift
└── ModuleName-Bridging-Header.h  # Bridging header
```

**Implementation details:**
- Type-safe method signatures matching the spec
- Promise-based async methods for long operations
- Event emitters for callbacks/streaming data
- Proper error handling with coded errors
- Thread management: heavy work on background thread, UI on main thread

#### React Native — Legacy Native Module

Same structure but using `ReactContextBaseJavaModule` (Android) and `RCTBridgeModule` (iOS).

#### Flutter — Platform Channel

**Dart side:**
```dart
lib/src/platform/
├── module_name_platform.dart     # Abstract platform interface
├── module_name_method_channel.dart # MethodChannel implementation
└── module_name.dart              # Public API facade
```

**Android (Kotlin):**
```
android/src/main/kotlin/com/project/
└── ModuleNamePlugin.kt           # FlutterPlugin with MethodChannel handler
```

**iOS (Swift):**
```
ios/Classes/
└── ModuleNamePlugin.swift        # FlutterPlugin with MethodChannel handler
```

**Implementation details:**
- `MethodChannel` with type-safe codec
- `EventChannel` for streaming data (e.g., sensor updates, Bluetooth scan results)
- `BasicMessageChannel` for simple bidirectional communication
- Platform-specific permission handling
- Error codes and messages for all failure paths
- `pigeon` code generation for type-safe channels (if project uses it)

#### Flutter — FFI (for high-performance or C library bindings)

```dart
lib/src/ffi/
├── module_name_bindings.dart     # ffigen-generated bindings
└── module_name_ffi.dart          # Dart API wrapping raw FFI calls
```

With `ffigen` config in `pubspec.yaml` and C header files.

#### Kotlin Multiplatform

```
shared/src/
├── commonMain/kotlin/com/project/
│   └── ModuleName.kt             # expect declarations
├── androidMain/kotlin/com/project/
│   └── ModuleName.kt             # actual Android implementation
└── iosMain/kotlin/com/project/
    └── ModuleName.kt             # actual iOS implementation
```

### Step 5: Handle platform permissions

Generate permission handling code for the capability:

| Capability | Android | iOS |
|-----------|---------|-----|
| Camera | `CAMERA` in Manifest + runtime request | `NSCameraUsageDescription` in Info.plist |
| Location | `ACCESS_FINE_LOCATION` + runtime | `NSLocationWhenInUseUsageDescription` |
| Biometrics | `USE_BIOMETRIC` + BiometricPrompt | LAContext + FaceID usage description |
| Notifications | `POST_NOTIFICATIONS` (Android 13+) | UNUserNotificationCenter.requestAuthorization |
| Bluetooth | `BLUETOOTH_SCAN/CONNECT` + runtime | `NSBluetoothAlwaysUsageDescription` |

Include:
- Runtime permission request flow
- Permission denied / permanently denied handling
- Graceful degradation when capability is unavailable

### Step 6: Generate tests

**Android:**
- Unit test with mocked platform APIs
- Robolectric test for Android-specific behavior

**iOS:**
- XCTest with mocked system frameworks

**Cross-platform:**
- Mock the native bridge in JS/Dart tests
- Test the platform interface abstraction

### Step 7: Documentation

Generate inline documentation and a usage example:

```markdown
## Usage

### Installation
[Any native setup steps — Podfile, build.gradle additions]

### API
[Method signatures with parameter descriptions]

### Example
[Complete code example calling the native module from JS/Dart]

### Platform support
| Method | Android | iOS |
|--------|---------|-----|
| methodName | API 26+ | iOS 15+ |
```

### Guidelines

- Always handle both platforms (Android + iOS) — never leave one as a stub
- Handle the permission lifecycle completely — request, granted, denied, settings redirect
- Marshal complex types carefully — dates, byte arrays, nested objects are common pitfalls
- Include proper error codes — don't just throw generic errors
- Consider lifecycle: what happens when the app backgrounds/foregrounds during a native operation?
- Use the platform's preferred language: Kotlin for Android, Swift for iOS (avoid Java and Objective-C for new code)
- Test on both platforms — platform channels can silently fail if types don't match
