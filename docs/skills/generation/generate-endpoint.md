# Generate Endpoint

Creates API endpoints with validation, error handling, types, and tests matching your backend framework. The skill reads your existing route definitions to produce endpoints that are consistent with your project's middleware stack, error format, and response structure.

## Quick Start

```bash
# Generate full CRUD endpoints for a resource
/generate-endpoint users CRUD

# Generate a single POST endpoint
/generate-endpoint orders POST

# Generate a GET endpoint
/generate-endpoint products GET
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `resource` | `$0` | Yes | Name of the API resource (e.g., `users`, `orders`, `products`) |
| `method` | `$1` | Yes | HTTP method: `GET`, `POST`, `PUT`, `DELETE`, or `CRUD` for all five |

::: tip
Using `CRUD` as the method argument generates all five standard REST endpoints for the resource: **list**, **get by ID**, **create**, **update**, and **delete**. This is the fastest way to scaffold a complete resource API.
:::

## How It Works

1. **Detects backend framework** -- Identifies your framework from Express, Fastify, Next.js API routes, Flask, Django, FastAPI, Go (net/http, Gin, Echo), and Rust (Actix, Axum).
2. **Studies existing endpoints** -- Reads existing route handlers to learn your patterns for middleware usage, request validation, error response format, and response structure.
3. **Generates types and validation** -- Creates request/response types or schemas and validation logic using the library your project already uses (Zod, Joi, Pydantic, etc.).
4. **Generates handler and route** -- Produces the route handler with proper error handling, and registers the route in your router following existing conventions.
5. **Generates tests** -- Creates API tests covering four scenarios: success, validation error, not found, and auth failure.

## CRUD Endpoints

When you specify `CRUD`, the skill generates all five REST endpoints:

| Endpoint | Method | Path | Description |
|----------|--------|------|-------------|
| List | `GET` | `/resource` | Paginated list with filtering |
| Get | `GET` | `/resource/:id` | Single item by ID |
| Create | `POST` | `/resource` | Create with validation |
| Update | `PUT` | `/resource/:id` | Update with validation |
| Delete | `DELETE` | `/resource/:id` | Soft or hard delete |

## Supported Frameworks

| Language | Frameworks |
|----------|------------|
| **JavaScript/TypeScript** | Express, Fastify, Next.js (API Routes & Route Handlers) |
| **Python** | Flask, Django (DRF), FastAPI |
| **Go** | net/http, Gin, Echo |
| **Rust** | Actix Web, Axum |

## Example

Suppose you have a Fastify + TypeScript project and run:

```bash
/generate-endpoint orders CRUD
```

The skill analyzes your existing endpoints, then generates:

```
src/modules/orders/
  orders.schema.ts       # Zod schemas for request/response validation
  orders.handler.ts      # Route handlers for all 5 CRUD operations
  orders.route.ts        # Route registration with Fastify schema validation
  orders.test.ts         # Integration tests covering success and error cases
```

Each handler follows the same patterns as your existing endpoints -- reusing your error response helper, your pagination utility, your auth middleware, and your database query style.

::: warning
The skill generates test scaffolding based on detected patterns, but you may need to adjust database seeding or mock setup depending on your test infrastructure. Always review the generated test file before running your test suite.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit` |

This skill operates in inline context mode with read/write file access. It does not execute shell commands, so it will not run migrations, install packages, or start servers. You will need to handle those steps separately.
