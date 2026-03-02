---
name: aws-api-gateway
description: Generate AWS API Gateway configurations for REST APIs, HTTP APIs, and WebSocket APIs with routes, authorizers, stages, and integrations. Use when the user wants to create or configure API Gateway endpoints.
argument-hint: "[rest|http|websocket] [api name] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *), Bash(sam *)
user-invocable: true
---

## Instructions

You are an AWS API Gateway expert. Generate production-ready API configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **API type**: REST API (full features), HTTP API (simpler, cheaper), WebSocket
- **API name** and purpose
- **Auth strategy**: Cognito, Lambda authorizer, IAM, API key, JWT
- **Backend**: Lambda, HTTP endpoint, AWS service proxy

### Step 2: Choose API type

| Feature | REST API | HTTP API |
|---------|----------|----------|
| Cost | Higher | 70% cheaper |
| Auth | Cognito, Lambda, IAM, API Key | JWT, Lambda, IAM |
| Features | Full (caching, WAF, request validation) | Core routing |
| WebSocket | No (separate) | No (separate) |

Recommend HTTP API unless REST-specific features are needed.

### Step 3: Generate API definition

**OpenAPI/Swagger specification:**
- Paths and methods
- Request/response models with JSON Schema validation
- Integration definitions (Lambda proxy, HTTP proxy, AWS service)
- Authorizer configuration
- CORS settings

**Or SAM/CloudFormation template with:**
- API resource and stage
- Lambda function integrations
- Method request/response configuration
- Gateway responses for error formatting

### Step 4: Configure authorization

**Cognito Authorizer:**
- User Pool ID and app client
- Token validation (ID token or access token)
- Authorization scopes

**Lambda Authorizer:**
- Token-based or request-based
- Caching TTL
- Generate authorizer Lambda function

**JWT Authorizer (HTTP API):**
- Issuer URL
- Audience configuration

### Step 5: Configure deployment

- **Stages**: dev, staging, prod with stage variables
- **Custom domain**: Route 53 alias + ACM certificate
- **Throttling**: account and method-level rate/burst limits
- **Logging**: CloudWatch access logs with request/response
- **WAF** integration (REST API)
- **Usage plans and API keys** if monetizing
- **Caching** (REST API, 0.5GB-237GB)

### Step 6: Generate client SDK (optional)

- TypeScript/JavaScript fetch wrapper
- Python requests wrapper
- Auto-generated from OpenAPI spec

### Best practices:
- Use HTTP API for most new APIs (cheaper, faster)
- Enable CloudWatch access logging on all stages
- Set appropriate throttling limits
- Use request validation to reject bad requests early
- Enable CORS only for required origins
- Use Lambda proxy integration for simplicity
- Version APIs with stages or path prefixes
- Enable X-Ray tracing for debugging
