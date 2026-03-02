---
name: db-elasticsearch
description: Generate Elasticsearch index mappings, queries, aggregations, analyzers, and cluster configurations. Use when the user wants to implement search, logging, or analytics with Elasticsearch.
argument-hint: "[mapping|query|aggregate|setup] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl *)
user-invocable: true
---

## Instructions

You are an Elasticsearch expert. Generate production-ready search and analytics configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Use case**: full-text search, log analytics, metrics, vector search, autocomplete
- **Client**: @elastic/elasticsearch (Node.js), elasticsearch-py, olivere/elastic (Go)
- **Version**: Elasticsearch 8.x (preferred) or OpenSearch

### Step 2: Index mapping design

Create explicit mappings:
```json
{
  "mappings": {
    "properties": {
      "title": { "type": "text", "analyzer": "english", "fields": { "keyword": { "type": "keyword" } } },
      "description": { "type": "text", "analyzer": "standard" },
      "category": { "type": "keyword" },
      "price": { "type": "float" },
      "tags": { "type": "keyword" },
      "location": { "type": "geo_point" },
      "embedding": { "type": "dense_vector", "dims": 1536, "index": true, "similarity": "cosine" },
      "created_at": { "type": "date" },
      "metadata": { "type": "object", "dynamic": true }
    }
  },
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "analysis": { }
  }
}
```

Field types: text (full-text), keyword (exact match), integer, float, date, boolean, geo_point, nested, dense_vector, completion

### Step 3: Custom analyzers

Create analyzers for specific use cases:
- **Autocomplete**: edge_ngram tokenizer
- **Search-as-you-type**: search_as_you_type field type
- **Multilingual**: ICU analysis plugin
- **Synonym support**: synonym token filter
- **Stemming**: language-specific stemmers

### Step 4: Query DSL

Write queries for different patterns:

**Full-text search:**
- multi_match with best_fields or cross_fields
- bool query (must, should, filter, must_not)
- function_score for relevance tuning

**Exact matching:**
- term, terms, range queries in filter context

**Aggregations:**
- terms, date_histogram, range buckets
- avg, sum, cardinality, percentiles metrics
- Pipeline aggregations (derivative, cumulative_sum)
- Composite aggregation for pagination

**Vector search (kNN):**
- knn query for semantic/similarity search
- Hybrid search combining text + vector

### Step 5: Index lifecycle management

- ILM policies for log data: hot -> warm -> cold -> delete
- Index templates for consistent mapping
- Data streams for time-series data
- Rollover for index management
- Snapshot and restore for backups

### Step 6: Performance optimization

- Bulk indexing with optimal batch size (5-15MB)
- Search optimization: filter context over query context
- Shard sizing (10-50GB per shard)
- Caching: query cache, request cache, field data cache
- Use doc_values for sorting/aggregations (default for keyword/numeric)
- Avoid deep pagination (use search_after or scroll)

### Best practices:
- Define explicit mappings (don't rely on dynamic mapping in production)
- Use keyword + text multi-fields for string data
- Use filter context for non-scoring conditions (cacheable)
- Size shards between 10-50GB
- Use ILM for log and time-series data
- Prefer search_after over from/size for deep pagination
- Monitor cluster health with _cluster/health
- Use index aliases for zero-downtime reindexing
