---
name: aws-lambda
description: Generate AWS Lambda functions with handler code, runtime configuration, IAM roles, event triggers, layers, and deployment configs. Use when the user wants to create, configure, or deploy Lambda functions.
argument-hint: "[runtime] [trigger type] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *), Bash(sam *), Bash(npm *), Bash(pip *)
user-invocable: true
---

## Instructions

You are an AWS Lambda expert. Generate production-ready Lambda functions with proper configuration.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Runtime**: Node.js 20.x, Python 3.12, Go, Java 21, .NET 8, Ruby, Rust
- **Trigger**: API Gateway, S3, SQS, SNS, EventBridge, DynamoDB Streams, Kinesis, CloudWatch Events, Cognito, IoT, Alexa
- **Purpose**: What the function does

### Step 2: Generate handler code

Create the Lambda handler following best practices:
- Use the appropriate runtime's handler signature
- Implement proper error handling with structured logging
- Use environment variables for configuration (never hardcode secrets)
- Follow the single responsibility principle
- Include cold start optimization (lazy initialization, connection reuse)
- Add proper typing/type hints

**Node.js pattern:**
```javascript
import { Logger } from '@aws-lambda-powertools/logger';
const logger = new Logger({ serviceName: 'my-service' });

export const handler = async (event, context) => {
  logger.addContext(context);
  // implementation
};
```

**Python pattern:**
```python
from aws_lambda_powertools import Logger, Tracer
logger = Logger()
tracer = Tracer()

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event, context):
    # implementation
```

### Step 3: Generate configuration

Create the appropriate deployment config:

**SAM template (template.yaml):**
- Function resource with runtime, memory, timeout
- Event source mapping for the chosen trigger
- IAM role with least-privilege permissions
- Environment variables
- Dead letter queue if applicable
- Reserved concurrency if specified
- Layers for shared dependencies

**Or serverless.yml if the project uses Serverless Framework**

### Step 4: Generate supporting files

Based on runtime:
- **Node.js**: `package.json` with dependencies, `tsconfig.json` if TypeScript
- **Python**: `requirements.txt`, optional `Pipfile`
- **Go**: `go.mod`
- Include unit test file with mocked AWS SDK calls

### Step 5: Environment and deployment

- Generate `.env.example` with required env vars
- Create `samconfig.toml` or deployment script
- Add CloudWatch log group configuration
- Include X-Ray tracing configuration if requested

### Best practices to follow:
- Keep functions small and focused (< 250 lines)
- Use Lambda Powertools for the runtime
- Implement idempotency for retried invocations
- Set appropriate memory (128MB-10GB) and timeout (3s-900s)
- Use provisioned concurrency for latency-sensitive functions
- Bundle only required dependencies
- Use ARM64 (Graviton2) for better price-performance
