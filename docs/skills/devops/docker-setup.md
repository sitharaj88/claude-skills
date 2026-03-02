# Docker Setup

Creates optimized multi-stage Dockerfiles, docker-compose configurations, and `.dockerignore` files for any stack. This skill analyzes your project to produce production-ready container setups with minimal image sizes, proper layer caching, and security hardening.

## Quick Start

```bash
# Generate both dev and prod Docker setup with database and Redis
/docker-setup both db,redis

# Production-only Dockerfile
/docker-setup prod

# Development setup with all common services
/docker-setup dev db,redis,rabbitmq
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `mode` | `$0` | Yes | Docker configuration mode: `dev`, `prod`, or `both` |
| `services` | `$1` | No | Comma-separated list of supporting services: `db`, `redis`, `rabbitmq`, `elasticsearch`, `minio`, `mailhog` |

::: tip
Use `both` mode to generate a multi-stage Dockerfile that serves both development (with hot-reload and debugging) and production (optimized, minimal image). This is the recommended approach for most projects.
:::

## How It Works

1. **Analyze project** -- Detects your language, framework, package manager, and build system by scanning configuration files (`package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`).
2. **Parse arguments** -- Determines the target mode and which supporting services to include in the compose configuration.
3. **Generate Dockerfile** -- Creates a multi-stage Dockerfile optimized for your stack, with separate build, test, and runtime stages.
4. **Generate docker-compose.yml** -- Produces a compose file with your application service plus any requested supporting services, complete with health checks, volume mounts, and networking.
5. **Generate .dockerignore** -- Creates a comprehensive ignore file to keep your build context small and prevent secrets from leaking into images.
6. **Supporting files** -- Generates `.env.example` with documented environment variables and a `Makefile` with common Docker commands.
7. **Verify** -- Validates the generated configuration for syntax correctness and common pitfalls.

## Platform Optimizations

| Platform | Base Image | Key Optimizations |
|----------|------------|-------------------|
| **Node.js** | `node:22-alpine` | Multi-stage with `npm ci --omit=dev`, non-root user, `.npmrc` caching |
| **Python** | `python:3.12-slim` | Virtual environment copy, `pip install --no-cache-dir`, compiled deps in build stage |
| **Go** | `golang:1.22-alpine` / `scratch` | Static binary compilation, `scratch` or `distroless` runtime image |
| **Rust** | `rust:1.77-alpine` / `scratch` | `cargo-chef` for dependency caching, `musl` for static linking |
| **Java** | `eclipse-temurin:21-jre-alpine` | Gradle/Maven build stage, JRE-only runtime, `jlink` custom runtime |

## Security Hardening

Every generated Dockerfile includes the following security measures:

- **Non-root user** -- Application runs as a dedicated unprivileged user
- **Read-only filesystem** -- Where supported, the root filesystem is mounted read-only
- **No package manager in production** -- Build tools and package managers are excluded from the final stage
- **Pinned base images** -- Uses digest-pinned or version-locked base images to prevent supply chain drift
- **Secret exclusion** -- `.dockerignore` excludes `.env`, `.git`, credentials, and private keys
- **Health checks** -- Every service includes a `HEALTHCHECK` instruction

::: warning
The generated `.env.example` contains placeholder values only. Never commit actual secrets to your repository. Use Docker secrets or a vault solution for production credentials.
:::

## Example

Suppose you have a Node.js + Express project and run:

```bash
/docker-setup both db,redis
```

The skill generates:

```
Dockerfile                # Multi-stage: dev target with hot-reload, prod target optimized
docker-compose.yml        # App + PostgreSQL + Redis with health checks
docker-compose.dev.yml    # Override with volume mounts, debug ports, hot-reload
.dockerignore             # Excludes node_modules, .git, .env, test coverage
.env.example              # DATABASE_URL, REDIS_URL, NODE_ENV, PORT
Makefile                  # make dev, make prod, make build, make logs, make clean
```

**Generated Dockerfile (abbreviated):**

```dockerfile
# ---- Build Stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
USER app
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` -- runs within your current conversation |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Bash` |

This skill has read/write access to your project files and can execute shell commands to inspect your project structure. It creates Docker-related files at the project root.
