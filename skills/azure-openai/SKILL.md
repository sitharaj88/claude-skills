---
name: azure-openai
description: Generate Azure OpenAI configurations with model deployments, RAG patterns, and AI integration. Use when the user wants to build AI-powered applications with Azure OpenAI Service.
argument-hint: "[deployment|chat|embedding|rag|assistant] [use case]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *), Bash(npm *), Bash(pip *), Bash(dotnet *)
user-invocable: true
---

## Instructions

You are an Azure OpenAI Service expert. Generate production-ready AI integration configurations and code.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: model deployment, chat completions, embeddings, RAG, assistants
- **Model**: GPT-4o, GPT-4, GPT-3.5-Turbo, DALL-E 3, Whisper, text-embedding-ada-002, text-embedding-3-small
- **Use case**: chatbot, document Q&A, semantic search, content generation, code assistant
- **Authentication**: API key, managed identity, Azure AD token
- **Scale**: expected tokens/minute, provisioned throughput needs

### Step 2: Generate resource and model deployment

**Bicep template:**
```bicep
param location string = resourceGroup().location
param openAIName string
param modelDeployments array = [
  {
    name: 'gpt-4o'
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-08-06'
    }
    sku: {
      name: 'Standard'
      capacity: 30  // Thousands of tokens per minute
    }
  }
  {
    name: 'text-embedding-3-small'
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-small'
      version: '1'
    }
    sku: {
      name: 'Standard'
      capacity: 120
    }
  }
]

resource openAI 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: openAIName
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: openAIName
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      defaultAction: 'Deny'
    }
    disableLocalAuth: true  // Require Azure AD authentication
  }
}

@batchSize(1)
resource deployments 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = [
  for deployment in modelDeployments: {
    parent: openAI
    name: deployment.name
    sku: deployment.sku
    properties: {
      model: deployment.model
      raiPolicyName: 'Microsoft.DefaultV2'
    }
  }
]

output endpoint string = openAI.properties.endpoint
output principalId string = openAI.identity.principalId
```

**Terraform alternative:**
```hcl
resource "azurerm_cognitive_account" "openai" {
  name                          = var.openai_name
  location                      = var.location
  resource_group_name           = var.resource_group_name
  kind                          = "OpenAI"
  sku_name                      = "S0"
  custom_subdomain_name         = var.openai_name
  public_network_access_enabled = false
  local_auth_enabled            = false

  identity {
    type = "SystemAssigned"
  }

  network_acls {
    default_action = "Deny"
  }

  tags = var.tags
}

resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = "gpt-4o"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = "2024-08-06"
  }

  sku {
    name     = "Standard"
    capacity = 30
  }
}

resource "azurerm_cognitive_deployment" "embedding" {
  name                 = "text-embedding-3-small"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "text-embedding-3-small"
    version = "1"
  }

  sku {
    name     = "Standard"
    capacity = 120
  }
}
```

### Step 3: Generate chat completions code

**TypeScript/Node.js (Azure OpenAI SDK):**
```typescript
import { AzureOpenAI } from 'openai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';

// Managed identity authentication (recommended)
const credential = new DefaultAzureCredential();
const azureADTokenProvider = getBearerTokenProvider(
  credential,
  'https://cognitiveservices.azure.com/.default'
);

const client = new AzureOpenAI({
  azureADTokenProvider,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: '2024-10-21',
});

// Basic chat completion
async function chat(userMessage: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',  // deployment name
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  return response.choices[0].message.content ?? '';
}
```

**Streaming responses:**
```typescript
async function chatStream(userMessage: string): Promise<void> {
  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: userMessage },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      process.stdout.write(content);
    }
  }
}
```

**JSON mode (structured output):**
```typescript
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: 'Extract product information as JSON with fields: name, price, category.',
    },
    { role: 'user', content: userInput },
  ],
  response_format: { type: 'json_object' },
});

const product = JSON.parse(response.choices[0].message.content ?? '{}');
```

**Function calling / Tools:**
```typescript
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
  },
];

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is the weather in London?' }],
  tools,
  tool_choice: 'auto',
});

const toolCall = response.choices[0].message.tool_calls?.[0];
if (toolCall) {
  const args = JSON.parse(toolCall.function.arguments);
  const weatherResult = await getWeather(args.location, args.unit);

  // Send tool result back
  const followUp = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'What is the weather in London?' },
      response.choices[0].message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(weatherResult),
      },
    ],
  });
}
```

**Python:**
```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
import os

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_version="2024-10-21",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"},
    ],
    temperature=0.7,
    max_tokens=4096,
)

print(response.choices[0].message.content)
```

### Step 4: Generate embeddings for semantic search

```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',  // deployment name
    input: text,
  });

  return response.data[0].embedding;
}

// Batch embeddings (up to 16 inputs per request for efficiency)
async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const batchSize = 16;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });

    allEmbeddings.push(...response.data.map(d => d.embedding));
  }

  return allEmbeddings;
}

// Cosine similarity for search ranking
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

### Step 5: Generate RAG with Azure AI Search

**Azure AI Search index (Bicep):**
```bicep
resource searchService 'Microsoft.Search/searchServices@2024-03-01-preview' = {
  name: searchServiceName
  location: location
  sku: {
    name: 'standard'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    semanticSearch: 'standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
}
```

**Create vector index and RAG pipeline (TypeScript):**
```typescript
import { SearchClient, SearchIndexClient, AzureKeyCredential } from '@azure/search-documents';

// Create index with vector search
const indexClient = new SearchIndexClient(
  process.env.SEARCH_ENDPOINT!,
  new AzureKeyCredential(process.env.SEARCH_API_KEY!)
);

await indexClient.createIndex({
  name: 'documents',
  fields: [
    { name: 'id', type: 'Edm.String', key: true, filterable: true },
    { name: 'content', type: 'Edm.String', searchable: true },
    { name: 'title', type: 'Edm.String', searchable: true, filterable: true },
    { name: 'category', type: 'Edm.String', filterable: true, facetable: true },
    {
      name: 'contentVector',
      type: 'Collection(Edm.Single)',
      searchable: true,
      vectorSearchDimensions: 1536,
      vectorSearchProfileName: 'vector-profile',
    },
  ],
  vectorSearch: {
    algorithms: [{ name: 'hnsw-algo', kind: 'hnsw', parameters: { m: 4, efConstruction: 400, efSearch: 500, metric: 'cosine' } }],
    profiles: [{ name: 'vector-profile', algorithmConfigurationName: 'hnsw-algo' }],
  },
  semanticConfiguration: {
    name: 'semantic-config',
    prioritizedFields: {
      contentFields: [{ name: 'content' }],
      titleField: { name: 'title' },
    },
  },
});

// RAG query: hybrid search (keyword + vector + semantic ranking)
async function ragQuery(userQuestion: string): Promise<string> {
  const searchClient = new SearchClient(
    process.env.SEARCH_ENDPOINT!,
    'documents',
    new AzureKeyCredential(process.env.SEARCH_API_KEY!)
  );

  // Generate embedding for the question
  const questionEmbedding = await generateEmbedding(userQuestion);

  // Hybrid search: combines keyword, vector, and semantic ranking
  const searchResults = await searchClient.search(userQuestion, {
    vectorSearchOptions: {
      queries: [{
        kind: 'vector',
        vector: questionEmbedding,
        kNearestNeighborsCount: 5,
        fields: ['contentVector'],
      }],
    },
    queryType: 'semantic',
    semanticSearchOptions: {
      configurationName: 'semantic-config',
    },
    top: 5,
    select: ['content', 'title'],
  });

  // Build context from search results
  const contexts: string[] = [];
  for await (const result of searchResults.results) {
    contexts.push(`[${result.document.title}]: ${result.document.content}`);
  }

  // Generate answer with context
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Answer the user's question based on the following context. If the answer is not in the context, say so. Cite sources using [title] format.\n\nContext:\n${contexts.join('\n\n')}`,
      },
      { role: 'user', content: userQuestion },
    ],
    temperature: 0.3,
    max_tokens: 2048,
  });

  return response.choices[0].message.content ?? '';
}
```

### Step 6: Generate Azure OpenAI Assistants API

```typescript
// Create an assistant
const assistant = await client.beta.assistants.create({
  model: 'gpt-4o',
  name: 'Data Analyst',
  instructions: 'You are a data analyst. Analyze uploaded files and answer questions about the data.',
  tools: [
    { type: 'code_interpreter' },
    { type: 'file_search' },
  ],
});

// Create a thread with a message
const thread = await client.beta.threads.create();

// Upload a file and attach to message
const file = await client.files.create({
  file: fs.createReadStream('data.csv'),
  purpose: 'assistants',
});

await client.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: 'Analyze this sales data and create a summary chart.',
  attachments: [
    { file_id: file.id, tools: [{ type: 'code_interpreter' }] },
  ],
});

// Run the assistant and stream the response
const run = client.beta.threads.runs.stream(thread.id, {
  assistant_id: assistant.id,
});

for await (const event of run) {
  if (event.event === 'thread.message.delta') {
    const content = event.data.delta.content?.[0];
    if (content?.type === 'text') {
      process.stdout.write(content.text?.value ?? '');
    }
  }
}
```

### Step 7: Generate content filtering configuration

```bicep
resource contentFilter 'Microsoft.CognitiveServices/accounts/raiPolicies@2024-04-01-preview' = {
  parent: openAI
  name: 'custom-filter'
  properties: {
    basePolicyName: 'Microsoft.DefaultV2'
    contentFilters: [
      { name: 'hate', blocking: true, enabled: true, source: 'Prompt', allowedContentLevel: 'Low' }
      { name: 'hate', blocking: true, enabled: true, source: 'Completion', allowedContentLevel: 'Low' }
      { name: 'sexual', blocking: true, enabled: true, source: 'Prompt', allowedContentLevel: 'Low' }
      { name: 'sexual', blocking: true, enabled: true, source: 'Completion', allowedContentLevel: 'Low' }
      { name: 'violence', blocking: true, enabled: true, source: 'Prompt', allowedContentLevel: 'Medium' }
      { name: 'violence', blocking: true, enabled: true, source: 'Completion', allowedContentLevel: 'Medium' }
      { name: 'selfharm', blocking: true, enabled: true, source: 'Prompt', allowedContentLevel: 'Low' }
      { name: 'selfharm', blocking: true, enabled: true, source: 'Completion', allowedContentLevel: 'Low' }
    ]
  }
}
```

### Step 8: Token management and rate limiting

```typescript
import { encoding_for_model } from 'tiktoken';

// Count tokens before sending request
function countTokens(text: string, model: string = 'gpt-4o'): number {
  const enc = encoding_for_model(model as any);
  const tokens = enc.encode(text);
  enc.free();
  return tokens.length;
}

// Rate limiter with exponential backoff
class RateLimiter {
  private retryAfterMs = 0;
  private lastRequestTime = 0;

  async execute<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const now = Date.now();
      if (now < this.lastRequestTime + this.retryAfterMs) {
        await new Promise(resolve =>
          setTimeout(resolve, this.lastRequestTime + this.retryAfterMs - now)
        );
      }

      try {
        this.lastRequestTime = Date.now();
        return await fn();
      } catch (error: any) {
        if (error.status === 429 && attempt < maxRetries) {
          const retryAfter = parseInt(error.headers?.['retry-after'] ?? '1', 10);
          this.retryAfterMs = retryAfter * 1000 * Math.pow(2, attempt);
          console.warn(`Rate limited. Retrying in ${this.retryAfterMs}ms`);
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

### Step 9: LangChain integration

```typescript
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from '@langchain/openai';
import { AzureAISearchVectorStore } from '@langchain/community/vectorstores/azure_aisearch';
import { createRetrievalChain } from 'langchain/chains/retrieval';

const model = new AzureChatOpenAI({
  azureOpenAIApiDeploymentName: 'gpt-4o',
  azureOpenAIApiVersion: '2024-10-21',
  temperature: 0.7,
});

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiDeploymentName: 'text-embedding-3-small',
  azureOpenAIApiVersion: '2024-10-21',
});

const vectorStore = new AzureAISearchVectorStore(embeddings, {
  endpoint: process.env.SEARCH_ENDPOINT!,
  key: process.env.SEARCH_API_KEY!,
  indexName: 'documents',
});
```

### Step 10: Semantic Kernel integration (.NET)

```csharp
using Microsoft.SemanticKernel;
using Azure.Identity;

var builder = Kernel.CreateBuilder();

builder.AddAzureOpenAIChatCompletion(
    deploymentName: "gpt-4o",
    endpoint: Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT")!,
    credentials: new DefaultAzureCredential()
);

builder.AddAzureOpenAITextEmbeddingGeneration(
    deploymentName: "text-embedding-3-small",
    endpoint: Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT")!,
    credentials: new DefaultAzureCredential()
);

var kernel = builder.Build();

// Simple prompt
var result = await kernel.InvokePromptAsync("Summarize this text: {{$input}}", new() {
    ["input"] = documentText
});

// Plugin with native function
public class WeatherPlugin
{
    [KernelFunction, Description("Gets current weather for a city")]
    public async Task<string> GetWeather(
        [Description("City name")] string city)
    {
        // Call weather API
        return $"Weather in {city}: 72F, Sunny";
    }
}

kernel.Plugins.AddFromType<WeatherPlugin>();
var chatResult = await kernel.InvokePromptAsync(
    "What is the weather in Seattle?",
    new(new OpenAIPromptExecutionSettings { ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions })
);
```

### Best practices:
- Use managed identity (DefaultAzureCredential) instead of API keys
- Use the latest API version for newest features and improvements
- Implement streaming for better user experience in chat applications
- Use system messages to set behavior, constraints, and output format
- Set appropriate temperature (0.0-0.3 for factual, 0.7-1.0 for creative)
- Use hybrid search (keyword + vector + semantic) for best RAG results
- Implement retry logic with exponential backoff for 429 rate limit errors
- Monitor token usage and costs with Application Insights
- Use content filtering to ensure safe AI outputs in production
- Version your prompts and track performance across prompt iterations
- Use structured output (JSON mode or function calling) for reliable parsing

### Anti-patterns to avoid:
- Do NOT hardcode API keys in source code (use managed identity or Key Vault)
- Do NOT ignore token limits (count tokens before sending large contexts)
- Do NOT skip content filtering in production applications
- Do NOT use a single deployment for all environments (separate dev/prod)
- Do NOT send sensitive PII data without content filtering and data handling policies
- Do NOT use synchronous calls for long-running completions (use streaming)
- Do NOT rely on a single region (deploy to multiple regions for resilience)
- Do NOT embed entire documents in prompts (use RAG for large document Q&A)

### Security considerations:
- Disable local authentication (require Azure AD tokens)
- Use private endpoints to restrict network access
- Configure content filtering policies appropriate to your use case
- Implement input validation and sanitization before sending to the API
- Log and audit all AI interactions for compliance
- Use managed identity for service-to-service authentication
- Apply RBAC roles: `Cognitive Services OpenAI User` for inference, `Cognitive Services OpenAI Contributor` for management
- Implement responsible AI practices: transparency, fairness, accountability

### Cost optimization tips:
- **Standard deployment**: pay-per-token, best for variable workloads
- **Provisioned throughput (PTU)**: fixed cost per unit, best for predictable high-volume workloads
- Use GPT-4o-mini or GPT-3.5-Turbo for simpler tasks (significantly cheaper)
- Use text-embedding-3-small over text-embedding-ada-002 (cheaper, better performance)
- Implement caching for repeated queries (semantic cache with embeddings)
- Optimize prompts to reduce token usage (concise system messages)
- Monitor usage with `az cognitiveservices account list-usage`
- Use batch processing for non-real-time workloads
- Set token limits (`max_tokens`) to prevent runaway costs
- Consider regional pricing differences when choosing deployment location
