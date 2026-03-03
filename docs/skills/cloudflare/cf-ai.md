# Cloudflare AI

Generate Cloudflare AI configurations with Workers AI inference, Vectorize vector search, AI Gateway proxy, and RAG pipeline architectures at the edge.

## Usage

```bash
/cf-ai <operation or description>
```

## What It Does

1. Configures Workers AI bindings for text generation, embeddings, image generation, speech-to-text, and translation
2. Generates chat completion endpoints with streaming support and conversation history
3. Sets up Vectorize indexes for vector storage, similarity search, metadata filtering, and namespaces
4. Implements full RAG pipelines with document ingestion, chunking, embedding, and context-augmented generation
5. Configures AI Gateway as a proxy for OpenAI, Anthropic, and other providers with caching and fallbacks
6. Provides model catalog references for selecting the right model for each task

## Example Output

```typescript
interface Env {
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;
  DB: D1Database;
}

async function queryRAG(
  env: Env,
  question: string
): Promise<{ answer: string; sources: Array<{ title: string; content: string }> }> {
  // Generate query embedding
  const queryEmbedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [question],
  });

  // Search for relevant chunks
  const searchResults = await env.VECTOR_INDEX.query(queryEmbedding.data[0], {
    topK: 5,
    returnMetadata: "all",
  });

  // Retrieve full chunk content from D1
  const chunkIds = searchResults.matches.map((m) => m.id);
  const placeholders = chunkIds.map(() => "?").join(", ");
  const { results: chunks } = await env.DB
    .prepare(`SELECT id, content FROM chunks WHERE id IN (${placeholders})`)
    .bind(...chunkIds)
    .all();

  // Generate answer with context
  const context = chunks.map((c: any) => c.content).join("\n\n---\n\n");
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      { role: "system", content: `Answer based on context:\n${context}` },
      { role: "user", content: question },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  });

  return { answer: response.response, sources: searchResults.matches.map((m) => ({
    title: (m.metadata as any)?.title || "Unknown",
    content: chunks.find((c: any) => c.id === m.id)?.content || "",
  })) };
}
```

## What It Covers

- **Text generation** with Llama, Mistral, and Gemma models including streaming responses
- **Text embeddings** with BGE models (384, 768, 1024 dimensions) for semantic search
- **Image generation** with Stable Diffusion XL and image classification with ResNet
- **Speech-to-text** with Whisper and translation with M2M-100
- **Vectorize** index creation, upsert, query, metadata filtering, and namespace isolation
- **RAG pipelines** with document ingestion, chunking, embedding, and context-augmented answers
- **AI Gateway** proxy setup with caching, rate limiting, logging, and provider fallbacks

<div class="badge-row">
  <span class="badge">Cloudflare</span>
  <span class="badge">AI/ML</span>
  <span class="badge">RAG</span>
</div>

## Installation

```bash
cp -r skills/cf-ai ~/.claude/skills/cf-ai
```

## Allowed Tools

- `Read` - Read existing AI configurations and model integration code
- `Write` - Create AI Workers, Vectorize pipelines, and RAG endpoints
- `Edit` - Modify existing AI configurations and model parameters
- `Bash` - Run Wrangler and curl commands for index management and testing
- `Glob` - Search for AI-related configuration files
- `Grep` - Find AI binding references and model usage patterns
