---
name: aws-bedrock
description: Generate AWS Bedrock configurations for AI/ML model integration, knowledge bases, agents, and generative AI applications. Use when the user wants to build AI-powered applications with Bedrock.
argument-hint: "[model|agent|knowledge-base] [use case]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *), Bash(npm *), Bash(pip *)
user-invocable: true
---

## Instructions

You are an AWS Bedrock AI/ML expert. Generate production-ready generative AI configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Use case**: text generation, summarization, RAG, chatbot, image generation, embeddings
- **Model**: Claude (Anthropic), Titan, Llama, Mistral, Stable Diffusion, Cohere
- **Features**: model access, knowledge base, agents, guardrails
- **Scale**: expected request volume and latency requirements

### Step 2: Generate model access configuration

**Enable model access:**
- Request access in Bedrock console (required per model)
- List available models: `aws bedrock list-foundation-models`

**Choose the right model:**
| Use Case | Recommended Model |
|----------|------------------|
| Complex reasoning | Claude 3.5 Sonnet / Claude 3 Opus |
| Fast responses | Claude 3 Haiku / Mistral 7B |
| Embeddings | Titan Embeddings V2 |
| Image generation | Stable Diffusion XL / Titan Image |
| Code generation | Claude 3.5 Sonnet |

### Step 3: Generate API integration code

**InvokeModel (basic):**
```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

const response = await client.send(new InvokeModelCommand({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  contentType: 'application/json',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages: [{ role: 'user', content: 'Hello!' }],
    system: 'You are a helpful assistant.',
  }),
}));
```

**Converse API (recommended, model-agnostic):**
```typescript
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const response = await client.send(new ConverseCommand({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  messages: [{ role: 'user', content: [{ text: 'Hello!' }] }],
  system: [{ text: 'You are a helpful assistant.' }],
  inferenceConfig: { maxTokens: 4096, temperature: 0.7 },
}));
```

**Streaming:**
```typescript
import { ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
// Use for real-time UI updates
```

### Step 4: Generate Knowledge Base (RAG)

Create a knowledge base for retrieval-augmented generation:
- Data source: S3 bucket with documents (PDF, TXT, MD, HTML, CSV)
- Embedding model: Titan Embeddings V2
- Vector store: OpenSearch Serverless, Aurora PostgreSQL, Pinecone
- Chunking strategy: fixed-size, semantic, hierarchical
- Retrieval configuration: top-K, search type

**Query with knowledge base:**
```typescript
import { RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';

const response = await client.send(new RetrieveAndGenerateCommand({
  input: { text: 'What is our return policy?' },
  retrieveAndGenerateConfiguration: {
    type: 'KNOWLEDGE_BASE',
    knowledgeBaseConfiguration: {
      knowledgeBaseId: 'KB_ID',
      modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
    },
  },
}));
```

### Step 5: Generate Bedrock Agent (if applicable)

Create an agent for multi-step task execution:
- Agent instructions (system prompt)
- Action groups with OpenAPI schema
- Lambda functions for action execution
- Knowledge base association
- Guardrails attachment

### Step 6: Generate Guardrails

Create content safety filters:
- Content filters (hate, insults, sexual, violence, misconduct)
- Denied topics (custom topic definitions)
- Word filters (profanity, custom words)
- PII filters (detect/mask SSN, email, phone, etc.)
- Contextual grounding (hallucination check)

### Step 7: Cost optimization

- Use Provisioned Throughput for consistent workloads
- Use batch inference for non-real-time processing
- Cache frequent responses
- Choose right model size for the task
- Use model evaluation to pick the best model

### Best practices:
- Use Converse API for model-agnostic code
- Use streaming for better user experience
- Implement retry with exponential backoff for throttling
- Use Guardrails for content safety in production
- Use Knowledge Bases for domain-specific context (RAG)
- Monitor with CloudWatch (invocations, latency, errors)
- Use Provisioned Throughput for production workloads
- Evaluate models before choosing (Bedrock Model Evaluation)
