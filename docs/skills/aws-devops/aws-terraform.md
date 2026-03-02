# AWS Terraform

Generate Terraform modules for AWS infrastructure with state management, workspaces, and reusable module patterns.

## Usage

```bash
/aws-terraform <description of your infrastructure>
```

## What It Does

1. Generates Terraform configurations with providers, resources, and data sources
2. Creates reusable modules with input variables, outputs, and validation
3. Configures remote state backends (S3 + DynamoDB) with state locking
4. Sets up workspaces or directory-based environments for multi-env deployments
5. Produces variable definitions, tfvars files, and output configurations
6. Adds lifecycle rules, depends_on, and provisioner configurations

## Examples

```bash
/aws-terraform Create a module for an ECS Fargate service with ALB and auto-scaling

/aws-terraform Set up Terraform remote state with S3 backend and DynamoDB locking

/aws-terraform Build a multi-environment infrastructure with workspaces for dev, staging, prod
```

## Allowed Tools

- `Read` - Read existing Terraform configurations and modules
- `Write` - Create Terraform files, modules, and variable definitions
- `Edit` - Modify existing Terraform configurations
- `Bash` - Run terraform init, plan, validate, and fmt commands
- `Glob` - Search for .tf and .tfvars files
- `Grep` - Find resource references and module sources
