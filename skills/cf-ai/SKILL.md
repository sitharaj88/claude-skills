---
name: cf-ai
description: Generate Cloudflare AI configs with Workers AI, Vectorize, and AI Gateway. Use when the user wants to run AI inference at the edge, build RAG pipelines, or proxy AI providers through Cloudflare.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx wrangler *), Bash(wrangler *), Bash(npm *), Bash(curl *)
user-invocable: true
---

## Instructions

You are a Cloudflare AI expert. Generate production-ready configurations for Workers AI inference, Vectorize vector databases, and AI Gateway proxy setups.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: inference (text/image/audio), embeddings, vector search, AI gateway, RAG pipeline
- **Model type**: text generation (LLM), text embeddings, image generation, image classification, speech-to-text, translation, code generation
- **Architecture**: Workers AI (serverless inference), Vectorize (vector DB), AI Gateway (proxy/cache/rate-limit)
- **Integration**: standalone Worker, Pages Function, existing application with AI Gateway

### Step 2: Configure AI bindings

**wrangler.toml:**

```toml
name = "my-ai-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# Workers AI binding
[ai]
binding = "AI"

# Vectorize index binding
[[vectorize]]
binding = "VECTOR_INDEX"
index_name = "my-embeddings"

# D1 for metadata storage (RAG pattern)
[[d1_databases]]
binding = "DB"
database_name = "knowledge-base"
database_id = "xxxx-xxxx-xxxx"

# R2 for document storage
[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "documents"
```

### Step 3: Workers AI - Text generation (chat completions)

```typescript
interface Env {
  AI: Ai;
}

// Basic text generation
async function generateText(ai: Ai, prompt: string): Promise<string> {
  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
  });

  return response.response;
}

// Chat completions with conversation history
async function chat(
  ai: Ai,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
    messages,
    max_tokens: options?.maxTokens || 1024,
    temperature: options?.temperature || 0.7,
  });

  return response.response;
}

// Streaming response
async function streamChat(
  ai: Ai,
  messages: Array<{ role: string; content: string }>
): Promise<ReadableStream> {
  const stream = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
    messages,
    stream: true,
    max_tokens: 2048,
  });

  return stream as ReadableStream;
}

// HTTP endpoint with streaming
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { messages, stream } = await request.json() as {
      messages: Array<{ role: string; content: string }>;
      stream?: boolean;
    };

    if (stream) {
      const responseStream = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages,
        stream: true,
        max_tokens: 2048,
      });

      return new Response(responseStream as ReadableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages,
      max_tokens: 2048,
    });

    return Response.json(response);
  },
};
```

### Step 4: Workers AI - Text embeddings

```typescript
// Generate embeddings for text
async function generateEmbeddings(
  ai: Ai,
  texts: string[]
): Promise<number[][]> {
  const response = await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: texts,
  });

  return response.data; // Array of embedding vectors
}

// Generate embedding for a single text
async function generateEmbedding(ai: Ai, text: string): Promise<number[]> {
  const response = await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: [text],
  });

  return response.data[0];
}

// Available embedding models:
// @cf/baai/bge-base-en-v1.5     - 768 dimensions, English
// @cf/baai/bge-large-en-v1.5    - 1024 dimensions, English
// @cf/baai/bge-small-en-v1.5    - 384 dimensions, English (fastest)
```

### Step 5: Workers AI - Image generation and classification

```typescript
// Image generation with Stable Diffusion
async function generateImage(ai: Ai, prompt: string): Promise<ArrayBuffer> {
  const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
    prompt,
    negative_prompt: "blurry, low quality, distorted",
    num_steps: 20,
    guidance: 7.5,
    width: 1024,
    height: 1024,
  });

  return response as unknown as ArrayBuffer;
}

// Image classification
async function classifyImage(ai: Ai, imageData: ArrayBuffer): Promise<Array<{ label: string; score: number }>> {
  const response = await ai.run("@cf/microsoft/resnet-50", {
    image: [...new Uint8Array(imageData)],
  });

  return response;
}

// Image-to-text (captioning)
async function describeImage(ai: Ai, imageData: ArrayBuffer): Promise<string> {
  const response = await ai.run("@cf/llava-hf/llava-1.5-7b-hf", {
    image: [...new Uint8Array(imageData)],
    prompt: "Describe this image in detail.",
    max_tokens: 512,
  });

  return response.description;
}

// HTTP endpoint for image generation
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { prompt } = await request.json() as { prompt: string };

    const image = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt,
      num_steps: 20,
    });

    return new Response(image as unknown as ArrayBuffer, {
      headers: { "Content-Type": "image/png" },
    });
  },
};
```

### Step 6: Workers AI - Speech-to-text and translation

```typescript
// Speech-to-text (Whisper)
async function transcribeAudio(ai: Ai, audioData: ArrayBuffer): Promise<{
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
}> {
  const response = await ai.run("@cf/openai/whisper", {
    audio: [...new Uint8Array(audioData)],
  });

  return response;
}

// Translation
async function translateText(
  ai: Ai,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const response = await ai.run("@cf/meta/m2m100-1.2b", {
    text,
    source_lang: sourceLang,
    target_lang: targetLang,
  });

  return response.translated_text;
}

// Text summarization
async function summarizeText(ai: Ai, text: string): Promise<string> {
  const response = await ai.run("@cf/facebook/bart-large-cnn", {
    input_text: text,
    max_length: 150,
  });

  return response.summary;
}
```

### Step 7: Vectorize - Vector database setup

```bash
# Create a Vectorize index
npx wrangler vectorize create my-embeddings \
  --dimensions=768 \
  --metric=cosine

# Dimensions depend on the embedding model:
# bge-small-en: 384 dimensions
# bge-base-en:  768 dimensions
# bge-large-en: 1024 dimensions

# Metric options: cosine, euclidean, dot-product

# List indexes
npx wrangler vectorize list

# Get index info
npx wrangler vectorize get my-embeddings

# Delete index
npx wrangler vectorize delete my-embeddings
```

### Step 8: Vectorize - Insert and query vectors

```typescript
interface Env {
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;
  DB: D1Database;
}

// Insert vectors with metadata
async function indexDocuments(
  ai: Ai,
  vectorIndex: VectorizeIndex,
  documents: Array<{ id: string; text: string; metadata: Record<string, string> }>
): Promise<void> {
  // Generate embeddings in batches
  const batchSize = 100;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const texts = batch.map((doc) => doc.text);

    const embeddings = await ai.run("@cf/baai/bge-base-en-v1.5", {
      text: texts,
    });

    const vectors: VectorizeVector[] = batch.map((doc, idx) => ({
      id: doc.id,
      values: embeddings.data[idx],
      metadata: doc.metadata,
    }));

    await vectorIndex.upsert(vectors);
  }
}

// Query similar vectors
async function searchSimilar(
  ai: Ai,
  vectorIndex: VectorizeIndex,
  query: string,
  options?: {
    topK?: number;
    filter?: VectorizeVectorMetadataFilter;
    returnValues?: boolean;
    returnMetadata?: "none" | "indexed" | "all";
  }
): Promise<VectorizeMatches> {
  // Generate query embedding
  const queryEmbedding = await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: [query],
  });

  // Search for similar vectors
  const results = await vectorIndex.query(queryEmbedding.data[0], {
    topK: options?.topK || 10,
    filter: options?.filter,
    returnValues: options?.returnValues || false,
    returnMetadata: options?.returnMetadata || "all",
  });

  return results;
}

// Delete vectors
async function deleteVectors(vectorIndex: VectorizeIndex, ids: string[]): Promise<void> {
  await vectorIndex.deleteByIds(ids);
}

// Get vectors by ID
async function getVectors(vectorIndex: VectorizeIndex, ids: string[]): Promise<VectorizeVector[]> {
  const results = await vectorIndex.getByIds(ids);
  return results;
}
```

### Step 9: Vectorize - Metadata filtering and namespaces

```typescript
// Query with metadata filtering
async function filteredSearch(
  ai: Ai,
  vectorIndex: VectorizeIndex,
  query: string,
  category: string
): Promise<VectorizeMatches> {
  const queryEmbedding = await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: [query],
  });

  return vectorIndex.query(queryEmbedding.data[0], {
    topK: 10,
    filter: {
      category: { $eq: category },
    },
    returnMetadata: "all",
  });
}

// Namespaces for multi-tenant isolation
async function searchInNamespace(
  ai: Ai,
  vectorIndex: VectorizeIndex,
  query: string,
  namespace: string
): Promise<VectorizeMatches> {
  const queryEmbedding = await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: [query],
  });

  return vectorIndex.query(queryEmbedding.data[0], {
    topK: 10,
    namespace,
    returnMetadata: "all",
  });
}

// Insert with namespace
async function insertWithNamespace(
  vectorIndex: VectorizeIndex,
  vectors: VectorizeVector[],
  namespace: string
): Promise<void> {
  await vectorIndex.upsert(
    vectors.map((v) => ({ ...v, namespace }))
  );
}
```

### Step 10: RAG pattern (D1 + Vectorize + Workers AI)

```typescript
interface Env {
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;
  DB: D1Database;
}

// Ingest documents into the RAG pipeline
async function ingestDocument(
  env: Env,
  document: { title: string; content: string; source: string }
): Promise<string> {
  const docId = crypto.randomUUID();

  // 1. Store document in D1
  await env.DB.prepare(
    "INSERT INTO documents (id, title, content, source, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
  ).bind(docId, document.title, document.content, document.source).run();

  // 2. Split content into chunks
  const chunks = splitIntoChunks(document.content, 500, 50); // 500 chars, 50 overlap

  // 3. Generate embeddings and store in Vectorize
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${docId}_chunk_${i}`;

    // Store chunk text in D1
    await env.DB.prepare(
      "INSERT INTO chunks (id, document_id, chunk_index, content) VALUES (?, ?, ?, ?)"
    ).bind(chunkId, docId, i, chunks[i]).run();

    // Generate embedding
    const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: [chunks[i]],
    });

    // Store in Vectorize
    await env.VECTOR_INDEX.upsert([{
      id: chunkId,
      values: embedding.data[0],
      metadata: {
        documentId: docId,
        title: document.title,
        source: document.source,
        chunkIndex: String(i),
      },
    }]);
  }

  return docId;
}

// Query the RAG pipeline
async function queryRAG(
  env: Env,
  question: string,
  options?: { topK?: number; temperature?: number }
): Promise<{ answer: string; sources: Array<{ title: string; content: string }> }> {
  // 1. Generate query embedding
  const queryEmbedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [question],
  });

  // 2. Search for relevant chunks
  const searchResults = await env.VECTOR_INDEX.query(queryEmbedding.data[0], {
    topK: options?.topK || 5,
    returnMetadata: "all",
  });

  // 3. Retrieve full chunk content from D1
  const chunkIds = searchResults.matches.map((m) => m.id);
  const placeholders = chunkIds.map(() => "?").join(", ");
  const { results: chunks } = await env.DB
    .prepare(`SELECT id, content, document_id FROM chunks WHERE id IN (${placeholders})`)
    .bind(...chunkIds)
    .all();

  // 4. Build context from retrieved chunks
  const context = chunks.map((c: any) => c.content).join("\n\n---\n\n");

  // 5. Generate answer with context
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant. Answer questions based on the provided context. If the context doesn't contain relevant information, say so. Always cite which parts of the context you used.

Context:
${context}`,
      },
      { role: "user", content: question },
    ],
    max_tokens: 1024,
    temperature: options?.temperature || 0.3,
  });

  // 6. Return answer with sources
  const sources = searchResults.matches.map((m) => ({
    title: (m.metadata as any)?.title || "Unknown",
    content: chunks.find((c: any) => c.id === m.id)?.content || "",
    score: m.score,
  }));

  return { answer: response.response, sources };
}

// Text chunking utility
function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

// Full RAG API endpoint
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/ingest" && request.method === "POST") {
      const doc = await request.json() as { title: string; content: string; source: string };
      const docId = await ingestDocument(env, doc);
      return Response.json({ id: docId, status: "ingested" }, { status: 201 });
    }

    if (url.pathname === "/api/query" && request.method === "POST") {
      const { question } = await request.json() as { question: string };
      const result = await queryRAG(env, question);
      return Response.json(result);
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

### Step 11: AI Gateway setup

AI Gateway acts as a proxy for AI providers with caching, rate limiting, logging, and fallbacks.

```typescript
// Using AI Gateway as a universal proxy
interface Env {
  AI_GATEWAY_URL: string; // e.g., https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_slug}
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}

// Proxy to OpenAI via AI Gateway
async function openaiViaGateway(
  env: Env,
  messages: Array<{ role: string; content: string }>
): Promise<Response> {
  return fetch(`${env.AI_GATEWAY_URL}/openai/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      max_tokens: 1024,
    }),
  });
}

// Proxy to Anthropic via AI Gateway
async function anthropicViaGateway(
  env: Env,
  messages: Array<{ role: string; content: string }>
): Promise<Response> {
  return fetch(`${env.AI_GATEWAY_URL}/anthropic/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages,
    }),
  });
}

// Universal endpoint with fallback
async function aiWithFallback(
  env: Env,
  messages: Array<{ role: string; content: string }>
): Promise<Response> {
  // Try primary provider
  try {
    const response = await openaiViaGateway(env, messages);
    if (response.ok) return response;
  } catch (error) {
    console.error("Primary provider failed:", error);
  }

  // Fallback to secondary provider
  try {
    const response = await anthropicViaGateway(env, messages);
    if (response.ok) return response;
  } catch (error) {
    console.error("Secondary provider failed:", error);
  }

  // Final fallback to Workers AI (runs on Cloudflare, no external dependency)
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages,
    max_tokens: 1024,
  });

  return Response.json(response);
}
```

**AI Gateway configuration (via Dashboard):**

```
Gateway Settings:
  - Caching: Enable (cache identical requests for cost savings)
  - Cache TTL: 3600 seconds
  - Rate Limiting: 100 requests per minute per user
  - Logging: Enable (log all requests for monitoring)
  - Real-time logging: Enable for debugging
  - Fallback: Configure provider chain (OpenAI -> Anthropic -> Workers AI)

Supported Providers:
  - OpenAI (GPT-4, GPT-3.5, DALL-E, Whisper)
  - Anthropic (Claude)
  - Azure OpenAI
  - Google Vertex AI (Gemini)
  - Hugging Face
  - Replicate
  - Cohere
  - Workers AI (Cloudflare native)
```

### Step 12: Model catalog reference

```typescript
// Text generation models
const TEXT_MODELS = {
  "llama-3.1-8b": "@cf/meta/llama-3.1-8b-instruct",
  "llama-3.1-70b": "@cf/meta/llama-3.1-70b-instruct",    // Larger, higher quality
  "mistral-7b": "@cf/mistral/mistral-7b-instruct-v0.2",
  "gemma-7b": "@cf/google/gemma-7b-it",
  "qwen-1.5-7b": "@cf/qwen/qwen1.5-7b-chat-awq",
};

// Embedding models
const EMBEDDING_MODELS = {
  "bge-small": "@cf/baai/bge-small-en-v1.5",   // 384 dims, fastest
  "bge-base": "@cf/baai/bge-base-en-v1.5",     // 768 dims, balanced
  "bge-large": "@cf/baai/bge-large-en-v1.5",   // 1024 dims, best quality
};

// Image models
const IMAGE_MODELS = {
  "stable-diffusion-xl": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  "image-classification": "@cf/microsoft/resnet-50",
};

// Audio models
const AUDIO_MODELS = {
  "whisper": "@cf/openai/whisper",                  // Speech-to-text
  "whisper-tiny": "@cf/openai/whisper-tiny-en",     // Faster, English only
};

// Translation models
const TRANSLATION_MODELS = {
  "m2m100": "@cf/meta/m2m100-1.2b", // 100+ languages
};

// Summarization models
const SUMMARIZATION_MODELS = {
  "bart-large-cnn": "@cf/facebook/bart-large-cnn",
};
```

### Best practices

- **Use streaming** for text generation responses to reduce time-to-first-token for users
- **Choose the right embedding model** based on quality vs. speed tradeoffs (bge-small for speed, bge-large for accuracy)
- **Chunk documents appropriately** for RAG (300-500 characters with overlap for best retrieval)
- **Use AI Gateway caching** for repeated identical queries to reduce costs and latency
- **Implement fallback chains** across providers for reliability (Workers AI as last resort is always available)
- **Set appropriate `max_tokens`** to avoid unnecessary compute (lower = faster and cheaper)
- **Use lower `temperature`** (0.1-0.3) for factual/retrieval tasks and higher (0.7-0.9) for creative tasks
- **Batch embedding requests** to reduce round-trips (up to 100 texts per call)
- **Store document metadata in D1** alongside vectors in Vectorize for rich retrieval
- **Use namespaces in Vectorize** for multi-tenant applications

### Anti-patterns to avoid

- Do NOT send excessively long prompts (increases latency and cost; summarize context first)
- Do NOT skip input validation before sending to AI models (sanitize user input to prevent prompt injection)
- Do NOT use large models when small ones suffice (llama-3.1-8b handles most tasks well)
- Do NOT ignore embedding dimension mismatch (Vectorize index dimensions must match the embedding model)
- Do NOT store raw text in Vectorize metadata (metadata has size limits; store text in D1)
- Do NOT forget to handle rate limits from external providers (use AI Gateway rate limiting and retries)
- Do NOT use Workers AI for tasks requiring GPT-4 or Claude-level reasoning (use AI Gateway to proxy to those providers)
- Do NOT skip chunking for long documents in RAG (embedding models have token limits)

### Cost optimization

- **Workers AI free tier**: 10,000 Neurons/day (units vary by model and operation)
- **Vectorize free tier**: 30 million queried vector dimensions/month, 5 million stored vector dimensions
- **AI Gateway**: free (no additional cost for proxying)
- Use AI Gateway caching to avoid redundant API calls to paid providers
- Use smaller models (bge-small, whisper-tiny) when accuracy requirements are lower
- Cache embeddings for frequently queried content to avoid regenerating them
- Use `@cf/meta/llama-3.1-8b-instruct` as the default text model (best cost-performance ratio)
- Monitor Neuron usage in the Cloudflare Dashboard to stay within free tier
- Batch embedding operations to reduce per-request overhead
- Use AI Gateway logging to identify and eliminate wasteful or duplicate API calls
