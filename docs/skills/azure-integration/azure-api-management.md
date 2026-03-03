# Azure API Management

Generate API policies, rate limiting, OAuth integration, versioning strategies, developer portal configurations, and gateway setups following Azure API Management best practices.

## Usage

```bash
/azure-api-management <description of your API management requirements>
```

## What It Does

1. Creates API definitions with OpenAPI imports, version sets, and revision management strategies
2. Generates inbound, outbound, and on-error policy expressions for request/response transformation
3. Produces rate limiting, quota, and throttling policies with per-subscription and per-key controls
4. Configures OAuth 2.0 and JWT validation policies with Entra ID and external identity provider integration
5. Sets up product definitions, subscription keys, developer portal customization, and API groupings
6. Implements backend configurations with load balancing, circuit breaker, and retry policy patterns

## Examples

```bash
/azure-api-management Create API policies with JWT validation, rate limiting, and request transformation for a REST API

/azure-api-management Design a versioning strategy with URL path segments and header-based revision selection

/azure-api-management Set up a self-hosted gateway with caching policies and backend circuit breaker patterns
```

## What It Covers

- **API definitions** - OpenAPI import, version sets, revisions, and API schema management
- **Policies** - Inbound, outbound, backend, and on-error policy chains with expressions
- **Rate limiting** - Rate-limit, quota-by-key, and ip-filter policies with counter management
- **Authentication** - JWT validation, OAuth 2.0 flows, subscription keys, and certificate authentication
- **Products** - API groupings, subscription requirements, approval workflows, and access control
- **Developer portal** - Custom branding, API documentation, interactive console, and self-service signup
- **Gateway** - Self-hosted gateways, caching, CORS, rewrite-uri, and set-header policies
- **Backends** - Backend entities, load balancing, circuit breaker, and retry configurations

<div class="badge-row">
  <span class="badge">APIs</span>
  <span class="badge">Gateway</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing API definitions, policy files, and gateway configurations
- `Write` - Create API policy XML, OpenAPI specs, and product definitions
- `Edit` - Modify existing API policies and management configurations
- `Bash` - Run Azure CLI commands for API Management deployment and testing
- `Glob` - Search for API definition files and policy configuration templates
- `Grep` - Find API references, subscription key usage, and policy patterns across the project
