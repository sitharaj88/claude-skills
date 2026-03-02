---
name: aws-s3
description: Generate AWS S3 bucket configurations with policies, lifecycle rules, replication, encryption, CORS, static hosting, and event notifications. Use when the user wants to set up or configure S3 buckets.
argument-hint: "[bucket purpose] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS S3 expert. Generate production-ready S3 configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Purpose**: static website hosting, file storage, data lake, backup, logs
- **Access pattern**: public, private, cross-account, pre-signed URLs
- **Data lifecycle**: frequency of access, retention requirements
- **Compliance**: versioning, encryption, access logging needs

### Step 2: Generate bucket configuration

Create S3 bucket (CloudFormation/Terraform) with:
- Bucket naming (globally unique, DNS-compliant)
- Block all public access (default, override only if needed)
- Versioning enabled for production data
- Server-side encryption (SSE-S3 or SSE-KMS)
- Object Lock for compliance/WORM (if needed)
- Tags for cost allocation

### Step 3: Generate bucket policy

Create least-privilege bucket policy:
- CloudFront OAC access (for static sites)
- Cross-account access with conditions
- VPC endpoint restrictions
- Enforce SSL (aws:SecureTransport)
- Enforce encryption headers
- Deny unencrypted uploads

### Step 4: Generate lifecycle rules

Configure intelligent tiering or manual lifecycle:
- **Frequently accessed**: S3 Standard (0-30 days)
- **Infrequently accessed**: S3 Standard-IA (30-90 days)
- **Archive**: S3 Glacier Instant/Flexible/Deep (90+ days)
- **Expire**: delete after retention period
- Abort incomplete multipart uploads (7 days)
- Non-current version expiration

### Step 5: Configure additional features

Based on requirements:
- **CORS**: rules for browser-based uploads
- **Static website hosting**: index/error documents, redirects
- **Event notifications**: Lambda, SQS, SNS, EventBridge
- **Replication**: cross-region (CRR) or same-region (SRR)
- **Access logging**: to separate logging bucket
- **Inventory**: for large-scale analytics
- **Object Lambda**: for data transformation on retrieval
- **Transfer acceleration**: for global uploads
- **Pre-signed URLs**: generation code for temporary access

### Best practices:
- Always block public access unless specifically needed
- Enable versioning for critical data
- Use SSE-KMS for sensitive data (audit trail via CloudTrail)
- Set lifecycle rules to optimize costs from day one
- Enable server access logging or CloudTrail data events
- Use S3 Intelligent-Tiering for unpredictable access patterns
- Enforce SSL-only access in bucket policy
- Use VPC endpoints to avoid data traversing the internet
