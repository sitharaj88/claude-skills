---
name: vercel-postgres
description: Generate Vercel Postgres configs with connection pooling, edge-compatible queries, migrations, and ORM integration. Use when the user wants to use serverless PostgreSQL on Vercel.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(vercel *), Bash(npm *), Bash(npx *), Bash(psql *)
user-invocable: true
---

## Instructions

You are a Vercel Postgres expert. Generate production-ready serverless PostgreSQL configurations powered by Neon.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: schema design, query building, migration, connection pooling
- **ORM**: Drizzle (recommended), Prisma, raw SQL with `@vercel/postgres`
- **Runtime**: Serverless Functions (Node.js) or Edge Functions (V8)
- **Schema**: tables, relationships, indexes, constraints
- **Scale**: expected query volume and connection patterns

### Step 2: Set up Vercel Postgres

**Create database via Vercel Dashboard:**
```bash
# Vercel Dashboard > Storage > Postgres > Create Database
# Selects region (iad1 recommended for US East)
# Environment variables are auto-populated:
# POSTGRES_URL             - pooled connection (for Serverless)
# POSTGRES_URL_NON_POOLED  - direct connection (for migrations)
# POSTGRES_PRISMA_URL      - pooled with pgbouncer for Prisma
# POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE

# Pull env vars to local
vercel env pull .env.local
```

**Install the SDK:**
```bash
# Option 1: @vercel/postgres (lightweight, edge-compatible)
npm install @vercel/postgres

# Option 2: Drizzle ORM (recommended for type-safe queries)
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit

# Option 3: Prisma with Neon adapter
npm install @prisma/client @prisma/adapter-neon @neondatabase/serverless
npm install -D prisma
```

### Step 3: Query with @vercel/postgres

**SQL template literal (edge-compatible):**
```typescript
import { sql } from '@vercel/postgres';

// Simple query with tagged template literal
export async function getUsers() {
  const { rows } = await sql`SELECT * FROM users ORDER BY created_at DESC`;
  return rows;
}

// Parameterized query (safe from SQL injection)
export async function getUserById(id: string) {
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] || null;
}

// Insert with returning
export async function createUser(name: string, email: string) {
  const { rows } = await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING *
  `;
  return rows[0];
}

// Update
export async function updateUser(id: string, name: string) {
  const { rows } = await sql`
    UPDATE users SET name = ${name}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

// Delete
export async function deleteUser(id: string) {
  await sql`DELETE FROM users WHERE id = ${id}`;
}
```

**Connection pool for multiple queries:**
```typescript
import { db } from '@vercel/postgres';

export async function complexOperation() {
  const client = await db.connect();

  try {
    // Multiple queries on the same connection
    const { rows: users } = await client.sql`SELECT * FROM users LIMIT 10`;
    const { rows: orders } = await client.sql`
      SELECT * FROM orders
      WHERE user_id = ANY(${users.map(u => u.id)})
    `;

    return { users, orders };
  } finally {
    client.release();
  }
}
```

**Transaction support:**
```typescript
import { db } from '@vercel/postgres';

export async function transferFunds(
  fromId: string,
  toId: string,
  amount: number
) {
  const client = await db.connect();

  try {
    await client.sql`BEGIN`;

    await client.sql`
      UPDATE accounts SET balance = balance - ${amount}
      WHERE id = ${fromId} AND balance >= ${amount}
    `;

    await client.sql`
      UPDATE accounts SET balance = balance + ${amount}
      WHERE id = ${toId}
    `;

    await client.sql`
      INSERT INTO transactions (from_id, to_id, amount)
      VALUES (${fromId}, ${toId}, ${amount})
    `;

    await client.sql`COMMIT`;
  } catch (error) {
    await client.sql`ROLLBACK`;
    throw error;
  } finally {
    client.release();
  }
}
```

### Step 4: Drizzle ORM integration (recommended)

**Define schema:**
```typescript
// db/schema.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
  index('users_created_at_idx').on(table.createdAt),
]);

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content'),
  slug: varchar('slug', { length: 500 }).notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  published: boolean('published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('posts_slug_idx').on(table.slug),
  index('posts_author_idx').on(table.authorId),
  index('posts_published_idx').on(table.published),
]);

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('comments_post_idx').on(table.postId),
]);

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));
```

**Configure Drizzle client:**
```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

**Type-safe queries with Drizzle:**
```typescript
import { db } from '@/db';
import { users, posts } from '@/db/schema';
import { eq, desc, and, like, count, sql } from 'drizzle-orm';

// Select all
const allUsers = await db.select().from(users);

// Select with conditions
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.isActive, true))
  .orderBy(desc(users.createdAt))
  .limit(20);

// Select with joins (query API)
const postsWithAuthors = await db.query.posts.findMany({
  where: eq(posts.published, true),
  with: {
    author: true,
    comments: {
      with: { author: true },
      limit: 5,
    },
  },
  orderBy: desc(posts.publishedAt),
  limit: 10,
});

// Insert
const newUser = await db
  .insert(users)
  .values({ name: 'Alice', email: 'alice@example.com' })
  .returning();

// Update
const updated = await db
  .update(users)
  .set({ name: 'Alice Smith', updatedAt: new Date() })
  .where(eq(users.id, userId))
  .returning();

// Delete
await db.delete(users).where(eq(users.id, userId));

// Aggregation
const userPostCounts = await db
  .select({
    userId: posts.authorId,
    postCount: count(posts.id),
  })
  .from(posts)
  .groupBy(posts.authorId);

// Raw SQL when needed
const result = await db.execute(
  sql`SELECT * FROM users WHERE email ILIKE ${'%@example.com'}`
);
```

**Drizzle Kit configuration:**
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL_NON_POOLED!,
  },
});
```

**Migration commands:**
```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema directly (development only)
npx drizzle-kit push

# Open Drizzle Studio (visual DB browser)
npx drizzle-kit studio
```

### Step 5: Prisma integration

**Prisma schema:**
```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLED")
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  posts     Post[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String   @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([authorId])
  @@map("posts")
}
```

**Prisma with Neon serverless adapter (edge-compatible):**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Prisma migration commands:**
```bash
# Create migration
npx prisma migrate dev --name init

# Apply migration in production
npx prisma migrate deploy

# Generate client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

### Step 6: Schema design patterns

**Timestamps and soft deletes:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**Full-text search:**
```sql
-- Add search vector column
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX posts_search_idx ON posts USING GIN(search_vector);

-- Query with ranking
SELECT id, title, ts_rank(search_vector, query) AS rank
FROM posts, to_tsquery('english', 'serverless & postgres') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

### Step 7: Edge-compatible queries

**Use @vercel/postgres sql tagged template for Edge Functions:**
```typescript
// app/api/users/route.ts
import { sql } from '@vercel/postgres';

export const runtime = 'edge';

export async function GET() {
  // sql`` works from Edge Functions via HTTP
  const { rows } = await sql`SELECT id, name, email FROM users LIMIT 50`;
  return Response.json(rows);
}
```

**Use Neon serverless driver directly for Edge:**
```typescript
import { neon } from '@neondatabase/serverless';

export const runtime = 'edge';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET() {
  const users = await sql`SELECT * FROM users`;
  return Response.json(users);
}
```

### Step 8: Connection pooling

**Understanding connection types:**
| Connection Type | URL Variable | Use Case |
|----------------|-------------|----------|
| Pooled (PgBouncer) | `POSTGRES_URL` | Serverless/Edge Functions |
| Non-pooled (Direct) | `POSTGRES_URL_NON_POOLED` | Migrations, schema changes |
| Prisma-specific | `POSTGRES_PRISMA_URL` | Prisma with pgbouncer param |

**Pooling best practices:**
- Always use pooled connections for application queries
- Use non-pooled connections only for DDL (migrations, `CREATE TABLE`)
- Neon auto-scales connections from 0 (suspends when idle)
- Default pool size is sufficient for most workloads
- Connection string includes `?sslmode=require` automatically

### Step 9: Preview deployment database branching

**Neon branching for preview deployments:**
- Each preview deployment can use a separate database branch
- Branches are copy-on-write (instant, near-zero storage cost)
- Configure in Vercel Dashboard > Storage > Postgres > Settings

**Branch workflow:**
1. Main branch uses production database
2. Preview deployments auto-create a Neon branch
3. Branch inherits production schema and data
4. Changes are isolated to the branch
5. Merge PR to apply migrations to production

### Step 10: Performance monitoring

**Query performance:**
```typescript
// Log slow queries
const start = performance.now();
const result = await sql`SELECT ...`;
const duration = performance.now() - start;

if (duration > 1000) {
  console.warn(`Slow query (${duration.toFixed(0)}ms):`, result.command);
}
```

**Index recommendations:**
```sql
-- Find missing indexes (run periodically)
SELECT
  schemaname, tablename, attname,
  n_live_tup, seq_scan, idx_scan
FROM pg_stat_user_tables t
JOIN pg_attribute a ON a.attrelid = t.relid
WHERE seq_scan > 1000 AND idx_scan < 100
ORDER BY seq_scan DESC;
```

### Best practices:
- Use Drizzle ORM for type-safe queries and easy migrations
- Always use pooled connections from Serverless/Edge Functions
- Use non-pooled connections only for migrations and DDL
- Add indexes on columns used in WHERE, JOIN, and ORDER BY clauses
- Use `RETURNING` clause to avoid extra SELECT after INSERT/UPDATE
- Implement database-level constraints (UNIQUE, CHECK, FOREIGN KEY)
- Use transactions for multi-step operations that must be atomic
- Set `search_path` explicitly in multi-tenant schemas

### Anti-patterns to avoid:
- Do not use non-pooled connections from application code (will exhaust connections)
- Avoid N+1 queries; use JOINs or batch loading
- Do not skip migrations and use `db push` in production
- Never store connection strings in code; use environment variables
- Avoid `SELECT *` in production queries; specify columns explicitly
- Do not create indexes on low-cardinality columns (boolean, status enums)
- Avoid long-running transactions in serverless functions (hold connections)

### Cost optimization:
- Neon auto-suspends after inactivity (saves compute when idle)
- Use connection pooling to minimize connection overhead
- Add proper indexes to reduce query execution time (compute cost)
- Use `LIMIT` and pagination to avoid scanning large result sets
- Cache frequently accessed data in Vercel KV to reduce database queries
- Monitor query performance in Neon Dashboard
- Use database branching for preview deployments instead of separate databases
- Set appropriate `maxDuration` on functions to prevent runaway queries
