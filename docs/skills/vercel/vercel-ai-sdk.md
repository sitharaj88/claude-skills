# Vercel AI SDK

Generate Vercel AI SDK configs with streaming chat, tool calling, structured output, RAG pipelines, and multi-provider support for AI-powered applications.

## Usage

```bash
/vercel-ai-sdk <pattern or description>
```

## What It Does

1. Installs and configures the AI SDK with provider packages for OpenAI, Anthropic, Google, Mistral, and more
2. Generates streaming chat API routes with `streamText` and React `useChat` hook integration
3. Implements tool calling with Zod-validated parameters and multi-step agent loops
4. Creates structured output with `generateObject`/`streamObject` and type-safe Zod schemas
5. Builds RAG pipelines with embedding generation, pgvector similarity search, and context injection
6. Configures AI SDK middleware for logging, caching, and multi-provider fallback patterns

## Example Output

```typescript
// app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const maxDuration = 60;

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
          const response = await fetch(
            `https://api.weather.example.com?q=${location}&units=${unit}`
          );
          return response.json();
        },
      }),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
```

## What It Covers

- **Text generation** with `generateText` for server-side and `streamText` for streaming UI responses
- **Chat interfaces** with `useChat` hook, message history, stop/reload controls, and error handling
- **Tool calling** with Zod schema validation, multi-step execution, and UI result rendering
- **Structured output** with `generateObject`/`streamObject` for typed JSON responses
- **RAG pipelines** with embedding generation, vector similarity search, and context-augmented prompts
- **Multi-provider support** with OpenAI, Anthropic, Google, Mistral, and provider fallback patterns
- **AI middleware** with logging, caching via Vercel KV, and performance monitoring
- **useCompletion and useObject** hooks for text completion and streaming structured data

<div class="badge-row">
  <span class="badge">Vercel</span>
  <span class="badge">AI</span>
  <span class="badge">Streaming</span>
</div>

## Installation

```bash
cp -r skills/vercel-ai-sdk ~/.claude/skills/vercel-ai-sdk
```

## Allowed Tools

- `Read` - Read existing AI routes, components, and configuration files
- `Write` - Create chat endpoints, tool definitions, and AI-powered components
- `Edit` - Modify existing AI SDK configurations and provider settings
- `Bash` - Run Vercel CLI, npm, and npx commands
- `Glob` - Search for AI-related route and component files
- `Grep` - Find AI SDK usage patterns and provider references
