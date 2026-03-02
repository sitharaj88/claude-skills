---
name: db-neo4j
description: Generate Neo4j graph database models, Cypher queries, indexes, and graph algorithm configurations. Use when the user wants to model or query graph data with Neo4j.
argument-hint: "[model|query|algorithm|setup] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(cypher-shell *)
user-invocable: true
---

## Instructions

You are a Neo4j graph database expert. Generate production-ready graph data models and queries.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: data modeling, Cypher queries, graph algorithms, setup
- **Use case**: social network, recommendation engine, knowledge graph, fraud detection, access control
- **Driver**: neo4j-driver (JS), neo4j (Python), neo4j-go-driver

### Step 2: Graph data modeling

Design the graph model:
- **Nodes** represent entities (labeled): (:User), (:Product), (:Order)
- **Relationships** represent connections (typed): -[:PURCHASED]->
- **Properties** on nodes and relationships for attributes

**Rules of thumb:**
- Nouns become node labels
- Verbs become relationship types
- Adjectives/adverbs become properties
- Use relationships for structure, properties for attributes
- Keep relationship types in UPPER_SNAKE_CASE

```cypher
// Schema example
CREATE CONSTRAINT user_email FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT product_sku FOR (p:Product) REQUIRE p.sku IS UNIQUE;
CREATE INDEX user_name FOR (u:User) ON (u.name);

// Data example
CREATE (u:User {id: randomUUID(), name: 'Alice', email: 'alice@example.com'})
CREATE (p:Product {id: randomUUID(), name: 'Widget', sku: 'WDG-001', price: 29.99})
CREATE (u)-[:PURCHASED {date: datetime(), quantity: 2}]->(p)
```

### Step 3: Cypher query patterns

**Traversal queries:**
```cypher
// Friends of friends who aren't direct friends
MATCH (user:User {email: $email})-[:FRIENDS_WITH]->(friend)-[:FRIENDS_WITH]->(fof)
WHERE NOT (user)-[:FRIENDS_WITH]->(fof) AND user <> fof
RETURN DISTINCT fof.name, count(friend) AS mutual_friends
ORDER BY mutual_friends DESC LIMIT 10
```

**Recommendation engine:**
```cypher
// Collaborative filtering: users who bought X also bought Y
MATCH (u:User)-[:PURCHASED]->(p:Product)<-[:PURCHASED]-(other:User)-[:PURCHASED]->(rec:Product)
WHERE u.id = $userId AND NOT (u)-[:PURCHASED]->(rec)
RETURN rec, count(other) AS score ORDER BY score DESC LIMIT 10
```

**Path finding:**
```cypher
// Shortest path between two users
MATCH path = shortestPath((a:User {id: $from})-[:FRIENDS_WITH*..6]-(b:User {id: $to}))
RETURN path, length(path) AS distance
```

### Step 4: Graph Data Science (GDS)

Use GDS library for algorithms:
- **Centrality**: PageRank, Betweenness, Degree
- **Community detection**: Louvain, Label Propagation
- **Similarity**: Node Similarity, kNN
- **Path finding**: Dijkstra, A*, Yen's k-shortest
- **Embeddings**: FastRP, GraphSAGE, Node2Vec

### Step 5: Performance optimization

- Create indexes for frequently queried properties
- Use parameterized queries (never concatenate)
- Profile queries with EXPLAIN and PROFILE
- Use APOC procedures for complex operations
- Batch large imports with CALL {} IN TRANSACTIONS
- Use composite indexes for multi-property lookups

### Step 6: Application integration

Generate driver code with:
- Connection pooling and session management
- Transaction functions for retry logic
- Result handling and mapping to domain objects
- Bookmark management for causal consistency

### Best practices:
- Model relationships as first-class citizens (not join tables)
- Use specific relationship types (not generic "RELATED_TO")
- Create constraints and indexes before loading data
- Use parameterized queries for all operations
- Profile queries during development
- Use APOC for data import, export, and utilities
- Consider graph algorithms for analytics use cases
- Keep relationship density balanced (avoid super-nodes)
