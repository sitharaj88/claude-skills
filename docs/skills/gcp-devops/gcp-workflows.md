# GCP Workflows

Generate Workflows for orchestrating GCP services and APIs with error handling, parallel execution, and saga patterns on Google Cloud.

## Usage

```bash
/gcp-workflows <description of your workflow orchestration>
```

## What It Does

1. Generates workflow YAML definitions with sequential, parallel, and conditional step execution
2. Configures HTTP calls and GCP service connectors for Cloud Functions, Cloud Run, BigQuery, Firestore, and Pub/Sub
3. Implements error handling with try/except blocks, custom retry predicates, and exponential backoff
4. Creates saga pattern workflows with compensation logic for distributed transactions
5. Sets up callbacks for human-in-the-loop approval workflows
6. Configures triggers via Cloud Scheduler, Eventarc, and Cloud Tasks

## Examples

```bash
/gcp-workflows Create an order processing workflow with payment, inventory, and notification steps

/gcp-workflows Set up a parallel data aggregation workflow that fetches from multiple services

/gcp-workflows Build a saga pattern workflow with compensation logic for a distributed transaction
```

## What It Covers

- **Workflow definition** - Main workflow with params, steps, assignments, and return values
- **Step types** - HTTP calls, GCP service connectors, assignments, and logging
- **Control flow** - Switch conditions, for loops, parallel branches, and parallel for loops
- **Error handling** - Try/except blocks with retry policies and exponential backoff
- **Saga pattern** - Distributed transactions with nested compensation logic
- **Subworkflows** - Reusable workflow functions for modular orchestration
- **Expressions** - String, JSON, math, time, and base64 built-in functions
- **Callbacks** - Human-in-the-loop approval workflows with callback endpoints
- **Long-running operations** - Polling patterns for BigQuery jobs and async operations
- **Triggers** - Cloud Scheduler cron triggers, Eventarc event triggers, and Cloud Tasks
- **Logging and monitoring** - Structured JSON logging and alerting on workflow failures

<div class="badge-row">
  <span class="badge">Orchestration</span>
  <span class="badge">Serverless</span>
  <span class="badge">GCP</span>
</div>

## Allowed Tools

- `Read` - Read existing workflow definitions and service configurations
- `Write` - Create workflow YAML files and trigger configurations
- `Edit` - Modify existing workflow definitions
- `Bash` - Run gcloud workflows commands for deployment and execution
- `Glob` - Search for workflow YAML files and related configurations
- `Grep` - Find service connector references and workflow step patterns
