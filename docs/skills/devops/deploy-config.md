# Deploy Config

Generates deployment configurations for Vercel, AWS, GCP, Fly.io, Kubernetes, Railway, and Render. This skill analyzes your project, produces platform-specific configuration files, sets up environment management, integrates CI/CD pipelines, and provides a cost estimate for your deployment target.

## Quick Start

```bash
# Deploy to Fly.io
/deploy-config fly

# Deploy to Kubernetes as an API service
/deploy-config k8s api

# Deploy a static site to Vercel
/deploy-config vercel static
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `platform` | `$0` | Yes | Target platform: `vercel`, `aws`, `gcp`, `fly`, `k8s`, `railway`, `render` |
| `app type` | `$1` | No | Application type: `static`, `api`, or `fullstack` (auto-detected if omitted) |

::: tip
If you omit the app type, the skill auto-detects it by examining your project structure. Projects with only static assets are classified as `static`, those with a server entry point as `api`, and those with both client and server code as `fullstack`.
:::

## How It Works

1. **Analyze project** -- Detects your language, framework, build commands, output directory, and port bindings by scanning configuration files and entry points.
2. **Parse arguments** -- Identifies the target platform and application type, falling back to auto-detection when the app type is not provided.
3. **Generate platform config** -- Creates the platform-specific deployment configuration files, optimized for your stack and app type.
4. **Environment management** -- Produces environment variable templates and documents required secrets for each deployment stage (staging, production).
5. **CI/CD integration** -- Generates a GitHub Actions workflow (or platform-native CI) for automated deployments on push to main.
6. **Summary with cost estimate** -- Outputs a deployment summary including the generated files, deploy commands, and an estimated monthly cost range based on typical usage.

## Platform Comparison

| Platform | Best For | Pricing Model | Deploy Speed |
|----------|----------|---------------|--------------|
| **Vercel** | Frontend, Next.js, static sites | Free tier + per-request | Seconds |
| **AWS (ECS/Lambda)** | Enterprise, custom infra | Pay-per-use | Minutes |
| **GCP (Cloud Run)** | Containerized APIs, scale-to-zero | Pay-per-use | Seconds |
| **Fly.io** | Global edge, full-stack apps | Per-VM pricing | Seconds |
| **Kubernetes** | Complex microservices, hybrid cloud | Cluster-dependent | Minutes |
| **Railway** | Rapid prototyping, databases included | Usage-based | Seconds |
| **Render** | Simple web services, managed infra | Free tier + fixed plans | Minutes |

## Files Generated Per Platform

| Platform | Generated Files |
|----------|----------------|
| **Vercel** | `vercel.json`, `.env.example`, `.github/workflows/deploy.yml` |
| **AWS** | `template.yaml` (SAM/CloudFormation), `buildspec.yml`, `Dockerfile`, `.env.example` |
| **GCP** | `app.yaml` or `cloudbuild.yaml`, `Dockerfile`, `.env.example` |
| **Fly.io** | `fly.toml`, `Dockerfile`, `.dockerignore`, `.env.example`, `.github/workflows/deploy.yml` |
| **Kubernetes** | `k8s/deployment.yaml`, `k8s/service.yaml`, `k8s/ingress.yaml`, `k8s/configmap.yaml`, `Dockerfile` |
| **Railway** | `railway.toml`, `Procfile`, `.env.example` |
| **Render** | `render.yaml`, `.env.example`, `.github/workflows/deploy.yml` |

::: warning
The generated CI/CD workflows reference secrets (such as `FLY_API_TOKEN` or `AWS_ACCESS_KEY_ID`) that must be added to your repository's secrets store before the pipeline will succeed. The skill lists all required secrets in the deployment summary.
:::

## Example

Suppose you have a Node.js full-stack application and run:

```bash
/deploy-config fly
```

The skill detects a full-stack Node.js app and generates:

```
fly.toml                          # Fly.io app config with health checks, auto-scaling
Dockerfile                        # Multi-stage build optimized for Fly.io
.dockerignore                     # Lean build context
.env.example                      # DATABASE_URL, SESSION_SECRET, NODE_ENV
.github/workflows/deploy.yml      # Auto-deploy on push to main
```

**Deployment summary:**

```
Platform:       Fly.io
App type:       fullstack (auto-detected)
Region:         iad (US East) -- closest to your current location
Resources:      shared-cpu-1x, 256MB RAM
Scaling:        1-3 instances, auto-scale on CPU > 70%
Estimated cost: $5-15/month

Deploy command:
  fly launch    # First-time setup
  fly deploy    # Subsequent deploys

Required secrets:
  fly secrets set DATABASE_URL="..." SESSION_SECRET="..."
```

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` -- runs within your current conversation |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Bash` |

This skill has read/write access to your project files and can execute shell commands to inspect your project structure and installed CLIs. It creates deployment configuration files at the locations expected by each platform.
