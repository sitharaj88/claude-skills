# Generate Migration

Generates database migrations for Prisma, Drizzle, Alembic, Django, Flyway, and Goose with built-in safety checks. This skill detects your ORM, studies existing migrations to maintain consistency, and produces migration files that are non-destructive, performance-safe, and reversible.

## Quick Start

```bash
# Add a column to an existing table
/generate-migration add email_verified column to users table

# Create a new table
/generate-migration create payments table with amount, currency, status, user_id

# Add an index
/generate-migration add index on orders.customer_id
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `$ARGUMENTS` | Yes | Natural language description of the schema change you want to make |

::: tip
Be specific about column types and constraints when describing your change. For example, `add email_verified boolean default false to users table` produces a more accurate migration than `add email_verified to users`.
:::

## How It Works

1. **Detect ORM** -- Scans your project for ORM configuration files (`schema.prisma`, `drizzle.config.ts`, `alembic.ini`, `manage.py`, `flyway.conf`, `goose` binary usage) to identify which migration system is in use.
2. **Study existing migrations** -- Reads recent migration files to learn your naming conventions, formatting style, and any project-specific patterns.
3. **Analyze schema change** -- Parses your natural language description and maps it to concrete schema operations (add column, create table, rename, drop, alter type, add index).
4. **Generate migration** -- Produces the migration file in the correct ORM-specific format, including both `up` and `down` (rollback) directions.
5. **Safety checks** -- Validates that the migration is non-destructive, performance-safe for large tables, and fully reversible.
6. **Data migration** -- If the schema change requires data backfill or transformation, generates a separate data migration step.
7. **Present and verify** -- Outputs the migration file along with a safety assessment and the rollback command.

## Supported ORMs

| Ecosystem | ORM / Tool | Config File | Migration Format |
|-----------|------------|-------------|------------------|
| **Node.js** | Prisma | `schema.prisma` | SQL via `prisma migrate` |
| **Node.js** | Drizzle | `drizzle.config.ts` | TypeScript migration files |
| **Python** | Alembic | `alembic.ini` | Python migration scripts |
| **Python** | Django | `manage.py` | Python migration classes |
| **Java / JVM** | Flyway | `flyway.conf` | Versioned SQL scripts |
| **Go** | Goose | `goose` CLI | SQL or Go migration files |

## Safety Checks

Every generated migration is evaluated against the following safety criteria:

| Check | Description | Example Violation |
|-------|-------------|-------------------|
| **Non-destructive** | No data loss without explicit confirmation | `DROP COLUMN` without backup step |
| **Performance-safe** | Avoids locking large tables for extended periods | `ALTER TABLE` with full table rewrite on 10M+ rows |
| **Reversible** | Includes a complete `down` migration | One-way data transformation with no rollback |
| **Index safety** | Uses `CONCURRENTLY` where supported | Creating an index on a high-traffic table without `CONCURRENTLY` |
| **Default values** | Validates defaults for NOT NULL columns | Adding `NOT NULL` column without a default to a populated table |
| **Foreign keys** | Checks referential integrity | Adding a foreign key to a column with orphaned rows |

::: warning
Destructive operations such as dropping columns or tables will generate a warning and require explicit confirmation. The skill will suggest a soft-delete or rename-first approach when possible.
:::

## Example

Suppose you have a Prisma project and run:

```bash
/generate-migration add email_verified boolean default false to users table
```

The skill detects Prisma, reads your `schema.prisma`, and generates:

```
prisma/migrations/20260302120000_add_email_verified_to_users/
  migration.sql
```

**Generated migration:**

```sql
-- Migration: add email_verified to users
-- Safety: Non-destructive, reversible, performance-safe

ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
```

**Safety assessment:**

```
+  Non-destructive   -- adds a column, no data removed
+  Performance-safe  -- DEFAULT value avoids full table rewrite (Postgres 11+)
+  Reversible        -- down migration drops the column
```

**Rollback command:**

```bash
npx prisma migrate resolve --rolled-back 20260302120000_add_email_verified_to_users
```

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` -- runs within your current conversation |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Bash` |

This skill has read/write access to your project files and can execute shell commands to inspect your database tooling. It will create migration files in the directory expected by your ORM.
