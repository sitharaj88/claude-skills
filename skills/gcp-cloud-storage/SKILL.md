---
name: gcp-cloud-storage
description: Generate Cloud Storage (GCS) bucket configurations with lifecycle management, IAM policies, access controls, encryption, and hosting. Use when the user wants to set up or configure GCS buckets.
argument-hint: "[purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(gsutil *), Bash(bq *)
user-invocable: true
---

## Instructions

You are a GCP Cloud Storage expert. Generate production-ready GCS bucket configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Purpose**: static website hosting, data lake, backups, media storage, build artifacts, log storage
- **Access pattern**: public, private, signed URLs, cross-project, requestor pays
- **Data lifecycle**: frequency of access, retention requirements, compliance needs
- **Region**: single region, dual-region, or multi-region for redundancy
- **Security**: encryption, VPC Service Controls, uniform vs fine-grained access

### Step 2: Choose storage class

Select appropriate storage class based on access frequency:

| Storage Class | Min Duration | Use Case | Availability SLA |
|--------------|-------------|----------|------------------|
| Standard | None | Frequently accessed data | 99.95% (region) |
| Nearline | 30 days | Accessed less than once/month | 99.9% |
| Coldline | 90 days | Accessed less than once/quarter | 99.9% |
| Archive | 365 days | Accessed less than once/year | 99.9% |

**Autoclass**: Enable for unpredictable access patterns. GCS automatically transitions objects between Standard and colder classes based on access frequency.

```hcl
resource "google_storage_bucket" "data_lake" {
  name          = "my-project-data-lake"
  location      = "US"
  storage_class = "STANDARD"

  autoclass {
    enabled                = true
    terminal_storage_class = "ARCHIVE"
  }
}
```

### Step 3: Generate bucket configuration

Create GCS bucket (Terraform/gcloud) with:
- Globally unique bucket name (project ID prefix recommended)
- Location: region (`us-central1`), dual-region (`us-east1+us-west1`), or multi-region (`US`)
- Storage class selection
- Uniform bucket-level access (recommended over fine-grained)
- Public access prevention enforced
- Versioning for production data
- Labels for cost allocation and organization

**Terraform configuration:**

```hcl
resource "google_storage_bucket" "main" {
  name                        = "${var.project_id}-${var.purpose}"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  labels = {
    environment = var.environment
    team        = var.team
    managed_by  = "terraform"
  }
}
```

**gcloud CLI:**

```bash
gcloud storage buckets create gs://my-project-data-lake \
  --location=us-central1 \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access \
  --public-access-prevention \
  --enable-autoclass
```

### Step 4: Configure lifecycle management

Set lifecycle rules to automatically transition or delete objects:

```hcl
resource "google_storage_bucket" "managed" {
  name     = "${var.project_id}-managed-data"
  location = "US"

  lifecycle_rule {
    condition {
      age = 30
      matches_storage_class = ["STANDARD"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 90
      matches_storage_class = ["NEARLINE"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
      matches_storage_class = ["COLDLINE"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }

  # Delete non-current versions after 30 days
  lifecycle_rule {
    condition {
      num_newer_versions = 3
      with_state         = "ARCHIVED"
    }
    action {
      type = "Delete"
    }
  }

  # Abort incomplete multipart uploads
  lifecycle_rule {
    condition {
      age = 7
      with_state = "ANY"
      matches_prefix = [""]
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }
}
```

### Step 5: Configure retention policies

For compliance-driven data retention:

```hcl
resource "google_storage_bucket" "compliant" {
  name     = "${var.project_id}-compliant-data"
  location = "US"

  retention_policy {
    retention_period = 2592000  # 30 days in seconds
    is_locked        = false    # Set true to make permanent (IRREVERSIBLE)
  }

  versioning {
    enabled = true
  }
}
```

**Warning**: Locking a retention policy is irreversible. The bucket cannot be deleted until every object has satisfied the retention period.

### Step 6: Configure IAM and access control

**Uniform bucket-level access (recommended):**

```hcl
# Grant read access to a service account
resource "google_storage_bucket_iam_member" "viewer" {
  bucket = google_storage_bucket.main.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.sa_email}"
}

# Grant write access to a specific group
resource "google_storage_bucket_iam_member" "creator" {
  bucket = google_storage_bucket.main.name
  role   = "roles/storage.objectCreator"
  member = "group:data-writers@example.com"
}

# Grant admin access with conditions
resource "google_storage_bucket_iam_member" "conditional" {
  bucket = google_storage_bucket.main.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.sa_email}"

  condition {
    title       = "only_temp_prefix"
    description = "Access only to temp/ prefix"
    expression  = "resource.name.startsWith(\"projects/_/buckets/${google_storage_bucket.main.name}/objects/temp/\")"
  }
}
```

### Step 7: Configure signed URLs and CORS

**Signed URLs for temporary access:**

```python
from google.cloud import storage
import datetime

def generate_signed_url(bucket_name, blob_name, expiration_minutes=15):
    """Generate a signed URL for temporary object access."""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=expiration_minutes),
        method="GET",
    )
    return url

def generate_upload_signed_url(bucket_name, blob_name, content_type="application/octet-stream"):
    """Generate a signed URL for uploading."""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=15),
        method="PUT",
        content_type=content_type,
    )
    return url
```

**CORS configuration for browser uploads:**

```hcl
resource "google_storage_bucket" "cors_enabled" {
  name     = "${var.project_id}-media"
  location = "US"

  cors {
    origin          = ["https://example.com"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["Content-Type", "Content-MD5", "x-goog-resumable"]
    max_age_seconds = 3600
  }
}
```

### Step 8: Configure notifications and event-driven patterns

**Pub/Sub notifications:**

```hcl
resource "google_storage_notification" "notification" {
  bucket         = google_storage_bucket.main.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.gcs_events.id
  event_types    = ["OBJECT_FINALIZE", "OBJECT_DELETE"]

  custom_attributes = {
    new-attribute = "new-attribute-value"
  }

  depends_on = [google_pubsub_topic_iam_member.gcs_publisher]
}

resource "google_pubsub_topic_iam_member" "gcs_publisher" {
  topic  = google_pubsub_topic.gcs_events.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${data.google_storage_project_service_account.gcs_account.email_address}"
}
```

### Step 9: Configure encryption (CMEK)

**Customer-managed encryption keys:**

```hcl
resource "google_kms_key_ring" "gcs_keyring" {
  name     = "gcs-keyring"
  location = "us-central1"
}

resource "google_kms_crypto_key" "gcs_key" {
  name     = "gcs-encryption-key"
  key_ring = google_kms_key_ring.gcs_keyring.id

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_storage_bucket" "encrypted" {
  name     = "${var.project_id}-encrypted"
  location = "us-central1"

  encryption {
    default_kms_key_name = google_kms_crypto_key.gcs_key.id
  }

  depends_on = [google_kms_crypto_key_iam_member.gcs_sa_key]
}

resource "google_kms_crypto_key_iam_member" "gcs_sa_key" {
  crypto_key_id = google_kms_crypto_key.gcs_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_storage_project_service_account.gcs_account.email_address}"
}
```

### Step 10: Static website hosting

```hcl
resource "google_storage_bucket" "static_site" {
  name     = "www.example.com"
  location = "US"

  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

# Make bucket publicly readable (use with Cloud CDN/Load Balancer instead when possible)
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.static_site.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
```

**Recommended**: Use Cloud CDN with a load balancer in front of GCS for production static sites instead of direct public access. This provides SSL, caching, and custom domains.

### Step 11: Transfer service for large migrations

```bash
# Transfer from AWS S3 to GCS
gcloud transfer jobs create \
  s3://source-bucket \
  gs://destination-bucket \
  --source-creds-file=aws-creds.json

# Schedule recurring transfers
gcloud transfer jobs create \
  gs://source-bucket \
  gs://destination-bucket \
  --schedule-starts=2024-01-01T00:00:00Z \
  --schedule-repeats-every=24h
```

### Best practices

- **Always enable uniform bucket-level access** for consistent IAM-based permissions
- **Enable public access prevention** unless the bucket explicitly needs to be public
- **Enable versioning** for critical data; configure lifecycle rules to limit version count
- **Use Autoclass** when access patterns are unpredictable to optimize costs automatically
- **Prefer CMEK** for sensitive data requiring key rotation control
- **Use signed URLs** instead of making buckets public for temporary access
- **Set lifecycle rules** from day one to avoid accumulating unnecessary storage costs
- **Use VPC Service Controls** to prevent data exfiltration from sensitive buckets
- **Enable Cloud Audit Logs** for data access logging on sensitive buckets
- **Use dual-region or multi-region** only when cross-region redundancy is truly required (higher cost)

### Anti-patterns to avoid

- Making buckets publicly writable (use signed URLs for uploads)
- Using fine-grained ACLs instead of uniform bucket-level IAM
- Storing secrets or credentials in GCS without CMEK encryption
- Not setting lifecycle rules, leading to unbounded storage growth
- Using multi-region storage class when single-region suffices (2x cost)
- Locking retention policies prematurely (irreversible operation)
- Hardcoding bucket names instead of using project-ID-based naming

### Cost optimization

- Use Autoclass to automatically tier data based on access patterns
- Set lifecycle rules to transition infrequently accessed data to Nearline/Coldline/Archive
- Enable Object Lifecycle Management to auto-delete temporary files
- Use `requestor_pays` for shared datasets where consumers should bear transfer costs
- Monitor with Cloud Monitoring and set budget alerts on storage spending
- Use `gsutil -m` for parallel uploads/downloads to maximize throughput
