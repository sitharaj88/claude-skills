# AWS DynamoDB

Design DynamoDB tables with partition and sort keys, Global Secondary Indexes, single-table design patterns, and application access code.

## Usage

```bash
/aws-dynamodb <description of your data model and access patterns>
```

## What It Does

1. Analyzes your access patterns to design optimal table key schemas
2. Creates table definitions with provisioned or on-demand capacity settings
3. Designs Global and Local Secondary Indexes for query flexibility
4. Generates single-table design layouts when applicable
5. Produces application code for CRUD operations using the AWS SDK
6. Adds TTL, streams, point-in-time recovery, and backup configurations

## Examples

```bash
/aws-dynamodb Design a single-table schema for an e-commerce app with orders, products, and users

/aws-dynamodb Create a table with GSI for querying by status and date range

/aws-dynamodb Generate Node.js CRUD operations with DynamoDB DocumentClient
```

## Allowed Tools

- `Read` - Read existing data models and application code
- `Write` - Create table definitions, access code, and migration scripts
- `Edit` - Modify existing DynamoDB configurations
- `Bash` - Run AWS CLI DynamoDB commands for testing
- `Glob` - Search for data model files
- `Grep` - Find table and index references
