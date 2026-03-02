---
name: docker-setup
description: Generates Dockerfiles, docker-compose.yml, and container orchestration configs for any project type. Creates optimized multi-stage builds, development and production configurations, and service dependencies. Use when the user wants to dockerize an app, add Docker support, create containers, or set up a docker-compose environment.
argument-hint: "[mode: dev|prod|both] [services: db,redis,etc]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a containerization expert. Generate production-grade Docker configuration for the current project.

### Step 1: Analyze the project

Detect the tech stack:
- **Language/runtime**: Node.js, Python, Go, Rust, Java, Ruby, .NET
- **Framework**: Express, Next.js, Django, Flask, FastAPI, Spring Boot, Rails, etc.
- **Package manager**: npm, yarn, pnpm, pip, poetry, go mod, cargo
- **Build system**: webpack, vite, esbuild, tsc, gradle, maven
- **Database**: PostgreSQL, MySQL, MongoDB, Redis, etc. (from connection strings or deps)
- **Other services**: Redis, RabbitMQ, Elasticsearch, MinIO, etc.

Read existing configs: `package.json`, `go.mod`, `pyproject.toml`, `requirements.txt`, etc.

### Step 2: Parse arguments

- `$0` = Mode (optional):
  - `dev` — Development-optimized with hot reload, volume mounts, debug ports
  - `prod` — Production-optimized with multi-stage build, minimal image, security hardening
  - `both` — Generate both dev and prod configs (default)
- `$1` = Additional services (optional, comma-separated): `db`, `redis`, `rabbitmq`, `elasticsearch`, `mailhog`

### Step 3: Generate Dockerfile

**Multi-stage production Dockerfile:**

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Platform-specific optimizations:**

| Platform | Base Image | Key Optimizations |
|----------|-----------|-------------------|
| Node.js | `node:20-alpine` | Multi-stage, npm ci, prune dev deps |
| Python | `python:3.12-slim` | Multi-stage, pip install --no-cache-dir, venv |
| Go | `golang:1.22-alpine` → `scratch` or `distroless` | Static binary, scratch final image |
| Rust | `rust:1.77-alpine` → `alpine` or `scratch` | Release build, strip binary |
| Java | `eclipse-temurin:21-jdk` → `eclipse-temurin:21-jre` | Build with Gradle/Maven, JRE-only runtime |

**Security hardening (all platforms):**
- Non-root user in final stage
- Minimal base image (alpine or distroless)
- No secrets in image layers
- Read-only filesystem where possible
- Health check configured

### Step 4: Generate docker-compose.yml

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner  # or builder for dev
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/appdb
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  db_data:
```

**Development override (`docker-compose.dev.yml`):**
```yaml
services:
  app:
    build:
      target: deps  # Use dependency stage
    volumes:
      - .:/app          # Source code mount for hot reload
      - /app/node_modules  # Preserve node_modules from image
    command: npm run dev
    environment:
      - NODE_ENV=development
```

### Step 5: Generate .dockerignore

```
node_modules
.git
.github
*.md
.env*
.vscode
.idea
dist
coverage
.next
__pycache__
*.pyc
target/
```

Tailor to the project — ignore build artifacts, IDE files, test output, but keep what's needed for the build.

### Step 6: Generate supporting files

**`.env.example`** — Document all environment variables the container needs:
```
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@db:5432/appdb
REDIS_URL=redis://redis:6379
NODE_ENV=production
```

**`Makefile` or scripts** — Common Docker commands:
```makefile
up:         docker compose up -d
down:       docker compose down
dev:        docker compose -f docker-compose.yml -f docker-compose.dev.yml up
build:      docker compose build --no-cache
logs:       docker compose logs -f app
shell:      docker compose exec app sh
db-shell:   docker compose exec db psql -U postgres appdb
```

### Step 7: Verify

1. Build the image: `docker build -t app-test .`
2. Verify the image size is reasonable
3. Run the container and check health endpoint
4. Verify docker-compose brings up all services and they can communicate

### Guidelines

- Always use specific image tags (`node:20-alpine`, not `node:latest`)
- Layer ordering matters — put rarely-changing layers first (deps before source)
- Never copy `.env` files or secrets into the image
- Use health checks for all services — compose `depends_on` with `condition: service_healthy`
- Dev and prod configs should be separate (compose override files)
- Keep images small — use alpine/slim/distroless base images
- Pin versions for reproducibility
