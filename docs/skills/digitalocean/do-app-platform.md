# DigitalOcean App Platform

Generate App Platform configs with auto-deploy, scaling, and managed services. Use when you need to deploy applications on DigitalOcean App Platform with zero-infrastructure management.

## Usage

```bash
/do-app-platform [type]
```

## What It Does

1. Generates `.do/app.yaml` app spec files with services, static sites, workers, jobs, and functions
2. Configures auto-deploy from GitHub or GitLab with branch-based continuous deployment
3. Sets up horizontal scaling with autoscaling rules based on CPU utilization
4. Manages environment variables and encrypted secrets with proper scoping
5. Configures custom domains with automatic Let's Encrypt SSL certificates
6. Provisions dev databases (PostgreSQL, MySQL, Redis) with component-level interpolation
7. Sets up log forwarding to Papertrail, Datadog, or Logtail
8. Produces Terraform configurations for infrastructure-as-code deployments

## Example Output

```yaml
name: my-app
region: nyc

services:
  - name: api
    github:
      repo: myorg/my-api
      branch: main
      deploy_on_push: true
    dockerfile_path: Dockerfile
    http_port: 3000
    instance_count: 2
    instance_size_slug: professional-xs
    health_check:
      http_path: /health
      initial_delay_seconds: 10
      period_seconds: 10
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
    routes:
      - path: /api

static_sites:
  - name: frontend
    github:
      repo: myorg/my-frontend
      branch: main
      deploy_on_push: true
    build_command: npm run build
    output_dir: dist
    routes:
      - path: /
    catchall_document: index.html

databases:
  - name: db
    engine: PG
    version: "16"
    production: false
```

## Installation

```bash
cp -r skills/do-app-platform ~/.claude/skills/
```

<div class="badge-row">
  <span class="badge">DigitalOcean</span>
  <span class="badge">PaaS</span>
  <span class="badge">Auto-Deploy</span>
</div>

## Allowed Tools

- `Read` - Read existing app specs and deployment configurations
- `Write` - Create app.yaml specs, Dockerfiles, and Terraform templates
- `Edit` - Modify existing app settings, scaling rules, and environment variables
- `Bash` - Run doctl, Terraform, and curl commands for app management
- `Glob` - Search for app configuration and source files
- `Grep` - Find component references and environment variable usage
