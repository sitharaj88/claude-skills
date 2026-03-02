# Analysis & Documentation Skills

Five skills for understanding, documenting, and improving your codebase.

<div class="skill-grid">
  <a href="analyze-codebase" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Analyze Codebase</h3>
    <span class="command">/analyze-codebase [focus]</span>
    <p>Deep codebase audit covering architecture, dependencies, code quality, and technical debt.</p>
  </a>
  <a href="generate-arch-doc" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Generate Arch Doc</h3>
    <span class="command">/generate-arch-doc [output]</span>
    <p>Generates architecture documentation with Mermaid diagrams, component catalog, and data flows.</p>
  </a>
  <a href="generate-api-doc" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Generate API Doc</h3>
    <span class="command">/generate-api-doc [output]</span>
    <p>Generates API reference docs from actual route definitions with parameters, examples, and error codes.</p>
  </a>
  <a href="generate-changelog" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Generate Changelog</h3>
    <span class="command">/generate-changelog [range]</span>
    <p>Generates changelogs from git history in Keep a Changelog format with PR/issue links.</p>
  </a>
  <a href="refactor-module" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Refactor Module</h3>
    <span class="command">/refactor-module [file]</span>
    <p>Detects code smells and applies incremental, test-verified refactorings.</p>
  </a>
</div>

## Analysis Focus Areas

The `/analyze-codebase` skill supports scoped analysis:

| Focus | What It Covers |
|-------|---------------|
| `architecture` | System structure, module boundaries, dependency flow |
| `security` | Vulnerabilities, secrets, auth patterns |
| `dependencies` | Third-party packages, outdated deps |
| `quality` | Code smells, complexity, testing coverage |
| `all` | Full analysis (default) |

## Documentation Output

Generated documentation includes **Mermaid diagrams** that render natively on GitHub:

- System context diagrams (C4 style)
- Component relationship diagrams
- Sequence diagrams for key data flows
- Deployment architecture diagrams
