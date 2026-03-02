# Elasticsearch

Expert guidance for Elasticsearch index mappings, Query DSL, aggregations, custom analyzers, vector search, and index lifecycle management.

## Usage

```bash
/db-elasticsearch [description or question]
```

## What It Does

1. Designs index mappings with field types, analyzers, and multi-fields
2. Writes queries using bool, match, nested, function_score, and kNN search
3. Builds aggregation pipelines for analytics with buckets, metrics, and pipelines
4. Creates custom analyzers with tokenizers, token filters, and character filters
5. Configures dense_vector fields for semantic and hybrid search
6. Sets up Index Lifecycle Management policies for rollover and retention

## Examples

```bash
/db-elasticsearch design mappings for a product search with faceted filtering
```

```bash
/db-elasticsearch build a hybrid search combining BM25 and vector similarity
```

```bash
/db-elasticsearch create an ILM policy for time-series log data
```

## Allowed Tools

- Read
- Edit
- Write
- Bash
- Grep
- Glob
