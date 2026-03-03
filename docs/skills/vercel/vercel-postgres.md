# Vercel Postgres

Generate Vercel Postgres configs with connection pooling, edge-compatible queries, migrations, and ORM integration for serverless PostgreSQL.

## Usage

```bash
/vercel-postgres <operation or description>
```

## What It Does

1. Sets up Vercel Postgres (powered by Neon) with pooled and non-pooled connection configuration
2. Generates type-safe queries using `@vercel/postgres` SQL template literals for Edge and Serverless
3. Configures Drizzle ORM with schema definitions, relations, indexes, and migration workflows
4. Sets up Prisma with the Neon serverless adapter for edge-compatible database access
5. Implements transaction patterns, connection pooling, and database branching for preview deployments
6. Creates schema designs with timestamps, soft deletes, full-text search, and performance monitoring

## Example Output

```typescript
// db/schema.ts
import { pgTable, uuid, varchar, timestamp, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
  index('users_created_at_idx').on(table.createdAt),
]);

// db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

## What It Covers

- **SQL template literals** with parameterized queries safe from SQL injection on Edge and Serverless
- **Drizzle ORM** with type-safe schemas, relations, query building, and migration management
- **Prisma integration** with Neon serverless adapter for edge-compatible access
- **Connection pooling** with pooled connections for app queries and direct connections for migrations
- **Transactions** with BEGIN/COMMIT/ROLLBACK patterns for atomic operations
- **Schema design** with timestamps, soft deletes, full-text search, and trigger functions
- **Database branching** with Neon branches for isolated preview deployment databases
- **Performance monitoring** with slow query logging and index recommendations

<div class="badge-row">
  <span class="badge">Vercel</span>
  <span class="badge">PostgreSQL</span>
  <span class="badge">Neon</span>
</div>

## Installation

```bash
cp -r skills/vercel-postgres ~/.claude/skills/vercel-postgres
```

## Allowed Tools

- `Read` - Read existing schemas, migrations, and database configuration files
- `Write` - Create schema definitions, migration files, and database client setup
- `Edit` - Modify existing schemas, queries, and connection configurations
- `Bash` - Run Vercel CLI, npm, npx, and psql commands
- `Glob` - Search for schema and migration files
- `Grep` - Find database references and query patterns
