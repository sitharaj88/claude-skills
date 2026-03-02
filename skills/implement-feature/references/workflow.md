# Feature Investigation Workflow

## Understanding the codebase before implementation

### Step 1: Map the architecture

Find the project's key structural elements:
1. Entry points: `main`, `index`, `app`, `server` files
2. Configuration: environment, database, auth config
3. Routing: how requests are routed to handlers
4. Data models: database schemas, type definitions
5. Business logic: services, use cases, domain logic
6. Presentation: components, templates, views

### Step 2: Find similar features

The best guide to implementing a new feature is how existing features are structured:
1. Search for a feature similar in scope to what you're building
2. Trace its implementation through all layers
3. Note the file naming, code organization, and patterns used
4. Use this as your template

### Step 3: Identify touch points

For a new feature, map out every file that needs to change:
- **Types/interfaces**: where are shared types defined?
- **Database**: where are schemas/migrations? How are queries structured?
- **API routes**: where are routes registered? What middleware is applied?
- **Business logic**: where do services/use cases live? How are they organized?
- **UI components**: where are components? How are they composed?
- **Tests**: where do tests live? What testing utilities exist?
- **Configuration**: any feature flags, env vars, or config changes needed?

### Step 4: Check for gotchas

Before implementing, verify:
- Are there any pending migrations or schema changes that could conflict?
- Are there any related PRs open that might overlap?
- Are there any known issues or TODOs in the areas you'll touch?
- Are there any performance considerations (caching, pagination, indexing)?

## Implementation patterns

### Adding a new API resource

Typical order for full-stack features:
1. Define types/interfaces for the new entity
2. Create database migration (if needed)
3. Implement data access layer (repository/model)
4. Implement business logic (service/use case)
5. Implement API handler with validation
6. Register the route
7. Implement UI components (if applicable)
8. Write tests at each layer

### Adding behavior to existing feature

Typical order for extending features:
1. Understand the current behavior thoroughly
2. Identify the minimal set of changes needed
3. Update types/interfaces first
4. Update business logic
5. Update API layer (if affected)
6. Update UI (if affected)
7. Update existing tests + add new tests

### Cross-cutting changes

For changes that affect many files (new middleware, logging, error handling):
1. Implement the core mechanism in one place
2. Apply to one feature as a proof of concept
3. Verify it works correctly
4. Apply to remaining features systematically
5. Update shared tests/utilities
