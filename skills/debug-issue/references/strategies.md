# Debugging Strategies Reference

## Strategy: Binary search through time

When you know the bug didn't exist before but does now:
1. Find the last known good state: `git log --oneline -30`
2. Identify the range of suspicious commits
3. Read the diffs of the most likely commits: `git diff <commit1> <commit2> -- <relevant-files>`
4. Narrow down to the specific commit that introduced the issue

## Strategy: Data flow tracing

For bugs where data is wrong/missing/corrupted:
1. Find where the data originates (user input, API response, database query)
2. Trace every transformation step from origin to the point of failure
3. At each step, verify: is the data correct here? What transforms it?
4. The bug is at the first step where data goes wrong

## Strategy: Race condition detection

Symptoms: intermittent failures, works sometimes, order-dependent behavior.
1. Look for shared mutable state accessed from multiple async operations
2. Search for patterns: `setTimeout`/`setInterval`, parallel `Promise.all`, goroutines, threads
3. Check for missing locks, missing `await`, or non-atomic read-modify-write sequences
4. Look for event ordering assumptions that may not hold

## Strategy: State management bugs

Symptoms: UI shows stale data, state inconsistencies, unexpected re-renders.
1. Find where the state is defined and what mutates it
2. Check for direct mutation instead of immutable updates (common in React/Redux)
3. Look for missing dependency arrays in hooks/effects
4. Verify that state updates are batched correctly
5. Check for multiple sources of truth for the same data

## Strategy: Configuration and environment

Symptoms: works locally but not in staging/production, works for some users.
1. Compare environment variables between working and broken environments
2. Check for hardcoded localhost/development URLs
3. Verify database connection strings and credentials
4. Check for feature flags or A/B test configurations
5. Compare package versions between environments (lock file drift)

## Strategy: Async/await pitfalls

Common patterns that cause bugs:
- Missing `await` — function returns Promise instead of value
- `forEach` with async callback — doesn't actually await each iteration
- Error in async callback not caught by outer try/catch
- Promise rejection not handled (unhandledRejection)
- Concurrent writes to the same resource without coordination

## Strategy: Type coercion and boundaries

For languages with implicit coercion (JavaScript, Python):
1. Check for `==` vs `===` comparisons
2. Look for string/number confusion (`"1" + 1 = "11"`)
3. Check for null vs undefined vs empty string handling
4. Verify array index bounds and object property existence
5. Look for integer overflow or floating-point precision issues

## Strategy: Dependency and import issues

Symptoms: "X is not a function", "cannot read property of undefined", module not found.
1. Check import paths — relative vs absolute, file extension requirements
2. Verify the dependency is installed and at the expected version
3. Check for circular dependencies (A imports B imports A)
4. Look for default export vs named export mismatches
5. Check for tree-shaking removing something needed at runtime
