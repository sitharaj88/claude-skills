# Cloudflare D1

Generate D1 SQLite database schemas, migrations, queries, full-text search, and ORM integration for edge-native data access.

## Usage

```bash
/cf-d1 <operation or description>
```

## What It Does

1. Creates D1 database schemas with tables, indexes, constraints, foreign keys, and triggers
2. Generates migration files for incremental schema changes with Wrangler CLI
3. Produces parameterized CRUD queries with batch operations and cursor-based pagination
4. Implements FTS5 full-text search with highlighting, snippets, and sync triggers
5. Integrates Drizzle ORM for type-safe queries with schema definitions and joins
6. Configures local development, remote execution, backups, and time travel recovery

## Example Output

```sql
-- migrations/0001_init-schema.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status, published_at DESC);
```

## What It Covers

- **Schema design** with tables, indexes, foreign keys, constraints, and triggers
- **Migrations** with incremental SQL files and Wrangler CLI management
- **CRUD operations** with parameterized queries, batch execution, and transactions
- **Full-text search** via FTS5 virtual tables with highlighting and ranking
- **JSON support** with json_extract, json_each, and structured data queries
- **Drizzle ORM** integration for type-safe schema definitions and queries
- **Performance** with cursor-based pagination, EXPLAIN QUERY PLAN, and index optimization

<div class="badge-row">
  <span class="badge">Cloudflare</span>
  <span class="badge">Database</span>
  <span class="badge">SQLite</span>
</div>

## Installation

```bash
cp -r skills/cf-d1 ~/.claude/skills/cf-d1
```

## Allowed Tools

- `Read` - Read existing database schemas, migrations, and query files
- `Write` - Create migration files, schema definitions, and query modules
- `Edit` - Modify existing schemas and query logic
- `Bash` - Run Wrangler CLI commands for database creation, migration, and execution
- `Glob` - Search for migration and schema files
- `Grep` - Find table references and query patterns
