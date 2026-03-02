# Generate API Doc

Generates API reference documentation by analyzing actual route definitions in the codebase. This skill detects your framework, discovers all endpoints, and produces detailed documentation including request/response schemas, authentication requirements, and example payloads.

## Quick Start

Generate API documentation with default settings:

```bash
/generate-api-doc
```

Specify an output path and format:

```bash
/generate-api-doc docs/API.md markdown
```

```bash
/generate-api-doc docs/openapi.yaml openapi
```

## Arguments

| Argument | Description | Default |
|---|---|---|
| `$0` | Output file path for the generated document | Printed to conversation |
| `$1` | Output format | `markdown` |

Supported formats:

- **`markdown`** -- Human-readable API reference with tables, examples, and grouped endpoints
- **`openapi`** -- Machine-readable OpenAPI 3.0 YAML specification

## How It Works

1. **Detect framework** -- Identifies the API framework in use (Express, Fastify, Next.js API routes, Django REST, Flask, Rails, Spring Boot, etc.)
2. **Discover routes** -- Scans route definitions, decorators, and configuration files to build a complete endpoint inventory
3. **Analyze each endpoint** -- For every route, extracts:
   - HTTP method and path
   - Request parameters (path, query, body)
   - Response structure and status codes
   - Authentication and authorization requirements
   - Validation rules and constraints
4. **Group by resource** -- Organizes endpoints into logical resource groups (e.g., Users, Orders, Products)
5. **Generate examples** -- Creates realistic example request and response payloads based on detected schemas
6. **Document authentication** -- Describes the authentication mechanism (JWT, API key, OAuth, session) and which endpoints require it
7. **Format output** -- Renders the final documentation in the requested format

## Output Format

### Markdown Output

```markdown
# API Reference

## Authentication
All endpoints require a Bearer token unless marked as public.

## Users

### GET /api/users
List all users with pagination.

**Query Parameters**
| Parameter | Type   | Required | Description          |
|-----------|--------|----------|----------------------|
| page      | number | No       | Page number (default: 1) |
| limit     | number | No       | Items per page (default: 20) |

**Response** `200 OK`
` ``json
{
  "data": [{ "id": 1, "name": "Alice", "email": "alice@example.com" }],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
` ``

**Error Codes**
| Status | Description         |
|--------|---------------------|
| 401    | Unauthorized        |
| 500    | Internal server error |
```

### OpenAPI Output

```yaml
openapi: 3.0.3
info:
  title: My API
  version: 1.0.0
paths:
  /api/users:
    get:
      summary: List all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Successful response
```

::: tip
Use the `openapi` format to feed the output into tools like Swagger UI, Postman, or API client generators for an interactive documentation experience.
:::

::: warning
The skill analyzes static route definitions. Dynamically generated routes, middleware-injected parameters, or routes registered at runtime may not be captured. Review the output against your running application for completeness.
:::

## Configuration

| Setting | Value |
|---|---|
| **Context mode** | `fork` -- runs in an isolated context so document generation does not affect your working conversation |
| **Agent** | `Explore` -- uses a read-only exploration agent for safe, non-destructive analysis |

When an output path is provided, the skill writes the file to disk. Otherwise, no files are created or modified.
