---
name: aws-codepipeline
description: Generate AWS CodePipeline CI/CD configurations with CodeBuild, CodeDeploy, and deployment strategies. Use when the user wants to set up CI/CD pipelines on AWS.
argument-hint: "[source] [target] [strategy]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS CI/CD expert. Generate production-ready deployment pipeline configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Source**: CodeCommit, GitHub, Bitbucket, S3
- **Build**: CodeBuild project configuration
- **Deploy target**: ECS, Lambda, EC2, S3, EKS, CloudFormation
- **Strategy**: rolling, blue/green, canary, all-at-once

### Step 2: Generate CodeBuild project

Create `buildspec.yml`:
```yaml
version: 0.2
env:
  variables:
    ENV: production
  secrets-manager:
    DB_PASSWORD: prod/database:password
phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - npm ci
  pre_build:
    commands:
      - npm run lint
      - npm run test
  build:
    commands:
      - npm run build
      - docker build -t $ECR_REPO:$CODEBUILD_RESOLVED_SOURCE_VERSION .
  post_build:
    commands:
      - docker push $ECR_REPO:$CODEBUILD_RESOLVED_SOURCE_VERSION
artifacts:
  files:
    - '**/*'
  base-directory: dist
cache:
  paths:
    - node_modules/**/*
```

CodeBuild project configuration:
- Build environment (standard image, custom image)
- Compute type (small, medium, large, 2xlarge)
- Privileged mode (for Docker builds)
- VPC configuration (if accessing private resources)
- IAM role with minimum permissions
- Build timeout and queued timeout
- CloudWatch Logs group
- S3 cache or local cache

### Step 3: Generate CodePipeline

Create pipeline with stages:

**Source stage:**
- GitHub (via CodeStar Connection)
- Trigger: push to main, PR merged
- Branch filtering

**Build stage:**
- CodeBuild project
- Parallel builds (unit tests + integration tests)
- Test reports

**Approval stage (optional):**
- Manual approval with SNS notification
- Before production deployment

**Deploy stage:**
- ECS: `imagedefinitions.json` rolling or CodeDeploy blue/green
- Lambda: CodeDeploy with traffic shifting
- S3: sync static files + CloudFront invalidation
- CloudFormation: create/update stack with change set

### Step 4: Generate deployment configuration

**ECS Blue/Green (CodeDeploy):**
- `appspec.yaml` with task definition and container port
- Target groups and listener rules
- Deployment configuration (Linear10PercentEvery1Minute, Canary10Percent5Minutes)
- Auto-rollback on CloudWatch alarms
- Lifecycle hooks (BeforeAllowTraffic, AfterAllowTraffic)

**Lambda Canary/Linear:**
- Traffic shifting aliases
- Pre/post traffic hook functions
- Auto-rollback on errors

**EC2 Rolling/Blue-Green:**
- `appspec.yml` with hooks
- Deployment group configuration
- Auto-rollback settings

### Step 5: Generate notifications and monitoring

- Pipeline state change notifications via EventBridge -> SNS
- Build failure alerts
- Deployment success/failure alerts
- Slack integration via Chatbot
- Dashboard for pipeline metrics

### Best practices:
- Use GitHub connection (not OAuth tokens) for source
- Cache build dependencies (node_modules, .m2)
- Run tests in parallel stages when possible
- Use blue/green for zero-downtime deployments
- Add manual approval gate before production
- Auto-rollback on CloudWatch alarms
- Store secrets in Secrets Manager (not pipeline env vars)
- Use cross-account deployment roles for multi-account setups
