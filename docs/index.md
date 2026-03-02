---
layout: home

hero:
  name: Claude Skills
  text: Supercharge Your Development Workflow
  tagline: 56 production-ready slash commands for Claude Code — from smart commits and mobile development to full AWS infrastructure.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Browse All Skills
      link: /guide/what-are-skills
    - theme: alt
      text: View on GitHub
      link: https://github.com/sitharaj88/claude-skills

features:
  - icon: ⚡
    title: Developer Workflow
    details: Smart commits, PR reviews, PR creation, hypothesis-driven debugging, and test generation — all matching your project's conventions.
    link: /skills/workflow/
    linkText: 5 skills →

  - icon: 🏗️
    title: Code Generation
    details: Generate UI components, API endpoints, scaffold entire projects, or implement features end-to-end from specs or GitHub issues.
    link: /skills/generation/
    linkText: 4 skills →

  - icon: 📊
    title: Analysis & Documentation
    details: Deep codebase audits, architecture docs with Mermaid diagrams, API reference generation, changelogs, and safe refactoring.
    link: /skills/analysis/
    linkText: 5 skills →

  - icon: 📱
    title: Mobile Development
    details: Full coverage for Android, iOS, React Native, and Flutter — screens, scaffolding, testing, native bridges, app store prep, and CI/CD.
    link: /skills/mobile/
    linkText: 6 skills →

  - icon: 🐳
    title: Database & DevOps
    details: Database migrations, Docker setup, cloud deployment configs, and full observability with monitoring, logging, and alerting.
    link: /skills/devops/
    linkText: 4 skills →

  - icon: 🛡️
    title: Security & Performance
    details: OWASP security audits, performance bottleneck analysis, dependency vulnerability scanning, and code migration between frameworks.
    link: /skills/security/
    linkText: 4 skills →

  - icon: ☁️
    title: AWS Compute & Networking
    details: Lambda, EC2, ECS/Fargate, EKS, VPC, API Gateway, and CloudFront — production-ready infrastructure with IaC output.
    link: /skills/aws-compute/
    linkText: 7 skills →

  - icon: 💾
    title: AWS Data & Storage
    details: S3, DynamoDB, RDS/Aurora, ElastiCache, Kinesis streaming, and Secrets Manager — from table design to caching strategies.
    link: /skills/aws-data/
    linkText: 6 skills →

  - icon: 🔐
    title: AWS Security, Messaging & Auth
    details: IAM least-privilege policies, Cognito auth, WAF rules, SQS/SNS messaging, EventBridge events, Step Functions, and SES email.
    link: /skills/aws-integration/
    linkText: 7 skills →

  - icon: 🚀
    title: AWS IaC, DevOps & AI
    details: CloudFormation, CDK, Terraform, CloudWatch monitoring, CodePipeline CI/CD, Route 53, Amplify, and Bedrock AI/ML.
    link: /skills/aws-devops/
    linkText: 8 skills →
---

<div class="stats-row">
  <div class="stat">
    <div class="number">56</div>
    <div class="label">Skills</div>
  </div>
  <div class="stat">
    <div class="number">11</div>
    <div class="label">Categories</div>
  </div>
  <div class="stat">
    <div class="number">28</div>
    <div class="label">AWS Services</div>
  </div>
  <div class="stat">
    <div class="number">4</div>
    <div class="label">Mobile Platforms</div>
  </div>
</div>

## Quick Start

```bash
# Clone and install all skills
git clone https://github.com/sitharaj88/claude-skills.git
cd claude-skills
./install.sh --all

# Start using in Claude Code
/smart-commit
/review-pr 42
/generate-component UserProfile form
/aws-lambda nodejs sqs "process orders"
/aws-cdk typescript "VPC with ECS service"
/aws-bedrock knowledge-base "product docs RAG"
```

## How It Works

Every skill **auto-detects** your project's framework, conventions, and patterns. No configuration needed.

```
You invoke a skill          Claude analyzes your project       You get tailored output
────────────────── ──→ ──────────────────────────────── ──→ ─────────────────────────
/generate-component         Detects React + Tailwind +         Component with Tailwind
  UserProfile form          existing component patterns        classes, TypeScript props,
                                                               test file, and story

/aws-ecs fargate            Detects existing VPC, ALB,         Task definition, service,
  my-api                    and Docker setup                   Dockerfile, and ALB config
```

Skills follow your project's style — if you use CSS Modules, the skill uses CSS Modules. If you use Vitest, the tests use Vitest. If you use CDK, the AWS skill outputs CDK constructs.

<div class="author-section">
  <h2>Made by Sitharaj</h2>
  <p>If you find Claude Skills useful, consider supporting the project.</p>
  <div class="author-links">
    <a href="https://sitharaj.in" target="_blank" class="author-link">
      <span>Website</span>
    </a>
    <a href="https://github.com/sitharaj88" target="_blank" class="author-link">
      <span>GitHub</span>
    </a>
    <a href="https://linkedin.com/in/sitharaj08" target="_blank" class="author-link">
      <span>LinkedIn</span>
    </a>
    <a href="https://buymeacoffee.com/sitharaj88" target="_blank" class="author-link bmc">
      <span>Buy Me a Coffee</span>
    </a>
  </div>
</div>
