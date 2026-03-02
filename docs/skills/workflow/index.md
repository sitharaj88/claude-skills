# Developer Workflow Skills

Five skills that streamline your daily development workflow — from writing commits to reviewing pull requests and debugging issues.

<div class="skill-grid">
  <a href="smart-commit" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Smart Commit</h3>
    <span class="command">/smart-commit</span>
    <p>Generates conventional commit messages by analyzing staged changes and matching your project's commit style.</p>
  </a>
  <a href="review-pr" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Review PR</h3>
    <span class="command">/review-pr [number]</span>
    <p>Reviews pull requests for correctness, security, performance, and maintainability with severity-categorized feedback.</p>
  </a>
  <a href="create-pr" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Create PR</h3>
    <span class="command">/create-pr [base]</span>
    <p>Creates well-structured PRs with titles, summaries, linked issues, and test plans from branch changes.</p>
  </a>
  <a href="debug-issue" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Debug Issue</h3>
    <span class="command">/debug-issue [error]</span>
    <p>Systematically diagnoses bugs using hypothesis-driven debugging with root cause analysis.</p>
  </a>
  <a href="test-writer" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Test Writer</h3>
    <span class="command">/test-writer [file]</span>
    <p>Generates comprehensive test suites matching your project's testing framework and conventions.</p>
  </a>
</div>

## When to Use These Skills

| Scenario | Skill |
|----------|-------|
| Ready to commit staged changes | `/smart-commit` |
| Need to review a teammate's PR | `/review-pr 42` |
| Ready to open a PR for your branch | `/create-pr` |
| Encountering a bug or error | `/debug-issue "TypeError: cannot read..."` |
| Need tests for a file or function | `/test-writer src/utils/parser.ts` |

## Shared Capabilities

All workflow skills:
- **Auto-detect** your project's conventions (commit style, test framework, etc.)
- **Use dynamic context injection** — they pull live data from git and GitHub
- **Follow minimum privilege** — they only access the tools they need
