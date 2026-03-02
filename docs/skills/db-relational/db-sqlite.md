# SQLite

Expert guidance for SQLite embedded database design, WAL mode configuration, FTS5 full-text search, and edge/mobile integration patterns.

## Usage

```bash
/db-sqlite [description or question]
```

## What It Does

1. Designs compact schemas optimized for embedded and single-file deployment
2. Configures WAL mode, journal settings, and PRAGMA options for concurrency
3. Sets up FTS5 virtual tables for full-text search with custom tokenizers
4. Implements migration strategies for mobile apps (iOS, Android, React Native)
5. Integrates with edge runtimes like Cloudflare D1, Turso, and Bun SQLite
6. Handles backup, vacuum, and integrity-check workflows

## Examples

```bash
/db-sqlite set up FTS5 search for a notes app with ranking
```

```bash
/db-sqlite configure WAL mode and optimize for concurrent reads
```

```bash
/db-sqlite design a local-first schema with sync support
```

## Allowed Tools

- Read
- Edit
- Write
- Bash
- Grep
- Glob
