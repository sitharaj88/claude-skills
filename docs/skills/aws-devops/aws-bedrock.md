# AWS Bedrock

Generate AI/ML integrations with foundation models, knowledge bases, agents, guardrails, and RAG pipelines using Amazon Bedrock.

## Usage

```bash
/aws-bedrock <description of your AI/ML integration>
```

## What It Does

1. Configures Bedrock model access and generates inference API code
2. Creates knowledge bases with S3 data sources and OpenSearch vector stores
3. Builds Bedrock Agents with action groups and Lambda functions
4. Sets up guardrails for content filtering, topic denial, and PII redaction
5. Produces RAG (Retrieval-Augmented Generation) pipeline configurations
6. Adds model invocation logging, cost tracking, and performance monitoring

## Examples

```bash
/aws-bedrock Create a knowledge base with S3 documents and Claude model for Q&A

/aws-bedrock Build a Bedrock Agent with tools for database lookup and email sending

/aws-bedrock Set up guardrails to block PII, harmful content, and off-topic responses
```

## Allowed Tools

- `Read` - Read existing AI/ML configurations and application code
- `Write` - Create Bedrock configs, agent definitions, and integration code
- `Edit` - Modify existing Bedrock configurations
- `Bash` - Run AWS CLI Bedrock commands for testing and model access
- `Glob` - Search for AI/ML-related files
- `Grep` - Find model IDs, knowledge base, and agent references
