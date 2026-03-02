# Analyze Codebase

Deep codebase audit covering architecture, tech stack, patterns, dependencies, code quality, and technical debt. This skill performs a comprehensive examination of your project and produces a structured report with prioritized findings and actionable recommendations.

## Quick Start

Run a full codebase analysis with defaults:

```bash
/analyze-codebase
```

Focus on a specific area:

```bash
/analyze-codebase security
```

```bash
/analyze-codebase dependencies
```

## Arguments

| Argument | Description | Default |
|---|---|---|
| `$ARGUMENTS` | Focus area for the analysis | `all` |

Supported focus areas:

- **`architecture`** -- Examines project structure, module boundaries, and design patterns
- **`security`** -- Scans for vulnerabilities, secrets exposure, and insecure patterns
- **`dependencies`** -- Audits dependency health, outdated packages, and license risks
- **`quality`** -- Evaluates code quality signals, complexity, and maintainability
- **`all`** -- Runs every analysis category (default)

## How It Works

1. **Project overview** -- Scans the repository root for configuration files, entry points, and project metadata to build a high-level understanding
2. **Architecture analysis** -- Maps directory structure, identifies layers, modules, and design patterns in use
3. **Dependency analysis** -- Parses lockfiles and manifests to catalog direct and transitive dependencies, flags outdated or vulnerable packages
4. **Code quality signals** -- Measures complexity indicators, identifies inconsistent patterns, and evaluates test coverage presence
5. **Technical debt inventory** -- Catalogs TODOs, FIXMEs, deprecated usage, and structural issues that accumulate maintenance cost
6. **Security scan** -- Checks for hardcoded secrets, insecure configurations, injection vectors, and known vulnerability patterns
7. **Structured report** -- Aggregates all findings into a single prioritized markdown report

## Output Format

The skill produces a markdown report containing the following sections:

```markdown
## Overview
| Metric        | Value           |
|---------------|-----------------|
| Language       | TypeScript      |
| Framework      | Next.js 14      |
| Test Coverage  | ~72%            |
| Dependencies   | 48 direct       |

## Architecture Diagram
(Mermaid diagram of module relationships)

## Strengths
- Clear separation of concerns...
- Consistent error handling...

## Findings

### Critical
- SQL injection vector in `src/db/queries.ts:45`

### Warning
- 12 dependencies are more than 2 major versions behind

### Suggestion
- Consider extracting shared validation logic into a utils module

## Technical Debt Summary
| Category    | Count | Estimated Effort |
|-------------|-------|-----------------|
| TODOs       | 23    | ~4 days         |
| Deprecated  | 5     | ~2 days         |

## Prioritized Recommendations
1. Address critical security finding immediately
2. Update stale dependencies in next sprint
3. ...
```

::: tip
Run `/analyze-codebase all` on a new project you've inherited to get a rapid understanding of its health and architecture before diving into code.
:::

::: warning
The analysis reads your codebase extensively but does not execute any code. Runtime behavior, environment-specific configurations, and dynamic code paths may not be fully captured.
:::

## Configuration

| Setting | Value |
|---|---|
| **Context mode** | `fork` -- runs in an isolated context so analysis does not affect your working conversation |
| **Agent** | `Explore` -- uses a read-only exploration agent for safe, non-destructive analysis |

The skill does not modify any files in your project. All output is returned as a report within the conversation.
