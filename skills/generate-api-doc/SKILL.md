---
name: generate-api-doc
description: Generates API reference documentation by analyzing route definitions, request/response types, and validation schemas in the codebase. Produces endpoint documentation with parameters, examples, and error codes. Use when the user asks for API documentation, endpoint reference, or REST API docs.
argument-hint: "[output-file-path] [format: markdown|openapi]"
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a technical writer specializing in API documentation. Generate comprehensive, accurate API reference docs by analyzing the actual codebase.

### Step 1: Detect the API framework

Search for:
- **Express/Fastify/Hono**: `app.get`, `router.post`, `app.route` patterns
- **Next.js API**: `pages/api/` or `app/api/` route files
- **Flask/FastAPI/Django**: `@app.route`, `@router.get`, `urlpatterns`
- **Go**: `http.HandleFunc`, `r.Get`, `e.GET` patterns
- **GraphQL**: `typeDefs`, `resolvers`, `.graphql` schema files

### Step 2: Discover all endpoints

Use Grep to find all route registrations. For each route, extract:
- HTTP method (GET, POST, PUT, PATCH, DELETE)
- Path pattern (with path parameters like `:id` or `{id}`)
- Handler function reference

Build a complete route map.

### Step 3: Analyze each endpoint

For each discovered endpoint, read the handler code to extract:

**Request details:**
- Path parameters (name, type, description)
- Query parameters (name, type, required/optional, default, description)
- Request headers (especially auth headers)
- Request body schema (from validation schemas, TypeScript types, Pydantic models, Go structs)

**Response details:**
- Success response body shape and types
- HTTP status codes returned (success and error)
- Response headers (if notable, e.g., pagination, rate-limit)

**Authentication:**
- Is this endpoint authenticated? (check middleware chain)
- What auth method? (Bearer token, API key, cookie/session)
- Authorization requirements (roles, permissions)

**Validation rules:**
- Required fields, min/max lengths, patterns, enums
- Extract from Zod, Joi, Pydantic, Go validator tags, etc.

### Step 4: Group by resource

Organize endpoints by REST resource:
- `/users/*` → Users
- `/orders/*` → Orders
- `/auth/*` → Authentication

Within each group, order: GET (list), GET (single), POST, PUT/PATCH, DELETE.

### Step 5: Generate examples

For each endpoint, create:
- **Example request** with realistic sample data (use `example.com` domain, `user@example.com` emails)
- **Example success response** matching the response schema
- **Example error response** for the most common error case

### Step 6: Document authentication

Write a dedicated authentication section:
- How to obtain credentials (if visible from the code)
- How to include credentials in requests (header format)
- Token refresh flow (if applicable)
- Error responses for auth failures

### Step 7: Format output

**If markdown format (default):**

```markdown
# API Reference

## Authentication
[Auth mechanism description]

## Endpoints

### Users

#### List Users
`GET /api/users`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 20 | Items per page |

**Response:** `200 OK`
\`\`\`json
{
  "data": [{ "id": "1", "name": "Jane Doe", "email": "jane@example.com" }],
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
\`\`\`

**Errors:**
| Status | Description |
|--------|-------------|
| 401 | Authentication required |
| 403 | Insufficient permissions |
```

**If openapi format (`$1` = "openapi"):**
Generate valid OpenAPI 3.0 YAML with:
- info section (title, version, description)
- servers section
- paths with operations
- components/schemas for request/response types
- securitySchemes

### Guidelines

- Document what the code DOES, not what it SHOULD do — read the actual handlers
- Include all endpoints, even internal/admin ones (mark them as such)
- Use realistic but obviously fake data in examples (john@example.com, not real emails)
- If validation rules exist in code, document them precisely — these are what developers need most
- If an endpoint lacks validation or error handling, note it as a documentation gap
- Save to `$0` file path if provided, otherwise present to the user
