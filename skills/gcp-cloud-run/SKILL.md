---
name: gcp-cloud-run
description: Generate Cloud Run services and jobs with auto-scaling, traffic management, and container optimization. Use when the user wants to deploy containerized applications on Cloud Run.
argument-hint: "[service|job] [name] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(docker *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a Google Cloud Run expert. Generate production-ready Cloud Run services and jobs with proper scaling, networking, and security.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Type**: Service (request-driven) or Job (batch processing)
- **Name**: Service or job name
- **Container source**: Existing image, Dockerfile, or source-based deploy
- **Traffic model**: HTTP, gRPC, WebSocket
- **Scaling needs**: Min/max instances, concurrency settings

### Step 2: Generate Dockerfile

**Node.js optimized Dockerfile:**
```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Cloud Run sets PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Run as non-root
USER node

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/server.js"]
```

**Python optimized Dockerfile:**
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .

ENV PORT=8080
EXPOSE 8080

# Run as non-root
RUN adduser --disabled-password --gecos '' appuser
USER appuser

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "8", "--timeout", "0", "main:app"]
```

**Go optimized Dockerfile:**
```dockerfile
FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
ENV PORT=8080
EXPOSE 8080
USER nonroot:nonroot
CMD ["/server"]
```

### Step 3: Generate Cloud Run service

**gcloud CLI deployment:**
```bash
# Deploy from source (Cloud Build auto-builds)
gcloud run deploy my-service \
  --source=. \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=100 \
  --concurrency=80 \
  --timeout=300 \
  --cpu-throttling \
  --service-account=my-service-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars="NODE_ENV=production,LOG_LEVEL=info" \
  --set-secrets="DB_PASSWORD=db-password:latest" \
  --vpc-connector=my-connector \
  --vpc-egress=private-ranges-only \
  --port=8080 \
  --execution-environment=gen2

# Deploy from pre-built image
gcloud run deploy my-service \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/my-repo/my-service:v1.0.0 \
  --region=us-central1 \
  --allow-unauthenticated
```

**Cloud Run with Cloud SQL:**
```bash
gcloud run deploy my-service \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/my-repo/my-service:latest \
  --region=us-central1 \
  --add-cloudsql-instances=$PROJECT_ID:us-central1:my-db \
  --set-env-vars="DB_HOST=/cloudsql/$PROJECT_ID:us-central1:my-db,DB_NAME=myapp,DB_USER=app" \
  --set-secrets="DB_PASSWORD=db-password:latest" \
  --memory=1Gi \
  --cpu=2
```

### Step 4: Traffic splitting and canary deployments

**Deploy new revision without traffic:**
```bash
gcloud run deploy my-service \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/my-repo/my-service:v2.0.0 \
  --region=us-central1 \
  --no-traffic \
  --tag=canary
```

**Gradual traffic migration:**
```bash
# Send 10% to canary
gcloud run services update-traffic my-service \
  --region=us-central1 \
  --to-tags=canary=10

# Increase to 50%
gcloud run services update-traffic my-service \
  --region=us-central1 \
  --to-tags=canary=50

# Full rollout
gcloud run services update-traffic my-service \
  --region=us-central1 \
  --to-latest

# Rollback
gcloud run services update-traffic my-service \
  --region=us-central1 \
  --to-revisions=my-service-00001-abc=100
```

**Blue-green deployment:**
```bash
# Deploy green with tag
gcloud run deploy my-service \
  --image=gcr.io/$PROJECT_ID/my-service:green \
  --region=us-central1 \
  --no-traffic \
  --tag=green

# Test green via tag URL: https://green---my-service-abc123.a.run.app

# Switch traffic to green
gcloud run services update-traffic my-service \
  --region=us-central1 \
  --to-tags=green=100
```

### Step 5: Cloud Run jobs

**Create a batch processing job:**
```bash
gcloud run jobs create data-processor \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/my-repo/processor:latest \
  --region=us-central1 \
  --tasks=10 \
  --parallelism=5 \
  --task-timeout=3600 \
  --max-retries=3 \
  --memory=2Gi \
  --cpu=2 \
  --service-account=processor-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars="BATCH_SIZE=1000" \
  --set-secrets="API_KEY=api-key:latest"

# Execute the job
gcloud run jobs execute data-processor --region=us-central1

# Execute with override
gcloud run jobs execute data-processor \
  --region=us-central1 \
  --tasks=20 \
  --update-env-vars="BATCH_SIZE=500"
```

**Scheduled job with Cloud Scheduler:**
```bash
gcloud scheduler jobs create http daily-cleanup \
  --location=us-central1 \
  --schedule="0 2 * * *" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/daily-cleanup:run" \
  --http-method=POST \
  --oauth-service-account-email=scheduler-sa@$PROJECT_ID.iam.gserviceaccount.com
```

### Step 6: CPU allocation and concurrency

**CPU allocation modes:**
```bash
# CPU throttling (default) - CPU allocated only during request processing
# Best for: typical web services, pay only for request time
gcloud run deploy my-service \
  --cpu-throttling \
  --cpu=1 \
  --memory=512Mi

# CPU always allocated - CPU available even between requests
# Best for: background processing, WebSockets, long-lived connections
gcloud run deploy my-service \
  --no-cpu-throttling \
  --cpu=2 \
  --memory=1Gi \
  --min-instances=1
```

**Concurrency tuning:**
```bash
# High concurrency for lightweight handlers (e.g., API proxy)
gcloud run deploy my-service --concurrency=250 --cpu=2

# Low concurrency for CPU-heavy processing
gcloud run deploy my-service --concurrency=10 --cpu=4

# Single concurrency for non-thread-safe code
gcloud run deploy my-service --concurrency=1
```

### Step 7: Custom domains and health checks

**Custom domain mapping:**
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=my-service \
  --domain=api.example.com \
  --region=us-central1

# Or use Cloud Load Balancing for global routing
# (See gcp-load-balancing skill for serverless NEG setup)
```

**Health checks and probes:**
```yaml
# service.yaml with startup and liveness probes
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: my-service
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/startup-cpu-boost: "true"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        - image: us-central1-docker.pkg.dev/project/repo/service:latest
          ports:
            - containerPort: 8080
          resources:
            limits:
              memory: 512Mi
              cpu: "1"
          startupProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 0
            timeoutSeconds: 3
            periodSeconds: 10
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            periodSeconds: 10
            failureThreshold: 3
```

### Step 8: Sidecars

**Multi-container deployment with sidecar:**
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: my-service
  annotations:
    run.googleapis.com/launch-stage: BETA
spec:
  template:
    spec:
      containers:
        # Primary container (ingress)
        - image: us-central1-docker.pkg.dev/project/repo/app:latest
          ports:
            - containerPort: 8080
          env:
            - name: PROXY_URL
              value: "http://localhost:9090"
        # Sidecar container
        - image: us-central1-docker.pkg.dev/project/repo/proxy:latest
          env:
            - name: UPSTREAM_PORT
              value: "9090"
          startupProbe:
            httpGet:
              path: /ready
              port: 9090
```

### Step 9: Terraform configuration

```hcl
resource "google_cloud_run_v2_service" "main" {
  name     = "my-service"
  location = "us-central1"

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 100
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    service_account = google_service_account.run_sa.email

    containers {
      image = "us-central1-docker.pkg.dev/${var.project_id}/my-repo/my-service:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
        cpu_idle          = false
        startup_cpu_boost = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      startup_probe {
        http_get {
          path = "/healthz"
          port = 8080
        }
        initial_delay_seconds = 0
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/healthz"
          port = 8080
        }
        period_seconds    = 10
        failure_threshold = 3
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.main.name
  location = google_cloud_run_v2_service.main.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_job" "batch" {
  name     = "data-processor"
  location = "us-central1"

  template {
    parallelism = 5
    task_count  = 10

    template {
      max_retries = 3
      timeout     = "3600s"

      service_account = google_service_account.run_sa.email

      containers {
        image = "us-central1-docker.pkg.dev/${var.project_id}/my-repo/processor:latest"

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }

        env {
          name  = "BATCH_SIZE"
          value = "1000"
        }
      }
    }
  }
}
```

### Step 10: gRPC support

```bash
# Deploy gRPC service
gcloud run deploy grpc-service \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/my-repo/grpc-service:latest \
  --region=us-central1 \
  --use-http2 \
  --port=8080 \
  --memory=512Mi \
  --cpu=1
```

### Best practices to follow:
- **Use multi-stage Docker builds** to minimize image size (smaller = faster cold starts)
- **Listen on `PORT` env var** (Cloud Run sets this, default 8080)
- **Set min-instances=1** for production services to eliminate cold starts
- **Use startup CPU boost** to speed up container initialization
- **Set concurrency based on workload** - high for I/O-bound, low for CPU-bound
- **Use Cloud Build triggers** for CI/CD instead of manual deploys
- **Handle SIGTERM** for graceful shutdown (Cloud Run sends before stopping)
- **Use distroless or slim base images** for security and size
- **Run as non-root user** in containers
- **Configure health checks** with startup and liveness probes
- **Use VPC connector** with `private-ranges-only` egress for database access

### Anti-patterns to avoid:
- Writing to the local filesystem (ephemeral, use Cloud Storage or volumes)
- Using in-memory sessions without sticky sessions (instances are stateless)
- Setting concurrency=1 without good reason (wastes resources)
- Not handling SIGTERM (causes request failures during shutdown)
- Using `cpu-throttling` with WebSockets or background processing
- Deploying without resource limits (memory/CPU)
- Using `:latest` tag in production (use specific version tags)

### Cost optimization:
- **CPU throttling (default)**: Only pay for CPU during request processing
- **Min instances=0**: Scale to zero for dev/staging (higher latency on cold start)
- **Right-size resources**: Start with 256Mi/1 CPU and scale up based on metrics
- **Committed use discounts**: Available for always-on CPU allocation
- **Use Cloud Build** for builds instead of building locally and pushing
- **Multi-region**: Deploy only in regions where users exist
- **Concurrency tuning**: Higher concurrency = fewer instances = lower cost
