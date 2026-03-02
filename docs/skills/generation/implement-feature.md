# Implement Feature

Plans and implements complete features across the full stack from a natural language description or a GitHub issue number. This skill handles everything from requirements gathering through implementation and testing, producing working code that follows your project's architecture.

## Quick Start

```bash
# Implement from a description
/implement-feature Add user profile page with avatar upload

# Implement from a GitHub issue
/implement-feature #42

# Implement with detailed requirements
/implement-feature Add search with autocomplete, debounced input, and result highlighting
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `description` | `$ARGUMENTS` | Yes | A feature description in plain English, or `#issue-number` to fetch from GitHub |

::: tip
When referencing a GitHub issue with `#issue-number`, the skill fetches the full issue body, comments, and labels to build a complete picture of the requirements. This works best when issues are well-written with acceptance criteria.
:::

## How It Works

1. **Parses requirements** -- Reads the provided description or fetches the GitHub issue (title, body, labels, and comments) to extract clear requirements and acceptance criteria.
2. **Explores the codebase** -- Investigates your project structure, identifies related code, and builds an understanding of your architecture, conventions, and dependencies.
3. **Creates an implementation plan** -- Produces an ordered list of files to create or modify, sequenced by dependency (data layer first, UI last).
4. **Implements layer by layer** -- Writes code from the bottom up: data models and schemas, then business logic and services, then API endpoints, and finally UI components.
5. **Writes tests at each layer** -- Generates tests following your project's existing test patterns at each layer of the implementation.
6. **Verifies the result** -- Runs the full test suite, fixes any failures, and verifies the build completes successfully.

## Implementation Order

The skill follows a strict bottom-up implementation sequence:

| Layer | Examples | Order |
|-------|----------|-------|
| **Data** | Database migrations, models, schemas | 1st |
| **Business Logic** | Services, utilities, helpers | 2nd |
| **API** | Endpoints, middleware, validation | 3rd |
| **UI** | Components, pages, routing | 4th |
| **Tests** | Unit, integration, and e2e tests | At each layer |

## Example

Suppose your project is a Next.js full-stack application and you run:

```bash
/implement-feature #42
```

Where issue #42 is titled "Add user profile page with avatar upload" and contains acceptance criteria. The skill will:

1. Fetch the issue details from GitHub
2. Scan your codebase to find existing user models, API patterns, and page conventions
3. Plan the implementation across 8-12 files
4. Generate the changes:

```
prisma/migrations/add_avatar_field/    # Database migration for avatar column
src/lib/storage.ts                      # File upload utility (S3 or local)
src/server/api/routers/user.ts          # Updated tRPC router with avatar upload
src/components/AvatarUpload.tsx          # Upload component with preview and crop
src/pages/profile.tsx                   # Profile page assembling all pieces
src/__tests__/api/user.test.ts          # API tests for avatar upload
src/__tests__/components/AvatarUpload.test.tsx  # Component tests
```

::: warning
This skill runs in fork context mode and has access to `Bash`, meaning it can execute shell commands including running tests, installing packages, and running builds. Review the implementation plan before it begins making changes.
:::

## Workflow Reference

This skill includes `references/workflow.md`, which provides investigation patterns for understanding codebases before implementation. The workflow covers:

- How to identify project architecture and conventions
- Strategies for finding related code across large repositories
- Dependency analysis and impact assessment
- Patterns for ordering changes to minimize breakage

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `fork` |
| **Allowed tools** | `Bash`, `Read`, `Grep`, `Glob`, `Write`, `Edit` |

This skill operates in fork context mode, meaning it runs in its own conversation branch with full tool access including shell execution. It can run tests, install dependencies, and verify builds as part of the implementation workflow.
