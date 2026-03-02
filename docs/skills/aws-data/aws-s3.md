# AWS S3

Generate S3 bucket configurations with bucket policies, lifecycle rules, replication, encryption, and static website hosting.

## Usage

```bash
/aws-s3 <description of your storage requirements>
```

## What It Does

1. Creates S3 bucket configurations with appropriate naming and region settings
2. Generates bucket policies and ACLs for access control
3. Configures lifecycle rules for storage class transitions and expiration
4. Sets up server-side encryption (SSE-S3, SSE-KMS, or SSE-C)
5. Produces cross-region or same-region replication configurations
6. Adds versioning, logging, event notifications, and CORS settings

## Examples

```bash
/aws-s3 Create a bucket for static website hosting with CloudFront OAC policy

/aws-s3 Set up a data lake bucket with lifecycle rules transitioning to Glacier after 90 days

/aws-s3 Configure a logging bucket with cross-region replication and KMS encryption
```

## Allowed Tools

- `Read` - Read existing bucket policies and configurations
- `Write` - Create bucket templates, policies, and lifecycle configs
- `Edit` - Modify existing S3 configurations
- `Bash` - Run AWS CLI S3 commands for validation
- `Glob` - Search for storage-related templates
- `Grep` - Find bucket references across the project
