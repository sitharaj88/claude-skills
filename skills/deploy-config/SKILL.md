---
name: deploy-config
description: Generates deployment configurations for cloud platforms — Vercel, Netlify, AWS (CDK/SAM/Terraform), GCP (Cloud Run), Fly.io, Railway, Render, and Kubernetes. Creates infrastructure-as-code, environment configs, and deployment pipelines. Use when the user wants to deploy an app, set up cloud infrastructure, create deployment configs, or configure a hosting platform.
argument-hint: "[platform: vercel|aws|gcp|fly|k8s|railway|render] [type: static|api|fullstack]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a cloud deployment expert. Generate deployment configuration for the project targeting `$ARGUMENTS`.

### Step 1: Analyze the project

Determine deployment requirements:
- **App type**: static site, API server, full-stack, serverless functions, worker/cron
- **Build output**: static files, server binary, container image, serverless functions
- **Runtime needs**: Node.js, Python, Go, Java — and version
- **Port**: what port does the app listen on
- **Environment variables**: what config does the app need (from `.env.example` or config files)
- **Database/services**: external service dependencies
- **Build command**: how to build for production
- **Start command**: how to start in production

### Step 2: Parse arguments

- `$0` = Target platform (required):
  - `vercel` — Vercel (static + serverless)
  - `netlify` — Netlify (static + functions)
  - `aws` — AWS (ECS/Lambda/S3+CloudFront via CDK or Terraform)
  - `gcp` — Google Cloud (Cloud Run)
  - `fly` — Fly.io (container-based)
  - `k8s` — Kubernetes (deployment + service + ingress)
  - `railway` — Railway
  - `render` — Render
- `$1` = App type (optional, auto-detect if not specified)

### Step 3: Generate platform-specific config

#### Vercel

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": { ... },
  "headers": [ ... ],
  "rewrites": [ ... ]
}
```
- Detect framework for zero-config (Next.js, Vite, etc.)
- Configure serverless functions in `api/` directory
- Set up environment variables via `vercel.json` or recommend dashboard

#### AWS (Terraform)

```hcl
# infrastructure/main.tf
resource "aws_ecs_service" "app" { ... }
resource "aws_ecs_task_definition" "app" { ... }
resource "aws_lb" "app" { ... }
resource "aws_rds_instance" "db" { ... }
```
- ECS Fargate for containerized apps
- Lambda + API Gateway for serverless
- S3 + CloudFront for static sites
- RDS for databases, ElastiCache for Redis
- VPC, security groups, IAM roles

#### GCP (Cloud Run)

```yaml
# cloudbuild.yaml + service.yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/app', '.']
  - name: gcr.io/cloud-builders/gcloud
    args: ['run', 'deploy', 'app', '--image', 'gcr.io/$PROJECT_ID/app']
```

#### Fly.io

```toml
# fly.toml
app = "app-name"
primary_region = "iad"

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[env]
  NODE_ENV = "production"

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
```

#### Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: app
          image: app:latest
          ports:
            - containerPort: 3000
          resources:
            requests: { memory: "128Mi", cpu: "100m" }
            limits: { memory: "256Mi", cpu: "200m" }
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
---
# k8s/service.yaml
apiVersion: v1
kind: Service
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
```

- Deployment with resource limits and probes
- Service for internal networking
- Ingress with TLS termination
- ConfigMap for non-secret env vars
- Secret for sensitive values
- HPA (Horizontal Pod Autoscaler) for scaling

### Step 4: Environment configuration

Generate environment management:
- `.env.example` — Document all required variables
- `.env.production` (gitignored) — Template for production values
- Platform-specific secret management instructions:
  - Vercel: `vercel env add`
  - AWS: Secrets Manager or Parameter Store
  - K8s: Kubernetes Secrets or external-secrets-operator
  - Fly: `fly secrets set`

### Step 5: CI/CD integration

Generate a deploy workflow (GitHub Actions):

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to [platform]
        # Platform-specific deploy steps
```

### Step 6: Summary

```markdown
## Deployment configured for [platform]

### Files created
- [list of generated config files]

### Setup steps
1. [Platform account/CLI setup]
2. [Set environment variables/secrets]
3. [Initial deployment command]

### Deployment flow
- Push to `main` → [what happens automatically]
- Manual deploy: `[command]`

### Estimated cost
[Rough cost estimate based on the platform's free tier and the app's requirements]
```

### Guidelines

- Always include health checks — every platform supports them
- Configure auto-scaling where available
- Set resource limits to prevent runaway costs
- Use platform-managed databases when possible (less ops burden)
- TLS/HTTPS should be automatic — configure it from the start
- Environment variables over config files — never hardcode secrets
- Include cost-awareness — note free tier limits and expected costs
- Generate the simplest config that works — don't over-engineer infrastructure
