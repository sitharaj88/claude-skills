# claude-skills

A curated collection of world-class [Claude Code](https://claude.ai/code) skills — custom slash commands that supercharge your development workflow.

## Skills

### Developer Workflow

| Skill | Command | Description |
|-------|---------|-------------|
| **Smart Commit** | `/smart-commit` | Generates conventional commit messages by analyzing staged changes and matching your project's commit style |
| **Review PR** | `/review-pr [number]` | Reviews pull requests for correctness, security, performance, and maintainability with severity-categorized feedback |
| **Create PR** | `/create-pr [base]` | Creates well-structured PRs with titles, summaries, linked issues, and test plans from branch changes |
| **Debug Issue** | `/debug-issue [error]` | Systematically diagnoses bugs using hypothesis-driven debugging with root cause analysis |
| **Test Writer** | `/test-writer [file]` | Generates comprehensive test suites matching your project's framework and conventions |

### Code Generation

| Skill | Command | Description |
|-------|---------|-------------|
| **Generate Component** | `/generate-component [Name]` | Creates UI components with props, styles, tests, and stories matching your frontend framework |
| **Generate Endpoint** | `/generate-endpoint [resource] [method]` | Creates API endpoints with validation, error handling, types, and tests for your backend framework |
| **Implement Feature** | `/implement-feature [spec]` | Plans and implements complete features across the stack from description or GitHub issue number |
| **Scaffold Project** | `/scaffold-project [type] [name]` | Scaffolds production-ready projects with config, CI/CD, testing, and linting setup |

### Analysis & Documentation

| Skill | Command | Description |
|-------|---------|-------------|
| **Analyze Codebase** | `/analyze-codebase [focus]` | Deep codebase audit covering architecture, dependencies, code quality, and technical debt |
| **Generate Arch Doc** | `/generate-arch-doc [output]` | Generates architecture documentation with Mermaid diagrams, component catalog, and data flows |
| **Generate API Doc** | `/generate-api-doc [output]` | Generates API reference docs from route definitions with parameters, examples, and error codes |
| **Generate Changelog** | `/generate-changelog [range]` | Generates changelogs from git history in Keep a Changelog format with PR/issue links |
| **Refactor Module** | `/refactor-module [file]` | Detects code smells and applies incremental, test-verified refactorings |

### Mobile Development

Comprehensive coverage for **Android Native**, **iOS Native**, **React Native**, and **Flutter**.

| Skill | Command | Description |
|-------|---------|-------------|
| **Generate Screen** | `/generate-screen [Name] [type]` | Creates mobile screens with navigation, state management, and platform-native UI for Compose/SwiftUI/RN/Flutter |
| **Scaffold Mobile** | `/scaffold-mobile [platform] [name]` | Scaffolds production-ready mobile projects with architecture, navigation, DI, and CI/CD |
| **Mobile Test Writer** | `/mobile-test-writer [file] [type]` | Generates mobile tests — Espresso, XCTest, RNTL/Detox, Flutter widget/integration tests |
| **Generate Native Bridge** | `/generate-native-bridge [capability]` | Creates platform bridges — RN Turbo Modules, Flutter Platform Channels, KMP shared code |
| **App Store Prep** | `/app-store-prep [platform] [version]` | Audits compliance, generates store metadata, configures signing, and creates release checklists |
| **Mobile CI Setup** | `/mobile-ci-setup [platform] [ci]` | Sets up CI/CD with GitHub Actions, Fastlane, EAS Build — build, test, sign, and deploy automation |

### Database & DevOps

| Skill | Command | Description |
|-------|---------|-------------|
| **Generate Migration** | `/generate-migration [change]` | Generates database migrations for Prisma, Drizzle, Alembic, Django, Flyway, Goose with safety checks and rollback |
| **Docker Setup** | `/docker-setup [mode] [services]` | Creates optimized multi-stage Dockerfiles, docker-compose configs, and .dockerignore for any stack |
| **Deploy Config** | `/deploy-config [platform]` | Generates deployment configs for Vercel, AWS, GCP, Fly.io, Kubernetes, Railway, and Render |
| **Setup Monitoring** | `/setup-monitoring [tool]` | Sets up logging (pino/structlog), error tracking (Sentry), metrics (Prometheus/OTel), health checks, and alerts |

### Security & Performance

| Skill | Command | Description |
|-------|---------|-------------|
| **Security Audit** | `/security-audit [scope]` | OWASP Top 10 vulnerability audit — injection, auth, secrets, XSS, SSRF with remediation code |
| **Performance Audit** | `/performance-audit [scope]` | Identifies N+1 queries, memory leaks, bundle bloat, rendering issues, and missing caching with fix code |
| **Dependency Audit** | `/dependency-audit [scope]` | Audits for vulnerabilities, outdated packages, license compliance, unused deps, and bundle size impact |

### Migration & Conversion

| Skill | Command | Description |
|-------|---------|-------------|
| **Migrate Code** | `/migrate-code [path] [from] [to]` | Migrates between frameworks/patterns — JS→TS, class→hooks, REST→GraphQL, CJS→ESM, and more |

## Installation

### Quick install (all skills)

```bash
git clone https://github.com/anthropics/claude-skills.git
cd claude-skills
./install.sh --all
```

### Install specific skills

```bash
./install.sh --skill smart-commit
./install.sh --skill review-pr
```

### Interactive picker

```bash
./install.sh --pick
```

### Install to project scope

```bash
./install.sh --scope project --all
```

### Manual installation

Symlink individual skills to your Claude Code skills directory:

```bash
# Personal (available in all projects)
ln -s /path/to/claude-skills/skills/smart-commit ~/.claude/skills/smart-commit

# Project-specific
ln -s /path/to/claude-skills/skills/smart-commit .claude/skills/smart-commit
```

### Uninstall

```bash
./install.sh --uninstall
```

## Usage

Once installed, invoke any skill in Claude Code with its slash command:

```
/smart-commit
/review-pr 42
/test-writer src/utils/parser.ts
/generate-component UserProfile form
/analyze-codebase security
/generate-screen OrderHistory list
/scaffold-mobile flutter my-app
/mobile-test-writer HomeScreen ui
/app-store-prep both 2.1.0
/docker-setup both db,redis
/security-audit full
/migrate-code src/ javascript typescript
/dependency-audit all
```

Skills automatically detect your project's framework, conventions, and patterns — no configuration needed.

## Skill Design

Each skill follows these principles:

- **Convention-matching** — Skills detect and follow your project's existing patterns, frameworks, and coding style
- **Minimum privilege** — Each skill only has access to the tools it needs (e.g., review skills can't write files)
- **Explicit invocation** — All skills require explicit `/slash-command` invocation — they won't fire automatically
- **Progressive disclosure** — Core instructions in SKILL.md, detailed references in supporting files
- **Feedback loops** — Skills that modify code run tests after each change and iterate until green

## Repository Structure

```
skills/
├── smart-commit/SKILL.md           # Conventional commit generation
├── review-pr/SKILL.md              # PR review with severity ratings
├── create-pr/SKILL.md              # Structured PR creation
├── debug-issue/                    # Hypothesis-driven debugging
│   ├── SKILL.md
│   └── references/strategies.md
├── test-writer/SKILL.md            # Framework-aware test generation
├── generate-component/SKILL.md     # UI component scaffolding
├── generate-endpoint/SKILL.md      # API endpoint generation
├── implement-feature/              # Full-stack feature implementation
│   ├── SKILL.md
│   └── references/workflow.md
├── scaffold-project/               # Project scaffolding
│   ├── SKILL.md
│   └── templates/
│       ├── node-api.md
│       ├── react-app.md
│       └── cli-tool.md
├── analyze-codebase/SKILL.md       # Codebase analysis & audit
├── generate-arch-doc/SKILL.md      # Architecture documentation
├── generate-api-doc/SKILL.md       # API reference documentation
├── generate-changelog/SKILL.md     # Changelog from git history
├── refactor-module/                # Safe incremental refactoring
│   ├── SKILL.md
│   └── references/patterns.md
├── generate-screen/SKILL.md        # Mobile screen generation (all platforms)
├── scaffold-mobile/                # Mobile project scaffolding
│   ├── SKILL.md
│   └── templates/
│       ├── android.md
│       ├── ios.md
│       ├── react-native.md
│       └── flutter.md
├── mobile-test-writer/SKILL.md     # Mobile testing (all platforms)
├── generate-native-bridge/SKILL.md # Native modules & platform channels
├── app-store-prep/SKILL.md         # App Store & Play Store preparation
├── mobile-ci-setup/SKILL.md        # Mobile CI/CD automation
├── generate-migration/SKILL.md     # Database migration generation
├── docker-setup/SKILL.md           # Docker & docker-compose setup
├── deploy-config/SKILL.md          # Cloud deployment configuration
├── setup-monitoring/SKILL.md       # Monitoring, logging & alerting
├── security-audit/SKILL.md         # OWASP security audit
├── performance-audit/SKILL.md      # Performance bottleneck analysis
├── dependency-audit/SKILL.md       # Dependency vulnerability & license audit
└── migrate-code/SKILL.md           # Code migration & conversion
```

## Contributing

To add a new skill:

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter and instructions
2. Follow the [skill authoring best practices](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/best-practices)
3. Keep SKILL.md under 500 lines — use `references/` for detailed content
4. Write clear descriptions that explain both **what** and **when**
5. Test with a fresh Claude Code session before submitting

## License

MIT
