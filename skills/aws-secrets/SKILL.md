---
name: aws-secrets
description: Generate AWS Secrets Manager and SSM Parameter Store configurations for secrets management, rotation, and secure access. Use when the user wants to manage secrets, API keys, or configuration securely.
argument-hint: "[secrets-manager|ssm] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS secrets management expert. Generate secure configurations for storing and accessing secrets.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Service**: Secrets Manager or SSM Parameter Store
- **Secret type**: database credentials, API keys, OAuth tokens, certificates
- **Rotation**: automatic rotation needed?
- **Access pattern**: Lambda, ECS, EC2, EKS, cross-account

### Step 2: Choose the right service

| Feature | Secrets Manager | SSM Parameter Store |
|---------|----------------|-------------------|
| Cost | $0.40/secret/month | Free (standard), $0.05/advanced |
| Rotation | Built-in auto-rotation | Manual (Lambda needed) |
| Size limit | 64KB | 4KB (standard), 8KB (advanced) |
| Cross-region | Replication built-in | Manual |
| Best for | Credentials, API keys | Config values, feature flags |

### Step 3: Generate Secrets Manager configuration

Create secret resources with:
- Secret name with path hierarchy: `/app/env/secret-name`
- Secret value structure (JSON for multi-field secrets)
- KMS encryption key (AWS managed or customer managed)
- Resource policy for cross-account access
- Replica regions for multi-region apps
- Tags for access control and cost tracking

**Rotation configuration:**
- Rotation Lambda function (single-user or multi-user strategy)
- Rotation schedule (30, 60, 90 days)
- RDS integration (automatic Lambda creation)
- Custom rotation for non-RDS secrets

### Step 4: Generate SSM Parameter Store configuration

Create parameters with:
- Name hierarchy: `/app/env/param-name`
- Type: String, StringList, or SecureString (KMS encrypted)
- Tier: Standard (free, 4KB) or Advanced (8KB, policies)
- Data type: text, aws:ec2:image, aws:ssm:integration
- Parameter policies (expiration, notification)

### Step 5: Generate access code

Create secure access patterns:

**Application code (SDK):**
- Fetch secrets at startup, cache in memory
- Refresh on rotation schedule
- Error handling for access denied
- Never log secret values

**Lambda:**
- Use Lambda Extensions for caching
- AWS Parameters and Secrets Lambda Extension

**ECS:**
- Task definition secrets from Secrets Manager/SSM
- Environment variable injection

**EKS:**
- External Secrets Operator or Secrets Store CSI Driver
- Sync to Kubernetes Secrets

**EC2:**
- Instance profile with IAM access
- Fetch at boot via user data

### Step 6: IAM and access control

- Least-privilege IAM policies per service/application
- Resource-based policies for cross-account
- Tag-based access control (ABAC)
- VPC endpoint for private access
- CloudTrail logging for audit

### Best practices:
- Use Secrets Manager for credentials that need rotation
- Use SSM Parameter Store for non-sensitive config and feature flags
- Never store secrets in code, env files, or version control
- Use path hierarchy for organization: /team/app/env/name
- Enable automatic rotation for database credentials
- Use KMS customer managed keys for compliance requirements
- Cache secrets in application memory (reduce API calls and cost)
- Set up CloudTrail alerts for unauthorized access attempts
