# Flutter Project Template

## Tech stack
- **Framework**: Flutter 3.x (latest stable)
- **Language**: Dart 3.x with null safety
- **Architecture**: Clean Architecture with BLoC or Riverpod
- **Navigation**: GoRouter (declarative routing)
- **State management**: flutter_bloc or Riverpod (detect from user preference)
- **Networking**: Dio + Retrofit (code generation) or http package
- **Serialization**: freezed + json_serializable (code generation)
- **DI**: get_it + injectable, or Riverpod (self-contained DI)
- **Testing**: flutter_test, bloc_test, mockito or mocktail
- **Linting**: flutter_lints (very strict) or custom analysis_options.yaml

## Directory structure (BLoC variant)

```
lib/
├── main.dart                               # Entry point, app initialization
├── app/
│   ├── app.dart                            # MaterialApp with router and theme
│   ├── router.dart                         # GoRouter configuration
│   └── di.dart                             # get_it service locator setup
├── features/
│   └── home/
│       ├── presentation/
│       │   ├── screens/
│       │   │   └── home_screen.dart        # Screen widget
│       │   ├── widgets/
│       │   │   └── home_list_item.dart     # Feature-specific widgets
│       │   └── bloc/
│       │       ├── home_bloc.dart          # BLoC
│       │       ├── home_event.dart         # Events
│       │       └── home_state.dart         # States
│       ├── data/
│       │   ├── repositories/
│       │   │   └── home_repository_impl.dart
│       │   ├── datasources/
│       │   │   └── home_remote_datasource.dart
│       │   └── models/
│       │       └── home_item_model.dart    # Data models with fromJson/toJson
│       └── domain/
│           ├── repositories/
│           │   └── home_repository.dart    # Abstract repository
│           ├── entities/
│           │   └── home_item.dart          # Domain entity
│           └── usecases/
│               └── get_home_items.dart     # Use case
├── core/
│   ├── network/
│   │   ├── api_client.dart                 # Dio client configuration
│   │   ├── api_interceptors.dart           # Auth, logging interceptors
│   │   └── api_exceptions.dart             # Typed exceptions
│   ├── theme/
│   │   ├── app_theme.dart                  # ThemeData configuration
│   │   ├── app_colors.dart                 # Color constants
│   │   └── app_text_styles.dart            # TextStyle definitions
│   ├── widgets/
│   │   ├── app_loading.dart                # Shared loading widget
│   │   ├── app_error.dart                  # Shared error widget
│   │   └── app_empty.dart                  # Shared empty state
│   ├── utils/
│   │   └── extensions.dart                 # Dart extensions
│   └── constants/
│       └── api_constants.dart              # Base URLs, timeouts
├── l10n/
│   ├── app_en.arb                          # English strings
│   └── app_localizations.dart              # Generated localizations
test/
├── features/home/
│   ├── presentation/bloc/
│   │   └── home_bloc_test.dart
│   └── data/repositories/
│       └── home_repository_test.dart
├── helpers/
│   ├── test_helpers.dart                   # Shared test setup
│   └── mocks.dart                          # Generated mocks
integration_test/
│   └── app_test.dart                       # Integration test
├── pubspec.yaml
├── analysis_options.yaml
├── .gitignore
├── .env.example
├── README.md
└── .github/workflows/ci.yml
```

## Key configuration

### pubspec.yaml
- Flutter SDK constraint
- All dependencies with version constraints
- Dev dependencies: flutter_test, bloc_test, mockito/mocktail, build_runner
- Assets and fonts registration

### analysis_options.yaml
- `include: package:flutter_lints/flutter.yaml`
- Additional strict rules: `always_declare_return_types`, `prefer_const_constructors`, etc.

### Build commands
- `flutter run` — Debug run
- `flutter build apk` — Android release
- `flutter build ios` — iOS release
- `flutter test` — Unit + widget tests
- `flutter test integration_test/` — Integration tests
- `dart run build_runner build` — Code generation
- `flutter analyze` — Static analysis

## Architecture pattern

```
Screen → BLoC/Cubit → UseCase → Repository (abstract) → DataSource → API/DB
```

- **Unidirectional**: BLoC emits states, UI rebuilds via BlocBuilder
- **Clean Architecture layers**: Presentation → Domain → Data
- **Code generation**: freezed for immutable models, json_serializable for JSON, injectable for DI
- **Feature-first**: Each feature is self-contained with its own presentation/domain/data layers
