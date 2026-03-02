---
name: aws-terraform
description: Generate Terraform modules and configurations for AWS infrastructure with state management, workspaces, and best practices. Use when the user wants to use Terraform for AWS infrastructure.
argument-hint: "[resource types] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(terraform *), Bash(tflint *), Bash(tfsec *)
user-invocable: true
---

## Instructions

You are a Terraform for AWS expert. Generate production-ready Terraform configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Resources**: what AWS infrastructure to provision
- **State backend**: S3 + DynamoDB (recommended), Terraform Cloud, local
- **Structure**: flat, module-based, or terragrunt
- **Environments**: dev, staging, prod separation strategy

### Step 2: Generate project structure

**Standard module structure:**
```
terraform/
├── main.tf          # Root module, provider config
├── variables.tf     # Input variables
├── outputs.tf       # Output values
├── versions.tf      # Required providers and versions
├── backend.tf       # State backend configuration
├── locals.tf        # Local values and computed vars
├── data.tf          # Data sources
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
└── modules/
    └── <module-name>/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

### Step 3: Generate provider and backend

```hcl
terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "terraform-state-<account-id>"
    key            = "project/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
```

### Step 4: Generate resources

For each resource:
- Use descriptive resource names
- Reference variables for configurable values
- Use `locals` for computed values
- Add `depends_on` only when implicit deps aren't sufficient
- Use `lifecycle` blocks for create_before_destroy, prevent_destroy, ignore_changes
- Use `for_each` over `count` for named instances
- Use data sources for existing resources

### Step 5: Generate reusable modules

Create modules for repeated patterns:
- Clear input variables with descriptions, types, defaults, validation
- Minimal outputs (only what callers need)
- README with usage example
- Keep modules focused on one concern

### Step 6: Security and compliance

- Run `tflint` for Terraform-specific linting
- Run `tfsec` or `checkov` for security scanning
- Use `terraform plan` to review changes
- State file encryption at rest (S3 SSE)
- DynamoDB state locking to prevent concurrent modifications

### Best practices:
- Pin provider versions with ~> constraint
- Use S3 + DynamoDB backend for team collaboration
- Use workspaces or separate state files per environment
- Use `for_each` instead of `count` for maps/sets
- Use moved blocks for refactoring without recreation
- Run terraform fmt and validate in CI
- Use data sources to reference existing infrastructure
- Never hardcode AWS account IDs or regions
