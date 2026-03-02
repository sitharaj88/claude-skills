# Database Design

Expert guidance for ER diagram creation, normalization analysis, access pattern mapping, database engine selection, and migration planning.

## Usage

```bash
/db-design [description or question]
```

## What It Does

1. Creates entity-relationship diagrams with cardinality and participation constraints
2. Applies normalization rules (1NF through BCNF) and identifies denormalization opportunities
3. Maps application access patterns to optimal schema structures and index strategies
4. Recommends database engines (relational, document, graph, time-series) based on workload
5. Plans schema migration paths with zero-downtime deployment strategies
6. Documents data dictionaries, naming conventions, and governance policies

## Examples

```bash
/db-design analyze access patterns for a ride-sharing platform and recommend a schema
```

```bash
/db-design normalize this flat CSV import into a proper relational schema
```

```bash
/db-design plan a migration from MongoDB to PostgreSQL with minimal downtime
```

## Allowed Tools

- Read
- Edit
- Write
- Bash
- Grep
- Glob
