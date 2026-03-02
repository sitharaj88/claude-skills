# AWS Secrets Manager

Generate Secrets Manager and SSM Parameter Store configurations with automatic rotation, secure access patterns, and application integration code.

## Usage

```bash
/aws-secrets <description of your secrets management needs>
```

## What It Does

1. Determines the best service (Secrets Manager or SSM Parameter Store) for your use case
2. Generates secret and parameter definitions with encryption settings
3. Creates rotation Lambda functions for automatic credential rotation
4. Configures IAM policies for least-privilege secret access
5. Produces application code for secure secret retrieval with caching
6. Adds resource policies, tagging, and cross-account access patterns

## Examples

```bash
/aws-secrets Store and rotate RDS database credentials with automatic 30-day rotation

/aws-secrets Create a parameter hierarchy in SSM for multi-environment app configuration

/aws-secrets Generate Node.js code to retrieve secrets with client-side caching
```

## Allowed Tools

- `Read` - Read existing secrets configurations and application code
- `Write` - Create secret definitions, rotation functions, and access code
- `Edit` - Modify existing secrets configurations
- `Bash` - Run AWS CLI commands for secret management
- `Glob` - Search for configuration and secrets-related files
- `Grep` - Find secret ARN and parameter references
