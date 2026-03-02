<p align="center">
  <strong>Claude Skills</strong><br>
  70 production-ready slash commands for <a href="https://claude.ai/code">Claude Code</a>
</p>

<p align="center">
  <a href="https://sitharaj88.github.io/claude-skills/">Documentation</a> &middot;
  <a href="#installation">Installation</a> &middot;
  <a href="#skills">All Skills</a> &middot;
  <a href="#contributing">Contributing</a> &middot;
  <a href="https://buymeacoffee.com/sitharaj88">Buy Me a Coffee</a>
</p>

---

## What is this?

A curated collection of world-class [Claude Code](https://claude.ai/code) skills — custom slash commands that supercharge your development workflow. From smart commits and database management to full AWS infrastructure, each skill auto-detects your project's framework, conventions, and patterns.

## Skills

### Developer Workflow

| Skill | Command | Description |
|-------|---------|-------------|
| **Smart Commit** | `/smart-commit` | Generates conventional commit messages by analyzing staged changes and matching your project's commit style |
| **Review PR** | `/review-pr [number]` | Reviews pull requests for correctness, security, performance, and maintainability with severity-categorized feedback |
| **Create PR** | `/create-pr [base]` | Creates well-structured PRs with titles, summaries, linked issues, and test plans from branch changes |
| **Debug Issue** | `/debug-issue [error]` | Systematically diagnoses bugs using hypothesis-driven debugging with root cause analysis |
| **Test Writer** | `/test-writer [file]` | Generates comprehensive test suites matching your project's framework and conventions |

### Code Generation

| Skill | Command | Description |
|-------|---------|-------------|
| **Generate Component** | `/generate-component [Name]` | Creates UI components with props, styles, tests, and stories matching your frontend framework |
| **Generate Endpoint** | `/generate-endpoint [resource] [method]` | Creates API endpoints with validation, error handling, types, and tests for your backend framework |
| **Implement Feature** | `/implement-feature [spec]` | Plans and implements complete features across the stack from description or GitHub issue number |
| **Scaffold Project** | `/scaffold-project [type] [name]` | Scaffolds production-ready projects with config, CI/CD, testing, and linting setup |

### Analysis & Documentation

| Skill | Command | Description |
|-------|---------|-------------|
| **Analyze Codebase** | `/analyze-codebase [focus]` | Deep codebase audit covering architecture, dependencies, code quality, and technical debt |
| **Generate Arch Doc** | `/generate-arch-doc [output]` | Generates architecture documentation with Mermaid diagrams, component catalog, and data flows |
| **Generate API Doc** | `/generate-api-doc [output]` | Generates API reference docs from route definitions with parameters, examples, and error codes |
| **Generate Changelog** | `/generate-changelog [range]` | Generates changelogs from git history in Keep a Changelog format with PR/issue links |
| **Refactor Module** | `/refactor-module [file]` | Detects code smells and applies incremental, test-verified refactorings |

### Mobile Development

Full coverage for **Android Native**, **iOS Native**, **React Native**, and **Flutter**.

| Skill | Command | Description |
|-------|---------|-------------|
| **Generate Screen** | `/generate-screen [Name] [type]` | Creates mobile screens with navigation, state management, and platform-native UI for Compose/SwiftUI/RN/Flutter |
| **Scaffold Mobile** | `/scaffold-mobile [platform] [name]` | Scaffolds production-ready mobile projects with architecture, navigation, DI, and CI/CD |
| **Mobile Test Writer** | `/mobile-test-writer [file] [type]` | Generates mobile tests — Espresso, XCTest, RNTL/Detox, Flutter widget/integration tests |
| **Generate Native Bridge** | `/generate-native-bridge [capability]` | Creates platform bridges — RN Turbo Modules, Flutter Platform Channels, KMP shared code |
| **App Store Prep** | `/app-store-prep [platform] [version]` | Audits compliance, generates store metadata, configures signing, and creates release checklists |
| **Mobile CI Setup** | `/mobile-ci-setup [platform] [ci]` | Sets up CI/CD with GitHub Actions, Fastlane, EAS Build — build, test, sign, and deploy automation |

### Database & DevOps

| Skill | Command | Description |
|-------|---------|-------------|
| **Generate Migration** | `/generate-migration [change]` | Generates database migrations for Prisma, Drizzle, Alembic, Django, Flyway, Goose with safety checks and rollback |
| **Docker Setup** | `/docker-setup [mode] [services]` | Creates optimized multi-stage Dockerfiles, docker-compose configs, and .dockerignore for any stack |
| **Deploy Config** | `/deploy-config [platform]` | Generates deployment configs for Vercel, AWS, GCP, Fly.io, Kubernetes, Railway, and Render |
| **Setup Monitoring** | `/setup-monitoring [tool]` | Sets up logging (pino/structlog), error tracking (Sentry), metrics (Prometheus/OTel), health checks, and alerts |

### Security & Performance

| Skill | Command | Description |
|-------|---------|-------------|
| **Security Audit** | `/security-audit [scope]` | OWASP Top 10 vulnerability audit — injection, auth, secrets, XSS, SSRF with remediation code |
| **Performance Audit** | `/performance-audit [scope]` | Identifies N+1 queries, memory leaks, bundle bloat, rendering issues, and missing caching with fix code |
| **Dependency Audit** | `/dependency-audit [scope]` | Audits for vulnerabilities, outdated packages, license compliance, unused deps, and bundle size impact |

### Migration & Conversion

| Skill | Command | Description |
|-------|---------|-------------|
| **Migrate Code** | `/migrate-code [path] [from] [to]` | Migrates between frameworks/patterns — JS→TS, class→hooks, REST→GraphQL, CJS→ESM, and more |

### Relational Databases

| Skill | Command | Description |
|-------|---------|-------------|
| **PostgreSQL** | `/db-postgres [operation]` | Generates schemas, queries, indexes, extensions (pgvector, PostGIS), replication, and performance tuning for PostgreSQL |
| **MySQL** | `/db-mysql [operation]` | Generates schemas, queries, stored procedures, replication, and InnoDB-optimized configurations for MySQL |
| **SQLite** | `/db-sqlite [operation]` | Generates schemas, queries, WAL configuration, FTS5, and edge/embedded patterns for SQLite, Turso, and D1 |

### NoSQL Databases

| Skill | Command | Description |
|-------|---------|-------------|
| **MongoDB** | `/db-mongodb [operation]` | Generates document schemas, aggregation pipelines, indexes, Mongoose/Prisma models, and Atlas configurations |
| **Redis** | `/db-redis [operation]` | Generates data structures, caching strategies, pub/sub, Lua scripts, Streams, and cluster configurations |
| **Elasticsearch** | `/db-elasticsearch [operation]` | Generates index mappings, Query DSL, analyzers, aggregations, kNN search, and ILM policies |
| **Cassandra** | `/db-cassandra [operation]` | Generates query-first data models, CQL schemas, partition strategies, and compaction tuning |
| **Neo4j** | `/db-neo4j [operation]` | Generates graph data models, Cypher queries, GDS algorithms, and relationship-centric schemas |

### ORMs, BaaS & Design

| Skill | Command | Description |
|-------|---------|-------------|
| **Prisma** | `/db-prisma [operation]` | Generates Prisma schemas, type-safe queries, migrations, relations, and middleware configurations |
| **Drizzle** | `/db-drizzle [operation]` | Generates Drizzle ORM schemas, SQL-like query builders, migrations, and multi-dialect configurations |
| **TypeORM** | `/db-typeorm [operation]` | Generates TypeORM entities, repositories, QueryBuilder patterns, and NestJS integration |
| **Supabase** | `/db-supabase [operation]` | Generates Supabase schemas with RLS policies, Edge Functions, Realtime subscriptions, and Auth setup |
| **Firebase** | `/db-firebase [operation]` | Generates Firestore data models, security rules, Cloud Functions, and RTDB configurations |
| **Schema Design** | `/db-design [entities]` | Designs database schemas with ER diagrams, normalization, access pattern analysis, and migration strategies |

### AWS — Compute & Networking

| Skill | Command | Description |
|-------|---------|-------------|
| **Lambda** | `/aws-lambda [runtime] [trigger]` | Generates Lambda functions with handlers, IAM roles, event triggers, layers, and SAM/Serverless configs |
| **EC2** | `/aws-ec2 [type] [os]` | Generates EC2 launch templates, Auto Scaling Groups, user data scripts, and security configurations |
| **ECS / Fargate** | `/aws-ecs [fargate\|ec2] [name]` | Generates ECS task definitions, services, Dockerfiles, ALB integration, and container orchestration |
| **EKS** | `/aws-eks [cluster name]` | Generates EKS cluster configs, node groups, Helm charts, add-ons, IRSA, and K8s manifests |
| **VPC** | `/aws-vpc [CIDR] [region]` | Generates VPC architectures with subnets, NAT gateways, security groups, NACLs, and VPC endpoints |
| **API Gateway** | `/aws-api-gateway [rest\|http\|websocket]` | Generates REST, HTTP, and WebSocket APIs with authorizers, stages, and custom domains |
| **CloudFront** | `/aws-cloudfront [static\|api\|media]` | Generates CDN distributions with caching policies, security headers, and edge compute |

### AWS — Data & Storage

| Skill | Command | Description |
|-------|---------|-------------|
| **S3** | `/aws-s3 [purpose]` | Generates S3 bucket configs with policies, lifecycle rules, replication, encryption, and CORS |
| **DynamoDB** | `/aws-dynamodb [entity] [patterns]` | Designs DynamoDB tables with key schemas, GSIs, single-table design, and access layer code |
| **RDS / Aurora** | `/aws-rds [engine] [purpose]` | Generates RDS and Aurora configs with multi-AZ, read replicas, backups, and connection management |
| **ElastiCache** | `/aws-elasticache [redis\|memcached]` | Generates Redis/Memcached clusters with caching strategies, replication, and client code |
| **Kinesis** | `/aws-kinesis [streams\|firehose]` | Generates real-time streaming configs with producers, consumers, and Firehose delivery |
| **Secrets Manager** | `/aws-secrets [type]` | Generates Secrets Manager and SSM Parameter Store configs with rotation and secure access |

### AWS — Messaging, Security & Auth

| Skill | Command | Description |
|-------|---------|-------------|
| **SQS & SNS** | `/aws-sqs-sns [sqs\|sns\|both]` | Generates queues, topics, dead-letter queues, fan-out patterns, and consumer code |
| **EventBridge** | `/aws-eventbridge [pattern]` | Generates event buses, rules, patterns, schemas, and event-driven architectures |
| **Step Functions** | `/aws-step-functions [type]` | Generates state machine workflows with error handling and service integrations |
| **SES** | `/aws-ses [type]` | Generates email configs with templates, domain verification (DKIM/SPF/DMARC), and deliverability |
| **IAM** | `/aws-iam [role\|policy] [service]` | Generates least-privilege IAM policies, roles, trust policies, and permission boundaries |
| **Cognito** | `/aws-cognito [user-pool\|identity-pool]` | Generates User Pools with OAuth2/OIDC, social login, MFA, and Identity Pools |
| **WAF** | `/aws-waf [cloudfront\|alb]` | Generates WAF Web ACLs with managed rules, custom rules, rate limiting, and bot control |

### AWS — IaC, DevOps & AI

| Skill | Command | Description |
|-------|---------|-------------|
| **CloudFormation** | `/aws-cloudformation [resources]` | Generates CloudFormation and SAM templates with nested stacks and cross-stack references |
| **CDK** | `/aws-cdk [language] [resources]` | Generates CDK constructs and stacks in TypeScript or Python with L2/L3 constructs |
| **Terraform** | `/aws-terraform [resources]` | Generates Terraform modules for AWS with state management, workspaces, and best practices |
| **CloudWatch** | `/aws-cloudwatch [dashboards\|alarms]` | Generates dashboards, alarms, metrics, log groups, and Log Insights queries |
| **CodePipeline** | `/aws-codepipeline [source] [target]` | Generates CI/CD pipelines with CodeBuild, CodeDeploy, and deployment strategies |
| **Route 53** | `/aws-route53 [domain] [type]` | Generates DNS configs with routing policies, health checks, and domain management |
| **Amplify** | `/aws-amplify [feature] [framework]` | Generates Amplify Gen 2 apps with authentication, data models, storage, and hosting |
| **Bedrock** | `/aws-bedrock [model\|agent\|kb]` | Generates AI/ML integrations with foundation models, knowledge bases, agents, and guardrails |

## Installation

### Quick install (all skills)

```bash
git clone https://github.com/sitharaj88/claude-skills.git
cd claude-skills
./install.sh --all
```

### Install specific skills

```bash
./install.sh --skill smart-commit
./install.sh --skill aws-lambda
```

### Interactive picker

```bash
./install.sh --pick
```

### Install to project scope

```bash
./install.sh --scope project --all
```

### Manual installation

Copy individual skills to your Claude Code skills directory:

```bash
# Personal (available in all projects)
cp -r skills/smart-commit ~/.claude/skills/smart-commit

# Project-specific
cp -r skills/smart-commit .claude/skills/smart-commit
```

### Uninstall

```bash
./install.sh --uninstall
```

## Usage

Once installed, invoke any skill in Claude Code with its slash command:

```
# Developer workflow
/smart-commit
/review-pr 42
/test-writer src/utils/parser.ts

# Code generation
/generate-component UserProfile form
/scaffold-project react-app my-dashboard

# Mobile
/generate-screen OrderHistory list
/scaffold-mobile flutter my-app

# AWS infrastructure
/aws-lambda nodejs sqs "process order events"
/aws-ecs fargate my-api
/aws-vpc 10.0.0.0/16 us-east-1
/aws-dynamodb User "get by email, list by status"
/aws-iam role lambda "access DynamoDB and S3"
/aws-cdk typescript "VPC with ECS Fargate service"
/aws-bedrock knowledge-base "product documentation RAG"

# Database
/db-postgres "users table with auth and profiles"
/db-mongodb "product catalog with categories"
/db-redis "session caching with TTL"
/db-prisma "schema for e-commerce app"
/db-design "users, orders, products, reviews"

# Security & analysis
/security-audit full
/performance-audit backend
/dependency-audit all
```

Skills automatically detect your project's framework, conventions, and patterns — no configuration needed.

## Documentation

Full documentation is available at **[sitharaj88.github.io/claude-skills](https://sitharaj88.github.io/claude-skills/)** — built with VitePress, covering all 70 skills with usage guides, examples, and a reference section.

## Skill Design

Each skill follows these principles:

- **Convention-matching** — Skills detect and follow your project's existing patterns, frameworks, and coding style
- **Minimum privilege** — Each skill only has access to the tools it needs (e.g., review skills can't write files)
- **Explicit invocation** — All skills require explicit `/slash-command` invocation — they won't fire automatically
- **Progressive disclosure** — Core instructions in SKILL.md, detailed references in supporting files
- **Feedback loops** — Skills that modify code run tests after each change and iterate until green

## Repository Structure

```
claude-skills/
├── skills/
│   ├── smart-commit/              # Developer Workflow (5 skills)
│   ├── review-pr/
│   ├── create-pr/
│   ├── debug-issue/
│   ├── test-writer/
│   ├── generate-component/        # Code Generation (4 skills)
│   ├── generate-endpoint/
│   ├── implement-feature/
│   ├── scaffold-project/
│   ├── analyze-codebase/          # Analysis & Docs (5 skills)
│   ├── generate-arch-doc/
│   ├── generate-api-doc/
│   ├── generate-changelog/
│   ├── refactor-module/
│   ├── generate-screen/           # Mobile Development (6 skills)
│   ├── scaffold-mobile/
│   ├── mobile-test-writer/
│   ├── generate-native-bridge/
│   ├── app-store-prep/
│   ├── mobile-ci-setup/
│   ├── generate-migration/        # Database & DevOps (4 skills)
│   ├── docker-setup/
│   ├── deploy-config/
│   ├── setup-monitoring/
│   ├── security-audit/            # Security & Performance (3 skills)
│   ├── performance-audit/
│   ├── dependency-audit/
│   ├── migrate-code/              # Migration (1 skill)
│   ├── db-postgres/               # Relational Databases (3 skills)
│   ├── db-mysql/
│   ├── db-sqlite/
│   ├── db-mongodb/                # NoSQL Databases (5 skills)
│   ├── db-redis/
│   ├── db-elasticsearch/
│   ├── db-cassandra/
│   ├── db-neo4j/
│   ├── db-prisma/                 # ORMs, BaaS & Design (6 skills)
│   ├── db-drizzle/
│   ├── db-typeorm/
│   ├── db-supabase/
│   ├── db-firebase/
│   ├── db-design/
│   ├── aws-lambda/                # AWS Compute & Networking (7 skills)
│   ├── aws-ec2/
│   ├── aws-ecs/
│   ├── aws-eks/
│   ├── aws-vpc/
│   ├── aws-api-gateway/
│   ├── aws-cloudfront/
│   ├── aws-s3/                    # AWS Data & Storage (6 skills)
│   ├── aws-dynamodb/
│   ├── aws-rds/
│   ├── aws-elasticache/
│   ├── aws-kinesis/
│   ├── aws-secrets/
│   ├── aws-sqs-sns/               # AWS Messaging, Security & Auth (7 skills)
│   ├── aws-eventbridge/
│   ├── aws-step-functions/
│   ├── aws-ses/
│   ├── aws-iam/
│   ├── aws-cognito/
│   ├── aws-waf/
│   ├── aws-cloudformation/        # AWS IaC, DevOps & AI (8 skills)
│   ├── aws-cdk/
│   ├── aws-terraform/
│   ├── aws-cloudwatch/
│   ├── aws-codepipeline/
│   ├── aws-route53/
│   ├── aws-amplify/
│   └── aws-bedrock/
├── docs/                          # VitePress documentation site
├── install.sh                     # Skill installer (symlink-based)
├── package.json
└── README.md
```

## Contributing

To add a new skill:

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter and instructions
2. Follow the [skill authoring best practices](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/best-practices)
3. Keep SKILL.md under 500 lines — use `references/` for detailed content
4. Write clear descriptions that explain both **what** and **when**
5. Test with a fresh Claude Code session before submitting
6. Add a documentation page in `docs/skills/<category>/`

## Author

**Sitharaj** — Building tools that make developers faster.

- [Website](https://sitharaj.in)
- [GitHub](https://github.com/sitharaj88)
- [LinkedIn](https://linkedin.com/in/sitharaj08)
- [Buy Me a Coffee](https://buymeacoffee.com/sitharaj88)

If Claude Skills saves you time, consider starring the repo or buying me a coffee!

## License

MIT
