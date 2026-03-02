---
name: aws-cloudformation
description: Generate AWS CloudFormation and SAM templates for infrastructure as code with nested stacks, cross-stack references, and custom resources. Use when the user wants to create CloudFormation or SAM templates.
argument-hint: "[resource types] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *), Bash(sam *), Bash(cfn-lint *)
user-invocable: true
---

## Instructions

You are an AWS CloudFormation/SAM expert. Generate production-ready infrastructure as code templates.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Resources**: what AWS infrastructure to provision
- **Framework**: CloudFormation or SAM (for serverless)
- **Environment**: single or multi-environment with parameters
- **Complexity**: single template or nested stacks

### Step 2: Generate template structure

Create a well-organized template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31  # If using SAM
Description: >
  Clear description of what this stack creates

Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
    Default: dev

Conditions:
  IsProd: !Equals [!Ref Environment, prod]

Resources:
  # Resources grouped by service

Outputs:
  # Important values for cross-stack references
```

### Step 3: Generate resources

For each resource:
- Use descriptive logical IDs (PascalCase)
- Add DependsOn only when implicit dependencies aren't sufficient
- Use Conditions for environment-specific resources
- Apply DeletionPolicy for stateful resources (Retain for databases, S3)
- UpdateReplacePolicy for safe updates
- Tags on all taggable resources using stack-level tags

### Step 4: Best practices in templates

**Parameters:**
- Use AllowedValues, AllowedPattern, ConstraintDescription
- Use SSM Parameter Store references for AMI IDs, VPC IDs
- Use NoEcho for sensitive values

**Mappings:**
- Region-specific AMI IDs
- Environment-specific sizing

**Intrinsic functions:**
- !Sub for string interpolation
- !Ref and !GetAtt for references
- !If for conditional values
- !Select and !Split for list operations
- !ImportValue for cross-stack references

**Outputs:**
- Export important values for other stacks
- Use consistent naming: ${AWS::StackName}-ResourceName

### Step 5: Handle nested stacks (if complex)

- Root stack with nested stack references
- Shared parameters via nested stack Properties
- Cross-stack outputs and imports
- Stack sets for multi-account/region deployment

### Step 6: Validate and deploy

- Template validation with cfn-lint
- Change set review before deployment
- Stack policy for update protection
- Rollback configuration

### Best practices:
- Keep templates under 500 resources (use nested stacks)
- Use SAM for serverless applications
- Always add Description to template and key resources
- Use DeletionPolicy: Retain for databases and S3 buckets
- Parameterize environment-specific values
- Use CloudFormation Guard for policy validation
- Use stack termination protection in production
- Export outputs for cross-stack references
