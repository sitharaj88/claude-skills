# GCP Cloud Storage

Generate Google Cloud Storage bucket configurations with IAM policies, lifecycle rules, versioning, encryption, and static website hosting.

## Usage

```bash
/gcp-cloud-storage <description of your storage requirements>
```

## What It Does

1. Creates GCS bucket configurations with appropriate naming, location, and storage class settings
2. Generates IAM policies and uniform bucket-level access controls
3. Configures lifecycle rules for storage class transitions (Standard, Nearline, Coldline, Archive) and object deletion
4. Sets up customer-managed encryption keys (CMEK) or Google-managed encryption
5. Produces versioning, retention policies, and object hold configurations
6. Adds logging, CORS settings, and static website hosting with load balancer integration

## Examples

```bash
/gcp-cloud-storage Create a bucket for static website hosting behind a Cloud CDN-enabled load balancer

/gcp-cloud-storage Set up a data lake bucket with lifecycle rules transitioning to Coldline after 90 days and Archive after 365 days

/gcp-cloud-storage Configure a multi-region logging bucket with CMEK encryption and uniform bucket-level access
```

## Allowed Tools

- `Read` - Read existing bucket policies and configurations
- `Write` - Create bucket templates, IAM policies, and lifecycle configs
- `Edit` - Modify existing GCS configurations
- `Bash` - Run gcloud storage commands for validation
- `Glob` - Search for storage-related templates
- `Grep` - Find bucket references across the project
