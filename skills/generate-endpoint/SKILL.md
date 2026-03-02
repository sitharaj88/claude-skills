---
name: generate-endpoint
description: Generates API endpoint handlers with validation, error handling, types, and tests, matching the project's backend framework and existing patterns. Use when the user asks to create an API endpoint, add a route, build a REST resource, or scaffold backend handlers.
argument-hint: "[resource-name] [method: GET|POST|PUT|DELETE|CRUD]"
allowed-tools: Read, Grep, Glob, Write, Edit
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a backend API expert. Generate a complete API endpoint for `$ARGUMENTS`, precisely matching the project's existing backend patterns.

### Step 1: Detect the backend framework

Search for framework indicators:
- **Express**: `express` in package.json, `app.get/post/put/delete` or `router.get/post`
- **Fastify**: `fastify` in package.json, `fastify.get` or route schema objects
- **Next.js API**: `next` in package.json, `pages/api/` or `app/api/` directories
- **Hono**: `hono` in package.json
- **Flask**: `flask` in requirements.txt, `@app.route`
- **Django REST**: `djangorestframework` in requirements.txt, `ViewSet`, `APIView`
- **FastAPI**: `fastapi` in requirements.txt, `@app.get`, Pydantic models
- **Go**: `net/http`, chi, gin, echo, fiber in go.mod
- **Rust**: actix-web, axum, rocket in Cargo.toml

### Step 2: Study existing endpoint patterns

Find 2-3 existing route handlers. For each, analyze:

**File organization:**
- Routes directory structure (`routes/`, `controllers/`, `handlers/`, `api/`)
- One file per resource vs grouped by domain
- Separation of route definition, handler, and business logic

**Middleware chain:**
- Authentication middleware (JWT verification, session check, API key)
- Authorization checks (role-based, permission-based)
- Rate limiting, CORS, logging

**Validation approach:**
- Zod schemas, Joi validation, Pydantic models, Go struct tags
- Where validation happens (middleware, handler, separate layer)
- Error response format for validation failures

**Response format:**
- Envelope pattern: `{ data, error, meta }` or `{ success, result }`
- Direct response: just the data
- Pagination format for list endpoints
- HTTP status code usage

**Error handling:**
- Custom error classes/types
- Centralized error handler vs per-route handling
- Error response structure

**Database/ORM pattern:**
- Prisma, TypeORM, Sequelize, SQLAlchemy, GORM, etc.
- Repository pattern vs direct queries
- Transaction usage

### Step 3: Parse the request

From `$ARGUMENTS`:
- `$0` = Resource name (e.g., `users`, `orders`, `products`)
- `$1` = HTTP method or `CRUD` for full resource:
  - `GET` — list and/or get-by-id endpoint
  - `POST` — create endpoint
  - `PUT` or `PATCH` — update endpoint
  - `DELETE` — delete endpoint
  - `CRUD` — generate all standard REST endpoints for the resource

### Step 4: Generate types/schemas

- **Request types**: path params, query params, request body
- **Response types**: success response, error response
- **Validation schema**: using the project's validation library
- Match existing type naming conventions and file locations

### Step 5: Generate the handler(s)

For each endpoint, generate:

1. **Route registration** matching existing pattern
2. **Authentication/authorization** if existing endpoints use it
3. **Input validation** using project's approach
4. **Handler logic** with:
   - Input extraction and validation
   - Business logic (with `// TODO:` for complex domain logic)
   - Database interaction following project's ORM/query pattern
   - Proper error handling matching project's error format
   - Response formatting matching project's envelope
5. **Correct HTTP status codes**: 200, 201, 204, 400, 401, 403, 404, 409, 500

### Step 6: Generate tests

Create API/integration tests following the project's testing pattern:
- **Success cases**: valid request returns expected response and status
- **Validation errors**: invalid input returns 400 with error details
- **Not found**: non-existent resource returns 404
- **Auth failures**: missing/invalid token returns 401 (if auth is used)
- **Edge cases**: duplicate creation (409), empty list, pagination boundaries

### Step 7: Register the route

- Add the route to the router/app following existing registration patterns
- Update any route index files or barrel exports
- If there's an API documentation setup (Swagger/OpenAPI), add annotations

### Guidelines

- Follow REST conventions: plural resource names, proper HTTP methods and status codes
- Match the project's patterns EXACTLY — don't introduce new libraries or patterns
- If the project uses a service layer, create the service — don't put business logic in the handler
- If the project uses a repository pattern, create the repository — don't query the DB directly in the handler
- Keep generated TODO comments specific: `// TODO: implement order total calculation` not `// TODO: add logic`
- If `CRUD` is requested, ensure consistent patterns across all generated endpoints
