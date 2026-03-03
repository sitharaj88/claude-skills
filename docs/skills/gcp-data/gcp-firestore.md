# GCP Firestore

Design Firestore data models with security rules, composite indexes, real-time listeners, and offline support for web and mobile applications.

## Usage

```bash
/gcp-firestore <description of your Firestore requirements>
```

## What It Does

1. Designs Firestore data models with collections, subcollections, and document structures
2. Generates security rules with role-based access control and field-level validation
3. Creates composite index definitions for complex queries
4. Produces real-time listener code for live data synchronization
5. Configures offline persistence and cache settings for mobile and web clients
6. Adds batch write operations, transactions, and paginated query patterns

## Examples

```bash
/gcp-firestore Design a data model for a multi-tenant SaaS application with user roles and team-based access control

/gcp-firestore Generate security rules that enforce document ownership and validate required fields on write

/gcp-firestore Create real-time listener code with optimistic UI updates and offline persistence for a chat application
```

## Allowed Tools

- `Read` - Read existing Firestore rules and data model files
- `Write` - Create security rules, index definitions, and data access code
- `Edit` - Modify existing Firestore configurations
- `Bash` - Run gcloud firestore and Firebase CLI commands for validation
- `Glob` - Search for Firestore-related templates
- `Grep` - Find Firestore references across the project
