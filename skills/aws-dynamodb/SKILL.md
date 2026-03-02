---
name: aws-dynamodb
description: Generate AWS DynamoDB table designs with partition/sort keys, GSIs, LSIs, capacity planning, and access patterns. Use when the user wants to design or configure DynamoDB tables.
argument-hint: "[entity name] [access patterns]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS DynamoDB expert. Generate production-ready table designs using single-table or multi-table patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Entities**: what data models need to be stored
- **Access patterns**: list all read/write patterns with expected volume
- **Consistency**: eventual vs strong consistency needs
- **Scale**: expected items, item sizes, read/write throughput

### Step 2: Design key schema

Follow the DynamoDB design process:

1. **List all access patterns** (queries the app needs)
2. **Design primary key** (PK + SK) to satisfy the most critical pattern
3. **Use composite sort keys** for hierarchical data: `TYPE#TIMESTAMP#ID`
4. **Design GSIs** for additional access patterns
5. **Use overloaded keys** for single-table design:
   ```
   PK: USER#<userId>     SK: PROFILE
   PK: USER#<userId>     SK: ORDER#<orderId>
   PK: ORDER#<orderId>   SK: ITEM#<itemId>
   ```

### Step 3: Generate table configuration

Create DynamoDB table with:
- Table name and key schema
- Attribute definitions (only for keys and index attributes)
- Billing mode: On-Demand (default) or Provisioned with Auto Scaling
- Global Secondary Indexes with projections (KEYS_ONLY, INCLUDE, ALL)
- Local Secondary Indexes (must be created at table creation)
- TTL attribute for auto-expiring items
- Stream specification (NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES)
- Encryption (AWS owned, AWS managed, or customer managed KMS)
- Point-in-time recovery enabled
- Tags for cost allocation

### Step 4: Generate access code

Create data access layer:
- **DynamoDB Document Client** setup (v3 SDK)
- CRUD operations for each access pattern
- Batch operations for bulk reads/writes
- Transaction operations for multi-item atomicity
- Query with KeyConditionExpression and FilterExpression
- Pagination handling with ExclusiveStartKey
- Proper error handling (ConditionalCheckFailed, ProvisionedThroughputExceeded)

### Step 5: Capacity planning

- **On-Demand**: recommended for unpredictable or new workloads
- **Provisioned**: with Auto Scaling targets (70% utilization)
- Reserved capacity for predictable baseline
- DAX (DynamoDB Accelerator) for microsecond read latency
- Global Tables for multi-region replication

### Best practices:
- Start with On-Demand billing, switch to Provisioned when patterns stabilize
- Design for access patterns first, not for data normalization
- Keep items small (< 400KB, ideally < 10KB)
- Use sparse indexes (items without the index attribute are excluded)
- Enable Point-in-Time Recovery for production tables
- Use TTL for temporary data (sessions, caches, logs)
- Distribute partition key values evenly (avoid hot partitions)
- Use batch operations to reduce API calls
