---
name: vercel-ai-sdk
description: Generate Vercel AI SDK configs with streaming chat, tool calling, structured output, RAG, and multi-provider support. Use when the user wants to build AI-powered applications with the Vercel AI SDK.
argument-hint: "[pattern]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(vercel *), Bash(npm *), Bash(npx *)
user-invocable: true
---

## Instructions

You are a Vercel AI SDK expert. Generate production-ready AI application configurations with streaming, tool calling, and structured output.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: chat, completion, tool-calling, RAG, structured-output, agent
- **Provider**: OpenAI, Anthropic, Google, Mistral, Cohere, Amazon Bedrock, Azure OpenAI
- **Framework**: Next.js App Router, Next.js Pages Router, SvelteKit, Vue/Nuxt, Solid
- **Features**: streaming, tool use, structured output, embeddings, image generation
- **UI**: React hooks (useChat, useCompletion, useObject) or server-only

### Step 2: Install and configure

**Install AI SDK packages:**
```bash
# Core SDK (always required)
npm install ai

# Provider packages (install what you need)
npm install @ai-sdk/openai       # OpenAI / Azure OpenAI
npm install @ai-sdk/anthropic    # Anthropic Claude
npm install @ai-sdk/google       # Google Gemini
npm install @ai-sdk/mistral      # Mistral AI
npm install @ai-sdk/cohere       # Cohere
npm install @ai-sdk/amazon-bedrock  # AWS Bedrock

# For structured output validation
npm install zod
```

**Environment variables:**
```bash
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AI...
MISTRAL_API_KEY=...
```

**Provider setup:**
```typescript
// lib/ai.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// Each provider auto-reads its environment variable
// openai() reads OPENAI_API_KEY
// anthropic() reads ANTHROPIC_API_KEY
// google() reads GOOGLE_GENERATIVE_AI_API_KEY

// Custom configuration
import { createOpenAI } from '@ai-sdk/openai';

const customOpenAI = createOpenAI({
  apiKey: process.env.CUSTOM_OPENAI_KEY,
  baseURL: 'https://custom-endpoint.example.com/v1',
});
```

### Step 3: AI SDK Core - Text generation

**generateText (non-streaming, server-side):**
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateText({
  model: openai('gpt-4o'),
  system: 'You are a helpful assistant that writes concise summaries.',
  prompt: 'Summarize the benefits of serverless computing.',
  maxTokens: 500,
  temperature: 0.7,
});

console.log(result.text);
console.log(result.usage); // { promptTokens, completionTokens, totalTokens }
console.log(result.finishReason); // 'stop' | 'length' | 'tool-calls'
```

**streamText (streaming, recommended for UI):**
```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  system: 'You are a helpful coding assistant.',
  messages: [
    { role: 'user', content: 'Write a React hook for dark mode.' },
  ],
  maxTokens: 2000,
  onChunk: ({ chunk }) => {
    // Process each chunk as it arrives
    if (chunk.type === 'text-delta') {
      process.stdout.write(chunk.textDelta);
    }
  },
  onFinish: ({ text, usage, finishReason }) => {
    console.log('Generation complete:', { usage, finishReason });
  },
});

// Convert to Response for API routes
return result.toDataStreamResponse();

// Or consume as text
const fullText = await result.text;
```

**Multi-turn conversation:**
```typescript
import { streamText, type CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';

const messages: CoreMessage[] = [
  { role: 'user', content: 'What is TypeScript?' },
  { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript...' },
  { role: 'user', content: 'How does it compare to Flow?' },
];

const result = streamText({
  model: openai('gpt-4o'),
  system: 'You are a programming expert.',
  messages,
});
```

### Step 4: Streaming chat API route

**Next.js App Router chat endpoint:**
```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, model = 'gpt-4o' } = await req.json();

  const result = streamText({
    model: openai(model),
    system: `You are a helpful AI assistant. Today's date is ${new Date().toISOString().split('T')[0]}.`,
    messages,
    maxTokens: 4096,
  });

  return result.toDataStreamResponse();
}
```

**React chat component with useChat:**
```typescript
// components/Chat.tsx
'use client';

import { useChat } from 'ai/react';

export function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    error,
  } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (message) => {
      console.log('Message complete:', message);
    },
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-md'
                : 'bg-gray-100 mr-auto max-w-2xl'
            }`}
          >
            <p className="text-sm font-medium">
              {message.role === 'user' ? 'You' : 'AI'}
            </p>
            <div className="prose prose-sm">{message.content}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-2 text-red-600 text-sm">
          Error: {error.message}
          <button onClick={() => reload()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
          disabled={isLoading}
        />
        {isLoading ? (
          <button type="button" onClick={stop} className="px-4 py-2 bg-red-500 text-white rounded">
            Stop
          </button>
        ) : (
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            Send
          </button>
        )}
      </form>
    </div>
  );
}
```

### Step 5: Tool calling (function calling)

**Define tools with Zod schemas:**
```typescript
// app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant with access to tools.',
    messages,
    tools: {
      getWeather: tool({
        description: 'Get the current weather for a location',
        parameters: z.object({
          location: z.string().describe('City name or zip code'),
          unit: z.enum(['celsius', 'fahrenheit']).default('celsius'),
        }),
        execute: async ({ location, unit }) => {
          // Call weather API
          const response = await fetch(
            `https://api.weather.example.com?q=${location}&units=${unit}`
          );
          const data = await response.json();
          return {
            temperature: data.temp,
            condition: data.condition,
            location: data.name,
          };
        },
      }),

      searchProducts: tool({
        description: 'Search for products in the catalog',
        parameters: z.object({
          query: z.string().describe('Search query'),
          category: z.string().optional().describe('Product category'),
          maxPrice: z.number().optional().describe('Maximum price'),
        }),
        execute: async ({ query, category, maxPrice }) => {
          const products = await db.product.findMany({
            where: {
              name: { contains: query, mode: 'insensitive' },
              ...(category && { category }),
              ...(maxPrice && { price: { lte: maxPrice } }),
            },
            take: 5,
          });
          return products;
        },
      }),

      createTask: tool({
        description: 'Create a new task in the task management system',
        parameters: z.object({
          title: z.string().describe('Task title'),
          description: z.string().optional().describe('Task description'),
          priority: z.enum(['low', 'medium', 'high']).default('medium'),
          dueDate: z.string().optional().describe('Due date in ISO format'),
        }),
        execute: async ({ title, description, priority, dueDate }) => {
          const task = await db.task.create({
            data: { title, description, priority, dueDate },
          });
          return { id: task.id, title: task.title, status: 'created' };
        },
      }),
    },
    maxSteps: 5, // Allow up to 5 tool call rounds
  });

  return result.toDataStreamResponse();
}
```

**Display tool results in the UI:**
```typescript
// components/Chat.tsx
'use client';

import { useChat } from 'ai/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === 'assistant' && message.toolInvocations && (
            <div className="space-y-2">
              {message.toolInvocations.map((toolInvocation) => (
                <div key={toolInvocation.toolCallId} className="bg-gray-50 p-2 rounded text-sm">
                  <p className="font-mono">Tool: {toolInvocation.toolName}</p>
                  {'result' in toolInvocation ? (
                    <pre>{JSON.stringify(toolInvocation.result, null, 2)}</pre>
                  ) : (
                    <p>Calling tool...</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {message.content && <div className="prose">{message.content}</div>}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}
```

### Step 6: Structured output with Zod

**generateObject (JSON output):**
```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const recipeSchema = z.object({
  name: z.string().describe('Recipe name'),
  ingredients: z.array(
    z.object({
      item: z.string(),
      amount: z.string(),
      unit: z.string(),
    })
  ),
  steps: z.array(z.string()).describe('Cooking instructions'),
  prepTime: z.number().describe('Prep time in minutes'),
  cookTime: z.number().describe('Cook time in minutes'),
  servings: z.number(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const result = await generateObject({
  model: openai('gpt-4o'),
  schema: recipeSchema,
  prompt: 'Create a recipe for chocolate chip cookies.',
});

// result.object is fully typed as z.infer<typeof recipeSchema>
const recipe = result.object;
```

**streamObject (streaming structured output):**
```typescript
// app/api/recipe/route.ts
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamObject({
    model: openai('gpt-4o'),
    schema: recipeSchema,
    prompt,
  });

  return result.toTextStreamResponse();
}
```

**useObject hook (React):**
```typescript
// components/RecipeGenerator.tsx
'use client';

import { useObject } from 'ai/react';
import { recipeSchema } from '@/lib/schemas';

export function RecipeGenerator() {
  const { object, submit, isLoading, error } = useObject({
    api: '/api/recipe',
    schema: recipeSchema,
  });

  return (
    <div>
      <button
        onClick={() => submit({ prompt: 'Create a vegan pasta recipe' })}
        disabled={isLoading}
      >
        Generate Recipe
      </button>

      {/* Object streams in progressively */}
      {object && (
        <div>
          <h2>{object.name ?? 'Loading...'}</h2>
          {object.ingredients?.map((ing, i) => (
            <p key={i}>{ing?.amount} {ing?.unit} {ing?.item}</p>
          ))}
          {object.steps?.map((step, i) => (
            <p key={i}>{i + 1}. {step}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 7: RAG (Retrieval-Augmented Generation)

**Embedding generation:**
```typescript
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

// Single embedding
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'What is serverless computing?',
});

// Batch embeddings
const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: [
    'Document chunk 1...',
    'Document chunk 2...',
    'Document chunk 3...',
  ],
});
```

**RAG pipeline with Vercel Postgres (pgvector):**
```typescript
// lib/rag.ts
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { sql } from '@vercel/postgres';

// Store document with embedding
export async function indexDocument(content: string, metadata: Record<string, unknown>) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: content,
  });

  await sql`
    INSERT INTO documents (content, metadata, embedding)
    VALUES (${content}, ${JSON.stringify(metadata)}, ${JSON.stringify(embedding)})
  `;
}

// Similarity search
export async function findSimilar(query: string, topK: number = 5) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  const { rows } = await sql`
    SELECT content, metadata,
      1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
    FROM documents
    ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT ${topK}
  `;

  return rows;
}
```

**RAG chat endpoint:**
```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { findSimilar } from '@/lib/rag';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // Retrieve relevant context
  const relevantDocs = await findSimilar(lastMessage, 5);
  const context = relevantDocs
    .map((doc) => doc.content)
    .join('\n\n---\n\n');

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a helpful assistant. Answer questions based on the following context.
If the context doesn't contain relevant information, say so.

Context:
${context}`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

### Step 8: AI SDK middleware

**Logging middleware:**
```typescript
import { wrapLanguageModel, type LanguageModelMiddleware } from 'ai';
import { openai } from '@ai-sdk/openai';

const loggingMiddleware: LanguageModelMiddleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    console.log('Generate called with:', {
      model: params.model,
      prompt: params.prompt,
    });

    const startTime = Date.now();
    const result = await doGenerate();
    const duration = Date.now() - startTime;

    console.log('Generate completed:', {
      duration: `${duration}ms`,
      usage: result.usage,
      finishReason: result.finishReason,
    });

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    console.log('Stream called');
    const startTime = Date.now();
    const { stream, ...rest } = await doStream();

    const transformedStream = stream.pipeThrough(
      new TransformStream({
        flush() {
          console.log(`Stream completed in ${Date.now() - startTime}ms`);
        },
      })
    );

    return { stream: transformedStream, ...rest };
  },
};

// Wrap a model with middleware
const modelWithLogging = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: loggingMiddleware,
});

// Use the wrapped model
const result = await generateText({
  model: modelWithLogging,
  prompt: 'Hello!',
});
```

**Caching middleware:**
```typescript
import { kv } from '@vercel/kv';
import { wrapLanguageModel, type LanguageModelMiddleware } from 'ai';

const cachingMiddleware: LanguageModelMiddleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = `ai:cache:${JSON.stringify(params.prompt)}`;
    const cached = await kv.get(cacheKey);

    if (cached) {
      return cached as Awaited<ReturnType<typeof doGenerate>>;
    }

    const result = await doGenerate();

    // Cache for 1 hour (only cache successful completions)
    if (result.finishReason === 'stop') {
      await kv.set(cacheKey, result, { ex: 3600 });
    }

    return result;
  },
};
```

### Step 9: Multi-provider setup

**Provider switching:**
```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { type LanguageModelV1 } from 'ai';

function getModel(modelId: string): LanguageModelV1 {
  const [provider, model] = modelId.split(':');

  switch (provider) {
    case 'openai':
      return openai(model);
    case 'anthropic':
      return anthropic(model);
    case 'google':
      return google(model);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Usage
const result = await streamText({
  model: getModel('anthropic:claude-sonnet-4-20250514'),
  messages,
});
```

**Fallback pattern:**
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

async function generateWithFallback(prompt: string) {
  const models = [
    openai('gpt-4o'),
    anthropic('claude-sonnet-4-20250514'),
    openai('gpt-4o-mini'), // Cheapest fallback
  ];

  for (const model of models) {
    try {
      const result = await generateText({ model, prompt, maxTokens: 1000 });
      return result;
    } catch (error) {
      console.warn(`Model failed, trying next:`, error);
      continue;
    }
  }

  throw new Error('All models failed');
}
```

### Step 10: useCompletion hook

**Text completion endpoint:**
```typescript
// app/api/complete/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    prompt,
  });

  return result.toDataStreamResponse();
}
```

**useCompletion component:**
```typescript
'use client';

import { useCompletion } from 'ai/react';

export function TextEditor() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useCompletion({
    api: '/api/complete',
  });

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Start writing..."
          rows={4}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Complete'}
        </button>
      </form>
      {completion && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="whitespace-pre-wrap">{completion}</p>
        </div>
      )}
    </div>
  );
}
```

### Best practices:
- Use `streamText` for all user-facing AI interactions (better UX than waiting for full response)
- Define tools with clear descriptions and strict Zod schemas for reliable function calling
- Use `maxSteps` to enable multi-step agent loops (tool call -> result -> next step)
- Set `maxDuration` on API routes to handle long AI generations (60s minimum recommended)
- Use `onFinish` callback to log usage metrics and store conversations
- Implement proper error handling with fallback providers
- Use `system` prompts to set context, constraints, and persona
- Cache expensive operations (embeddings, static completions) with Vercel KV
- Use structured output (generateObject/streamObject) when you need typed JSON responses

### Anti-patterns to avoid:
- Do not use `generateText` for UI-facing endpoints (users see a loading spinner instead of progressive content)
- Avoid sending entire conversation history without truncation (token costs grow rapidly)
- Do not hardcode API keys in client-side code; always use server-side API routes
- Avoid creating new provider instances on every request (use module-level singletons)
- Do not skip Zod validation on tool parameters (leads to runtime errors)
- Avoid using Edge runtime for AI endpoints that need long execution times (30s max vs 300s for Node.js)
- Never expose raw model errors to users; catch and return friendly error messages

### Cost optimization:
- Use smaller models for simple tasks (gpt-4o-mini, claude-haiku) and reserve large models for complex reasoning
- Implement caching for repeated or similar prompts with Vercel KV
- Set `maxTokens` to prevent unexpectedly large responses
- Use `temperature: 0` for deterministic tasks (caching is more effective)
- Truncate conversation history to last N messages to reduce input tokens
- Use embeddings models (text-embedding-3-small) instead of full LLM calls for similarity search
- Monitor token usage via `result.usage` and log to your analytics platform
- Use streaming to allow users to stop generation early (saves tokens)
