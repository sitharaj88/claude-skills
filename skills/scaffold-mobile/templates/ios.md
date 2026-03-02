# iOS Project Template (Swift + SwiftUI)

## Tech stack
- **Language**: Swift 6
- **UI**: SwiftUI with iOS 17+ features
- **Architecture**: MVVM with Repository pattern
- **Navigation**: NavigationStack with typed destinations
- **DI**: Swift package-based dependency container or Factory
- **Networking**: URLSession + async/await, or Alamofire
- **Persistence**: SwiftData or Core Data
- **Image loading**: AsyncImage (built-in) or Kingfisher
- **Testing**: XCTest, Swift Testing framework, ViewInspector
- **Linting**: SwiftLint

## Directory structure

```
ProjectName/
├── ProjectName/
│   ├── App/
│   │   ├── ProjectNameApp.swift             # @main App entry point
│   │   └── ContentView.swift                # Root view with TabView/NavigationStack
│   ├── Features/
│   │   └── Home/
│   │       ├── HomeView.swift               # SwiftUI View
│   │       ├── HomeViewModel.swift           # ObservableObject ViewModel
│   │       └── Models/
│   │           └── HomeItem.swift            # Feature-specific models
│   ├── Core/
│   │   ├── Network/
│   │   │   ├── APIClient.swift              # URLSession wrapper with async/await
│   │   │   ├── Endpoint.swift               # Endpoint protocol/enum
│   │   │   └── NetworkError.swift           # Typed errors
│   │   ├── Persistence/
│   │   │   └── DataStore.swift              # SwiftData or UserDefaults abstraction
│   │   ├── DI/
│   │   │   └── Dependencies.swift           # Dependency container
│   │   └── UI/
│   │       ├── Theme/
│   │       │   ├── Colors.swift             # Color extensions
│   │       │   └── Typography.swift         # Font styles
│   │       └── Components/
│   │           └── LoadingView.swift         # Shared UI components
│   ├── Extensions/                           # Swift extensions
│   ├── Resources/
│   │   ├── Assets.xcassets
│   │   └── Localizable.xcstrings
│   └── Info.plist
├── ProjectNameTests/
│   └── Features/Home/
│       └── HomeViewModelTests.swift
├── ProjectNameUITests/
│   └── Features/Home/
│       └── HomeUITests.swift
├── .swiftlint.yml
├── .gitignore
├── .github/workflows/ci.yml
└── ProjectName.xcodeproj
```

## Key configuration

### Swift concurrency
- `@MainActor` on all ViewModels
- `async/await` for all asynchronous operations
- Structured concurrency with `TaskGroup` where applicable
- `Sendable` conformance enforced

### SwiftUI patterns
- `@Observable` macro (iOS 17+) or `ObservableObject` protocol
- `@Environment` for dependency injection
- `NavigationStack` with `NavigationPath` for programmatic navigation
- `.task {}` modifier for view lifecycle data loading

### Build configurations
- Debug: full logging, mock server option
- Release: optimized, stripped symbols
- Xcode schemes for Debug, Release, Testing

### Scripts
- `xcodebuild -scheme ProjectName -sdk iphonesimulator build` — Build
- `xcodebuild test -scheme ProjectName -destination 'platform=iOS Simulator'` — Test
- `swiftlint` — Lint

## Architecture pattern

```
View (SwiftUI) → ViewModel (@Observable) → Repository (protocol) → DataSource (API/DB)
```

- **Unidirectional**: ViewModel publishes state, View renders
- **Protocol-based dependencies**: All services defined as protocols for testability
- **Error handling**: Typed errors propagated via Result or throws
