---
name: aws-step-functions
description: Generate AWS Step Functions state machine definitions with error handling, parallel execution, and service integrations. Use when the user wants to orchestrate workflows or coordinate microservices.
argument-hint: "[workflow type] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS Step Functions expert. Generate production-ready workflow orchestrations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Workflow type**: Standard (long-running, exactly-once) or Express (high-volume, at-least-once)
- **Steps**: what tasks need to be orchestrated
- **Error handling**: retry strategies, fallback paths
- **Duration**: seconds (Express) or up to 1 year (Standard)

### Step 2: Choose workflow type

| Feature | Standard | Express |
|---------|----------|---------|
| Duration | Up to 1 year | Up to 5 minutes |
| Execution | Exactly-once | At-least-once or at-most-once |
| Rate | 2,000 starts/sec | 100,000 starts/sec |
| Price | Per state transition | Per execution + duration |
| Best for | Order processing, ETL | Data transforms, IoT, high-volume |

### Step 3: Generate state machine definition (ASL)

Create Amazon States Language definition:

**Task states:**
- Lambda function invocations
- Direct AWS SDK integrations (.sync for synchronous)
- HTTP task for API calls
- ECS/Fargate task runs
- SQS send, SNS publish, DynamoDB operations

**Flow control:**
- Choice state for conditional branching
- Parallel state for concurrent execution
- Map state for iterating over arrays (inline or distributed)
- Wait state for delays or timestamps

**Error handling:**
- Retry with exponential backoff per state
- Catch with fallback states
- Error types: States.ALL, States.Timeout, States.TaskFailed, Lambda.ServiceException

Example structure:
```json
{
  "StartAt": "ValidateInput",
  "States": {
    "ValidateInput": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...",
      "Retry": [{"ErrorEquals": ["States.ALL"], "MaxAttempts": 3, "BackoffRate": 2}],
      "Catch": [{"ErrorEquals": ["States.ALL"], "Next": "HandleError"}],
      "Next": "ProcessOrder"
    }
  }
}
```

### Step 4: Generate IAM role

Create execution role with:
- Lambda invoke permissions for task functions
- Direct service integration permissions
- CloudWatch Logs for logging
- X-Ray for tracing
- Least-privilege per state machine

### Step 5: Generate supporting infrastructure

- CloudFormation/Terraform for the state machine
- Lambda functions for task states
- CloudWatch alarms (ExecutionsFailed, ExecutionsTimedOut)
- X-Ray tracing enabled
- CloudWatch Logs with log level (ALL, ERROR, FATAL)
- EventBridge rule for execution status changes

### Best practices:
- Use Standard for business workflows, Express for data processing
- Use direct SDK integrations instead of Lambda wrappers when possible
- Always add Retry with backoff on Task states
- Use Catch for graceful error handling
- Use Map state with distributed mode for large datasets
- Use ResultPath and OutputPath to control state input/output
- Enable X-Ray tracing for debugging
- Use JSONPath for data transformation between states
