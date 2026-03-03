---
name: do-app-platform
description: Generate App Platform configs with auto-deploy, scaling, and managed services. Use when the user wants to deploy applications on DigitalOcean App Platform with zero-infrastructure management.
argument-hint: "[type]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(doctl *), Bash(terraform *), Bash(curl *)
user-invocable: true
---

## Instructions

You are a DigitalOcean App Platform expert. Generate production-ready app specs and deployment configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Component type**: web-service, static-site, worker, job, function
- **Source**: GitHub repo, GitLab repo, container registry, local Dockerfile
- **Runtime/framework**: Node.js, Python, Go, Ruby, PHP, static (HTML/React/Vue/Next.js)
- **Scaling needs**: instance count, instance size
- **Database**: dev database (managed PostgreSQL/MySQL/Redis)

### Step 2: Generate app spec

Create the `.do/app.yaml` app spec file:

**Web service (Node.js example):**
```yaml
name: my-app
region: nyc

services:
  - name: api
    github:
      repo: myorg/my-api
      branch: main
      deploy_on_push: true
    source_dir: /
    dockerfile_path: Dockerfile
    http_port: 3000
    instance_count: 2
    instance_size_slug: professional-xs
    health_check:
      http_path: /health
      initial_delay_seconds: 10
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: REDIS_URL
        value: ${redis.REDIS_URL}
      - key: SECRET_KEY
        scope: RUN_TIME
        type: SECRET
        value: "change-me-in-console"
    routes:
      - path: /api
    cors:
      allow_origins:
        - prefix: https://example.com
      allow_methods:
        - GET
        - POST
        - PUT
        - DELETE
      allow_headers:
        - Content-Type
        - Authorization
      max_age: "3600"

static_sites:
  - name: frontend
    github:
      repo: myorg/my-frontend
      branch: main
      deploy_on_push: true
    source_dir: /
    build_command: npm run build
    output_dir: dist
    envs:
      - key: VITE_API_URL
        value: ${api.PUBLIC_URL}/api
        scope: BUILD_TIME
    routes:
      - path: /
    catchall_document: index.html

workers:
  - name: queue-processor
    github:
      repo: myorg/my-api
      branch: main
      deploy_on_push: true
    source_dir: /
    dockerfile_path: Dockerfile.worker
    instance_count: 1
    instance_size_slug: professional-xs
    envs:
      - key: QUEUE_NAME
        value: tasks
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}

jobs:
  - name: db-migrate
    github:
      repo: myorg/my-api
      branch: main
    source_dir: /
    dockerfile_path: Dockerfile.migrate
    kind: PRE_DEPLOY
    instance_count: 1
    instance_size_slug: professional-xs
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}

databases:
  - name: db
    engine: PG
    version: "16"
    production: false
    num_nodes: 1

  - name: redis
    engine: REDIS
    version: "7"
    production: false
    num_nodes: 1

domains:
  - domain: example.com
    type: PRIMARY
  - domain: www.example.com
    type: ALIAS

alerts:
  - rule: DEPLOYMENT_FAILED
  - rule: DOMAIN_FAILED
```

### Step 3: Component type configurations

**Static site (React/Vue/Next.js):**
```yaml
static_sites:
  - name: frontend
    github:
      repo: myorg/my-app
      branch: main
      deploy_on_push: true
    build_command: npm run build
    output_dir: build              # React: build, Vue: dist, Next.js: out
    environment_slug: node-js
    catchall_document: index.html  # For SPA routing
    envs:
      - key: REACT_APP_API_URL
        value: https://api.example.com
        scope: BUILD_TIME
```

**Dockerfile-based service:**
```yaml
services:
  - name: api
    github:
      repo: myorg/my-api
      branch: main
    dockerfile_path: Dockerfile
    http_port: 8080
    instance_count: 2
    instance_size_slug: professional-s
```

**Buildpack-based service (auto-detected):**
```yaml
services:
  - name: api
    github:
      repo: myorg/my-api
      branch: main
    environment_slug: python       # node-js, python, go, ruby, php
    build_command: pip install -r requirements.txt
    run_command: gunicorn app:app --bind 0.0.0.0:8080
    http_port: 8080
```

**Functions component:**
```yaml
functions:
  - name: my-functions
    github:
      repo: myorg/my-functions
      branch: main
      deploy_on_push: true
    source_dir: /packages
```

### Step 4: Scaling configuration

**Horizontal scaling:**
```yaml
services:
  - name: api
    instance_count: 3              # Fixed count
    instance_size_slug: professional-s
    autoscaling:
      min_instance_count: 2
      max_instance_count: 10
      metrics:
        cpu:
          percent: 70
```

**Instance size reference:**

| Slug | vCPUs | RAM | $/mo per instance |
|------|-------|-----|-------------------|
| basic-xxs | 1 | 256MB | $5 |
| basic-xs | 1 | 512MB | $10 |
| basic-s | 1 | 1GB | $12 |
| basic-m | 1 | 2GB | $24 |
| professional-xs | 1 | 1GB | $12 |
| professional-s | 1 | 2GB | $24 |
| professional-m | 2 | 4GB | $48 |
| professional-l | 4 | 8GB | $99 |

### Step 5: Environment variables and secrets

```yaml
envs:
  # Plain text variable (visible in dashboard)
  - key: NODE_ENV
    value: production
    scope: RUN_AND_BUILD_TIME

  # Secret (encrypted, not visible after set)
  - key: JWT_SECRET
    value: "your-secret-value"
    type: SECRET
    scope: RUN_TIME

  # Build-time only
  - key: NEXT_PUBLIC_API_URL
    value: https://api.example.com
    scope: BUILD_TIME

  # Reference another component
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}

  # App-level variable (inherited by all components)
  # Set at the top level of the spec
```

**App-level environment variables:**
```yaml
name: my-app
envs:
  - key: APP_ENV
    value: production
    scope: RUN_AND_BUILD_TIME
services:
  - name: api
    # Inherits APP_ENV from app level
```

### Step 6: Custom domains and SSL

```yaml
domains:
  - domain: example.com
    type: PRIMARY
    zone: example.com
  - domain: www.example.com
    type: ALIAS
  - domain: api.example.com
    type: PRIMARY
    zone: example.com
```

DNS configuration required:
```
# For apex domain (example.com)
A     @    <app-platform-ip>

# For subdomains
CNAME www  <app-id>.ondigitalocean.app.
CNAME api  <app-id>.ondigitalocean.app.
```

SSL certificates are automatically provisioned and renewed via Let's Encrypt.

### Step 7: Deploy and manage with doctl

```bash
# Create app from spec
doctl apps create --spec .do/app.yaml

# Update existing app
doctl apps update <app-id> --spec .do/app.yaml

# List apps
doctl apps list

# Get app info
doctl apps get <app-id>

# View deployment logs
doctl apps logs <app-id> --type build
doctl apps logs <app-id> --type deploy
doctl apps logs <app-id> --type run --follow

# Create deployment
doctl apps create-deployment <app-id>

# List deployments
doctl apps list-deployments <app-id>
```

### Step 8: Terraform configuration

```hcl
resource "digitalocean_app" "my_app" {
  spec {
    name   = "my-app"
    region = "nyc"

    service {
      name               = "api"
      instance_count     = 2
      instance_size_slug = "professional-xs"
      http_port          = 3000

      github {
        repo           = "myorg/my-api"
        branch         = "main"
        deploy_on_push = true
      }

      health_check {
        http_path = "/health"
      }

      env {
        key   = "NODE_ENV"
        value = "production"
      }

      env {
        key   = "DATABASE_URL"
        value = digitalocean_database_cluster.db.uri
        type  = "SECRET"
      }

      routes {
        path = "/api"
      }
    }

    static_site {
      name          = "frontend"
      build_command = "npm run build"
      output_dir    = "dist"

      github {
        repo           = "myorg/my-frontend"
        branch         = "main"
        deploy_on_push = true
      }

      routes {
        path = "/"
      }
    }

    domain {
      name = "example.com"
      type = "PRIMARY"
    }
  }
}
```

### Step 9: Preview apps for pull requests

Enable automatic preview deployments for PRs:

In the DigitalOcean dashboard, enable "Auto Deploy on Push" and configure preview apps. Each PR gets a unique URL like `pr-123.<app-id>.ondigitalocean.app`.

Preview apps share the same dev database and environment, so use caution with destructive operations.

### Step 10: Log forwarding

Forward application logs to external providers:

```yaml
name: my-app
services:
  - name: api
    log_destinations:
      - name: papertrail
        papertrail:
          endpoint: syslog+tls://logsN.papertrailapp.com:XXXXX
      - name: datadog
        datadog:
          endpoint: https://http-intake.logs.datadoghq.com
          api_key: ${DATADOG_API_KEY}
      - name: logtail
        logtail:
          token: ${LOGTAIL_TOKEN}
```

### Best practices

- Use `.do/app.yaml` in your repo for version-controlled infrastructure
- Use Dockerfile builds for full control over the build environment
- Use buildpacks for simple apps that follow convention over configuration
- Set `deploy_on_push: true` for main branch continuous deployment
- Use `PRE_DEPLOY` jobs for database migrations before new code goes live
- Reference database URLs with `${db.DATABASE_URL}` interpolation syntax
- Use `type: SECRET` for sensitive environment variables
- Configure health checks for all services with appropriate thresholds
- Use `catchall_document: index.html` for single-page applications

### Anti-patterns to avoid

- Do not store secrets as plain text environment variables; use `type: SECRET`
- Do not skip health checks; they prevent bad deploys from receiving traffic
- Do not use dev databases for production workloads; they lack HA and backups
- Do not deploy large monoliths; break into services, workers, and static sites
- Do not set `instance_count: 1` for production; use at least 2 for availability
- Do not use buildpacks when you need specific system dependencies; use Dockerfile
- Do not put build-only variables in `RUN_TIME` scope; it leaks info at runtime

### Cost optimization tips

- Use static sites for frontends (free tier: 3 static sites)
- Start with `basic-xxs` ($5/mo) for low-traffic services and scale up
- Use dev databases (free tier available) for staging environments
- Use Starter tier for hobby projects (limited to 1 container, 512MB RAM)
- Use workers instead of cron-triggered services for background processing
- Consolidate related services into a single app to share dev databases
- Monitor build minutes; optimize Dockerfiles with multi-stage builds and caching
- Use `source_dir` to scope builds to relevant directories in monorepos
