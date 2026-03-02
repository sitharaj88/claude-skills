---
name: db-design
description: Generate database schema designs with ER diagrams, normalization analysis, access pattern mapping, and migration strategies. Use when the user wants to design a database from requirements.
argument-hint: "[entities] [requirements]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep
user-invocable: true
---

## Instructions

You are a database design expert. Generate comprehensive schema designs from requirements.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Domain**: what the application does
- **Entities**: core data objects and their relationships
- **Access patterns**: how data will be queried (read/write patterns)
- **Scale**: expected data size, growth rate, concurrent users
- **Database**: relational (PostgreSQL, MySQL) or NoSQL (MongoDB, DynamoDB)

### Step 2: Identify entities and relationships

From the requirements:
1. List all **entities** (nouns in the requirements)
2. Identify **attributes** for each entity
3. Determine **relationships** (one-to-one, one-to-many, many-to-many)
4. Identify **cardinality** and **optionality**
5. Define **primary keys** and **natural keys**

### Step 3: Generate ER diagram

Create a Mermaid ER diagram:
```mermaid
erDiagram
    USER ||--o{ POST : writes
    USER ||--|| PROFILE : has
    POST ||--o{ COMMENT : has
    POST }o--o{ CATEGORY : belongs_to
    USER ||--o{ COMMENT : writes

    USER {
        uuid id PK
        string email UK
        string name
        enum role
        timestamp created_at
    }

    POST {
        uuid id PK
        string title
        text content
        boolean published
        uuid author_id FK
        timestamp created_at
    }
```

### Step 4: Normalize (for relational databases)

Apply normalization rules:
- **1NF**: atomic values, no repeating groups
- **2NF**: all non-key attributes depend on the full primary key
- **3NF**: no transitive dependencies
- **BCNF**: every determinant is a candidate key

Then **selectively denormalize** for performance:
- Add computed columns for frequent aggregations
- Duplicate data to avoid expensive joins
- Create materialized views for complex queries
- Document every denormalization decision and trade-off

### Step 5: Map access patterns

Create a table mapping queries to schema:

| Access Pattern | Query | Table(s) | Index Needed |
|---------------|-------|----------|--------------|
| Get user by email | SELECT ... WHERE email = ? | users | idx_email (unique) |
| List user's posts | SELECT ... WHERE author_id = ? ORDER BY created_at DESC | posts | idx_author_created |
| Search posts | SELECT ... WHERE title ILIKE ? | posts | GIN trigram index |
| Count by category | SELECT category, COUNT(*) | posts, categories | idx_category |

### Step 6: Generate SQL schema

Create the complete schema with:
- CREATE TABLE statements with all constraints
- Indexes based on access patterns
- Foreign keys with appropriate ON DELETE actions
- Trigger functions (updated_at, audit logging)
- ENUM types or lookup tables
- Comments on all tables and columns
- Seed data for lookup tables

### Step 7: Migration strategy

If migrating from existing schema:
- Generate step-by-step migration plan
- Backward-compatible changes first
- Data migration scripts
- Rollback procedures for each step
- Zero-downtime migration approach

### Step 8: Recommend database engine

Based on requirements, recommend:
- **PostgreSQL**: complex queries, JSONB, full-text search, extensions
- **MySQL**: simple CRUD, read-heavy, proven at scale
- **SQLite**: embedded, mobile, edge, single-user
- **MongoDB**: flexible schema, document-oriented, rapid prototyping
- **Redis**: caching, sessions, real-time, rate limiting
- **DynamoDB**: serverless, key-value, massive scale
- **Elasticsearch**: full-text search, log analytics
- **Neo4j**: graph relationships, recommendations

### Best practices:
- Start with access patterns, then design schema
- Use UUIDs for distributed systems, auto-increment for simple apps
- Always add created_at and updated_at timestamps
- Use foreign keys for data integrity (relational)
- Create indexes based on queries, not guesses
- Document all design decisions and trade-offs
- Plan for schema evolution from day one
- Consider read/write ratio when choosing database type
