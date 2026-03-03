---
name: gcp-cloud-deploy
description: Generate Cloud Deploy pipelines with progressive delivery, canary deployments, and rollbacks. Use when the user wants to set up continuous delivery on Google Cloud.
argument-hint: "[target]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Cloud Deploy expert. Generate production-ready continuous delivery pipeline configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Target runtime**: GKE, Cloud Run, Anthos
- **Environments**: dev, staging, production (pipeline stages)
- **Deployment strategy**: standard, canary, blue/green
- **Approval requirements**: manual approval gates between stages
- **Rollback strategy**: automatic or manual

### Step 2: Generate delivery pipeline configuration

**Pipeline definition (delivery-pipeline.yaml):**
```yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: my-app-pipeline
description: Production delivery pipeline for my-app
serialPipeline:
  stages:
    - targetId: dev
      profiles: [dev]
      deployParameters:
        - values:
            replicas: "2"
          matchTargetLabels:
            env: dev
    - targetId: staging
      profiles: [staging]
      deployParameters:
        - values:
            replicas: "3"
          matchTargetLabels:
            env: staging
    - targetId: production
      profiles: [production]
      strategy:
        canary:
          runtimeConfig:
            cloudRun:
              automaticTrafficControl: true
          canaryDeployment:
            percentages: [10, 25, 50, 75]
            verify: true
      deployParameters:
        - values:
            replicas: "5"
          matchTargetLabels:
            env: production
```

### Step 3: Generate target configurations

**Cloud Run target:**
```yaml
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: dev
  labels:
    env: dev
description: Development Cloud Run target
run:
  location: projects/my-project/locations/us-central1
---
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: staging
  labels:
    env: staging
description: Staging Cloud Run target
run:
  location: projects/my-project/locations/us-central1
requireApproval: false
---
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: production
  labels:
    env: production
description: Production Cloud Run target
run:
  location: projects/my-project/locations/us-central1
requireApproval: true
```

**GKE target:**
```yaml
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: production-gke
  labels:
    env: production
description: Production GKE cluster target
gke:
  cluster: projects/my-project/locations/us-central1/clusters/prod-cluster
  internalIp: false
requireApproval: true
executionConfigs:
  - usages:
      - RENDER
      - DEPLOY
    serviceAccount: deploy-sa@my-project.iam.gserviceaccount.com
    artifactStorage: gs://my-project-deploy-artifacts
```

**Multi-target (parallel deployment):**
```yaml
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: production-multi
description: Multi-region production deployment
multiTarget:
  targetIds:
    - production-us-central1
    - production-us-east1
    - production-europe-west1
requireApproval: true
```

### Step 4: Generate Skaffold configuration

**Skaffold for Cloud Run (skaffold.yaml):**
```yaml
apiVersion: skaffold/v4beta7
kind: Config
metadata:
  name: my-app
profiles:
  - name: dev
    manifests:
      rawYaml:
        - k8s/dev/service.yaml
  - name: staging
    manifests:
      rawYaml:
        - k8s/staging/service.yaml
  - name: production
    manifests:
      rawYaml:
        - k8s/production/service.yaml
deploy:
  cloudrun: {}
```

**Cloud Run service manifest (k8s/production/service.yaml):**
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: my-app
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "2"
        autoscaling.knative.dev/maxScale: "100"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        - image: my-app
          ports:
            - containerPort: 8080
          resources:
            limits:
              cpu: "2"
              memory: 1Gi
          env:
            - name: ENV
              value: production
```

**Skaffold for GKE:**
```yaml
apiVersion: skaffold/v4beta7
kind: Config
metadata:
  name: my-app-gke
profiles:
  - name: dev
    manifests:
      kustomize:
        paths:
          - k8s/overlays/dev
  - name: production
    manifests:
      kustomize:
        paths:
          - k8s/overlays/production
deploy:
  kubectl: {}
```

### Step 5: Configure canary deployments

**Cloud Run canary with traffic splitting:**
```yaml
# In delivery-pipeline.yaml
stages:
  - targetId: production
    profiles: [production]
    strategy:
      canary:
        runtimeConfig:
          cloudRun:
            automaticTrafficControl: true
        canaryDeployment:
          percentages: [10, 25, 50]
          verify: true
          predeploy:
            actions: ["pre-deploy-check"]
          postdeploy:
            actions: ["post-deploy-verify"]
```

**GKE canary with Gateway API:**
```yaml
stages:
  - targetId: production-gke
    profiles: [production]
    strategy:
      canary:
        runtimeConfig:
          kubernetes:
            gatewayServiceMesh:
              httpRoute: my-app-route
              service: my-app
              deployment: my-app
              routeUpdateWaitTime: 120s
        canaryDeployment:
          percentages: [10, 30, 60]
          verify: true
```

### Step 6: Configure deployment verification

**Verification configuration in skaffold.yaml:**
```yaml
apiVersion: skaffold/v4beta7
kind: Config
verify:
  - name: smoke-test
    container:
      name: smoke-test
      image: curlimages/curl:latest
      command: ["/bin/sh"]
      args:
        - "-c"
        - |
          response=$(curl -s -o /dev/null -w "%{http_code}" $CLOUD_RUN_SERVICE_URL/health)
          if [ "$response" != "200" ]; then
            echo "Health check failed with status $response"
            exit 1
          fi
  - name: integration-test
    container:
      name: integration-test
      image: node:20-slim
      command: ["/bin/sh"]
      args:
        - "-c"
        - "npm run test:integration"
```

### Step 7: Configure deploy hooks

**Pre-deploy and post-deploy actions:**
```yaml
# In skaffold.yaml
customActions:
  - name: pre-deploy-check
    containers:
      - name: db-migration
        image: my-app-migration:latest
        command: ["/bin/sh"]
        args: ["-c", "npm run migrate"]
  - name: post-deploy-verify
    containers:
      - name: health-check
        image: curlimages/curl:latest
        command: ["/bin/sh"]
        args: ["-c", "curl -f $CLOUD_RUN_SERVICE_URL/health"]
```

### Step 8: Configure rollback strategies

**Automatic rollback on verification failure:**
```yaml
# Canary deployments automatically roll back if verify phase fails
stages:
  - targetId: production
    strategy:
      canary:
        canaryDeployment:
          percentages: [10, 50]
          verify: true  # Failure at any phase triggers rollback
```

**Manual rollback:**
```bash
# Roll back to previous release
gcloud deploy releases promote \
  --release=release-abc123 \
  --delivery-pipeline=my-app-pipeline \
  --to-target=production \
  --region=us-central1

# Roll back a specific rollout
gcloud deploy rollouts reject current-rollout \
  --delivery-pipeline=my-app-pipeline \
  --release=release-def456 \
  --region=us-central1
```

### Step 9: Configure automation rules

**Auto-promotion between stages:**
```yaml
apiVersion: deploy.cloud.google.com/v1
kind: Automation
metadata:
  name: auto-promote-to-staging
description: Auto-promote successful dev deployments to staging
selector:
  targets:
    - id: dev
rules:
  - promoteReleaseRule:
      name: promote-after-dev
      wait: 600s  # Wait 10 minutes after successful deploy
      destinationTargetId: staging
      destinationPhase: stable
```

**Auto-advance canary phases:**
```yaml
apiVersion: deploy.cloud.google.com/v1
kind: Automation
metadata:
  name: auto-advance-canary
selector:
  targets:
    - id: production
rules:
  - advanceRolloutRule:
      name: advance-after-verify
      sourcePhases: ["canary-10", "canary-25", "canary-50"]
      wait: 300s  # Wait 5 minutes between phases
```

### Step 10: Create and manage releases

**Create a release:**
```bash
gcloud deploy releases create release-$(date +%Y%m%d%H%M%S) \
  --delivery-pipeline=my-app-pipeline \
  --region=us-central1 \
  --images=my-app=${REGION}-docker.pkg.dev/$PROJECT_ID/repo/my-app:$SHORT_SHA \
  --skaffold-file=skaffold.yaml
```

**Promote a release:**
```bash
gcloud deploy releases promote \
  --release=release-20240101120000 \
  --delivery-pipeline=my-app-pipeline \
  --to-target=production \
  --region=us-central1
```

**Approve a rollout:**
```bash
gcloud deploy rollouts approve rollout-name \
  --delivery-pipeline=my-app-pipeline \
  --release=release-20240101120000 \
  --region=us-central1
```

### Step 11: Configure notifications

**Pub/Sub notifications for pipeline events:**
```bash
# Cloud Deploy publishes to clouddeploy-operations topic
gcloud pubsub topics create clouddeploy-operations

# Create notification subscription
gcloud pubsub subscriptions create deploy-notifications \
  --topic=clouddeploy-operations \
  --push-endpoint="https://notification-handler.run.app"
```

### Step 12: IAM for pipeline management

```bash
# Deployer role (create releases and rollouts)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cicd@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/clouddeploy.releaser"

# Approver role (approve rollouts)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="group:release-approvers@company.com" \
  --role="roles/clouddeploy.approver"

# Execution service account (performs actual deployment)
gcloud iam service-accounts create deploy-executor \
  --display-name="Cloud Deploy Executor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:deploy-executor@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.developer"
```

## Best Practices

- Use Skaffold profiles to differentiate environment configurations
- Use canary deployments for production targets to reduce blast radius
- Always enable deployment verification for production canary rollouts
- Use automation rules to auto-promote from dev to staging after passing tests
- Use multi-target deployments for multi-region consistency
- Set `requireApproval: true` on production targets
- Use deploy parameters to customize resource allocation per environment
- Keep Skaffold and Cloud Deploy configs in the same repository as application code

## Anti-Patterns

- Do not skip canary verification phases to speed up deployment
- Do not use the same target for multiple environments
- Do not grant overly broad IAM roles to the execution service account
- Do not hard-code image tags in Skaffold manifests; use the `--images` flag
- Do not ignore failed canary phases; investigate before advancing

## Security Considerations

- Use Binary Authorization to enforce image signing policies
- Use separate GCP projects for each environment when possible
- Restrict who can approve production rollouts with IAM
- Use Workload Identity for GKE targets instead of service account keys
- Enable audit logging for Cloud Deploy operations
- Store deployment artifacts in a dedicated, access-controlled GCS bucket

## Cost Optimization

- Use Cloud Deploy automation to reduce manual intervention costs
- Clean up old releases and rollouts to reduce storage costs
- Use regional targets close to your users to minimize latency and transfer costs
- Share Skaffold render caches across builds with Cloud Storage
- Use appropriate machine types for verification containers
