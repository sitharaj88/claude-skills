# AWS Lambda

Generate Lambda functions with handlers, IAM roles, triggers, and SAM deployment configurations across multiple runtimes.

## Usage

```bash
/aws-lambda <description of your Lambda function>
```

## What It Does

1. Analyzes your requirements and selects the appropriate runtime (Node.js, Python, Go)
2. Generates the function handler code with proper error handling and logging
3. Creates an IAM execution role with least-privilege permissions
4. Configures event source triggers (API Gateway, S3, SQS, EventBridge, etc.)
5. Produces a SAM or CloudFormation template for deployment
6. Adds environment variable configuration and secrets references

## Examples

```bash
/aws-lambda Create a Node.js function triggered by S3 uploads that generates thumbnails

/aws-lambda Build a Python API handler with DynamoDB access and JWT authorization

/aws-lambda Create a Go function that processes SQS messages in batches
```

## Allowed Tools

- `Read` - Read existing project files for context
- `Write` - Create function handlers, templates, and config files
- `Edit` - Modify existing Lambda configurations
- `Bash` - Run SAM CLI commands for local testing and deployment
- `Glob` - Search for related project files
- `Grep` - Find references and dependencies
