# Database & DevOps Skills

Four skills for database management, containerization, deployment, and observability.

<div class="skill-grid">
  <a href="generate-migration" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Generate Migration</h3>
    <span class="command">/generate-migration [change]</span>
    <p>Generates database migrations for Prisma, Drizzle, Alembic, Django, Flyway, and Goose with safety checks.</p>
  </a>
  <a href="docker-setup" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Docker Setup</h3>
    <span class="command">/docker-setup [mode]</span>
    <p>Creates optimized multi-stage Dockerfiles, docker-compose configs, and .dockerignore.</p>
  </a>
  <a href="deploy-config" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Deploy Config</h3>
    <span class="command">/deploy-config [platform]</span>
    <p>Generates deployment configs for Vercel, AWS, GCP, Fly.io, Kubernetes, Railway, and Render.</p>
  </a>
  <a href="setup-monitoring" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Setup Monitoring</h3>
    <span class="command">/setup-monitoring [tool]</span>
    <p>Sets up structured logging, error tracking, metrics, health checks, and alerting.</p>
  </a>
</div>

## Supported ORM / Migration Tools

| Ecosystem | Tools |
|-----------|-------|
| JavaScript/TypeScript | Prisma, Drizzle, TypeORM, Sequelize, Knex, Kysely |
| Python | Alembic (SQLAlchemy), Django Migrations, Tortoise ORM |
| Go | Goose, golang-migrate, GORM |
| Ruby | ActiveRecord |
| Java/Kotlin | Flyway, Liquibase |

## Deployment Platforms

| Platform | Best For |
|----------|----------|
| Vercel | Static sites, Next.js, serverless |
| Fly.io | Containers, global edge deployment |
| AWS | Full infrastructure control |
| GCP Cloud Run | Container-based, auto-scaling |
| Kubernetes | Complex multi-service architectures |
| Railway/Render | Simple PaaS deployment |

## Monitoring Stack Options

| Tool | Scope |
|------|-------|
| Sentry | Error tracking + performance |
| Datadog | Full observability platform |
| Grafana + Prometheus | Self-hosted metrics and dashboards |
| OpenTelemetry | Vendor-neutral instrumentation |
| CloudWatch | AWS-native monitoring |
