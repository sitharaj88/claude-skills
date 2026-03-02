# AWS CDK

Generate CDK constructs and stacks in TypeScript or Python for defining AWS infrastructure as code with high-level abstractions.

## Usage

```bash
/aws-cdk <description of your infrastructure>
```

## What It Does

1. Generates CDK stacks with properly typed constructs in TypeScript or Python
2. Creates L2 and L3 constructs for common infrastructure patterns
3. Configures stack dependencies, cross-stack references, and environment settings
4. Sets up CDK Pipelines for self-mutating CI/CD deployment
5. Produces unit tests for infrastructure code using assertions
6. Adds context values, feature flags, and cdk.json configuration

## Examples

```bash
/aws-cdk Create a TypeScript CDK stack for a serverless API with Lambda and DynamoDB

/aws-cdk Build a Python CDK construct for a VPC with standard 3-tier networking

/aws-cdk Set up a CDK Pipeline that deploys to staging and production accounts
```

## Allowed Tools

- `Read` - Read existing CDK stacks and construct code
- `Write` - Create CDK stacks, constructs, and test files
- `Edit` - Modify existing CDK code
- `Bash` - Run cdk synth, diff, deploy, and test commands
- `Glob` - Search for CDK-related source files
- `Grep` - Find construct references and imports
