# Azure OpenAI Service

Generate Azure OpenAI deployments, prompt engineering patterns, RAG architectures, and AI-powered application integrations.

## Usage

```bash
/azure-openai <description of your AI solution>
```

## What It Does

1. Generates Azure OpenAI resource deployments with model configurations and content filters
2. Creates prompt engineering patterns with system messages, few-shot examples, and chain-of-thought
3. Configures Retrieval-Augmented Generation pipelines with Azure AI Search and embeddings
4. Sets up Azure AI Studio projects with prompt flow orchestration and evaluation
5. Implements token management with rate limiting, retry logic, and quota monitoring
6. Integrates Semantic Kernel and LangChain SDKs for building AI agents and workflows

## Examples

```bash
/azure-openai Deploy GPT-4o with content filters, managed identity auth, and a private endpoint

/azure-openai Build a RAG pipeline with Azure AI Search, text-embedding-ada-002, and a chat completion endpoint

/azure-openai Create a multi-agent workflow using Semantic Kernel with function calling and memory
```

## What It Covers

- **Resource deployment** - Azure OpenAI accounts, model deployments, and SKU configurations
- **Model selection** - GPT-4o, GPT-4, GPT-3.5-Turbo, embedding models, and DALL-E
- **Prompt engineering** - System prompts, few-shot examples, temperature tuning, and token limits
- **RAG architecture** - Azure AI Search indexing, chunking strategies, and hybrid retrieval
- **Content filtering** - Built-in filters, custom blocklists, and safety system messages
- **Authentication** - Managed identity, API keys, Azure AD tokens, and RBAC roles
- **Prompt flow** - Azure AI Studio flows with LLM nodes, Python tools, and evaluations
- **SDK integration** - Semantic Kernel, LangChain, and OpenAI Python/JS SDK patterns
- **Scaling** - Provisioned throughput units, standard deployments, and quota management
- **Monitoring** - Token usage metrics, latency tracking, and content filter logging

<div class="badge-row">
  <span class="badge">AI/ML</span>
  <span class="badge">GenAI</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing AI configurations, prompt templates, and deployment files
- `Write` - Create deployment configs, prompt templates, and application code
- `Edit` - Modify existing AI service configurations and prompts
- `Bash` - Run az cognitiveservices, az ml, and az search CLI commands
- `Glob` - Search for configuration, prompt, and deployment files
- `Grep` - Find API references, model names, and endpoint configurations
