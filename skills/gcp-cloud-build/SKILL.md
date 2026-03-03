---
name: gcp-cloud-build
description: Generate Cloud Build configs with multi-step pipelines, triggers, and CI/CD workflows. Use when the user wants to set up CI/CD on Google Cloud.
argument-hint: "[trigger-type]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Cloud Build expert. Generate production-ready CI/CD pipeline configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Trigger type**: push, pr, manual, pubsub, webhook
- **Source**: GitHub, Cloud Source Repositories, Bitbucket
- **Build targets**: container images, artifacts, deployments
- **Environment**: dev, staging, production pipeline stages

### Step 2: Generate cloudbuild.yaml configuration

Create the build configuration file:

```yaml
steps:
  # Install dependencies
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['ci']
    id: 'install'

  # Run tests
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['test']
    id: 'test'
    waitFor: ['install']

  # Build application
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['run', 'build']
    id: 'build'
    waitFor: ['test']

  # Build container image with kaniko (recommended over docker build)
  - name: 'gcr.io/kaniko-project/executor:latest'
    args:
      - '--destination=${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_IMAGE_NAME}:$SHORT_SHA'
      - '--destination=${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_IMAGE_NAME}:latest'
      - '--cache=true'
      - '--cache-ttl=72h'
    id: 'containerize'
    waitFor: ['build']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - '${_SERVICE_NAME}'
      - '--image=${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_IMAGE_NAME}:$SHORT_SHA'
      - '--region=${_REGION}'
      - '--platform=managed'
    id: 'deploy'
    waitFor: ['containerize']

substitutions:
  _REGION: 'us-central1'
  _REPO_NAME: 'my-repo'
  _IMAGE_NAME: 'my-app'
  _SERVICE_NAME: 'my-service'

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'
  dynamic_substitutions: true

timeout: '1200s'

images:
  - '${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_IMAGE_NAME}:$SHORT_SHA'

artifacts:
  objects:
    location: 'gs://${PROJECT_ID}-build-artifacts/'
    paths:
      - 'dist/**'
```

### Step 3: Configure build steps

**Official builders (gcr.io/cloud-builders/):**
- `docker` - Docker build and push
- `gcloud` - gcloud CLI commands
- `kubectl` - Kubernetes operations
- `gsutil` - Cloud Storage operations
- `git` - Git operations
- `npm` - Node.js package management
- `go` - Go builds
- `mvn` - Maven builds
- `gradle` - Gradle builds
- `bazel` - Bazel builds

**Community builders (gcr.io/cloud-builders-community/):**
- `terraform` - Terraform apply/plan
- `helm` - Helm chart deployment
- `kustomize` - Kustomize overlays
- `firebase` - Firebase deployments
- `pulumi` - Pulumi IaC

**Kaniko for container builds (recommended):**
```yaml
- name: 'gcr.io/kaniko-project/executor:latest'
  args:
    - '--destination=${_REGION}-docker.pkg.dev/$PROJECT_ID/repo/image:$SHORT_SHA'
    - '--cache=true'
    - '--cache-ttl=72h'
    - '--snapshot-mode=redo'
    - '--use-new-run'
```

### Step 4: Configure build triggers

**GitHub push trigger:**
```yaml
# gcloud command
gcloud builds triggers create github \
  --name="deploy-on-push" \
  --repo-name="my-repo" \
  --repo-owner="my-org" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --substitutions="_ENV=production" \
  --service-account="projects/$PROJECT_ID/serviceAccounts/cloudbuild@$PROJECT_ID.iam.gserviceaccount.com"
```

**Pull request trigger:**
```yaml
gcloud builds triggers create github \
  --name="pr-check" \
  --repo-name="my-repo" \
  --repo-owner="my-org" \
  --pull-request-pattern="^main$" \
  --build-config="cloudbuild-pr.yaml" \
  --comment-control="COMMENTS_ENABLED_FOR_EXTERNAL_CONTRIBUTORS_ONLY"
```

**Manual trigger:**
```yaml
gcloud builds triggers create manual \
  --name="manual-deploy" \
  --repo="https://github.com/my-org/my-repo" \
  --branch="main" \
  --build-config="cloudbuild.yaml" \
  --substitutions="_ENV=staging,_VERSION=v1.2.3"
```

**Pub/Sub trigger:**
```yaml
gcloud builds triggers create pubsub \
  --name="event-driven-build" \
  --topic="projects/$PROJECT_ID/topics/build-trigger" \
  --build-config="cloudbuild.yaml" \
  --substitutions="_PAYLOAD=$(body.message.data)"
```

**Webhook trigger:**
```yaml
gcloud builds triggers create webhook \
  --name="webhook-deploy" \
  --secret="projects/$PROJECT_ID/secrets/webhook-secret/versions/latest" \
  --build-config="cloudbuild.yaml" \
  --substitutions="_REF=$(body.ref)"
```

### Step 5: Configure secrets and environment

**Secrets from Secret Manager:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        echo "$$DB_PASSWORD" | docker login -u _json_key --password-stdin
    secretEnv: ['DB_PASSWORD']

availableSecrets:
  secretManager:
    - versionName: 'projects/$PROJECT_ID/secrets/db-password/versions/latest'
      env: 'DB_PASSWORD'
```

**Substitution variables:**
- `$PROJECT_ID` - GCP project ID
- `$BUILD_ID` - unique build ID
- `$COMMIT_SHA` - full commit SHA
- `$SHORT_SHA` - first 7 characters of SHA
- `$REPO_NAME` - repository name
- `$BRANCH_NAME` - branch name
- `$TAG_NAME` - tag name (if triggered by tag)
- `$REVISION_ID` - revision ID
- `$_CUSTOM_VAR` - user-defined substitution (prefixed with underscore)

### Step 6: Configure caching

**Cloud Storage cache:**
```yaml
steps:
  # Restore cache
  - name: 'gcr.io/cloud-builders/gsutil'
    args: ['-m', 'rsync', '-r', 'gs://${PROJECT_ID}-cache/node_modules/', 'node_modules/']
    id: 'restore-cache'

  - name: 'node:20'
    entrypoint: 'npm'
    args: ['ci']
    id: 'install'
    waitFor: ['restore-cache']

  # Save cache
  - name: 'gcr.io/cloud-builders/gsutil'
    args: ['-m', 'rsync', '-r', 'node_modules/', 'gs://${PROJECT_ID}-cache/node_modules/']
    id: 'save-cache'
    waitFor: ['install']
```

**Kaniko layer caching:**
```yaml
- name: 'gcr.io/kaniko-project/executor:latest'
  args:
    - '--cache=true'
    - '--cache-repo=${_REGION}-docker.pkg.dev/$PROJECT_ID/cache/my-app'
    - '--cache-ttl=168h'
```

### Step 7: Configure private pools and networking

**Private pool for VPC access:**
```yaml
gcloud builds worker-pools create my-pool \
  --project=$PROJECT_ID \
  --region=us-central1 \
  --peered-network="projects/$PROJECT_ID/global/networks/my-vpc" \
  --peered-network-ip-range="192.168.0.0/24"
```

**Use private pool in build:**
```yaml
options:
  pool:
    name: 'projects/$PROJECT_ID/locations/us-central1/workerPools/my-pool'
```

### Step 8: Configure parallel and conditional steps

**Parallel execution:**
```yaml
steps:
  - name: 'node:20'
    args: ['npm', 'ci']
    id: 'install'

  # These run in parallel (both waitFor install)
  - name: 'node:20'
    args: ['npm', 'run', 'lint']
    id: 'lint'
    waitFor: ['install']

  - name: 'node:20'
    args: ['npm', 'test']
    id: 'test'
    waitFor: ['install']

  # This waits for both lint and test
  - name: 'node:20'
    args: ['npm', 'run', 'build']
    id: 'build'
    waitFor: ['lint', 'test']
```

**Conditional steps with bash:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        if [ "$BRANCH_NAME" = "main" ]; then
          gcloud run deploy my-service --image=my-image:$SHORT_SHA --region=us-central1
        else
          echo "Skipping deployment for branch $BRANCH_NAME"
        fi
```

### Step 9: Configure approval gates

**Approval-based deployment:**
```yaml
gcloud builds triggers create github \
  --name="production-deploy" \
  --repo-name="my-repo" \
  --repo-owner="my-org" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-prod.yaml" \
  --require-approval
```

### Step 10: Configure notifications

**Cloud Build notifications via Pub/Sub:**
```yaml
# Cloud Build automatically publishes to cloud-builds topic
# Create a subscription for Slack/email notifications

gcloud pubsub subscriptions create build-notifications \
  --topic=cloud-builds \
  --push-endpoint="https://my-notification-handler.run.app"
```

**Build notification with Cloud Functions:**
```yaml
# Trigger a Cloud Function on build status changes
gcloud functions deploy notifyBuildStatus \
  --trigger-topic=cloud-builds \
  --runtime=nodejs20
```

### Step 11: Multi-environment deployment pipeline

```yaml
# cloudbuild-pipeline.yaml
steps:
  # Build and push image
  - name: 'gcr.io/kaniko-project/executor:latest'
    args:
      - '--destination=${_REGION}-docker.pkg.dev/$PROJECT_ID/repo/app:$SHORT_SHA'
      - '--cache=true'
    id: 'build'

  # Deploy to dev
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: ['run', 'deploy', 'app-dev', '--image=${_REGION}-docker.pkg.dev/$PROJECT_ID/repo/app:$SHORT_SHA', '--region=${_REGION}']
    id: 'deploy-dev'
    waitFor: ['build']

  # Run integration tests against dev
  - name: 'node:20'
    entrypoint: 'bash'
    args:
      - '-c'
      - 'npm run test:integration -- --base-url=https://app-dev-xxxx.run.app'
    id: 'integration-test'
    waitFor: ['deploy-dev']

  # Deploy to staging
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: ['run', 'deploy', 'app-staging', '--image=${_REGION}-docker.pkg.dev/$PROJECT_ID/repo/app:$SHORT_SHA', '--region=${_REGION}']
    id: 'deploy-staging'
    waitFor: ['integration-test']

substitutions:
  _REGION: 'us-central1'

options:
  logging: CLOUD_LOGGING_ONLY
timeout: '1800s'
```

### Step 12: Service account configuration

```yaml
# Create a dedicated service account
gcloud iam service-accounts create cloudbuild-sa \
  --display-name="Cloud Build Service Account"

# Grant minimum required permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloudbuild-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloudbuild-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloudbuild-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Use in trigger
gcloud builds triggers update my-trigger \
  --service-account="projects/$PROJECT_ID/serviceAccounts/cloudbuild-sa@$PROJECT_ID.iam.gserviceaccount.com"
```

## Best Practices

- Use kaniko instead of Docker-in-Docker for container builds (faster, no privileged mode)
- Use `waitFor` to parallelize independent steps and reduce build time
- Pin builder image versions to avoid unexpected changes
- Use Artifact Registry (not Container Registry) for storing images
- Store secrets in Secret Manager, never in substitution variables or source code
- Use a dedicated service account per trigger with least-privilege IAM roles
- Enable Cloud Storage caching for dependencies to speed up builds
- Set appropriate `timeout` values to avoid runaway builds
- Use private pools when builds need VPC access to private resources
- Use `dynamic_substitutions: true` for variable interpolation in substitution values

## Anti-Patterns

- Do not use `gcr.io` for new projects; migrate to Artifact Registry (`pkg.dev`)
- Do not use the default Cloud Build service account in production
- Do not hardcode project IDs; use `$PROJECT_ID` substitution
- Do not run all steps sequentially when they can be parallelized
- Do not store build cache in the build image; use Cloud Storage or kaniko cache
- Do not skip integration tests in the pipeline even for "small" changes

## Security Considerations

- Use Artifact Registry with vulnerability scanning enabled
- Enable Binary Authorization to verify image signatures before deployment
- Use VPC Service Controls to restrict Cloud Build access
- Rotate webhook secrets regularly
- Audit build logs for credential leaks
- Use workload identity federation instead of service account keys

## Cost Optimization

- Use `E2_MEDIUM` machine type for simple builds; upgrade only when needed
- Use kaniko caching to reduce build times and compute costs
- Set `CLOUD_LOGGING_ONLY` to avoid Cloud Storage log costs
- Use regional builds to minimize data transfer costs
- Clean up old images in Artifact Registry with lifecycle policies
- Use concurrent build limits to control spending
