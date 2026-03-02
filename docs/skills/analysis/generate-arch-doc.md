# Generate Arch Doc

Generates comprehensive architecture documentation with Mermaid diagrams, component catalog, and data flow analysis. This skill examines your entire codebase to produce a self-contained architecture document suitable for onboarding, design reviews, and long-term project reference.

## Quick Start

Generate architecture documentation with default settings:

```bash
/generate-arch-doc
```

Specify a custom output file path:

```bash
/generate-arch-doc docs/ARCHITECTURE.md
```

## Arguments

| Argument | Description | Default |
|---|---|---|
| `$ARGUMENTS` | Output file path for the generated document | Printed to conversation |

When an output path is provided, the skill writes the architecture document directly to that file. When omitted, the full document is displayed in the conversation for you to copy or save manually.

## How It Works

1. **Map system** -- Scans the repository to identify all major components, services, packages, and their relationships
2. **System context diagram** -- Produces a C4 Level 1 Mermaid diagram showing the system and its external actors and dependencies
3. **Component catalog** -- Builds a detailed table of every component including its responsibility, technology, and dependencies
4. **Data flow diagrams** -- Creates Mermaid sequence diagrams tracing key data flows through the system (e.g., request lifecycle, event processing)
5. **Technology stack** -- Catalogs all languages, frameworks, databases, and infrastructure tools with their versions and purposes
6. **Deployment** -- Documents the deployment topology, environment configuration, and infrastructure layout using a Mermaid deployment diagram
7. **Development guide** -- Generates setup instructions, build commands, and contribution guidelines derived from project configuration files

## Output Format

The skill produces a full markdown document with the following structure:

```markdown
# Architecture Documentation

## System Context
(Mermaid C4 Level 1 diagram)

## Component Catalog
| Component       | Responsibility            | Technology   | Dependencies        |
|-----------------|---------------------------|-------------|---------------------|
| API Gateway     | Request routing, auth     | Express.js  | AuthService, Logger |
| OrderService    | Order lifecycle mgmt      | TypeScript  | DB, EventBus        |

## Data Flow
### Order Creation Flow
(Mermaid sequence diagram)

### Authentication Flow
(Mermaid sequence diagram)

## Technology Stack
| Category   | Technology   | Version | Purpose                |
|------------|-------------|---------|------------------------|
| Runtime    | Node.js     | 20.x    | Server execution       |
| Framework  | Next.js     | 14.1    | Full-stack framework   |
| Database   | PostgreSQL  | 16      | Primary data store     |

## Deployment
(Mermaid deployment diagram)

## Development Guide
- Prerequisites
- Setup instructions
- Build & run commands
- Testing instructions

## Glossary
| Term            | Definition                              |
|-----------------|-----------------------------------------|
| Bounded Context | A logical boundary within the domain... |
```

::: tip
Pipe the output to a file to keep your architecture docs in version control. Re-run the skill periodically to keep the documentation in sync with the codebase.
:::

::: warning
Mermaid diagrams are generated based on static analysis of the code. Dynamically registered routes, runtime plugin systems, or code-generated modules may not appear in the diagrams.
:::

## Configuration

| Setting | Value |
|---|---|
| **Context mode** | `fork` -- runs in an isolated context so document generation does not affect your working conversation |
| **Agent** | `Explore` -- uses a read-only exploration agent for safe, non-destructive analysis |

When an output path is provided, the skill writes the file to disk. Otherwise, no files are created or modified.
