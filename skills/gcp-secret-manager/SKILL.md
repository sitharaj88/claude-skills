---
name: gcp-secret-manager
description: Generate Secret Manager configurations with versioning, rotation, replication, and secure access patterns. Use when the user wants to manage secrets, API keys, or credentials on GCP.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Secret Manager expert. Generate production-ready secret management configurations with versioning, rotation, and secure access patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: create, rotate, access, replicate
- **Secret type**: database credentials, API keys, OAuth tokens, TLS certificates
- **Access pattern**: Cloud Run, Cloud Functions, GKE, Compute Engine, application code
- **Rotation**: automatic or manual, rotation interval
- **Replication**: automatic (Google-managed) or user-managed (specific regions)

### Step 2: Generate secret creation

**CLI secret creation:**
```bash
# Create a secret with automatic replication
gcloud secrets create my-api-key \
  --replication-policy="automatic" \
  --labels="env=production,team=platform,app=orders"

# Add a secret version
echo -n "my-secret-value" | gcloud secrets versions add my-api-key --data-file=-

# Create a secret with user-managed replication
gcloud secrets create my-db-password \
  --replication-policy="user-managed" \
  --locations="us-central1,us-east1" \
  --labels="env=production"

# Create with CMEK encryption
gcloud secrets create my-sensitive-secret \
  --replication-policy="user-managed" \
  --locations="us-central1" \
  --kms-key-name="projects/my-project/locations/us-central1/keyRings/my-ring/cryptoKeys/my-key"

# Create with expiration
gcloud secrets create temp-token \
  --replication-policy="automatic" \
  --expire-time="2025-12-31T23:59:59Z"

# Create with TTL
gcloud secrets create temp-secret \
  --replication-policy="automatic" \
  --ttl="2592000s"  # 30 days
```

**Terraform secret creation:**
```hcl
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  project   = var.project_id

  labels = {
    env  = "production"
    team = "platform"
    app  = "orders"
  }

  # Automatic replication (Google-managed)
  replication {
    auto {
      customer_managed_encryption {
        kms_key_name = google_kms_crypto_key.secret_key.id
      }
    }
  }

  # OR: User-managed replication
  # replication {
  #   user_managed {
  #     replicas {
  #       location = "us-central1"
  #       customer_managed_encryption {
  #         kms_key_name = google_kms_crypto_key.secret_key_central.id
  #       }
  #     }
  #     replicas {
  #       location = "us-east1"
  #       customer_managed_encryption {
  #         kms_key_name = google_kms_crypto_key.secret_key_east.id
  #       }
  #     }
  #   }
  # }

  # Optional: Secret expiration
  expire_time = "2025-12-31T23:59:59Z"
  # OR: TTL
  # ttl = "2592000s" # 30 days
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password # From a secure variable source

  # Prevent deletion of active secret versions
  lifecycle {
    prevent_destroy = true
  }
}

# JSON-structured secret (multi-field)
resource "google_secret_manager_secret" "db_credentials" {
  secret_id = "db-credentials"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_credentials" {
  secret = google_secret_manager_secret.db_credentials.id
  secret_data = jsonencode({
    host     = var.db_host
    port     = var.db_port
    username = var.db_username
    password = var.db_password
    database = var.db_name
  })
}
```

### Step 3: Generate secret access patterns

**Python application code:**
```python
from google.cloud import secretmanager
import json

client = secretmanager.SecretManagerServiceClient()

def access_secret(project_id: str, secret_id: str, version: str = "latest") -> str:
    """Access a secret version."""
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version}"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("utf-8")

def access_json_secret(project_id: str, secret_id: str) -> dict:
    """Access a JSON-structured secret."""
    secret_data = access_secret(project_id, secret_id)
    return json.loads(secret_data)

# Access a simple secret
api_key = access_secret("my-project", "my-api-key")

# Access JSON-structured credentials
db_creds = access_json_secret("my-project", "db-credentials")
connection_string = f"postgresql://{db_creds['username']}:{db_creds['password']}@{db_creds['host']}:{db_creds['port']}/{db_creds['database']}"
```

**Node.js application code:**
```javascript
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const client = new SecretManagerServiceClient();

async function accessSecret(projectId, secretId, version = "latest") {
  const name = `projects/${projectId}/secrets/${secretId}/versions/${version}`;
  const [response] = await client.accessSecretVersion({ name });
  return response.payload.data.toString("utf8");
}

async function accessJsonSecret(projectId, secretId) {
  const data = await accessSecret(projectId, secretId);
  return JSON.parse(data);
}

// Usage
const apiKey = await accessSecret("my-project", "my-api-key");
const dbCreds = await accessJsonSecret("my-project", "db-credentials");
```

**Python with caching (recommended for production):**
```python
from google.cloud import secretmanager
from functools import lru_cache
import time
import threading

class SecretCache:
    """Cache secrets with TTL to reduce API calls."""

    def __init__(self, project_id: str, cache_ttl: int = 300):
        self.client = secretmanager.SecretManagerServiceClient()
        self.project_id = project_id
        self.cache_ttl = cache_ttl
        self._cache = {}
        self._lock = threading.Lock()

    def get_secret(self, secret_id: str, version: str = "latest") -> str:
        cache_key = f"{secret_id}:{version}"
        with self._lock:
            if cache_key in self._cache:
                value, timestamp = self._cache[cache_key]
                if time.time() - timestamp < self.cache_ttl:
                    return value

        name = f"projects/{self.project_id}/secrets/{secret_id}/versions/{version}"
        response = self.client.access_secret_version(request={"name": name})
        value = response.payload.data.decode("utf-8")

        with self._lock:
            self._cache[cache_key] = (value, time.time())

        return value

    def invalidate(self, secret_id: str = None):
        with self._lock:
            if secret_id:
                keys_to_remove = [k for k in self._cache if k.startswith(f"{secret_id}:")]
                for key in keys_to_remove:
                    del self._cache[key]
            else:
                self._cache.clear()

# Usage
secrets = SecretCache("my-project", cache_ttl=300)
api_key = secrets.get_secret("my-api-key")
```

### Step 4: Generate Cloud Run secret access

```bash
# Mount secret as environment variable
gcloud run deploy my-service \
  --image=gcr.io/my-project/my-service:latest \
  --set-secrets="DB_PASSWORD=db-password:latest,API_KEY=my-api-key:latest" \
  --service-account=my-app-sa@my-project.iam.gserviceaccount.com

# Mount secret as volume
gcloud run deploy my-service \
  --image=gcr.io/my-project/my-service:latest \
  --set-secrets="/secrets/db-password=db-password:latest" \
  --service-account=my-app-sa@my-project.iam.gserviceaccount.com
```

**Terraform Cloud Run with secrets:**
```hcl
resource "google_cloud_run_v2_service" "app" {
  name     = "my-service"
  location = "us-central1"

  template {
    service_account = google_service_account.app.email

    containers {
      image = "gcr.io/my-project/my-service:latest"

      # Secret as environment variable
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.api_key.secret_id
            version = "latest"
          }
        }
      }

      # Secret as mounted volume
      volume_mounts {
        name       = "db-credentials"
        mount_path = "/secrets"
      }
    }

    volumes {
      name = "db-credentials"
      secret {
        secret = google_secret_manager_secret.db_credentials.secret_id
        items {
          version = "latest"
          path    = "db-credentials.json"
          mode    = 0 # Default: 0444
        }
      }
    }
  }
}
```

### Step 5: Generate GKE secret access

**Using Secrets Store CSI Driver:**
```yaml
# Install the GCP provider for Secrets Store CSI Driver
# SecretProviderClass resource
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: gcp-secrets
spec:
  provider: gcp
  parameters:
    secrets: |
      - resourceName: "projects/my-project/secrets/db-password/versions/latest"
        path: "db-password"
      - resourceName: "projects/my-project/secrets/api-key/versions/latest"
        path: "api-key"
  # Optional: sync to Kubernetes Secret
  secretObjects:
    - secretName: app-secrets
      type: Opaque
      data:
        - objectName: db-password
          key: DB_PASSWORD
        - objectName: api-key
          key: API_KEY
---
# Pod using the SecretProviderClass
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  serviceAccountName: my-app-ksa
  containers:
    - name: app
      image: gcr.io/my-project/my-app:latest
      volumeMounts:
        - name: secrets
          mountPath: "/secrets"
          readOnly: true
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
  volumes:
    - name: secrets
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: gcp-secrets
```

**Using External Secrets Operator:**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: gcp-secret-manager
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: db-password
        version: latest
    - secretKey: API_KEY
      remoteRef:
        key: my-api-key
        version: latest
---
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: gcp-secret-manager
spec:
  provider:
    gcpsm:
      projectID: my-project
      auth:
        workloadIdentity:
          clusterLocation: us-central1
          clusterName: my-cluster
          clusterProjectID: my-project
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

### Step 6: Generate Cloud Functions secret access

```bash
# Deploy function with secret as env var
gcloud functions deploy my-function \
  --gen2 \
  --runtime=python312 \
  --set-secrets="API_KEY=my-api-key:latest" \
  --service-account=my-function-sa@my-project.iam.gserviceaccount.com

# Deploy function with secret as volume mount
gcloud functions deploy my-function \
  --gen2 \
  --runtime=python312 \
  --set-secrets="/secrets/creds=db-credentials:latest" \
  --service-account=my-function-sa@my-project.iam.gserviceaccount.com
```

### Step 7: Generate automatic rotation with Cloud Functions

```python
# rotation_function/main.py
import functions_framework
from google.cloud import secretmanager
import secrets
import string
import json

client = secretmanager.SecretManagerServiceClient()

@functions_framework.cloud_event
def rotate_secret(cloud_event):
    """Rotate a secret triggered by Pub/Sub notification."""
    import base64

    data = cloud_event.data
    message = base64.b64decode(data["message"]["data"]).decode("utf-8")
    event_data = json.loads(message)

    secret_name = event_data.get("name")
    event_type = event_data.get("eventType")

    if event_type != "SECRET_ROTATE":
        print(f"Ignoring event type: {event_type}")
        return

    print(f"Rotating secret: {secret_name}")

    # Generate new password
    alphabet = string.ascii_letters + string.digits + string.punctuation
    new_password = "".join(secrets.choice(alphabet) for _ in range(32))

    # Update the actual credential (e.g., database password)
    # update_database_password(new_password)

    # Add new version to Secret Manager
    client.add_secret_version(
        request={
            "parent": secret_name,
            "payload": {"data": new_password.encode("utf-8")},
        }
    )

    print(f"Secret rotated successfully: {secret_name}")
```

**Configure rotation with Pub/Sub notifications:**
```bash
# Create Pub/Sub topic for secret rotation events
gcloud pubsub topics create secret-rotation-topic

# Configure secret to send notifications
gcloud secrets update my-api-key \
  --add-topics=projects/my-project/topics/secret-rotation-topic

# Set rotation schedule
gcloud secrets update my-api-key \
  --rotation-period=2592000s \
  --next-rotation-time="2025-02-01T00:00:00Z"
```

**Terraform rotation configuration:**
```hcl
# Pub/Sub topic for rotation events
resource "google_pubsub_topic" "secret_rotation" {
  name = "secret-rotation-topic"
}

# Secret with rotation configuration
resource "google_secret_manager_secret" "rotating_api_key" {
  secret_id = "rotating-api-key"
  project   = var.project_id

  replication {
    auto {}
  }

  rotation {
    rotation_period    = "2592000s" # 30 days
    next_rotation_time = "2025-02-01T00:00:00Z"
  }

  topics {
    name = google_pubsub_topic.secret_rotation.id
  }
}

# Cloud Function for rotation
resource "google_cloudfunctions2_function" "rotator" {
  name     = "secret-rotator"
  location = "us-central1"

  build_config {
    runtime     = "python312"
    entry_point = "rotate_secret"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.rotator_source.name
      }
    }
  }

  service_config {
    service_account_email = google_service_account.rotator.email
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.secret_rotation.id
  }
}
```

### Step 8: Generate IAM access control

```hcl
# Service account that needs to read secrets
resource "google_service_account" "app" {
  account_id   = "my-app-sa"
  display_name = "Application Service Account"
}

# Grant access to specific secrets (recommended over project-level)
resource "google_secret_manager_secret_iam_member" "app_access" {
  for_each = toset([
    google_secret_manager_secret.db_password.secret_id,
    google_secret_manager_secret.api_key.secret_id,
  ])

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app.email}"
}

# Grant rotation function permission to manage versions
resource "google_secret_manager_secret_iam_member" "rotator_access" {
  secret_id = google_secret_manager_secret.rotating_api_key.secret_id
  role      = "roles/secretmanager.secretVersionManager"
  member    = "serviceAccount:${google_service_account.rotator.email}"
}

# Conditional access (time-based)
resource "google_secret_manager_secret_iam_member" "temporary_access" {
  secret_id = google_secret_manager_secret.db_password.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "user:contractor@company.com"

  condition {
    title       = "temporary_access"
    expression  = "request.time < timestamp('2025-06-30T23:59:59Z')"
  }
}
```

### Step 9: Secret versioning and management

```bash
# List all versions of a secret
gcloud secrets versions list my-api-key

# Access a specific version
gcloud secrets versions access 3 --secret=my-api-key

# Disable a version (prevent access but keep data)
gcloud secrets versions disable 2 --secret=my-api-key

# Enable a disabled version
gcloud secrets versions enable 2 --secret=my-api-key

# Destroy a version (permanent, cannot be undone)
gcloud secrets versions destroy 1 --secret=my-api-key

# List secrets with filter
gcloud secrets list --filter="labels.env=production"
```

### Step 10: Monitoring and audit logging

```bash
# View audit logs for secret access
gcloud logging read 'resource.type="secretmanager.googleapis.com/Secret" AND protoPayload.methodName="google.cloud.secretmanager.v1.SecretManagerService.AccessSecretVersion"' \
  --project=my-project \
  --limit=50
```

**Terraform monitoring alert:**
```hcl
# Alert on unauthorized secret access attempts
resource "google_monitoring_alert_policy" "secret_access_denied" {
  display_name = "Secret Manager Access Denied"

  conditions {
    display_name = "Unauthorized secret access"
    condition_matched_log {
      filter = <<-EOT
        resource.type="audited_resource"
        AND protoPayload.serviceName="secretmanager.googleapis.com"
        AND protoPayload.status.code=7
      EOT
    }
  }

  alert_strategy {
    notification_rate_limit {
      period = "300s"
    }
  }

  notification_channels = [var.notification_channel_id]
}
```

## Best practices

- **Use Secret Manager** for credentials, API keys, and sensitive data (not environment variables)
- **Use JSON-structured secrets** for multi-field credentials (host, port, user, password)
- **Use automatic replication** unless compliance requires specific regions
- **Grant secret-level IAM** (not project-level secretmanager.secretAccessor)
- **Cache secrets** in application memory with TTL to reduce API calls and cost
- **Set rotation schedules** for all secrets that support rotation
- **Use secret versioning** for safe rollbacks (disable old versions, do not destroy immediately)
- **Use CMEK** for compliance requirements (HIPAA, PCI DSS, SOC 2)
- **Use labels** to organize secrets by environment, team, and application
- **Enable Pub/Sub notifications** for secret events (version creation, rotation)

## Anti-patterns

- Storing secrets in environment variables, code, or version control
- Using the same secret across multiple environments (dev, staging, production)
- Granting project-level `roles/secretmanager.admin` to application service accounts
- Not versioning secrets (overwriting in place)
- Destroying secret versions immediately (keep disabled for rollback)
- Accessing secrets on every request (use caching)
- Using service account keys to access Secret Manager (use Workload Identity)

## Cost optimization

- Secret Manager charges per secret ($0.06/month) and per access operation ($0.03/10K)
- Cache secrets in application memory to reduce access API calls
- Use `latest` version alias to avoid hard-coding version numbers
- Clean up unused secrets and destroy old versions that are no longer needed
- Use SSM-style parameter stores for non-sensitive configuration (save secret cost)
- Batch secret access at application startup rather than per-request

## Security considerations

- Enable Cloud Audit Logs for all Secret Manager operations (DATA_READ, DATA_WRITE)
- Use VPC Service Controls to restrict Secret Manager API access
- Implement least-privilege IAM (secretAccessor for read, secretVersionManager for write)
- Use CMEK with Cloud KMS for envelope encryption
- Set secret expiration for temporary credentials
- Monitor for anomalous access patterns with Security Command Center
- Never log secret values in application logs
- Use Pub/Sub notifications to detect unauthorized secret version creation
