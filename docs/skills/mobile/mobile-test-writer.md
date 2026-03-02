# Mobile Test Writer

Generates comprehensive mobile test suites -- Espresso, XCTest, React Native Testing Library, Detox, Flutter widget tests, and integration tests. The skill detects your platform and testing framework, studies your existing tests to learn conventions, and produces tests that fit naturally into your codebase.

## Quick Start

```bash
# Generate UI tests for a screen
/mobile-test-writer HomeScreen ui

# Generate unit tests for a ViewModel
/mobile-test-writer src/features/home/HomeViewModel.kt unit

# Generate end-to-end tests
/mobile-test-writer checkout e2e

# Generate integration tests for a feature
/mobile-test-writer PaymentFlow integration
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `target` | `$0` | Yes | File path (e.g., `src/features/home/HomeViewModel.kt`) or screen/class name (e.g., `HomeScreen`). When given a name, the skill searches the codebase to locate it. |
| `type` | `$1` | No | Test type: `unit`, `ui`, `integration`, or `e2e`. Defaults to `unit` for logic files and `ui` for screen files. |

::: tip
Passing a file path is faster because the skill can skip the search step. Use a screen or class name when you are not sure where it lives or when you want the skill to decide the best file to test.
:::

## How It Works

1. **Detects platform** -- Identifies whether the project is Android, iOS, React Native, or Flutter by inspecting build files, project structure, and dependencies.
2. **Detects test framework** -- Determines which testing libraries and runners are configured in the project (e.g., JUnit5 + MockK, XCTest, Jest + RNTL, flutter_test).
3. **Parses request** -- Resolves the target file or name and determines the test type to generate.
4. **Analyzes target** -- Maps out the component or class under test: inputs, outputs, state transitions, dependencies, UI interactions, and edge cases.
5. **Generates platform-specific tests** -- Writes tests following the patterns found in your existing test files, using the correct assertions, matchers, and structure for your framework.
6. **Applies mock strategy** -- Creates mocks, fakes, or stubs for dependencies using the appropriate mocking library for the platform (MockK, protocol mocks, Jest mocks, mocktail).
7. **Runs and iterates** -- Executes the generated tests, fixes any failures, and re-runs until all tests pass.

## Testing Frameworks

### Unit and UI Tests

| Platform | Unit Testing | UI Testing |
|----------|-------------|------------|
| **Android** | JUnit5 + MockK + Turbine (for Flow testing) | Compose UI Test + Robolectric |
| **iOS** | XCTest + Swift mocks | ViewInspector + XCUITest |
| **React Native** | Jest + module mocks | React Native Testing Library (RNTL) |
| **Flutter** | flutter_test + bloc_test + mocktail | flutter_test (widget tests) + WidgetTester |

### Integration and E2E Tests

| Platform | Integration Testing | E2E Testing |
|----------|-------------------|-------------|
| **Android** | Compose UI Test + Hilt test rules | Compose UI Test with NavHost / Maestro |
| **iOS** | XCTest with dependency overrides | XCUITest / Maestro |
| **React Native** | RNTL with provider wrappers | Detox / Maestro |
| **Flutter** | integration_test package | integration_test + patrol |

## Test Priority Order

Tests are generated in a deliberate priority order to maximize coverage value:

| Priority | Category | Count | Purpose |
|----------|----------|-------|---------|
| 1 | **Happy path** | 2-3 tests | Verify the core functionality works as expected |
| 2 | **State transitions** | 2-3 tests | Confirm correct state changes (loading, success, error) |
| 3 | **Edge cases** | 2-4 tests | Cover empty states, boundary values, offline scenarios |
| 4 | **Error conditions** | 2-3 tests | Validate error handling, retry logic, and fallbacks |
| 5 | **Interaction** | 1-2 tests | Test navigation triggers, callbacks, and user gestures |

## Example

Suppose you have an Android Compose project and run:

```bash
/mobile-test-writer src/features/home/HomeViewModel.kt unit
```

The skill detects JUnit5 + MockK + Turbine, studies your existing test conventions, and generates:

```kotlin
@ExtendWith(MockKExtension::class)
class HomeViewModelTest {

    @MockK
    private lateinit var repository: HomeRepository

    private lateinit var viewModel: HomeViewModel

    @BeforeEach
    fun setUp() {
        viewModel = HomeViewModel(repository)
    }

    @Test
    fun `initial state is Loading`() = runTest {
        viewModel.uiState.test {
            assertThat(awaitItem()).isEqualTo(HomeUiState.Loading)
        }
    }

    @Test
    fun `loadData emits Success with items`() = runTest {
        val items = listOf(HomeItem("1", "First"), HomeItem("2", "Second"))
        coEvery { repository.getItems() } returns items

        viewModel.loadData()

        viewModel.uiState.test {
            assertThat(awaitItem()).isEqualTo(HomeUiState.Success(items))
        }
    }

    @Test
    fun `loadData emits Error when repository throws`() = runTest {
        coEvery { repository.getItems() } throws IOException("Network error")

        viewModel.loadData()

        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state).isInstanceOf(HomeUiState.Error::class.java)
            assertThat((state as HomeUiState.Error).message).contains("Network error")
        }
    }

    @Test
    fun `refresh reloads data from repository`() = runTest {
        val items = listOf(HomeItem("1", "Refreshed"))
        coEvery { repository.getItems() } returns items

        viewModel.refresh()

        coVerify(exactly = 1) { repository.getItems() }
    }
}
```

The skill then runs the tests, verifies they pass, and presents the results.

::: warning
This skill has write access and will create or modify test files in your project. It will also execute tests using your project's test runner. Review the generated tests before committing them. For E2E tests, make sure the emulator or simulator is running before execution.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Bash`, `Write`, `Edit` |

This skill operates in inline context mode with shell access for running tests. It reads your source and existing test files to learn conventions, generates new tests, and executes them to verify correctness.
