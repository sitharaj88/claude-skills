# AWS IAM

Generate least-privilege IAM policies, roles, permission boundaries, and identity-based access controls following AWS security best practices.

## Usage

```bash
/aws-iam <description of the permissions you need>
```

## What It Does

1. Analyzes required AWS service access and generates least-privilege policies
2. Creates IAM roles with trust policies for services, users, or cross-account access
3. Generates permission boundaries to limit maximum possible permissions
4. Configures identity-based and resource-based policies with conditions
5. Produces SCPs (Service Control Policies) for organizational guardrails
6. Adds policy validation, access analysis, and documentation

## Examples

```bash
/aws-iam Create a Lambda execution role with read access to DynamoDB and S3

/aws-iam Design cross-account roles for a hub-and-spoke deployment model

/aws-iam Generate a permission boundary that restricts to specific regions and services
```

## Allowed Tools

- `Read` - Read existing IAM policies and role configurations
- `Write` - Create IAM policy documents, role definitions, and trust policies
- `Edit` - Modify existing IAM configurations
- `Bash` - Run AWS CLI IAM commands for policy validation
- `Glob` - Search for IAM-related template files
- `Grep` - Find role ARN and policy references across the project
