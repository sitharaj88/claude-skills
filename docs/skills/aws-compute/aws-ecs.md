# AWS ECS / Fargate

Generate ECS task definitions, services, Dockerfiles, and container orchestration configurations for both Fargate and EC2 launch types.

## Usage

```bash
/aws-ecs <description of your containerized service>
```

## What It Does

1. Generates optimized multi-stage Dockerfiles for your application
2. Creates ECS task definitions with container, resource, and logging configs
3. Configures ECS services with load balancing and service discovery
4. Sets up Fargate or EC2 capacity providers with scaling policies
5. Produces IAM task and execution roles with required permissions
6. Adds health checks, environment variables, and secrets integration

## Examples

```bash
/aws-ecs Deploy a Node.js API on Fargate with ALB and auto-scaling to 10 tasks

/aws-ecs Create a multi-container task with nginx sidecar and application container

/aws-ecs Set up a background worker service consuming from SQS with spot Fargate
```

## Allowed Tools

- `Read` - Read existing Dockerfiles and project configs
- `Write` - Create task definitions, Dockerfiles, and service configs
- `Edit` - Modify existing ECS configurations
- `Bash` - Run Docker and ECS CLI commands
- `Glob` - Search for container-related files
- `Grep` - Find service dependencies and references
