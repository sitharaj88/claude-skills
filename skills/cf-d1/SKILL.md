---
name: cf-d1
description: Generate D1 SQLite database schemas, queries, and edge-native patterns. Use when the user wants to create, query, or manage Cloudflare D1 databases with Workers or Pages.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx wrangler *), Bash(wrangler *), Bash(npm *)
user-invocable: true
---

## Instructions

You are a Cloudflare D1 expert. Generate production-ready D1 database schemas, queries, migrations, and integration patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: schema design, query writing, migration creation, seed data
- **Data model**: tables, relationships, constraints, indexes
- **Access pattern**: read-heavy, write-heavy, mixed
- **Integration**: raw D1 API, Drizzle ORM, Prisma with D1 adapter
- **Scale**: read replication needs, location hints

### Step 2: Create database and configure binding

```bash
# Create a D1 database
npx wrangler d1 create my-app-db

# Output includes database_id to add to wrangler.toml

# List databases
npx wrangler d1 list

# Get database info
npx wrangler d1 info my-app-db
```

**wrangler.toml binding:**

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "xxxx-xxxx-xxxx-xxxx"

# Multiple databases
[[d1_databases]]
binding = "ANALYTICS_DB"
database_name = "analytics-db"
database_id = "yyyy-yyyy-yyyy-yyyy"
```

### Step 3: Generate schema with migrations

**Create migration files:**

```bash
# Create a new migration
npx wrangler d1 migrations create my-app-db init-schema

# This creates: migrations/0001_init-schema.sql
```

**Schema design (migrations/0001_init-schema.sql):**

```sql
-- Enable WAL mode for better concurrent read performance
PRAGMA journal_mode = WAL;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = 1;

-- Posts table with foreign key
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status, published_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);

-- Tags table (many-to-many)
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_users_timestamp
  AFTER UPDATE ON users
  FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER update_posts_timestamp
  AFTER UPDATE ON posts
  FOR EACH ROW
BEGIN
  UPDATE posts SET updated_at = datetime('now') WHERE id = OLD.id;
END;
```

**Apply migrations:**

```bash
# Apply migrations locally (for development)
npx wrangler d1 migrations apply my-app-db --local

# Apply migrations to remote (production)
npx wrangler d1 migrations apply my-app-db --remote

# List applied migrations
npx wrangler d1 migrations list my-app-db
```

### Step 4: Generate D1 client API queries

```typescript
interface Env {
  DB: D1Database;
}

// --- CRUD Operations ---

// Create (INSERT)
async function createUser(db: D1Database, user: { email: string; name: string; passwordHash: string }) {
  const result = await db
    .prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?) RETURNING *")
    .bind(user.email, user.name, user.passwordHash)
    .first();
  return result;
}

// Read single (SELECT ... first())
async function getUserById(db: D1Database, id: string) {
  return db.prepare("SELECT id, email, name, role, created_at FROM users WHERE id = ?").bind(id).first();
}

// Read multiple (SELECT ... all())
async function getPublishedPosts(db: D1Database, limit = 20, offset = 0) {
  const { results } = await db
    .prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.published_at,
             u.name AS author_name, u.avatar_url AS author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(limit, offset)
    .all();
  return results;
}

// Update
async function updatePost(db: D1Database, id: number, data: { title?: string; content?: string; status?: string }) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title) { fields.push("title = ?"); values.push(data.title); }
  if (data.content) { fields.push("content = ?"); values.push(data.content); }
  if (data.status) {
    fields.push("status = ?");
    values.push(data.status);
    if (data.status === "published") {
      fields.push("published_at = datetime('now')");
    }
  }

  values.push(id);

  return db
    .prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first();
}

// Delete
async function deletePost(db: D1Database, id: number) {
  return db.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
}
```

### Step 5: Batch and transaction operations

```typescript
// Batch operations (multiple statements in one round-trip)
async function createPostWithTags(
  db: D1Database,
  post: { title: string; slug: string; content: string; authorId: string },
  tagIds: number[]
) {
  const statements: D1PreparedStatement[] = [
    db.prepare(
      "INSERT INTO posts (title, slug, content, author_id, status) VALUES (?, ?, ?, ?, 'draft') RETURNING id"
    ).bind(post.title, post.slug, post.content, post.authorId),
  ];

  // Note: batch() executes statements sequentially but in a single transaction
  // The post ID from the first statement is not available to subsequent statements
  // Use a known ID pattern or two-step approach for dependent inserts

  const results = await db.batch(statements);
  const postId = (results[0].results?.[0] as { id: number })?.id;

  if (postId && tagIds.length > 0) {
    const tagStatements = tagIds.map((tagId) =>
      db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)").bind(postId, tagId)
    );
    await db.batch(tagStatements);
  }

  return postId;
}

// Exec for raw SQL (useful for seeds and migrations)
async function seedDatabase(db: D1Database) {
  await db.exec(`
    INSERT INTO tags (name, slug) VALUES ('JavaScript', 'javascript');
    INSERT INTO tags (name, slug) VALUES ('TypeScript', 'typescript');
    INSERT INTO tags (name, slug) VALUES ('Cloudflare', 'cloudflare');
    INSERT INTO tags (name, slug) VALUES ('Workers', 'workers');
  `);
}
```

### Step 6: Full-text search with FTS5

```sql
-- migrations/0002_add-fts.sql

-- Create FTS5 virtual table for posts
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title,
  content,
  content='posts',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- Populate FTS index from existing data
INSERT INTO posts_fts(rowid, title, content)
  SELECT id, title, content FROM posts;

-- Triggers to keep FTS in sync
CREATE TRIGGER posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, title, content) VALUES (NEW.id, NEW.title, NEW.content);
END;

CREATE TRIGGER posts_fts_delete AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, content)
    VALUES('delete', OLD.id, OLD.title, OLD.content);
END;

CREATE TRIGGER posts_fts_update AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, content)
    VALUES('delete', OLD.id, OLD.title, OLD.content);
  INSERT INTO posts_fts(rowid, title, content)
    VALUES (NEW.id, NEW.title, NEW.content);
END;
```

```typescript
// Full-text search query
async function searchPosts(db: D1Database, query: string, limit = 20) {
  const { results } = await db
    .prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt,
             highlight(posts_fts, 0, '<mark>', '</mark>') AS title_highlighted,
             snippet(posts_fts, 1, '<mark>', '</mark>', '...', 32) AS content_snippet,
             rank
      FROM posts_fts
      JOIN posts p ON posts_fts.rowid = p.id
      WHERE posts_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `)
    .bind(query, limit)
    .all();
  return results;
}
```

### Step 7: JSON support

```typescript
// Store and query JSON data
async function createSetting(db: D1Database, key: string, value: object) {
  await db
    .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, json(?))")
    .bind(key, JSON.stringify(value))
    .run();
}

async function getSettingField(db: D1Database, key: string, field: string) {
  return db
    .prepare("SELECT json_extract(value, ?) AS field_value FROM settings WHERE key = ?")
    .bind(`$.${field}`, key)
    .first();
}

// Query JSON arrays
async function getUsersByPreference(db: D1Database, preference: string) {
  const { results } = await db
    .prepare(`
      SELECT u.id, u.name
      FROM users u, json_each(u.preferences, '$.tags') AS t
      WHERE t.value = ?
    `)
    .bind(preference)
    .all();
  return results;
}
```

### Step 8: Drizzle ORM integration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
```

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin", "moderator"] }).notNull().default("user"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
```

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// Usage in Worker
import { eq, desc } from "drizzle-orm";
import { createDb } from "./db";
import { users, posts } from "./db/schema";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = createDb(env.DB);

    // Select with joins
    const publishedPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        authorName: users.name,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(20);

    return Response.json(publishedPosts);
  },
};
```

### Step 9: Query performance optimization

```typescript
// Use EXPLAIN QUERY PLAN to analyze queries
async function analyzeQuery(db: D1Database, sql: string) {
  const { results } = await db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
  return results;
}

// Efficient pagination with cursor-based approach (avoid OFFSET for large datasets)
async function getPostsCursor(db: D1Database, cursor?: string, limit = 20) {
  let query = `
    SELECT id, title, slug, published_at
    FROM posts
    WHERE status = 'published'
  `;
  const params: unknown[] = [];

  if (cursor) {
    query += " AND published_at < ?";
    params.push(cursor);
  }

  query += " ORDER BY published_at DESC LIMIT ?";
  params.push(limit + 1); // Fetch one extra to determine if there are more

  const stmt = db.prepare(query);
  const { results } = await stmt.bind(...params).all();

  const hasMore = results.length > limit;
  const items = results.slice(0, limit);
  const nextCursor = hasMore ? (items[items.length - 1] as { published_at: string }).published_at : null;

  return { items, nextCursor, hasMore };
}
```

### Step 10: Local development and backups

```bash
# Execute SQL against local D1
npx wrangler d1 execute my-app-db --local --command "SELECT * FROM users LIMIT 5"

# Execute SQL against remote D1
npx wrangler d1 execute my-app-db --remote --command "SELECT COUNT(*) FROM users"

# Execute SQL from a file
npx wrangler d1 execute my-app-db --local --file ./seed.sql

# Export database (backup)
npx wrangler d1 export my-app-db --remote --output ./backup.sql

# Time travel (point-in-time recovery)
# Available via Cloudflare Dashboard: D1 -> Database -> Time Travel
# Restore to any point within the last 30 days (paid plan)
```

### Best practices

- **Use parameterized queries** (`.bind()`) to prevent SQL injection -- never concatenate user input
- **Create indexes** for columns used in WHERE, JOIN, and ORDER BY clauses
- **Use `batch()`** for multiple related operations to reduce round-trips and ensure atomicity
- **Use cursor-based pagination** instead of OFFSET for large datasets
- **Use `first()`** instead of `all()` when expecting a single row
- **Store dates as TEXT** in ISO 8601 format using `datetime('now')` for SQLite compatibility
- **Use FTS5** for text search rather than `LIKE '%term%'` (which cannot use indexes)
- **Set location hints** for databases that are primarily accessed from specific regions
- **Use Drizzle ORM** for type-safe queries in larger applications
- **Keep migrations small and incremental** (one concern per migration file)

### Anti-patterns to avoid

- Do NOT use `exec()` for user-provided input (no parameter binding, SQL injection risk)
- Do NOT create too many indexes (each index increases write latency and storage)
- Do NOT use `SELECT *` in production queries (specify needed columns explicitly)
- Do NOT use D1 for high-write-throughput workloads (SQLite is single-writer)
- Do NOT store large binary blobs in D1 (use R2 and store the key/URL in D1)
- Do NOT skip migrations and modify the schema manually
- Do NOT use `OFFSET` for deep pagination (performance degrades linearly with offset value)
- Do NOT ignore `meta.changes` and `meta.duration` in query results (useful for monitoring)

### Cost optimization

- **Free tier**: 5 million rows read/day, 100,000 rows written/day, 5GB storage
- **Paid plan**: $0.001 per million rows read, $1.00 per million rows written
- Optimize queries to read fewer rows (use indexes, limit result sets)
- Use `batch()` to combine multiple reads into a single call (counts as one billable operation)
- Cache frequently-read data in KV to reduce D1 read operations
- Use read replicas for read-heavy workloads to distribute load
- Monitor row reads/writes in the Cloudflare Dashboard under D1 Analytics
- Avoid full table scans by ensuring queries hit indexes (use EXPLAIN QUERY PLAN)
