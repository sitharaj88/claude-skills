---
name: db-mongodb
description: Generate MongoDB schemas, aggregation pipelines, indexes, data modeling patterns, and replica set configurations. Use when the user wants to design or optimize MongoDB databases.
argument-hint: "[schema|query|aggregate|optimize] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mongosh *), Bash(mongodump *), Bash(mongorestore *)
user-invocable: true
---

## Instructions

You are a MongoDB expert. Generate production-ready database designs and queries.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: data modeling, queries, aggregation, optimization, setup
- **Driver**: Mongoose (Node.js), PyMongo, Motor (async Python), Go driver
- **Pattern**: embedded documents, references, or hybrid

### Step 2: Data modeling

Design collections following MongoDB patterns:

**Embedding (denormalization) when:**
- Data is accessed together
- One-to-few relationships
- Data doesn't change frequently

**Referencing (normalization) when:**
- Many-to-many relationships
- Data is accessed independently
- Documents would exceed 16MB

**Patterns:**
- **Polymorphic** — different document shapes in one collection
- **Bucket** — group time-series data into buckets
- **Outlier** — handle documents with unusual array sizes
- **Computed** — pre-compute aggregations
- **Extended Reference** — embed frequently accessed fields
- **Subset** — embed only recent/relevant subset

### Step 3: Schema validation

Create JSON Schema validation:
```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name"],
      properties: {
        email: { bsonType: "string", pattern: "^.+@.+$" },
        name: { bsonType: "string", minLength: 1 },
        roles: { bsonType: "array", items: { enum: ["admin", "user", "editor"] } },
        profile: {
          bsonType: "object",
          properties: {
            bio: { bsonType: "string", maxLength: 500 },
            avatar: { bsonType: "string" }
          }
        }
      }
    }
  }
});
```

### Step 4: Indexes and queries

Create indexes based on query patterns:
- Single field, compound, multikey (array), text, geospatial, hashed
- Use ESR rule: Equality, Sort, Range for compound index order
- Partial indexes for filtered queries
- TTL indexes for auto-expiring documents
- Wildcard indexes for dynamic schemas
- Atlas Search for full-text search

Optimize queries:
- Use explain() to analyze query plans
- Covered queries (all fields in index)
- Use $lookup sparingly (prefer embedding)
- Use $graphLookup for recursive relations
- Cursor-based pagination with _id

### Step 5: Aggregation pipelines

Create efficient aggregation pipelines:
- $match early to reduce documents
- $project to limit fields
- $group with accumulators ($sum, $avg, $push, $addToSet)
- $lookup for joins (use pipeline form for filtered lookups)
- $facet for multi-dimensional aggregations
- $merge or $out for materialized views
- $unionWith for combining collections

### Step 6: Application integration

Generate driver code:
- **Mongoose**: schemas, models, middleware, virtuals, population
- **Native driver**: connection pooling, transactions, change streams
- Change Streams for real-time data sync
- Transactions for multi-document atomicity
- Read/write concerns for consistency

### Step 7: Operations

- Replica set configuration (3+ members)
- Sharding strategy (hashed vs ranged shard key)
- Atlas setup and configuration
- mongodump/mongorestore backup scripts
- Monitoring with mongostat and mongotop

### Best practices:
- Design schema for your queries, not your entities
- Embed when data is read together, reference when independent
- Follow the ESR rule for compound indexes
- Use Atlas for production (managed service)
- Enable retryable writes and reads
- Use change streams instead of polling
- Set appropriate write concern for durability
- Monitor with Atlas or MongoDB Cloud Manager
