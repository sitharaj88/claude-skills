---
name: mobile-test-writer
description: Generates mobile-specific tests including unit tests, widget/UI tests, integration tests, and end-to-end tests for Android (Espresso/Compose Testing), iOS (XCTest/XCUITest), React Native (Jest/Detox/Maestro), and Flutter (widget tests/integration tests). Use when the user asks to write mobile tests, add mobile test coverage, or create UI/integration tests for a mobile app.
argument-hint: "[file-path or screen-name] [type: unit|ui|integration|e2e]"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a mobile testing expert. Generate thorough, platform-appropriate tests for `$ARGUMENTS`.

### Step 1: Detect the mobile platform

Search for platform indicators:
- **Android**: `build.gradle.kts`, `AndroidManifest.xml`, `*.kt` files
- **iOS**: `*.xcodeproj`, `*.swift` files, `Package.swift`
- **React Native**: `react-native` in `package.json`, `*.tsx` screen files
- **Flutter**: `pubspec.yaml`, `*.dart` files in `lib/`

### Step 2: Detect testing frameworks

**Android:**
- Unit tests: JUnit 5, MockK, Turbine (for Flow testing)
- Compose UI tests: `compose-ui-test`, `createComposeRule()`
- Integration: Espresso, UI Automator
- E2E: Maestro, Appium

**iOS:**
- Unit tests: XCTest, Quick/Nimble
- UI tests: XCUITest, ViewInspector (SwiftUI)
- Snapshot tests: swift-snapshot-testing
- E2E: Maestro, Appium

**React Native:**
- Unit tests: Jest
- Component tests: React Native Testing Library
- E2E: Detox, Maestro, Appium
- Snapshot tests: Jest snapshots

**Flutter:**
- Unit tests: `flutter_test`, Mockito
- Widget tests: `testWidgets`, `WidgetTester`
- Integration tests: `integration_test` package
- Golden tests: `matchesGoldenFile`

Study existing test files to match conventions exactly.

### Step 3: Parse the request

- `$0` = File path or screen name to test
- `$1` = Test type (optional):
  - `unit` — Test ViewModels, BLoCs, repositories, use cases, utility functions
  - `ui` — Test UI components/widgets/composables in isolation
  - `integration` — Test feature flows with mocked services
  - `e2e` — End-to-end tests on real/simulated device

If no type specified, generate unit + ui tests.

### Step 4: Analyze the target code

Read the target file and its dependencies. Identify:
- **State management logic**: ViewModel states, BLoC events/states, hook returns
- **User interactions**: buttons, inputs, gestures, navigation triggers
- **Async operations**: API calls, database queries, timers
- **Conditional UI**: loading/error/empty states, permission-gated content
- **Navigation**: screen transitions, deep links, back behavior

### Step 5: Generate tests by platform

#### Android (Kotlin)

**Unit tests (ViewModel/UseCase):**
```kotlin
@Test
fun `should emit loading then success when data loads`() = runTest {
    // Given
    coEvery { repository.getData() } returns testData
    // When
    viewModel.loadData()
    // Then - use Turbine for Flow testing
    viewModel.uiState.test {
        assertThat(awaitItem()).isEqualTo(UiState.Loading)
        assertThat(awaitItem()).isEqualTo(UiState.Success(testData))
    }
}
```

**Compose UI tests:**
```kotlin
@get:Rule
val composeTestRule = createComposeRule()

@Test
fun `should display items when loaded`() {
    composeTestRule.setContent {
        ScreenContent(state = UiState.Success(testItems))
    }
    composeTestRule.onNodeWithText("Item 1").assertIsDisplayed()
}
```

Test: rendering states, click handlers, text input, scroll behavior, accessibility.

#### iOS (Swift)

**Unit tests (ViewModel):**
```swift
@MainActor
func testLoadDataSuccess() async {
    let mockService = MockDataService(result: .success(testData))
    let viewModel = ScreenViewModel(service: mockService)
    await viewModel.loadData()
    XCTAssertEqual(viewModel.state, .loaded(testData))
}
```

**SwiftUI view tests (ViewInspector or snapshot):**
```swift
func testLoadedStateRendersContent() throws {
    let view = ScreenView(viewModel: mockViewModel(state: .loaded(testData)))
    let inspected = try view.inspect()
    XCTAssertNoThrow(try inspected.find(text: "Expected Title"))
}
```

Test: async state transitions, error handling, Combine publishers, navigation triggers.

#### React Native

**Component tests (RNTL):**
```tsx
it('renders items when loaded', async () => {
  mockApi.getItems.mockResolvedValue(testItems);
  const { getByText, queryByTestId } = render(
    <NavigationContainer>
      <ScreenNameScreen />
    </NavigationContainer>
  );
  await waitFor(() => expect(queryByTestId('loading')).toBeNull());
  expect(getByText('Item 1')).toBeTruthy();
});
```

**Hook tests:**
```tsx
const { result } = renderHook(() => useScreenName(), { wrapper });
await act(async () => { result.current.loadData(); });
expect(result.current.items).toHaveLength(3);
```

Test: rendering, navigation, form submission, async loading, error display.

#### Flutter

**Widget tests:**
```dart
testWidgets('displays items when loaded', (tester) async {
  when(() => bloc.state).thenReturn(ScreenLoaded(items: testItems));
  await tester.pumpWidget(
    MaterialApp(home: BlocProvider.value(value: bloc, child: ScreenNameScreen())),
  );
  expect(find.text('Item 1'), findsOneWidget);
});
```

**BLoC tests:**
```dart
blocTest<ScreenBloc, ScreenState>(
  'emits [loading, loaded] when data fetched successfully',
  build: () { when(() => repo.getData()).thenAnswer((_) async => testData); return ScreenBloc(repo); },
  act: (bloc) => bloc.add(LoadData()),
  expect: () => [ScreenLoading(), ScreenLoaded(data: testData)],
);
```

Test: widget rendering, state transitions, user interactions, golden tests for UI.

### Step 6: Mock strategy (mobile-specific)

- Mock **network layer** — never make real API calls in tests
- Mock **platform services** — camera, location, notifications, biometrics
- Mock **navigation** — verify navigation calls without actual screen transitions
- Mock **storage** — SharedPreferences, UserDefaults, AsyncStorage, secure storage
- Use platform-standard mocking: MockK (Android), protocol mocks (iOS), jest.mock (RN), Mockito (Flutter)

### Step 7: Run and iterate

1. Run generated tests with platform test command
2. Fix failures — distinguish test bugs from real bugs
3. Re-run until green
4. Verify existing tests still pass

### Guidelines

- Test **behavior**, not implementation — "when user taps submit, form is submitted" not "when button.onPressed is called, bloc.add is called"
- Always test the three states: loading, success, error
- Test accessibility: content descriptions are present, touch targets are adequate
- For form screens: test validation (empty fields, invalid email, password rules)
- For list screens: test empty state, single item, pagination
- Keep tests fast — mock everything slow (network, disk, animations)
- Use `TestID`/`testTag`/`key`/`accessibilityIdentifier` for reliable element selection, not text matching
