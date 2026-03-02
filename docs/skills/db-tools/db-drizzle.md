# Drizzle

Expert guidance for Drizzle ORM TypeScript-first schema definitions, SQL-like query builder, relational queries, and migration workflows.

## Usage

```bash
/db-drizzle [description or question]
```

## What It Does

1. Defines schemas using TypeScript with tables, columns, indexes, and constraints
2. Writes queries using the SQL-like `select().from().where()` builder syntax
3. Configures relational queries with `relations()` for type-safe joins
4. Generates and manages migrations with `drizzle-kit generate` and `drizzle-kit push`
5. Sets up database connections for PostgreSQL, MySQL, SQLite, and Turso
6. Integrates with Next.js Server Actions, tRPC, and Hono

## Examples

```bash
/db-drizzle define a schema with users, teams, and many-to-many memberships
```

```bash
/db-drizzle write a relational query with nested includes and filters
```

```bash
/db-drizzle set up Drizzle with Turso for an edge-deployed app
```

## Allowed Tools

- Read
- Edit
- Write
- Bash
- Grep
- Glob
