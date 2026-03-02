---
name: aws-iam
description: Generate AWS IAM policies, roles, users, and permission boundaries with least-privilege access. Use when the user wants to configure IAM permissions, roles, or security policies.
argument-hint: "[role|policy|user] [service] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS IAM security expert. Generate least-privilege IAM configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Resource type**: role, policy, user, group, permission boundary
- **Principal**: Lambda, ECS, EC2, EKS pod, human user, cross-account
- **Permissions needed**: which AWS services and actions
- **Scope**: specific resources or broader access

### Step 2: Design least-privilege policy

Follow least privilege principles:

1. **Start with zero permissions** and add only what's needed
2. **Use specific actions** — never use `*` for actions unless truly needed
3. **Scope to specific resources** — use ARNs, not `*` for Resource
4. **Add conditions** for extra security:
   - `aws:SourceAccount` — restrict cross-service confused deputy
   - `aws:SourceVpc` / `aws:SourceVpce` — VPC-only access
   - `aws:PrincipalOrgID` — organization-only access
   - `aws:RequestedRegion` — region restrictions
   - `aws:ResourceTag` — tag-based access control
   - `aws:MultiFactorAuthPresent` — require MFA

### Step 3: Generate IAM role

Create role with:
- Trust policy (AssumeRolePolicyDocument):
  - Service principal (lambda.amazonaws.com, ecs-tasks.amazonaws.com)
  - Cross-account principal with external ID
  - OIDC provider (EKS IRSA, GitHub Actions)
  - SAML provider (SSO)
- Permission policies (inline or managed)
- Permission boundary (max permissions ceiling)
- Session duration
- Tags

### Step 4: Generate IAM policy document

Structure the policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DescriptiveStatementId",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-bucket/prefix/*",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalOrgID": "o-xxxxxxxxxx"
        }
      }
    }
  ]
}
```

### Step 5: Common role patterns

**Lambda execution role:**
- CloudWatch Logs (CreateLogGroup, CreateLogStream, PutLogEvents)
- Service-specific permissions (DynamoDB, S3, SQS, etc.)
- X-Ray (PutTraceSegments, PutTelemetryRecords)
- VPC permissions if VPC-attached

**ECS task role:**
- Application-level AWS API access
- Secrets Manager / SSM Parameter Store read
- S3, DynamoDB, SQS access as needed

**ECS execution role:**
- ECR image pull
- CloudWatch Logs
- Secrets Manager (for container secrets)

**CI/CD role (GitHub Actions):**
- OIDC trust policy for GitHub
- Deploy permissions (ECR push, ECS update, S3 sync, CloudFront invalidate)

**Cross-account role:**
- Trust policy with source account
- External ID condition for security
- Specific resource access

### Step 6: Validate and audit

- Use IAM Access Analyzer to check for public/cross-account access
- Use IAM Policy Simulator to test policies
- Review with Access Advisor for unused permissions
- Generate SCPs for organizational guardrails

### Best practices:
- Never use root account for daily operations
- Use IAM Identity Center (SSO) for human access
- Use roles (not users/access keys) for services
- Apply permission boundaries to limit maximum permissions
- Use conditions to restrict access context
- Tag roles for organization and cost tracking
- Rotate credentials and use temporary credentials when possible
- Regularly audit with Access Analyzer and Access Advisor
- Use aws:SourceAccount/Arn conditions to prevent confused deputy
