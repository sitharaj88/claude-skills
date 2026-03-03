# DigitalOcean Functions

Generate serverless functions with triggers, packages, and scheduled invocations. Use when you need to create and deploy DigitalOcean Functions for serverless workloads.

## Usage

```bash
/do-functions [runtime]
```

## What It Does

1. Generates project structures with `project.yml` configuration and organized package/function layout
2. Creates function handlers in Node.js, Python, Go, and PHP with proper HTTP response patterns
3. Configures web functions (JSON API), raw functions (webhooks), and background functions (jobs)
4. Sets up scheduled triggers with cron expressions for daily, hourly, and custom intervals
5. Manages per-function dependencies via package.json, requirements.txt, or go.mod
6. Connects managed databases and other resources for environment variable injection
7. Produces Terraform configurations for deploying functions via App Platform
8. Configures timeout, memory, and concurrency limits for cost-efficient execution

## Example Output

```yaml
# project.yml
packages:
  - name: api
    environment:
      DATABASE_URL: "${DB_URL}"
    functions:
      - name: login
        runtime: nodejs:20
        web: true
        main: index.handler
        timeout: 10000
        memory: 256

      - name: profile
        runtime: python:3.11
        web: true
        main: __main__.main
        timeout: 10000
        memory: 128

  - name: jobs
    functions:
      - name: cleanup
        runtime: nodejs:20
        web: false
        main: index.handler
        timeout: 300000
        memory: 512
        triggers:
          - name: daily-cleanup
            type: scheduler
            cron: "0 3 * * *"

  - name: webhooks
    functions:
      - name: stripe
        runtime: nodejs:20
        web: raw
        main: index.handler
        timeout: 30000
        memory: 256
```

## Installation

```bash
cp -r skills/do-functions ~/.claude/skills/
```

<div class="badge-row">
  <span class="badge">DigitalOcean</span>
  <span class="badge">Serverless</span>
  <span class="badge">Event-Driven</span>
</div>

## Allowed Tools

- `Read` - Read existing function code and project configuration files
- `Write` - Create function handlers, project.yml specs, and deployment configs
- `Edit` - Modify existing function settings, triggers, and environment variables
- `Bash` - Run doctl, Terraform, npm, pip, and curl commands for function management
- `Glob` - Search for function source files and package configurations
- `Grep` - Find function references, trigger definitions, and dependency usage
