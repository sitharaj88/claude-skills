# What are Claude Skills?

Claude Skills are **custom slash commands** for [Claude Code](https://claude.ai/code) — Anthropic's CLI tool for AI-assisted development. They extend Claude Code with specialized workflows, making complex multi-step tasks as simple as typing `/skill-name`.

## The Problem

Without skills, you'd repeatedly explain the same workflows to Claude:

> "Review this PR, check for security issues, look at performance, categorize findings by severity, format the output like this..."

> "Generate a commit message matching our conventional commits format, analyze the staged diff, detect the project's commit style..."

## The Solution

Skills capture these workflows as reusable, shareable commands:

```
/review-pr 42         → Full PR review with severity-rated findings
/smart-commit         → Conventional commit matching your project style
/security-audit       → OWASP Top 10 audit with remediation code
```

## How Skills Work

Each skill is a **directory** containing a `SKILL.md` file with two parts:

### 1. YAML Frontmatter — Metadata

```yaml
---
name: review-pr
description: Reviews a pull request for correctness, security, performance...
argument-hint: "[PR-number]"
context: fork
allowed-tools: Bash(gh *), Read, Grep, Glob
---
```

This tells Claude Code:
- **When** to suggest this skill (from the description)
- **What arguments** it accepts
- **Which tools** it can use (minimum privilege)
- **How to run** it (inline or in a forked context)

### 2. Markdown Body — Instructions

The body contains the actual workflow instructions that Claude follows — analysis steps, output format, decision trees, and quality checks.

## Key Capabilities

### Auto-Detection

Skills don't need configuration. They detect your project's stack by analyzing:
- Package files (`package.json`, `go.mod`, `pubspec.yaml`, etc.)
- Existing code patterns (component structure, test conventions, etc.)
- Configuration files (ESLint, TypeScript, testing frameworks)

### Convention Matching

Skills study your existing code to match your patterns exactly:
- If you use arrow functions, the generated code uses arrow functions
- If your tests use `describe`/`it` blocks, generated tests use `describe`/`it`
- If you follow conventional commits, generated messages follow conventional commits

### Dynamic Context

Skills can inject live data using shell commands:

```markdown
## Staged changes
!`git diff --staged`

## Recent commits
!`git log --oneline -10`
```

This data is loaded *before* the skill runs, giving Claude full context.

### Arguments

Skills accept arguments for flexibility:

```
/generate-endpoint users CRUD     → Full REST resource for users
/scaffold-mobile flutter my-app   → Flutter project named my-app
/migrate-code src/ javascript typescript → JS to TS migration
```

## Skill Scopes

| Scope | Location | Available in |
|-------|----------|-------------|
| Personal | `~/.claude/skills/` | All your projects |
| Project | `.claude/skills/` | This project only |

## All 147 Skills by Category

### Core Development
- [Developer Workflow](/skills/workflow/) — Smart Commit, Review PR, Create PR, Debug Issue, Test Writer
- [Code Generation](/skills/generation/) — Generate Component, Generate Endpoint, Implement Feature, Scaffold Project
- [Analysis & Documentation](/skills/analysis/) — Analyze Codebase, Generate Arch Doc, Generate API Doc, Generate Changelog, Refactor Module
- [Mobile Development](/skills/mobile/) — Generate Screen, Scaffold Mobile, Mobile Test Writer, Native Bridge, App Store Prep, Mobile CI Setup
- [Database & DevOps](/skills/devops/) — Generate Migration, Docker Setup, Deploy Config, Setup Monitoring
- [Security & Performance](/skills/security/) — Security Audit, Performance Audit, Dependency Audit
- [Migration](/skills/migration/) — Migrate Code

### Databases
- [Relational Databases](/skills/db-relational/) — PostgreSQL, MySQL, SQLite
- [NoSQL Databases](/skills/db-nosql/) — MongoDB, Redis, Elasticsearch, Cassandra, Neo4j
- [ORMs, BaaS & Design](/skills/db-tools/) — Prisma, Drizzle, TypeORM, Supabase, Firebase, Schema Design

### AWS (28 skills)
- [Compute & Networking](/skills/aws-compute/) — Lambda, EC2, ECS/Fargate, EKS, VPC, API Gateway, CloudFront
- [Data & Storage](/skills/aws-data/) — S3, DynamoDB, RDS/Aurora, ElastiCache, Kinesis, Secrets Manager
- [Messaging, Security & Auth](/skills/aws-integration/) — SQS/SNS, EventBridge, Step Functions, SES, IAM, Cognito, WAF
- [IaC, DevOps & AI](/skills/aws-devops/) — CloudFormation, CDK, Terraform, CloudWatch, CodePipeline, Route 53, Amplify, Bedrock

### GCP (28 skills)
- [Compute & Networking](/skills/gcp-compute/) — Cloud Functions, Compute Engine, Cloud Run, GKE, VPC, Load Balancing, Cloud CDN
- [Data & Storage](/skills/gcp-data/) — Cloud Storage, Cloud SQL, Firestore, Bigtable, Spanner, Memorystore, BigQuery
- [Messaging, Security & Identity](/skills/gcp-integration/) — Pub/Sub, Cloud Tasks, Eventarc, IAM, Secret Manager, Cloud Armor, Identity Platform
- [DevOps & AI](/skills/gcp-devops/) — Cloud Build, Cloud Deploy, Cloud Monitoring, Terraform, Vertex AI, Cloud DNS, Workflows

### Azure (28 skills)
- [Compute & Networking](/skills/azure-compute/) — Azure Functions, VMs, Container Apps, AKS, VNet, Application Gateway, Front Door
- [Data & Storage](/skills/azure-data/) — Blob Storage, Azure SQL, Cosmos DB, Cache for Redis, Event Hubs, Key Vault, Synapse
- [Messaging, Security & Identity](/skills/azure-integration/) — Service Bus, Event Grid, Logic Apps, Entra ID, RBAC, API Management, App Configuration
- [DevOps & AI](/skills/azure-devops/) — DevOps Pipelines, Azure Monitor, Terraform, Azure OpenAI, Azure DNS, Bicep, Durable Functions

### Cloudflare (7 skills)
- [Cloudflare](/skills/cloudflare/) — Workers, Pages, R2, D1, KV, Queues, Workers AI

### Vercel (7 skills)
- [Vercel](/skills/vercel/) — Deploy, Functions, KV, Postgres, Blob, AI SDK, Edge Config

### DigitalOcean (7 skills)
- [DigitalOcean](/skills/digitalocean/) — Droplets, App Platform, Kubernetes, Managed Databases, Spaces, Functions, Networking

## Next Steps

- [Install the skills](/guide/installation) in under a minute
- [Create your own skills](/guide/authoring) with the authoring guide
