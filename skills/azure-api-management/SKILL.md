---
name: azure-api-management
description: Generate APIM configs with policies, products, and developer portal
invocation: /azure-api-management [operation]
arguments:
  - name: operation
    description: "Operation (api, policy, product, subscription, portal)"
    required: false
allowed_tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
---

## Instructions

You are an Azure API Management expert. Generate production-ready APIM configurations for API governance, security, and developer experience.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: API definition, policy configuration, product setup, subscription management, developer portal
- **Tier**: Consumption (serverless), Developer (testing), Basic, Standard, Premium (multi-region, VNET)
- **API type**: REST (OpenAPI), SOAP (WSDL), GraphQL, WebSocket, gRPC
- **Backend**: App Service, Function App, AKS, external API, Logic App
- **Security**: OAuth 2.0/JWT, subscription keys, client certificates, IP filtering

### Step 2: Generate APIM instance

```bicep
resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: 'apim-${appName}-${environment}'
  location: location
  sku: {
    name: 'Standard'  // Consumption, Developer, Basic, Standard, Premium
    capacity: 1        // Scale units (not for Consumption)
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherName: publisherName
    publisherEmail: publisherEmail
    virtualNetworkType: 'None'  // None, External, Internal
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Ssl30': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Ssl30': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Ciphers.TripleDes168': 'False'
    }
    apiVersionConstraint: {
      minApiVersion: '2021-08-01'
    }
  }
  tags: commonTags
}

// Application Insights for APIM
resource apimLogger 'Microsoft.ApiManagement/service/loggers@2023-05-01-preview' = {
  parent: apim
  name: 'appinsights-logger'
  properties: {
    loggerType: 'applicationInsights'
    credentials: {
      instrumentationKey: appInsights.properties.InstrumentationKey
    }
    isBuffered: true
  }
}

resource apimDiagnostics 'Microsoft.ApiManagement/service/diagnostics@2023-05-01-preview' = {
  parent: apim
  name: 'applicationinsights'
  properties: {
    loggerId: apimLogger.id
    alwaysLog: 'allErrors'
    logClientIp: true
    httpCorrelationProtocol: 'W3C'
    verbosity: 'information'
    sampling: {
      percentage: 100
      samplingType: 'fixed'
    }
    frontend: {
      request: {
        headers: []
        body: { bytes: 0 }
      }
      response: {
        headers: []
        body: { bytes: 0 }
      }
    }
    backend: {
      request: {
        headers: []
        body: { bytes: 0 }
      }
      response: {
        headers: []
        body: { bytes: 0 }
      }
    }
  }
}
```

### Step 3: Generate API definition

**Import OpenAPI specification:**

```bicep
resource ordersApi 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apim
  name: 'orders-api'
  properties: {
    displayName: 'Orders API'
    description: 'API for managing orders'
    path: 'orders'
    protocols: ['https']
    subscriptionRequired: true
    subscriptionKeyParameterNames: {
      header: 'X-API-Key'
      query: 'api-key'
    }
    apiRevision: '1'
    apiVersion: 'v1'
    apiVersionSetId: apiVersionSet.id
    serviceUrl: 'https://app-orders-${environment}.azurewebsites.net'
    format: 'openapi+json'
    value: loadTextContent('openapi/orders-api.json')
    authenticationSettings: {
      oAuth2AuthenticationSettings: [
        {
          authorizationServerId: oauthServer.name
        }
      ]
    }
  }
}

// API Version Set
resource apiVersionSet 'Microsoft.ApiManagement/service/apiVersionSets@2023-05-01-preview' = {
  parent: apim
  name: 'orders-api-version-set'
  properties: {
    displayName: 'Orders API'
    versioningScheme: 'Segment'  // Segment (/v1/), Header, Query
    versionHeaderName: 'Api-Version'
    versionQueryName: 'api-version'
  }
}

// Individual operations (if not importing OpenAPI)
resource getOrders 'Microsoft.ApiManagement/service/apis/operations@2023-05-01-preview' = {
  parent: ordersApi
  name: 'get-orders'
  properties: {
    displayName: 'Get Orders'
    method: 'GET'
    urlTemplate: '/'
    description: 'Retrieve all orders'
    responses: [
      {
        statusCode: 200
        description: 'List of orders'
        representations: [
          {
            contentType: 'application/json'
            schemaId: 'orderSchema'
            typeName: 'OrderList'
          }
        ]
      }
    ]
  }
}

// Named values (configuration)
resource backendUrl 'Microsoft.ApiManagement/service/namedValues@2023-05-01-preview' = {
  parent: apim
  name: 'backend-url'
  properties: {
    displayName: 'Backend URL'
    value: 'https://app-orders-${environment}.azurewebsites.net'
    secret: false
  }
}

// Named value from Key Vault
resource apiSecret 'Microsoft.ApiManagement/service/namedValues@2023-05-01-preview' = {
  parent: apim
  name: 'api-signing-key'
  properties: {
    displayName: 'API Signing Key'
    keyVault: {
      secretIdentifier: 'https://kv-${appName}.vault.azure.net/secrets/api-signing-key'
    }
    secret: true
  }
}
```

### Step 4: Generate APIM policies

**Global (all APIs) policy:**

```xml
<!-- Global policy applied to all APIs -->
<policies>
    <inbound>
        <!-- Rate limiting by subscription -->
        <rate-limit-by-key
            calls="100"
            renewal-period="60"
            counter-key="@(context.Subscription?.Key ?? context.Request.IpAddress)"
            increment-condition="@(context.Response.StatusCode >= 200 && context.Response.StatusCode < 400)" />

        <!-- CORS -->
        <cors allow-credentials="true">
            <allowed-origins>
                <origin>https://portal.myapp.com</origin>
                <origin>https://admin.myapp.com</origin>
            </allowed-origins>
            <allowed-methods preflight-result-max-age="300">
                <method>GET</method>
                <method>POST</method>
                <method>PUT</method>
                <method>DELETE</method>
                <method>OPTIONS</method>
            </allowed-methods>
            <allowed-headers>
                <header>Authorization</header>
                <header>Content-Type</header>
                <header>X-Request-Id</header>
            </allowed-headers>
        </cors>

        <!-- Add request ID for tracing -->
        <set-header name="X-Request-Id" exists-action="skip">
            <value>@(Guid.NewGuid().ToString())</value>
        </set-header>

        <!-- IP filtering -->
        <ip-filter action="allow">
            <address-range from="10.0.0.0" to="10.255.255.255" />
            <address>203.0.113.50</address>
        </ip-filter>
    </inbound>
    <backend>
        <forward-request timeout="30" />
    </backend>
    <outbound>
        <!-- Remove sensitive headers -->
        <set-header name="X-Powered-By" exists-action="delete" />
        <set-header name="X-AspNet-Version" exists-action="delete" />
        <set-header name="Server" exists-action="delete" />

        <!-- Add security headers -->
        <set-header name="X-Content-Type-Options" exists-action="override">
            <value>nosniff</value>
        </set-header>
        <set-header name="X-Frame-Options" exists-action="override">
            <value>DENY</value>
        </set-header>
        <set-header name="Content-Security-Policy" exists-action="override">
            <value>default-src 'none'</value>
        </set-header>
    </outbound>
    <on-error>
        <!-- Custom error response -->
        <set-status code="500" reason="Internal Server Error" />
        <set-header name="Content-Type" exists-action="override">
            <value>application/json</value>
        </set-header>
        <set-body>@{
            return new JObject(
                new JProperty("error", new JObject(
                    new JProperty("code", context.Response.StatusCode),
                    new JProperty("message", "An error occurred processing your request."),
                    new JProperty("requestId", context.RequestId.ToString())
                ))
            ).ToString();
        }</set-body>
    </on-error>
</policies>
```

**JWT validation policy:**

```xml
<policies>
    <inbound>
        <!-- Validate JWT from Entra ID -->
        <validate-jwt
            header-name="Authorization"
            failed-validation-httpcode="401"
            failed-validation-error-message="Unauthorized"
            require-expiration-time="true"
            require-scheme="Bearer"
            require-signed-tokens="true">
            <openid-config url="https://login.microsoftonline.com/{tenant-id}/v2.0/.well-known/openid-configuration" />
            <required-claims>
                <claim name="aud" match="any">
                    <value>api://my-api-client-id</value>
                </claim>
                <claim name="roles" match="any">
                    <value>Orders.Read</value>
                    <value>Orders.ReadWrite</value>
                </claim>
            </required-claims>
        </validate-jwt>

        <!-- Extract claims for backend -->
        <set-header name="X-User-Id" exists-action="override">
            <value>@(context.Request.Headers.GetValueOrDefault("Authorization","").AsJwt()?.Claims.GetValueOrDefault("oid", "unknown"))</value>
        </set-header>
        <set-header name="X-User-Email" exists-action="override">
            <value>@(context.Request.Headers.GetValueOrDefault("Authorization","").AsJwt()?.Claims.GetValueOrDefault("email", "unknown"))</value>
        </set-header>
    </inbound>
</policies>
```

**Caching policy:**

```xml
<policies>
    <inbound>
        <!-- Cache lookup -->
        <cache-lookup vary-by-developer="false"
                      vary-by-developer-groups="false"
                      caching-type="prefer-external"
                      downstream-caching-type="none">
            <vary-by-query-parameter>page</vary-by-query-parameter>
            <vary-by-query-parameter>pageSize</vary-by-query-parameter>
            <vary-by-header>Accept</vary-by-header>
        </cache-lookup>
    </inbound>
    <outbound>
        <!-- Cache store (only successful responses) -->
        <cache-store duration="300" cache-response="@(context.Response.StatusCode == 200)" />
    </outbound>
</policies>
```

**Request/response transformation policy:**

```xml
<policies>
    <inbound>
        <!-- Transform request -->
        <set-body>@{
            var body = context.Request.Body.As<JObject>(preserveContent: true);
            body["timestamp"] = DateTime.UtcNow.ToString("o");
            body["source"] = "apim";
            return body.ToString();
        }</set-body>

        <!-- Rewrite URL -->
        <rewrite-uri template="/api/v2/orders/{orderId}" copy-unmatched-params="true" />

        <!-- Set backend dynamically -->
        <set-backend-service base-url="@{
            var region = context.Request.Headers.GetValueOrDefault("X-Region", "eastus");
            return region == "westus"
                ? "https://app-orders-westus.azurewebsites.net"
                : "https://app-orders-eastus.azurewebsites.net";
        }" />
    </inbound>
    <outbound>
        <!-- Transform response -->
        <set-body>@{
            var response = context.Response.Body.As<JObject>();
            var wrapper = new JObject(
                new JProperty("data", response),
                new JProperty("meta", new JObject(
                    new JProperty("requestId", context.RequestId.ToString()),
                    new JProperty("apiVersion", "v1"),
                    new JProperty("timestamp", DateTime.UtcNow.ToString("o"))
                ))
            );
            return wrapper.ToString();
        }</set-body>
    </outbound>
</policies>
```

**Circuit breaker and retry policy:**

```xml
<policies>
    <backend>
        <!-- Retry with exponential backoff -->
        <retry condition="@(context.Response.StatusCode >= 500)"
               count="3"
               interval="1"
               max-interval="30"
               delta="2"
               first-fast-retry="true">
            <forward-request timeout="10" buffer-request-body="true" />
        </retry>
    </backend>
</policies>
```

**Backend with load balancing:**

```bicep
resource backend 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apim
  name: 'orders-backend-pool'
  properties: {
    type: 'Pool'
    description: 'Load-balanced backend pool'
    pool: {
      services: [
        {
          id: '/backends/orders-eastus'
          priority: 1
          weight: 3
        }
        {
          id: '/backends/orders-westus'
          priority: 1
          weight: 1
        }
        {
          id: '/backends/orders-fallback'
          priority: 2
          weight: 1
        }
      ]
    }
    circuitBreaker: {
      rules: [
        {
          failureCondition: {
            count: 5
            errorReasons: ['Server errors']
            interval: 'PT1M'
            statusCodeRanges: [
              { min: 500, max: 599 }
            ]
          }
          name: 'circuit-breaker-rule'
          tripDuration: 'PT1M'
          acceptRetryAfter: true
        }
      ]
    }
  }
}

resource backendEastus 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apim
  name: 'orders-eastus'
  properties: {
    url: 'https://app-orders-eastus.azurewebsites.net'
    protocol: 'http'
    tls: {
      validateCertificateChain: true
      validateCertificateName: true
    }
    credentials: {
      header: {}
      query: {}
    }
  }
}
```

### Step 5: Generate products and subscriptions

```bicep
// Product definition
resource product 'Microsoft.ApiManagement/service/products@2023-05-01-preview' = {
  parent: apim
  name: 'standard-api'
  properties: {
    displayName: 'Standard API Access'
    description: 'Standard tier with rate limiting'
    subscriptionRequired: true
    approvalRequired: true
    subscriptionsLimit: 5
    state: 'published'
    terms: 'By subscribing, you agree to the Terms of Service.'
  }
}

// Associate API with product
resource productApi 'Microsoft.ApiManagement/service/products/apis@2023-05-01-preview' = {
  parent: product
  name: ordersApi.name
}

// Product policy (rate limiting per product)
resource productPolicy 'Microsoft.ApiManagement/service/products/policies@2023-05-01-preview' = {
  parent: product
  name: 'policy'
  properties: {
    value: '''
      <policies>
        <inbound>
          <rate-limit calls="1000" renewal-period="3600" />
          <quota calls="10000" renewal-period="86400" />
        </inbound>
      </policies>
    '''
    format: 'xml'
  }
}

// Premium product with higher limits
resource premiumProduct 'Microsoft.ApiManagement/service/products@2023-05-01-preview' = {
  parent: apim
  name: 'premium-api'
  properties: {
    displayName: 'Premium API Access'
    description: 'Premium tier with higher rate limits'
    subscriptionRequired: true
    approvalRequired: false
    state: 'published'
  }
}

resource premiumProductPolicy 'Microsoft.ApiManagement/service/products/policies@2023-05-01-preview' = {
  parent: premiumProduct
  name: 'policy'
  properties: {
    value: '''
      <policies>
        <inbound>
          <rate-limit calls="10000" renewal-period="3600" />
          <quota calls="100000" renewal-period="86400" />
        </inbound>
      </policies>
    '''
    format: 'xml'
  }
}

// Subscription
resource subscription 'Microsoft.ApiManagement/service/subscriptions@2023-05-01-preview' = {
  parent: apim
  name: 'partner-subscription'
  properties: {
    displayName: 'Partner Access'
    scope: '/products/${product.name}'
    state: 'active'
    allowTracing: false
  }
}
```

### Step 6: Generate Terraform configuration

```hcl
resource "azurerm_api_management" "main" {
  name                 = "apim-${var.app_name}-${var.environment}"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  publisher_name       = var.publisher_name
  publisher_email      = var.publisher_email
  sku_name             = "Standard_1"  # Consumption, Developer_1, Basic_1, Standard_1, Premium_1

  identity {
    type = "SystemAssigned"
  }

  protocols {
    enable_http2 = true
  }

  security {
    enable_backend_ssl30  = false
    enable_backend_tls10  = false
    enable_backend_tls11  = false
    enable_frontend_ssl30 = false
    enable_frontend_tls10 = false
    enable_frontend_tls11 = false
  }

  sign_in {
    enabled = true
  }

  tags = var.common_tags
}

resource "azurerm_api_management_api" "orders" {
  name                  = "orders-api"
  resource_group_name   = azurerm_resource_group.main.name
  api_management_name   = azurerm_api_management.main.name
  revision              = "1"
  display_name          = "Orders API"
  path                  = "orders"
  protocols             = ["https"]
  subscription_required = true
  service_url           = "https://app-orders-${var.environment}.azurewebsites.net"

  subscription_key_parameter_names {
    header = "X-API-Key"
    query  = "api-key"
  }

  import {
    content_format = "openapi+json"
    content_value  = file("${path.module}/openapi/orders-api.json")
  }
}

resource "azurerm_api_management_api_policy" "orders" {
  api_name            = azurerm_api_management_api.orders.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = azurerm_resource_group.main.name

  xml_content = <<XML
<policies>
  <inbound>
    <validate-jwt header-name="Authorization" failed-validation-httpcode="401" require-scheme="Bearer">
      <openid-config url="https://login.microsoftonline.com/${var.tenant_id}/v2.0/.well-known/openid-configuration" />
      <required-claims>
        <claim name="aud"><value>${var.api_client_id}</value></claim>
      </required-claims>
    </validate-jwt>
    <rate-limit-by-key calls="100" renewal-period="60"
      counter-key="@(context.Request.Headers.GetValueOrDefault(\"Authorization\",\"\").AsJwt()?.Claims.GetValueOrDefault(\"oid\",\"anonymous\"))" />
  </inbound>
  <backend>
    <forward-request timeout="30" />
  </backend>
  <outbound>
    <set-header name="X-Powered-By" exists-action="delete" />
    <set-header name="Server" exists-action="delete" />
  </outbound>
  <on-error />
</policies>
XML
}

resource "azurerm_api_management_product" "standard" {
  product_id            = "standard-api"
  api_management_name   = azurerm_api_management.main.name
  resource_group_name   = azurerm_resource_group.main.name
  display_name          = "Standard API Access"
  description           = "Standard tier with rate limiting"
  subscription_required = true
  approval_required     = true
  subscriptions_limit   = 5
  published             = true
}

resource "azurerm_api_management_product_api" "standard_orders" {
  api_name            = azurerm_api_management_api.orders.name
  product_id          = azurerm_api_management_product.standard.product_id
  api_management_name = azurerm_api_management.main.name
  resource_group_name = azurerm_resource_group.main.name
}

# Custom domain
resource "azurerm_api_management_custom_domain" "main" {
  api_management_id = azurerm_api_management.main.id

  gateway {
    host_name    = "api.${var.domain}"
    key_vault_id = azurerm_key_vault_certificate.api.secret_id
  }

  developer_portal {
    host_name    = "developer.${var.domain}"
    key_vault_id = azurerm_key_vault_certificate.portal.secret_id
  }
}

# Self-hosted gateway
resource "azurerm_api_management_gateway" "on_prem" {
  name              = "on-premises-gateway"
  api_management_id = azurerm_api_management.main.id
  description       = "Self-hosted gateway for on-premises APIs"
  location_data {
    name     = "On-Premises DC"
    city     = "New York"
    region   = "United States"
  }
}
```

### Step 7: VNET integration

```bicep
// Internal VNET integration (Premium tier)
resource apimInternal 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: 'apim-${appName}-${environment}'
  location: location
  sku: {
    name: 'Premium'
    capacity: 1
  }
  properties: {
    publisherName: publisherName
    publisherEmail: publisherEmail
    virtualNetworkType: 'Internal'  // Gateway accessible only via VNET
    virtualNetworkConfiguration: {
      subnetResourceId: apimSubnet.id
    }
  }
}

// Private DNS zone for internal APIM
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'azure-api.net'
  location: 'global'
}

resource privateDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'apim-vnet-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}
```

### APIM tier comparison

| Feature | Consumption | Developer | Basic | Standard | Premium |
|---------|-------------|-----------|-------|----------|---------|
| SLA | 99.95% | None | 99.95% | 99.95% | 99.99% |
| Cache | External | 10MB | 50MB | 1GB | 5GB |
| VNET | No | Yes | No | No | Yes |
| Multi-region | No | No | No | No | Yes |
| Self-hosted GW | No | Yes | No | No | Yes |
| Dev portal | No | Yes | Yes | Yes | Yes |
| Scale units | Auto | 1 | 2 | 4 | 12/region |
| Price model | Per call | Fixed | Fixed | Fixed | Fixed |

### Best practices

- **Use Consumption tier for lightweight APIs** - No fixed cost, auto-scale
- **Use policies for cross-cutting concerns** - Auth, rate limiting, caching, transformation
- **Validate JWT tokens at the gateway** - Offload auth from backend services
- **Use named values for configuration** - Reference Key Vault for secrets
- **Version APIs** - Use version sets with URL segment or header versioning
- **Use revisions for non-breaking changes** - Test before making current
- **Enable Application Insights** - Full request/response tracing and analytics
- **Use products for access tiers** - Group APIs with different rate limits and terms
- **Implement circuit breaker** - Protect backends from cascade failures
- **Use backend pools** - Load balance and failover across regions

### Anti-patterns

- **Using APIM as a compute layer** - Policies are for transformation, not business logic
- **Logging full request/response bodies** - Performance impact and data privacy concerns
- **Not rate limiting** - Backend can be overwhelmed by uncontrolled traffic
- **Hardcoding backend URLs** - Use named values or backend entities
- **Using Developer tier in production** - No SLA, single instance
- **Ignoring policy execution order** - Inbound runs top-down, outbound bottom-up
- **Not using CORS policy** - Browser requests will fail without proper CORS headers
- **Exposing subscription keys in query strings** - Use header-based keys only

### Security considerations

- Use JWT validation for all APIs (validate audience, issuer, scopes)
- Disable TLS 1.0 and 1.1 and weak cipher suites
- Use managed identity for backend authentication and Key Vault access
- Configure IP filtering to restrict management API access
- Use client certificates for mutual TLS (mTLS) with backends
- Remove sensitive headers (Server, X-Powered-By, X-AspNet-Version)
- Add security response headers (X-Content-Type-Options, X-Frame-Options, CSP)
- Use VNET integration (Internal mode) for private API access
- Enable diagnostic logging for security audit
- Rotate subscription keys regularly
- Use OAuth 2.0 instead of subscription keys for user-facing APIs

### Cost optimization

- **Consumption tier**: Best for low-traffic APIs (first 1M calls free/month)
- **Right-size scale units**: Monitor CPU/memory and adjust capacity
- **Use caching**: Reduce backend calls and improve response times
- **Rate limit aggressively**: Prevent abuse and reduce backend load
- **Use response caching**: Cache GET responses at the gateway
- **Consolidate APIs**: One APIM instance can host many APIs
- **Self-hosted gateway**: Use for on-premises APIs instead of Premium VNET
- **Monitor unused APIs**: Remove APIs and products that are not in use
- **Use Consumption for dev/test**: Avoid fixed cost for non-production environments
