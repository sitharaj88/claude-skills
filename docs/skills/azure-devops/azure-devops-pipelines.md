# Azure DevOps Pipelines

Generate Azure DevOps pipeline YAML with multi-stage builds, deployment strategies, templates, and environment approvals.

## Usage

```bash
/azure-devops-pipelines <description of your pipeline>
```

## What It Does

1. Generates multi-stage YAML pipelines with build, test, and deploy stages
2. Creates reusable pipeline templates for jobs, steps, and variables
3. Configures deployment strategies including rolling, canary, and blue-green
4. Sets up environment approvals, gates, and deployment checks
5. Integrates service connections for Azure subscriptions, container registries, and Kubernetes clusters
6. Configures pipeline triggers including CI, PR, scheduled, and pipeline resource triggers

## Examples

```bash
/azure-devops-pipelines Create a multi-stage pipeline for building a .NET app, running tests, and deploying to AKS with staging and production environments

/azure-devops-pipelines Set up a pipeline with template references for building Docker images and pushing to Azure Container Registry

/azure-devops-pipelines Build a release pipeline with canary deployment to App Service, approval gates, and automatic rollback
```

## What It Covers

- **Pipeline structure** - Multi-stage YAML with stages, jobs, steps, and conditions
- **Templates** - Reusable job, step, and variable templates with parameters
- **Triggers** - CI triggers, PR triggers, scheduled triggers, and pipeline resources
- **Deployment strategies** - Rolling, canary, blue-green with lifecycle hooks
- **Environments** - Environment definitions with approvals, checks, and resource targets
- **Service connections** - Azure Resource Manager, Docker Registry, and Kubernetes endpoints
- **Variable groups** - Library variable groups, Key Vault integration, and pipeline variables
- **Artifacts** - Build artifact publishing, downloading, and pipeline caching
- **Testing** - Unit test execution, code coverage publishing, and test result reporting
- **Security** - Secure files, secret variables, and pipeline permissions

<div class="badge-row">
  <span class="badge">CI/CD</span>
  <span class="badge">Pipelines</span>
  <span class="badge">Azure DevOps</span>
</div>

## Allowed Tools

- `Read` - Read existing pipeline YAML and template files
- `Write` - Create pipeline definitions, templates, and variable files
- `Edit` - Modify existing pipeline configurations
- `Bash` - Run az devops and az pipelines CLI commands
- `Glob` - Search for YAML pipeline and template files
- `Grep` - Find pipeline references, template usage, and variable groups
