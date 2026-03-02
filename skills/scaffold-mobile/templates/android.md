# Android Project Template (Kotlin + Jetpack Compose)

## Tech stack
- **Language**: Kotlin 2.x
- **UI**: Jetpack Compose with Material 3
- **Architecture**: MVVM + Clean Architecture (feature-based modules)
- **Navigation**: Compose Navigation (type-safe routes)
- **DI**: Hilt
- **Networking**: Retrofit + OkHttp + Kotlin Serialization
- **Async**: Kotlin Coroutines + Flow
- **Image loading**: Coil
- **Testing**: JUnit 5, MockK, Turbine, Compose UI Testing
- **Linting**: ktlint, detekt

## Directory structure

```
app/
├── src/main/
│   ├── java/com/example/projectname/
│   │   ├── App.kt                          # Application class with @HiltAndroidApp
│   │   ├── MainActivity.kt                 # Single Activity with Compose content
│   │   ├── navigation/
│   │   │   ├── AppNavHost.kt               # NavHost with all routes
│   │   │   └── Routes.kt                   # Sealed class/object for type-safe routes
│   │   ├── features/
│   │   │   └── home/
│   │   │       ├── HomeScreen.kt           # @Composable screen
│   │   │       ├── HomeViewModel.kt        # @HiltViewModel
│   │   │       └── HomeUiState.kt          # Sealed interface for UI states
│   │   ├── core/
│   │   │   ├── di/
│   │   │   │   ├── NetworkModule.kt        # Retrofit, OkHttp provider
│   │   │   │   └── RepositoryModule.kt     # Repository bindings
│   │   │   ├── network/
│   │   │   │   ├── ApiService.kt           # Retrofit interface
│   │   │   │   └── NetworkResult.kt        # Result wrapper for API calls
│   │   │   ├── data/
│   │   │   │   └── repository/             # Repository implementations
│   │   │   └── ui/
│   │   │       ├── theme/
│   │   │       │   ├── Theme.kt            # Material 3 theme
│   │   │       │   ├── Color.kt            # Color definitions
│   │   │       │   └── Type.kt             # Typography
│   │   │       └── components/             # Shared composables
│   │   └── util/                           # Extension functions, helpers
│   ├── res/
│   │   ├── values/
│   │   │   ├── strings.xml
│   │   │   └── themes.xml
│   │   └── drawable/
│   └── AndroidManifest.xml
├── src/test/                               # Unit tests
│   └── java/com/example/projectname/
│       └── features/home/
│           └── HomeViewModelTest.kt
├── src/androidTest/                        # Instrumented tests
│   └── java/com/example/projectname/
│       └── features/home/
│           └── HomeScreenTest.kt
├── build.gradle.kts                        # App-level build config
├── proguard-rules.pro
├── .editorconfig
├── detekt.yml
├── .github/workflows/ci.yml
└── build.gradle.kts (root)                 # Root build config with version catalog
```

## Key configuration

### Version catalog (`gradle/libs.versions.toml`)
Define all dependency versions in one place.

### Build features
- `compose = true`
- `buildConfig = true`
- Kotlin serialization plugin
- Hilt plugin
- KSP for annotation processing

### Gradle scripts
- `assembleDebug` — Debug build
- `assembleRelease` — Release build with ProGuard
- `test` — Unit tests
- `connectedAndroidTest` — Instrumented tests
- `ktlintCheck` — Code style check
- `detekt` — Static analysis

## Architecture pattern

```
UI Layer (Compose) → ViewModel → UseCase (optional) → Repository → DataSource (API/DB)
```

- **Unidirectional data flow**: ViewModel exposes StateFlow of UiState, UI collects and renders
- **Events**: UI sends events to ViewModel via function calls
- **Side effects**: One-shot events via SharedFlow (navigation, snackbar, toast)
