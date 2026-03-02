---
name: aws-cdk
description: Generate AWS CDK constructs and stacks in TypeScript or Python for infrastructure as code. Use when the user wants to define AWS infrastructure using CDK.
argument-hint: "[language] [resources] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(cdk *), Bash(npm *), Bash(npx *), Bash(pip *)
user-invocable: true
---

## Instructions

You are an AWS CDK expert. Generate production-ready infrastructure using CDK constructs.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Language**: TypeScript (recommended) or Python
- **Resources**: what AWS infrastructure to define
- **Construct level**: L1 (Cfn), L2 (curated), L3 (patterns)
- **Project structure**: new project or add to existing

### Step 2: Detect or initialize CDK project

Check for existing CDK project:
- `cdk.json` and `tsconfig.json` (TypeScript)
- `cdk.json` and `setup.py`/`pyproject.toml` (Python)

If new project needed, generate:
- `cdk.json` with context and feature flags
- App entry point (`bin/app.ts` or `app.py`)
- Stack definitions (`lib/`)
- `package.json` / `requirements.txt`

### Step 3: Generate CDK stacks

**TypeScript pattern:**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'MyBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
```

### Step 4: Use appropriate construct levels

**L2 Constructs (recommended):**
- Sensible defaults and convenience methods
- Type-safe properties
- Built-in IAM grant methods: `bucket.grantRead(lambda)`

**L3 Patterns:**
- `aws-ecs-patterns`: ApplicationLoadBalancedFargateService
- `aws-apigateway`: LambdaRestApi
- `aws-route53-patterns`: HttpsRedirect
- Higher-level abstractions

### Step 5: Apply CDK best practices

- Use `Stack` props interface for typed configuration
- Use `cdk.Tags.of(this).add()` for tagging
- Use `cdk.CfnOutput` for important outputs
- Use `cdk.Aspects` for cross-cutting concerns (tagging, compliance)
- Use `cdk.Stage` for multi-environment deployments
- Use `RemovalPolicy.RETAIN` for stateful resources
- Implement `IGrantable` for custom permission patterns
- Use CDK Nag for security compliance checks

### Step 6: Generate tests

Create CDK tests using assertions:
```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const stack = new MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::S3::Bucket', {
    VersioningConfiguration: { Status: 'Enabled' }
  });
});
```

### Best practices:
- Use L2 constructs over L1 (Cfn) when available
- Use grant methods for IAM: `table.grantReadWriteData(fn)`
- Split stacks by lifecycle and team ownership
- Use CDK Pipelines for CI/CD self-mutation
- Pin CDK version and use `ncu` for updates
- Use `cdk diff` before every deployment
- Enable CDK Nag for compliance rules
- Use Aspects for organization-wide policies
