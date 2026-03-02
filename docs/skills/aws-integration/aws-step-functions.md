# AWS Step Functions

Generate state machine definitions with error handling, retries, parallel execution, and direct AWS service integrations.

## Usage

```bash
/aws-step-functions <description of your workflow>
```

## What It Does

1. Designs state machine workflows using Amazon States Language (ASL)
2. Generates Standard or Express workflow definitions based on requirements
3. Configures states (Task, Choice, Parallel, Map, Wait) with transitions
4. Sets up error handling with Catch and Retry policies per state
5. Produces direct SDK integrations (DynamoDB, SQS, Lambda, ECS) without Lambda glue
6. Adds IAM execution roles, logging, tracing, and CloudWatch alarms

## Examples

```bash
/aws-step-functions Create an order fulfillment workflow with payment, inventory, and shipping steps

/aws-step-functions Build a data processing pipeline with parallel ETL jobs and error handling

/aws-step-functions Design a human approval workflow with wait-for-callback token pattern
```

## Allowed Tools

- `Read` - Read existing workflow definitions and handler code
- `Write` - Create state machine definitions, IAM roles, and templates
- `Edit` - Modify existing Step Functions configurations
- `Bash` - Run AWS CLI commands for workflow execution testing
- `Glob` - Search for workflow-related files
- `Grep` - Find state machine ARN and task references
