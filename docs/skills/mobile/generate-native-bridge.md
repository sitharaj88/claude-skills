# Generate Native Bridge

Creates platform bridges for cross-platform mobile frameworks -- React Native Turbo Modules, Flutter Platform Channels, and Kotlin Multiplatform shared code. The skill generates both the native (Android + iOS) and framework-side code, handles platform permissions, and produces tests for each layer.

## Quick Start

```bash
# Generate a camera bridge for React Native
/generate-native-bridge camera rn

# Generate a biometrics bridge for Flutter
/generate-native-bridge biometrics flutter

# Generate a Bluetooth bridge for KMP
/generate-native-bridge bluetooth kmp

# Generate a custom capability bridge
/generate-native-bridge custom rn
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `capability` | `$0` | Yes | Native capability to bridge: `camera`, `biometrics`, `notifications`, `bluetooth`, or `custom` |
| `framework` | `$1` | Yes | Target framework: `rn` (React Native), `flutter`, or `kmp` (Kotlin Multiplatform) |

::: tip
When using the `custom` capability, the skill will prompt you to describe the native API you want to bridge. This is useful for device-specific hardware features, proprietary SDKs, or platform APIs not covered by the built-in capabilities.
:::

## How It Works

1. **Parses request** -- Validates the capability and framework combination and determines which bridge pattern to apply.
2. **Detects framework version** -- Identifies the framework version and architecture (e.g., React Native New Architecture vs Legacy, Flutter plugin vs FFI) to generate the correct bridge style.
3. **Studies existing bridges** -- Reads any existing native modules or platform channels in the project to learn conventions for naming, error handling, and threading.
4. **Generates bridge code** -- Creates both the native platform implementations (Android in Kotlin, iOS in Swift) and the framework-side interface (TypeScript spec, Dart channel, or KMP expect/actual).
5. **Handles permissions** -- Adds required permission declarations to `AndroidManifest.xml` and `Info.plist`, including runtime permission request logic.
6. **Generates tests** -- Produces unit tests for the native implementations and integration tests for the bridge communication layer.
7. **Documentation** -- Creates inline documentation and a usage guide for the generated bridge.

## Bridge Types

| Bridge Type | Framework | Architecture | Use Case |
|------------|-----------|-------------|----------|
| **Turbo Module** | React Native | New Architecture (JSI) | High-performance synchronous access to native APIs |
| **Legacy Native Module** | React Native | Bridge (JSON) | Backward-compatible async native API access |
| **MethodChannel** | Flutter | Platform Channels | Request-response communication with native code |
| **EventChannel** | Flutter | Platform Channels | Streaming data from native to Dart (sensors, location) |
| **FFI** | Flutter | dart:ffi | Direct C/C++ library binding without message passing |
| **expect/actual** | KMP | Kotlin Multiplatform | Shared Kotlin interfaces with platform-specific implementations |

## Permission Mapping

| Capability | Android Permission | iOS Info.plist Key |
|-----------|-------------------|-------------------|
| **Camera** | `android.permission.CAMERA` | `NSCameraUsageDescription` |
| **Location** | `android.permission.ACCESS_FINE_LOCATION` | `NSLocationWhenInUseUsageDescription` |
| **Biometrics** | `android.permission.USE_BIOMETRIC` | `NSFaceIDUsageDescription` |
| **Notifications** | `android.permission.POST_NOTIFICATIONS` (API 33+) | Push entitlement + `UNUserNotificationCenter` |
| **Bluetooth** | `android.permission.BLUETOOTH_CONNECT` (API 31+) | `NSBluetoothAlwaysUsageDescription` |

## Example

Suppose you have a React Native project using the New Architecture and run:

```bash
/generate-native-bridge camera rn
```

The skill examines your project, then generates:

```
specs/
  NativeCameraModule.ts          # Turbo Module TypeScript spec

android/app/src/main/java/com/myapp/camera/
  CameraModule.kt               # Android Turbo Module implementation
  CameraPackage.kt              # React package registration

ios/MyApp/Camera/
  CameraModule.swift             # iOS Turbo Module implementation
  CameraModule.mm                # Objective-C++ bridge registration

src/modules/camera/
  useCamera.ts                   # React hook wrapping the native module
  camera.types.ts                # TypeScript type definitions
```

The generated `CameraModule.kt` (Android) includes:

```kotlin
class CameraModule(reactContext: ReactApplicationContext) :
    NativeCameraModuleSpec(reactContext) {

    override fun getName() = NAME

    @ReactMethod
    override fun capturePhoto(options: ReadableMap, promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "Activity is not available")
            return
        }
        // Camera capture implementation with permission check
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            promise.reject("PERMISSION_DENIED", "Camera permission not granted")
            return
        }
        // ... capture logic
    }

    companion object {
        const val NAME = "CameraModule"
    }
}
```

::: warning
Native bridge code requires platform-specific build tools. Ensure you have Android Studio (for Kotlin compilation) and Xcode (for Swift compilation) configured before testing the generated bridges. The skill updates manifest and plist files but does not run native builds automatically.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit` |

This skill operates in inline context mode, meaning it runs within your current conversation and has read/write access to your project files. It generates native source files, updates platform configuration (manifests, plists), and creates TypeScript or Dart interface code without executing shell commands.
