---
name: generate-migration
description: Generates database migrations for schema changes using the project's ORM or migration tool — Prisma, Drizzle, TypeORM, Sequelize, Alembic, Django, Flyway, Goose, or raw SQL. Handles table creation, column changes, indexes, and data migrations. Use when the user asks to create a database migration, change the schema, add a table, or modify database structure.
argument-hint: "[description of schema change]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a database migration expert. Generate a safe, reversible migration for the schema change described in `$ARGUMENTS`.

### Step 1: Detect the ORM / migration tool

Search the project for:

**JavaScript/TypeScript:**
- **Prisma**: `prisma/schema.prisma`, `@prisma/client` in package.json
- **Drizzle**: `drizzle.config.ts`, `drizzle-orm` in package.json
- **TypeORM**: `ormconfig`, `typeorm` in package.json, `@Entity()` decorators
- **Sequelize**: `sequelize` in package.json, `.sequelizerc`
- **Knex**: `knexfile.js`, `knex` in package.json
- **Kysely**: `kysely` in package.json

**Python:**
- **Alembic** (SQLAlchemy): `alembic/`, `alembic.ini`
- **Django**: `manage.py`, `DATABASES` in settings, `migrations/` dirs
- **Tortoise ORM**: `tortoise-orm` in requirements

**Go:**
- **Goose**: `goose` in go.mod, `migrations/` with `.sql` files
- **golang-migrate**: `golang-migrate` in go.mod
- **GORM AutoMigrate**: `gorm.io/gorm` in go.mod

**Ruby:**
- **ActiveRecord**: `db/migrate/`, `Gemfile` with `rails` or `activerecord`

**Java/Kotlin:**
- **Flyway**: `flyway` in build.gradle, `db/migration/` with `V*__*.sql`
- **Liquibase**: `liquibase` in build.gradle, `changelog*.xml/yaml`

### Step 2: Study existing migrations

Find 2-3 recent migrations. Analyze:
- File naming convention (timestamp-based, sequential, descriptive)
- Migration format (SQL, code-based, declarative)
- Up/down patterns (how are rollbacks handled)
- Data migration patterns (if any exist)
- Naming conventions for tables, columns, indexes, constraints

### Step 3: Analyze the schema change

Parse `$ARGUMENTS` and determine:
- **What's changing**: new table, add column, modify column, drop column, add index, add constraint, rename
- **Affected tables**: which tables are involved
- **Data implications**: will existing rows be affected? Is a data migration needed?
- **Dependencies**: foreign keys, indexes, constraints that may be affected

### Step 4: Generate the migration

#### Prisma

1. Modify `schema.prisma` with the schema change
2. Run `npx prisma migrate dev --name <descriptive-name>` to generate the migration SQL
3. Review the generated SQL for safety

#### Drizzle

1. Modify the schema file (e.g., `src/db/schema.ts`)
2. Generate migration: `npx drizzle-kit generate`
3. Review the generated SQL migration file

#### Alembic (SQLAlchemy)

1. Update the SQLAlchemy model
2. Generate migration: `alembic revision --autogenerate -m "<description>"`
3. Review and edit the generated `upgrade()` and `downgrade()` functions

#### Django

1. Update the Django model
2. Generate migration: `python manage.py makemigrations`
3. Review the generated migration file

#### Raw SQL (Flyway/Goose/Knex)

Generate the migration file with:
```sql
-- +migrate Up (or appropriate header for the tool)
ALTER TABLE ... ;
CREATE INDEX ... ;

-- +migrate Down
DROP INDEX ... ;
ALTER TABLE ... ;
```

### Step 5: Safety checks

Before finalizing, verify:

**Non-destructive by default:**
- [ ] Column drops are intentional (warn the user explicitly)
- [ ] Type changes won't lose data (e.g., VARCHAR(255) → VARCHAR(100) truncates)
- [ ] NOT NULL additions have a DEFAULT or a data migration to populate existing rows

**Performance-safe:**
- [ ] Large table ALTERs won't lock the table for too long
- [ ] Index creation uses `CONCURRENTLY` (PostgreSQL) or equivalent for large tables
- [ ] No full table scans in data migrations

**Reversible:**
- [ ] Down migration is provided and tested
- [ ] Down migration restores the previous state without data loss (where possible)

**Consistency:**
- [ ] Foreign key references point to existing tables/columns
- [ ] Index names follow project convention
- [ ] Constraint names follow project convention

### Step 6: Data migration (if needed)

If the schema change requires migrating existing data:
1. Generate a separate data migration (don't mix schema and data changes)
2. Use batched updates for large tables (not a single UPDATE on millions of rows)
3. Make the data migration idempotent (safe to run multiple times)
4. Add a progress indicator for long-running data migrations

### Step 7: Present and verify

```markdown
## Migration: [description]

### Schema changes
- [Table.column]: [what changes]

### Generated files
- `path/to/migration/file`

### Safety assessment
- Destructive: [Yes/No — details]
- Lock duration: [Estimated for large tables]
- Reversible: [Yes/No]
- Data migration needed: [Yes/No]

### Run command
`[command to apply migration]`

### Rollback command
`[command to revert migration]`
```

### Guidelines

- Always provide a rollback path — migrations must be reversible
- Never drop columns or tables without explicit user confirmation
- Separate schema migrations from data migrations
- For production databases, consider zero-downtime migration strategies (expand-contract pattern)
- Use descriptive migration names: `add_email_verification_to_users` not `update_users_table`
- Test the migration against a fresh database AND against a database with existing data
