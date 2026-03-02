# AWS CloudFormation

Generate CloudFormation and SAM templates with nested stacks, cross-stack references, custom resources, and deployment configurations.

## Usage

```bash
/aws-cloudformation <description of your infrastructure>
```

## What It Does

1. Generates CloudFormation templates with parameters, mappings, and conditions
2. Creates nested stack architectures for modular infrastructure management
3. Configures cross-stack references using Exports and ImportValue
4. Produces SAM templates for serverless applications with simplified syntax
5. Sets up custom resources with Lambda-backed provisioning logic
6. Adds stack policies, change sets, and drift detection configurations

## Examples

```bash
/aws-cloudformation Create a nested stack for a 3-tier web app with VPC, compute, and database

/aws-cloudformation Build a SAM template for an API with Lambda, DynamoDB, and Cognito

/aws-cloudformation Generate a CloudFormation template with conditions for multi-environment deployment
```

## Allowed Tools

- `Read` - Read existing CloudFormation templates and configs
- `Write` - Create templates, nested stacks, and parameter files
- `Edit` - Modify existing CloudFormation templates
- `Bash` - Run AWS CLI and SAM CLI commands for deployment and validation
- `Glob` - Search for template files across the project
- `Grep` - Find resource references and cross-stack exports
