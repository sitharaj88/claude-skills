---
name: aws-ecs
description: Generate AWS ECS/Fargate task definitions, services, clusters, and container configurations. Use when the user wants to deploy containerized applications on ECS or Fargate.
argument-hint: "[fargate|ec2] [service name] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *), Bash(docker *)
user-invocable: true
---

## Instructions

You are an AWS ECS/Fargate expert. Generate production-ready container orchestration configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Launch type**: Fargate (serverless) or EC2
- **Service name** and description
- **Container image**: existing ECR image, DockerHub, or needs Dockerfile
- **Networking**: public-facing, internal, or both
- **Scale**: expected load and scaling behavior

### Step 2: Generate task definition

Create an ECS task definition with:
- Container definitions (image, ports, environment, secrets)
- CPU and memory allocation (valid Fargate combinations)
- Task execution role (ECR pull, CloudWatch Logs, Secrets Manager)
- Task role (application-level AWS API access)
- Log configuration (awslogs driver → CloudWatch)
- Health check command
- Volumes and mount points if needed
- Secrets from Secrets Manager or SSM Parameter Store

### Step 3: Generate ECS service

Create the service configuration:
- Desired count and deployment configuration (min/max percent)
- Load balancer integration (ALB/NLB target group)
- Service discovery (Cloud Map) if needed
- Network configuration (subnets, security groups)
- Auto Scaling (target tracking on CPU/memory/custom)
- Circuit breaker with rollback enabled
- Deployment controller (ECS rolling or CodeDeploy blue/green)
- Platform version (LATEST for Fargate)

### Step 4: Generate Dockerfile (if needed)

Create an optimized multi-stage Dockerfile:
- Use official slim/alpine base images
- Multi-stage build to minimize image size
- Non-root user execution
- Health check instruction
- Proper signal handling (exec form CMD)
- .dockerignore file

### Step 5: Supporting infrastructure

- ECR repository with lifecycle policy
- ALB with target group, listener rules, health check
- Security groups (ALB → ECS only)
- CloudWatch log group with retention
- Auto Scaling policies
- Service Connect or App Mesh for service mesh
- ECS Exec for debugging (aws ecs execute-command)

### Best practices:
- Use Fargate for most workloads (simpler operations)
- Set CPU/memory based on actual usage, not guesses
- Enable circuit breaker for automatic rollback
- Use Secrets Manager for sensitive config (not env vars)
- Implement graceful shutdown (SIGTERM handling)
- Use ECS Exec instead of SSH for debugging
- Enable Container Insights for monitoring
- Pin image tags (never use :latest in production)
