# AWS API Gateway

Generate REST, HTTP, and WebSocket APIs with authorizers, request validation, integrations, and deployment stages.

## Usage

```bash
/aws-api-gateway <description of your API>
```

## What It Does

1. Selects the appropriate API type (REST, HTTP API, or WebSocket) for your use case
2. Generates API resource and route definitions with request/response models
3. Configures Lambda, HTTP, or AWS service integrations for each route
4. Sets up authorizers (Cognito, Lambda, JWT) and API key usage plans
5. Produces OpenAPI/Swagger specifications for documentation
6. Adds throttling, CORS, custom domains, and stage configurations

## Examples

```bash
/aws-api-gateway Create a REST API with Cognito authorizer and Lambda proxy integration

/aws-api-gateway Build an HTTP API with JWT auth, rate limiting, and custom domain

/aws-api-gateway Set up a WebSocket API for real-time chat with connect/disconnect handlers
```

## Allowed Tools

- `Read` - Read existing API definitions and handler code
- `Write` - Create API templates, OpenAPI specs, and integration configs
- `Edit` - Modify existing API configurations
- `Bash` - Run AWS CLI and SAM commands for API testing
- `Glob` - Search for API-related files
- `Grep` - Find route and integration references
