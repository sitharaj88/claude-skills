---
name: azure-devops-pipelines
description: Generate Azure DevOps CI/CD pipelines with stages, environments, approvals, and deployment strategies. Use when the user wants to set up build and release pipelines in Azure DevOps.
argument-hint: "[ci|cd|multi-stage|release] [target] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure DevOps Pipelines expert. Generate production-ready CI/CD pipeline configurations using YAML pipelines.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pipeline type**: CI (build/test), CD (deploy), multi-stage (build + deploy), release
- **Source**: Azure Repos Git, GitHub, Bitbucket
- **Build target**: .NET, Node.js, Python, Java, Docker, Helm
- **Deploy target**: AKS, App Service, Container Apps, Azure Functions, VMs, Static Web Apps
- **Environments**: dev, staging, production (with approval gates)
- **Strategy**: runOnce, rolling, canary

### Step 2: Generate basic CI pipeline

Create `azure-pipelines.yml`:

**Node.js CI pipeline:**
```yaml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    exclude:
      - '**/*.md'
      - docs/

pr:
  branches:
    include:
      - main
  autoCancel: true

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: 'common-variables'
  - name: nodeVersion
    value: '20.x'
  - name: npm_config_cache
    value: $(Pipeline.Workspace)/.npm

stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - job: BuildJob
        displayName: 'Build, Lint, and Test'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'

          - task: Cache@2
            inputs:
              key: 'npm | "$(Agent.OS)" | package-lock.json'
              restoreKeys: |
                npm | "$(Agent.OS)"
              path: $(npm_config_cache)
            displayName: 'Cache npm packages'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run lint
            displayName: 'Run linter'

          - script: npm run test -- --ci --coverage
            displayName: 'Run tests'

          - task: PublishTestResults@2
            condition: succeededOrFailed()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/junit.xml'
              mergeTestResults: true

          - task: PublishCodeCoverageResults@2
            inputs:
              summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'

          - script: npm run build
            displayName: 'Build application'

          - task: PublishPipelineArtifact@1
            inputs:
              targetPath: '$(System.DefaultWorkingDirectory)/dist'
              artifact: 'app-build'
            displayName: 'Publish build artifact'
```

**.NET CI pipeline:**
```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  dotnetVersion: '8.x'

steps:
  - task: UseDotNet@2
    inputs:
      version: $(dotnetVersion)
    displayName: 'Install .NET SDK'

  - task: DotNetCoreCLI@2
    inputs:
      command: 'restore'
      projects: '**/*.csproj'
    displayName: 'Restore NuGet packages'

  - task: DotNetCoreCLI@2
    inputs:
      command: 'build'
      projects: '**/*.csproj'
      arguments: '--configuration $(buildConfiguration) --no-restore'
    displayName: 'Build solution'

  - task: DotNetCoreCLI@2
    inputs:
      command: 'test'
      projects: '**/*Tests.csproj'
      arguments: '--configuration $(buildConfiguration) --no-build --collect:"XPlat Code Coverage"'
    displayName: 'Run tests'

  - task: DotNetCoreCLI@2
    inputs:
      command: 'publish'
      projects: '**/src/*.csproj'
      arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
    displayName: 'Publish application'

  - task: PublishPipelineArtifact@1
    inputs:
      targetPath: '$(Build.ArtifactStagingDirectory)'
      artifact: 'dotnet-app'
```

### Step 3: Generate multi-stage pipeline

Create a multi-stage pipeline with build, test, and deploy stages:

```yaml
trigger:
  branches:
    include:
      - main

resources:
  repositories:
    - repository: templates
      type: git
      name: shared-templates
      ref: refs/heads/main

variables:
  - template: variables/common.yml@templates
  - group: 'key-vault-secrets'

stages:
  - stage: Build
    displayName: 'Build'
    jobs:
      - job: Build
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - template: steps/build-node.yml@templates
            parameters:
              nodeVersion: '20.x'

          - task: Docker@2
            displayName: 'Build and push Docker image'
            inputs:
              containerRegistry: 'acr-service-connection'
              repository: '$(imageRepository)'
              command: 'buildAndPush'
              Dockerfile: '**/Dockerfile'
              tags: |
                $(Build.BuildId)
                latest

  - stage: DeployDev
    displayName: 'Deploy to Dev'
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployDev
        displayName: 'Deploy to Dev Environment'
        environment: 'dev'
        pool:
          vmImage: 'ubuntu-latest'
        strategy:
          runOnce:
            deploy:
              steps:
                - template: steps/deploy-aks.yml@templates
                  parameters:
                    environment: 'dev'
                    imageTag: '$(Build.BuildId)'

  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    dependsOn: DeployDev
    condition: succeeded()
    jobs:
      - deployment: DeployStaging
        displayName: 'Deploy to Staging Environment'
        environment: 'staging'
        pool:
          vmImage: 'ubuntu-latest'
        strategy:
          runOnce:
            deploy:
              steps:
                - template: steps/deploy-aks.yml@templates
                  parameters:
                    environment: 'staging'
                    imageTag: '$(Build.BuildId)'

      - job: IntegrationTests
        dependsOn: DeployStaging
        displayName: 'Run Integration Tests'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - script: npm run test:integration
            displayName: 'Run integration tests'
            env:
              API_URL: $(staging-api-url)

  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - deployment: DeployProd
        displayName: 'Deploy to Production'
        environment: 'production'
        pool:
          vmImage: 'ubuntu-latest'
        strategy:
          canary:
            increments: [10, 50]
            deploy:
              steps:
                - template: steps/deploy-aks.yml@templates
                  parameters:
                    environment: 'prod'
                    imageTag: '$(Build.BuildId)'
            on:
              failure:
                steps:
                  - script: echo "Canary deployment failed, rolling back"
              success:
                steps:
                  - script: echo "Canary deployment succeeded"
```

### Step 4: Generate deployment job strategies

**Rolling deployment:**
```yaml
jobs:
  - deployment: RollingDeploy
    environment:
      name: 'production'
      resourceType: VirtualMachine
    strategy:
      rolling:
        maxParallel: 25%
        preDeploy:
          steps:
            - script: echo "Pre-deploy health check"
        deploy:
          steps:
            - task: IISWebAppDeploymentOnMachineGroup@0
              inputs:
                WebSiteName: 'MyApp'
                Package: '$(Pipeline.Workspace)/drop/**/*.zip'
        routeTraffic:
          steps:
            - script: echo "Route traffic to updated instances"
        postRouteTraffic:
          steps:
            - script: echo "Run smoke tests"
        on:
          failure:
            steps:
              - script: echo "Rollback deployment"
          success:
            steps:
              - script: echo "Deployment successful"
```

**Canary deployment to AKS:**
```yaml
jobs:
  - deployment: CanaryDeploy
    environment: 'production.aks-namespace'
    strategy:
      canary:
        increments: [10, 50, 100]
        deploy:
          steps:
            - task: KubernetesManifest@1
              inputs:
                action: 'deploy'
                strategy: 'canary'
                percentage: $(strategy.increment)
                manifests: 'manifests/*.yml'
                containers: '$(acr).azurecr.io/$(image):$(tag)'
        postRouteTraffic:
          steps:
            - task: Bash@3
              inputs:
                targetType: 'inline'
                script: |
                  # Monitor canary metrics
                  sleep 120
                  # Check error rate
```

### Step 5: Generate template references

**Step template (steps/build-node.yml):**
```yaml
parameters:
  - name: nodeVersion
    type: string
    default: '20.x'
  - name: runLint
    type: boolean
    default: true

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: ${{ parameters.nodeVersion }}
    displayName: 'Install Node.js'

  - script: npm ci
    displayName: 'Install dependencies'

  - ${{ if parameters.runLint }}:
    - script: npm run lint
      displayName: 'Run linter'

  - script: npm run build
    displayName: 'Build application'
```

**Job template (jobs/deploy-job.yml):**
```yaml
parameters:
  - name: environment
    type: string
  - name: serviceConnection
    type: string
  - name: resourceGroup
    type: string

jobs:
  - deployment: Deploy_${{ parameters.environment }}
    environment: ${{ parameters.environment }}
    pool:
      vmImage: 'ubuntu-latest'
    strategy:
      runOnce:
        deploy:
          steps:
            - task: AzureWebApp@1
              inputs:
                azureSubscription: ${{ parameters.serviceConnection }}
                appType: 'webAppLinux'
                appName: 'myapp-${{ parameters.environment }}'
                package: '$(Pipeline.Workspace)/drop/**/*.zip'
```

**Stage template (stages/deploy-stage.yml):**
```yaml
parameters:
  - name: environments
    type: object
    default: []

stages:
  - ${{ each env in parameters.environments }}:
    - stage: Deploy_${{ env.name }}
      displayName: 'Deploy to ${{ env.name }}'
      jobs:
        - template: ../jobs/deploy-job.yml
          parameters:
            environment: ${{ env.name }}
            serviceConnection: ${{ env.serviceConnection }}
            resourceGroup: ${{ env.resourceGroup }}
```

### Step 6: Generate pipeline triggers

**Scheduled trigger:**
```yaml
schedules:
  - cron: '0 2 * * Mon-Fri'
    displayName: 'Nightly build (weekdays at 2 AM)'
    branches:
      include:
        - main
    always: false  # Only if code changed
```

**Pipeline trigger (cross-pipeline):**
```yaml
resources:
  pipelines:
    - pipeline: upstream-build
      source: 'my-upstream-pipeline'
      trigger:
        branches:
          include:
            - main
        stages:
          - Build
```

**PR trigger with path filters:**
```yaml
pr:
  branches:
    include:
      - main
      - releases/*
  paths:
    include:
      - src/**
    exclude:
      - src/**/*.md
  drafts: false
```

### Step 7: Generate variable groups and Key Vault integration

**Variable group with Key Vault:**
```yaml
variables:
  - group: 'my-variable-group'
  - group: 'keyvault-secrets'
  - name: buildConfiguration
    value: 'Release'
  - ${{ if eq(variables['Build.SourceBranchName'], 'main') }}:
    - name: environment
      value: 'production'
  - ${{ else }}:
    - name: environment
      value: 'development'
```

**Azure CLI to create variable group linked to Key Vault:**
```bash
az pipelines variable-group create \
  --name 'keyvault-secrets' \
  --authorize true \
  --variables "placeholder=value" \
  --organization "https://dev.azure.com/myorg" \
  --project "my-project"

# Link to Key Vault (via UI or REST API)
```

### Step 8: Generate matrix strategy for multi-platform builds

```yaml
jobs:
  - job: Build
    strategy:
      matrix:
        linux_node18:
          imageName: 'ubuntu-latest'
          nodeVersion: '18.x'
        linux_node20:
          imageName: 'ubuntu-latest'
          nodeVersion: '20.x'
        windows_node20:
          imageName: 'windows-latest'
          nodeVersion: '20.x'
        mac_node20:
          imageName: 'macOS-latest'
          nodeVersion: '20.x'
      maxParallel: 4
    pool:
      vmImage: $(imageName)
    steps:
      - task: NodeTool@0
        inputs:
          versionSpec: $(nodeVersion)
      - script: npm ci
      - script: npm test
```

### Step 9: Generate container jobs

```yaml
resources:
  containers:
    - container: pg
      image: postgres:16
      ports:
        - 5432:5432
      env:
        POSTGRES_PASSWORD: testpassword

jobs:
  - job: IntegrationTest
    pool:
      vmImage: 'ubuntu-latest'
    container: node:20
    services:
      postgres: pg
    steps:
      - script: npm ci
      - script: npm run test:integration
        env:
          DATABASE_URL: 'postgresql://postgres:testpassword@postgres:5432/testdb'
```

### Step 10: Generate deployment to Azure services

**Deploy to Azure App Service:**
```yaml
- task: AzureWebApp@1
  inputs:
    azureSubscription: 'my-service-connection'
    appType: 'webAppLinux'
    appName: 'my-app-name'
    package: '$(Pipeline.Workspace)/drop/**/*.zip'
    deploymentMethod: 'zipDeploy'
    startUpCommand: 'npm start'
```

**Deploy to AKS:**
```yaml
- task: KubernetesManifest@1
  inputs:
    action: 'deploy'
    connectionType: 'azureResourceManager'
    azureSubscriptionConnection: 'my-service-connection'
    azureResourceGroup: 'my-rg'
    kubernetesCluster: 'my-aks'
    namespace: 'production'
    manifests: |
      manifests/deployment.yml
      manifests/service.yml
    containers: '$(acr).azurecr.io/$(image):$(tag)'
    imagePullSecrets: 'acr-secret'
```

**Deploy to Azure Functions:**
```yaml
- task: AzureFunctionApp@2
  inputs:
    azureSubscription: 'my-service-connection'
    appType: 'functionAppLinux'
    appName: 'my-function-app'
    package: '$(Pipeline.Workspace)/drop/**/*.zip'
    runtimeStack: 'NODE|20'
    deploymentMethod: 'zipDeploy'
```

**Deploy to Container Apps:**
```yaml
- task: AzureContainerApps@1
  inputs:
    azureSubscription: 'my-service-connection'
    containerAppName: 'my-container-app'
    resourceGroup: 'my-rg'
    imageToDeploy: '$(acr).azurecr.io/$(image):$(tag)'
```

### Step 11: Generate Bicep integration in pipeline

```yaml
- stage: Infrastructure
  displayName: 'Deploy Infrastructure'
  jobs:
    - job: DeployBicep
      pool:
        vmImage: 'ubuntu-latest'
      steps:
        - task: AzureCLI@2
          displayName: 'Deploy Bicep template'
          inputs:
            azureSubscription: 'my-service-connection'
            scriptType: 'bash'
            scriptLocation: 'inlineScript'
            inlineScript: |
              az deployment group create \
                --resource-group $(resourceGroup) \
                --template-file infra/main.bicep \
                --parameters infra/parameters/$(environment).bicepparam \
                --name "deploy-$(Build.BuildId)"
```

### Best practices:
- Use YAML pipelines over classic release pipelines (version controlled, reviewable)
- Use template references for reusable pipeline logic across projects
- Pin task versions (e.g., `NodeTool@0`, not `NodeTool`) and update deliberately
- Use pipeline caching for dependency restoration (npm, NuGet, pip)
- Create environments with approval gates for production deployments
- Use variable groups linked to Key Vault for secrets management
- Use service connections with workload identity federation (not secrets)
- Publish test results and code coverage for visibility
- Use conditional insertion (`${{ if }}`) for environment-specific logic
- Set up branch policies requiring successful builds before merge
- Use pipeline artifacts (not build artifacts) for modern pipelines
- Enable pipeline resource triggers for cross-pipeline orchestration

### Anti-patterns to avoid:
- Do NOT use classic release pipelines for new projects (use YAML multi-stage)
- Do NOT store secrets in pipeline variables (use Key Vault variable groups)
- Do NOT use `latest` as default image tag in deployments (use build ID or commit SHA)
- Do NOT skip approval gates for production environments
- Do NOT use `always: true` on scheduled triggers without good reason (wastes build minutes)
- Do NOT create overly complex single-pipeline files (split into templates)
- Do NOT use `script` tasks for complex Azure operations (use dedicated Azure tasks)
- Do NOT hard-code environment-specific values in pipeline YAML

### Security considerations:
- Use workload identity federation for service connections (no secrets to rotate)
- Restrict pipeline permissions to minimum required scope
- Enable branch protection with required reviewers
- Use environment approvals and checks (business hours, required template)
- Configure pipeline permissions (who can edit, who can run)
- Use decorators/required templates for compliance enforcement
- Scan container images for vulnerabilities in the pipeline
- Run SAST/DAST tools (SonarQube, OWASP ZAP) as pipeline stages
- Audit pipeline runs and approvals
- Use agent pools with network restrictions for sensitive deployments

### Cost optimization tips:
- Use Microsoft-hosted agents for most workloads (no infrastructure to manage)
- Use self-hosted agents for heavy builds or when you need specific software/hardware
- Cache dependencies aggressively to reduce build times
- Use `condition: succeeded()` and `dependsOn` to skip unnecessary stages
- Run expensive tests only on main branch (not on every PR)
- Use shallow fetch (`fetchDepth: 1`) for faster checkout
- Configure appropriate timeouts to prevent runaway builds
- Use parallel jobs wisely (each consumes a parallel slot)
- Consider Azure DevOps free tier limits (1800 minutes/month for public, 1 free parallel job)
- Use pipeline triggers with path filters to avoid unnecessary builds
