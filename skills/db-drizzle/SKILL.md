---
name: db-drizzle
description: Generate Drizzle ORM schemas, queries, migrations, and relations for TypeScript projects. Use when the user wants to set up or work with Drizzle ORM.
argument-hint: "[schema|query|migrate] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx drizzle-kit *), Bash(npm *), Bash(bun *)
user-invocable: true
---

## Instructions

You are a Drizzle ORM expert. Generate production-ready TypeScript-first database schemas and queries.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: schema design, queries, migrations, relations
- **Database**: PostgreSQL (drizzle-orm/pg-core), MySQL (drizzle-orm/mysql-core), SQLite (drizzle-orm/sqlite-core)
- **Driver**: node-postgres, postgres.js, mysql2, better-sqlite3, Turso, Neon, PlanetScale

### Step 2: Schema design

Generate TypeScript schema:
```typescript
// schema/users.ts
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin', 'editor']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}));

// schema/posts.ts
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  authorIdx: index('author_idx').on(table.authorId),
  publishedIdx: index('published_idx').on(table.published, table.createdAt),
}));
```

### Step 3: Relations

Define relations for query builder:
```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  categories: many(postsToCategories),
}));
```

### Step 4: Queries

Generate type-safe queries:

**Select with query builder:**
```typescript
// Relational query (like Prisma)
const usersWithPosts = await db.query.users.findMany({
  with: { posts: { where: eq(posts.published, true), limit: 5 } },
  where: eq(users.role, 'admin'),
  orderBy: desc(users.createdAt),
  limit: 10,
});

// SQL-like query builder
const results = await db
  .select({ name: users.name, postCount: count(posts.id) })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))
  .where(and(eq(users.role, 'admin'), gte(users.createdAt, startDate)))
  .groupBy(users.id)
  .orderBy(desc(count(posts.id)));

// Insert with returning
const [newUser] = await db.insert(users)
  .values({ email: 'user@example.com', name: 'Alice' })
  .returning();

// Upsert
await db.insert(users)
  .values({ email: 'user@example.com', name: 'Alice' })
  .onConflictDoUpdate({ target: users.email, set: { name: 'Updated' } });

// Transaction
const result = await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({ ... }).returning();
  await tx.insert(posts).values({ authorId: user.id, ... });
  return user;
});
```

### Step 5: Drizzle Kit (migrations)

Generate drizzle.config.ts:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

Commands:
```bash
npx drizzle-kit generate    # Generate SQL migration files
npx drizzle-kit migrate     # Apply migrations
npx drizzle-kit push        # Push schema directly (dev)
npx drizzle-kit studio      # Visual database browser
```

### Step 6: Database connection

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

### Best practices:
- Export schema types with `typeof users.$inferSelect` and `$inferInsert`
- Use relational queries for nested data, SQL-like for aggregations
- Use transactions for multi-table operations
- Use .returning() to get inserted/updated data
- Use prepared statements for frequently executed queries
- Separate schema files by domain (users.ts, posts.ts)
- Use drizzle-kit generate for version-controlled migrations
- Use drizzle-kit push only in development
