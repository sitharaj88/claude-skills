# claude-skills

A curated collection of world-class [Claude Code](https://claude.ai/code) skills — custom slash commands that supercharge your development workflow.

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

Comprehensive coverage for **Android Native**, **iOS Native**, **React Native**, and **Flutter**.

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
git clone https://github.com/anthropics/claude-skills.git
cd claude-skills
./install.sh --all
```

### Install specific skills

```bash
./install.sh --skill smart-commit
./install.sh --skill review-pr
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

Symlink individual skills to your Claude Code skills directory:

```bash
# Personal (available in all projects)
ln -s /path/to/claude-skills/skills/smart-commit ~/.claude/skills/smart-commit

# Project-specific
ln -s /path/to/claude-skills/skills/smart-commit .claude/skills/smart-commit
```

### Uninstall

```bash
./install.sh --uninstall
```

## Usage

Once installed, invoke any skill in Claude Code with its slash command:

```
/smart-commit
/review-pr 42
/test-writer src/utils/parser.ts
/generate-component UserProfile form
/analyze-codebase security
/generate-screen OrderHistory list
/scaffold-mobile flutter my-app
/mobile-test-writer HomeScreen ui
/app-store-prep both 2.1.0
/docker-setup both db,redis
/security-audit full
/migrate-code src/ javascript typescript
/dependency-audit all
/aws-lambda nodejs sqs "process order events"
/aws-ecs fargate my-api
/aws-vpc 10.0.0.0/16 us-east-1
/aws-dynamodb User "get by email, list by status"
/aws-iam role lambda "access DynamoDB and S3"
/aws-cdk typescript "VPC with ECS Fargate service"
/aws-bedrock knowledge-base "product documentation RAG"
```

Skills automatically detect your project's framework, conventions, and patterns — no configuration needed.

## Skill Design

Each skill follows these principles:

- **Convention-matching** — Skills detect and follow your project's existing patterns, frameworks, and coding style
- **Minimum privilege** — Each skill only has access to the tools it needs (e.g., review skills can't write files)
- **Explicit invocation** — All skills require explicit `/slash-command` invocation — they won't fire automatically
- **Progressive disclosure** — Core instructions in SKILL.md, detailed references in supporting files
- **Feedback loops** — Skills that modify code run tests after each change and iterate until green

## Repository Structure

```
skills/
├── smart-commit/SKILL.md           # Conventional commit generation
├── review-pr/SKILL.md              # PR review with severity ratings
├── create-pr/SKILL.md              # Structured PR creation
├── debug-issue/                    # Hypothesis-driven debugging
│   ├── SKILL.md
│   └── references/strategies.md
├── test-writer/SKILL.md            # Framework-aware test generation
├── generate-component/SKILL.md     # UI component scaffolding
├── generate-endpoint/SKILL.md      # API endpoint generation
├── implement-feature/              # Full-stack feature implementation
│   ├── SKILL.md
│   └── references/workflow.md
├── scaffold-project/               # Project scaffolding
│   ├── SKILL.md
│   └── templates/
│       ├── node-api.md
│       ├── react-app.md
│       └── cli-tool.md
├── analyze-codebase/SKILL.md       # Codebase analysis & audit
├── generate-arch-doc/SKILL.md      # Architecture documentation
├── generate-api-doc/SKILL.md       # API reference documentation
├── generate-changelog/SKILL.md     # Changelog from git history
├── refactor-module/                # Safe incremental refactoring
│   ├── SKILL.md
│   └── references/patterns.md
├── generate-screen/SKILL.md        # Mobile screen generation (all platforms)
├── scaffold-mobile/                # Mobile project scaffolding
│   ├── SKILL.md
│   └── templates/
│       ├── android.md
│       ├── ios.md
│       ├── react-native.md
│       └── flutter.md
├── mobile-test-writer/SKILL.md     # Mobile testing (all platforms)
├── generate-native-bridge/SKILL.md # Native modules & platform channels
├── app-store-prep/SKILL.md         # App Store & Play Store preparation
├── mobile-ci-setup/SKILL.md        # Mobile CI/CD automation
├── generate-migration/SKILL.md     # Database migration generation
├── docker-setup/SKILL.md           # Docker & docker-compose setup
├── deploy-config/SKILL.md          # Cloud deployment configuration
├── setup-monitoring/SKILL.md       # Monitoring, logging & alerting
├── security-audit/SKILL.md         # OWASP security audit
├── performance-audit/SKILL.md      # Performance bottleneck analysis
├── dependency-audit/SKILL.md       # Dependency vulnerability & license audit
├── migrate-code/SKILL.md           # Code migration & conversion
├── aws-lambda/SKILL.md             # AWS Lambda functions & deployment
├── aws-ec2/SKILL.md                # AWS EC2 instances & Auto Scaling
├── aws-ecs/SKILL.md                # AWS ECS/Fargate containers
├── aws-eks/SKILL.md                # AWS EKS Kubernetes
├── aws-vpc/SKILL.md                # AWS VPC networking
├── aws-api-gateway/SKILL.md        # AWS API Gateway
├── aws-cloudfront/SKILL.md         # AWS CloudFront CDN
├── aws-s3/SKILL.md                 # AWS S3 storage
├── aws-dynamodb/SKILL.md           # AWS DynamoDB design
├── aws-rds/SKILL.md                # AWS RDS/Aurora databases
├── aws-elasticache/SKILL.md        # AWS ElastiCache Redis/Memcached
├── aws-kinesis/SKILL.md            # AWS Kinesis streaming
├── aws-secrets/SKILL.md            # AWS Secrets Manager & SSM
├── aws-sqs-sns/SKILL.md            # AWS SQS & SNS messaging
├── aws-eventbridge/SKILL.md        # AWS EventBridge events
├── aws-step-functions/SKILL.md     # AWS Step Functions workflows
├── aws-ses/SKILL.md                # AWS SES email
├── aws-iam/SKILL.md                # AWS IAM policies & roles
├── aws-cognito/SKILL.md            # AWS Cognito authentication
├── aws-waf/SKILL.md                # AWS WAF firewall
├── aws-cloudformation/SKILL.md     # AWS CloudFormation/SAM templates
├── aws-cdk/SKILL.md                # AWS CDK constructs
├── aws-terraform/SKILL.md          # Terraform for AWS
├── aws-cloudwatch/SKILL.md         # AWS CloudWatch monitoring
├── aws-codepipeline/SKILL.md       # AWS CodePipeline CI/CD
├── aws-route53/SKILL.md            # AWS Route 53 DNS
├── aws-amplify/SKILL.md            # AWS Amplify full-stack
└── aws-bedrock/SKILL.md            # AWS Bedrock AI/ML
```

## Contributing

To add a new skill:

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter and instructions
2. Follow the [skill authoring best practices](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/best-practices)
3. Keep SKILL.md under 500 lines — use `references/` for detailed content
4. Write clear descriptions that explain both **what** and **when**
5. Test with a fresh Claude Code session before submitting

## License

MIT
