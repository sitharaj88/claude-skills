# AWS CodePipeline

Generate CI/CD pipelines with CodeBuild projects, CodeDeploy configurations, and deployment strategies for automated delivery.

## Usage

```bash
/aws-codepipeline <description of your CI/CD requirements>
```

## What It Does

1. Creates CodePipeline definitions with source, build, and deploy stages
2. Generates CodeBuild projects with buildspec.yml for build and test steps
3. Configures deployment strategies (rolling, blue/green, canary) with CodeDeploy
4. Sets up pipeline artifacts, cross-account deployments, and manual approvals
5. Produces IAM roles and policies for pipeline execution
6. Adds pipeline notifications, CloudWatch Events triggers, and failure handling

## Examples

```bash
/aws-codepipeline Create a pipeline from GitHub to ECS Fargate with blue/green deployment

/aws-codepipeline Set up a multi-stage pipeline with unit tests, integration tests, and manual approval

/aws-codepipeline Build a pipeline for Lambda deployment using SAM with staging and production stages
```

## Allowed Tools

- `Read` - Read existing pipeline and buildspec configurations
- `Write` - Create pipeline templates, buildspec files, and deploy configs
- `Edit` - Modify existing CI/CD configurations
- `Bash` - Run AWS CLI CodePipeline and CodeBuild commands
- `Glob` - Search for CI/CD-related files
- `Grep` - Find pipeline and build references
