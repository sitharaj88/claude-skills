---
name: azure-app-gateway
description: Generate Application Gateway configs with WAF, SSL, and routing rules. Use when the user wants to set up an Azure Application Gateway for load balancing and web application firewall.
argument-hint: "[tier] [backend type] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Application Gateway expert. Generate production-ready Application Gateway configurations with WAF, SSL termination, and advanced routing.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Tier**: Standard_v2 (load balancing only) or WAF_v2 (with Web Application Firewall)
- **Backend**: VMs, App Service, AKS, Container Apps, custom FQDN
- **Domains**: custom domains and SSL certificates
- **Routing**: basic, path-based, multi-site, or a combination
- **WAF mode**: Detection or Prevention

### Step 2: Generate Application Gateway

**Bicep template:**
```bicep
param location string = resourceGroup().location
param appGatewayName string
param tier string = 'WAF_v2'

resource publicIp 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: '${appGatewayName}-pip'
  location: location
  sku: { name: 'Standard' }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
  zones: ['1', '2', '3']
}

resource appGateway 'Microsoft.Network/applicationGateways@2023-05-01' = {
  name: appGatewayName
  location: location
  zones: ['1', '2', '3']
  properties: {
    sku: {
      name: tier
      tier: tier
    }
    autoscaleConfiguration: {
      minCapacity: 1
      maxCapacity: 10
    }
    gatewayIPConfigurations: [
      {
        name: 'appGatewayIpConfig'
        properties: {
          subnet: { id: appGatewaySubnet.id }
        }
      }
    ]
    frontendIPConfigurations: [
      {
        name: 'appGwPublicFrontendIp'
        properties: {
          publicIPAddress: { id: publicIp.id }
        }
      }
      {
        name: 'appGwPrivateFrontendIp'
        properties: {
          privateIPAllocationMethod: 'Static'
          privateIPAddress: '10.0.5.10'
          subnet: { id: appGatewaySubnet.id }
        }
      }
    ]
    frontendPorts: [
      { name: 'port_443', properties: { port: 443 } }
      { name: 'port_80', properties: { port: 80 } }
    ]
    sslCertificates: [
      {
        name: 'ssl-cert'
        properties: {
          keyVaultSecretId: 'https://my-vault.vault.azure.net/secrets/ssl-cert'
        }
      }
    ]
    sslPolicy: {
      policyType: 'Predefined'
      policyName: 'AppGwSslPolicy20220101S'  // TLS 1.2+ with strong ciphers
    }
    httpListeners: [
      {
        name: 'https-listener'
        properties: {
          frontendIPConfiguration: { id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', appGatewayName, 'appGwPublicFrontendIp') }
          frontendPort: { id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', appGatewayName, 'port_443') }
          protocol: 'Https'
          sslCertificate: { id: resourceId('Microsoft.Network/applicationGateways/sslCertificates', appGatewayName, 'ssl-cert') }
          hostNames: ['api.myapp.com', 'www.myapp.com']
          requireServerNameIndication: true
        }
      }
      {
        name: 'http-listener'
        properties: {
          frontendIPConfiguration: { id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', appGatewayName, 'appGwPublicFrontendIp') }
          frontendPort: { id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', appGatewayName, 'port_80') }
          protocol: 'Http'
        }
      }
    ]
    backendAddressPools: [
      {
        name: 'api-backend'
        properties: {
          backendAddresses: [
            { fqdn: 'myapp-api.azurewebsites.net' }
          ]
        }
      }
      {
        name: 'web-backend'
        properties: {
          backendAddresses: [
            { fqdn: 'myapp-web.azurewebsites.net' }
          ]
        }
      }
    ]
    backendHttpSettingsCollection: [
      {
        name: 'api-settings'
        properties: {
          port: 443
          protocol: 'Https'
          cookieBasedAffinity: 'Disabled'
          pickHostNameFromBackendAddress: true
          requestTimeout: 30
          probe: { id: resourceId('Microsoft.Network/applicationGateways/probes', appGatewayName, 'api-health-probe') }
        }
      }
      {
        name: 'web-settings'
        properties: {
          port: 443
          protocol: 'Https'
          cookieBasedAffinity: 'Disabled'
          pickHostNameFromBackendAddress: true
          requestTimeout: 30
          probe: { id: resourceId('Microsoft.Network/applicationGateways/probes', appGatewayName, 'web-health-probe') }
        }
      }
    ]
    probes: [
      {
        name: 'api-health-probe'
        properties: {
          protocol: 'Https'
          path: '/health'
          interval: 30
          timeout: 30
          unhealthyThreshold: 3
          pickHostNameFromBackendHttpSettings: true
          match: {
            statusCodes: ['200-399']
          }
        }
      }
      {
        name: 'web-health-probe'
        properties: {
          protocol: 'Https'
          path: '/'
          interval: 30
          timeout: 30
          unhealthyThreshold: 3
          pickHostNameFromBackendHttpSettings: true
          match: {
            statusCodes: ['200-399']
          }
        }
      }
    ]
    urlPathMaps: [
      {
        name: 'path-map'
        properties: {
          defaultBackendAddressPool: { id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', appGatewayName, 'web-backend') }
          defaultBackendHttpSettings: { id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', appGatewayName, 'web-settings') }
          pathRules: [
            {
              name: 'api-path'
              properties: {
                paths: ['/api/*']
                backendAddressPool: { id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', appGatewayName, 'api-backend') }
                backendHttpSettings: { id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', appGatewayName, 'api-settings') }
              }
            }
          ]
        }
      }
    ]
    requestRoutingRules: [
      {
        name: 'https-rule'
        properties: {
          priority: 100
          ruleType: 'PathBasedRouting'
          httpListener: { id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'https-listener') }
          urlPathMap: { id: resourceId('Microsoft.Network/applicationGateways/urlPathMaps', appGatewayName, 'path-map') }
        }
      }
      {
        name: 'http-to-https-redirect'
        properties: {
          priority: 200
          ruleType: 'Basic'
          httpListener: { id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'http-listener') }
          redirectConfiguration: { id: resourceId('Microsoft.Network/applicationGateways/redirectConfigurations', appGatewayName, 'http-to-https') }
        }
      }
    ]
    redirectConfigurations: [
      {
        name: 'http-to-https'
        properties: {
          redirectType: 'Permanent'
          targetListener: { id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'https-listener') }
          includePath: true
          includeQueryString: true
        }
      }
    ]
    rewriteRuleSets: [
      {
        name: 'security-headers'
        properties: {
          rewriteRules: [
            {
              name: 'add-security-headers'
              ruleSequence: 100
              actionSet: {
                responseHeaderConfigurations: [
                  { headerName: 'Strict-Transport-Security', headerValue: 'max-age=31536000; includeSubDomains' }
                  { headerName: 'X-Content-Type-Options', headerValue: 'nosniff' }
                  { headerName: 'X-Frame-Options', headerValue: 'DENY' }
                  { headerName: 'Content-Security-Policy', headerValue: 'default-src \'self\'' }
                  { headerName: 'Referrer-Policy', headerValue: 'strict-origin-when-cross-origin' }
                ]
              }
            }
            {
              name: 'remove-server-header'
              ruleSequence: 200
              actionSet: {
                responseHeaderConfigurations: [
                  { headerName: 'Server', headerValue: '' }
                ]
              }
            }
          ]
        }
      }
    ]
    firewallPolicy: { id: wafPolicy.id }
  }
}
```

### Step 3: Configure WAF policy

```bicep
resource wafPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2023-05-01' = {
  name: '${appGatewayName}-waf-policy'
  location: location
  properties: {
    policySettings: {
      state: 'Enabled'
      mode: 'Prevention'  // 'Detection' for initial rollout
      requestBodyCheck: true
      maxRequestBodySizeInKb: 128
      fileUploadLimitInMb: 100
      requestBodyInspectLimitInKB: 128
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'OWASP'
          ruleSetVersion: '3.2'
          ruleGroupOverrides: [
            {
              ruleGroupName: 'REQUEST-920-PROTOCOL-ENFORCEMENT'
              rules: [
                {
                  ruleId: '920300'
                  state: 'Disabled'  // Example: disable specific rule causing false positives
                }
              ]
            }
          ]
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
        }
      ]
      exclusions: [
        {
          matchVariable: 'RequestHeaderNames'
          selectorMatchOperator: 'Equals'
          selector: 'Authorization'
        }
      ]
    }
    customRules: [
      {
        name: 'RateLimitRule'
        priority: 1
        ruleType: 'RateLimitRule'
        rateLimitDuration: 'OneMin'
        rateLimitThreshold: 100
        matchConditions: [
          {
            matchVariables: [
              { variableName: 'RemoteAddr' }
            ]
            operator: 'IPMatch'
            negationCondition: true
            matchValues: ['10.0.0.0/8']  // Exclude internal IPs
          }
        ]
        action: 'Block'
      }
      {
        name: 'GeoBlockRule'
        priority: 2
        ruleType: 'MatchRule'
        matchConditions: [
          {
            matchVariables: [
              { variableName: 'RemoteAddr' }
            ]
            operator: 'GeoMatch'
            matchValues: ['CN', 'RU']  // Example: block specific countries
          }
        ]
        action: 'Block'
      }
      {
        name: 'AllowKnownIPs'
        priority: 3
        ruleType: 'MatchRule'
        matchConditions: [
          {
            matchVariables: [
              { variableName: 'RemoteAddr' }
            ]
            operator: 'IPMatch'
            matchValues: ['203.0.113.0/24']  // Corporate CIDR
          }
        ]
        action: 'Allow'
      }
    ]
  }
}
```

### Step 4: Configure multi-site hosting

**Multiple listeners for different domains:**
```bicep
httpListeners: [
  {
    name: 'api-listener'
    properties: {
      frontendIPConfiguration: { id: frontendIpId }
      frontendPort: { id: httpsPortId }
      protocol: 'Https'
      sslCertificate: { id: sslCertId }
      hostName: 'api.myapp.com'
      requireServerNameIndication: true
    }
  }
  {
    name: 'admin-listener'
    properties: {
      frontendIPConfiguration: { id: frontendIpId }
      frontendPort: { id: httpsPortId }
      protocol: 'Https'
      sslCertificate: { id: sslCertId }
      hostName: 'admin.myapp.com'
      requireServerNameIndication: true
    }
  }
]
```

### Step 5: Configure end-to-end SSL

```bicep
// For backends that require HTTPS (App Service, AKS with TLS)
backendHttpSettingsCollection: [
  {
    name: 'e2e-ssl-settings'
    properties: {
      port: 443
      protocol: 'Https'
      cookieBasedAffinity: 'Disabled'
      pickHostNameFromBackendAddress: true
      requestTimeout: 30
      trustedRootCertificates: [
        { id: resourceId('Microsoft.Network/applicationGateways/trustedRootCertificates', appGatewayName, 'backend-root-cert') }
      ]
    }
  }
]

trustedRootCertificates: [
  {
    name: 'backend-root-cert'
    properties: {
      // For App Service, use the well-known root CA
      // For custom backends, provide the root CA certificate
      data: loadFileAsBase64('certs/root-ca.cer')
    }
  }
]
```

### Step 6: Configure Application Gateway for AKS (AGIC)

**Enable AGIC as AKS add-on:**
```bicep
resource aks 'Microsoft.ContainerService/managedClusters@2024-01-01' = {
  // ...
  properties: {
    addonProfiles: {
      ingressApplicationGateway: {
        enabled: true
        config: {
          applicationGatewayId: appGateway.id
        }
      }
    }
  }
}
```

**Kubernetes Ingress with AGIC annotations:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
    appgw.ingress.kubernetes.io/backend-protocol: "http"
    appgw.ingress.kubernetes.io/health-probe-path: "/health"
    appgw.ingress.kubernetes.io/connection-draining: "true"
    appgw.ingress.kubernetes.io/connection-draining-timeout: "30"
    appgw.ingress.kubernetes.io/cookie-based-affinity: "true"
    appgw.ingress.kubernetes.io/request-timeout: "30"
    appgw.ingress.kubernetes.io/waf-policy-for-path: "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Network/applicationGatewayWebApplicationFirewallPolicies/my-waf"
spec:
  tls:
    - hosts:
        - api.myapp.com
      secretName: tls-secret
  rules:
    - host: api.myapp.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
```

### Step 7: Configure Key Vault integration for certificates

```bicep
// App Gateway managed identity for Key Vault access
resource appGatewayIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appGatewayName}-identity'
  location: location
}

// Key Vault access policy
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: appGatewayIdentity.properties.principalId
        permissions: {
          secrets: ['get']
          certificates: ['get']
        }
      }
    ]
  }
}
```

### Step 8: Terraform alternative

```hcl
resource "azurerm_application_gateway" "main" {
  name                = var.app_gateway_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  zones               = ["1", "2", "3"]
  firewall_policy_id  = azurerm_web_application_firewall_policy.main.id
  force_firewall_policy_association = true

  sku {
    name = "WAF_v2"
    tier = "WAF_v2"
  }

  autoscale_configuration {
    min_capacity = 1
    max_capacity = 10
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.appgw.id]
  }

  gateway_ip_configuration {
    name      = "gateway-ip-config"
    subnet_id = azurerm_subnet.appgw.id
  }

  frontend_ip_configuration {
    name                 = "public-frontend"
    public_ip_address_id = azurerm_public_ip.appgw.id
  }

  frontend_port {
    name = "https-port"
    port = 443
  }

  ssl_certificate {
    name                = "ssl-cert"
    key_vault_secret_id = azurerm_key_vault_certificate.main.secret_id
  }

  ssl_policy {
    policy_type = "Predefined"
    policy_name = "AppGwSslPolicy20220101S"
  }

  http_listener {
    name                           = "https-listener"
    frontend_ip_configuration_name = "public-frontend"
    frontend_port_name             = "https-port"
    protocol                       = "Https"
    ssl_certificate_name           = "ssl-cert"
    host_names                     = ["api.myapp.com"]
  }

  backend_address_pool {
    name  = "api-backend"
    fqdns = ["myapp-api.azurewebsites.net"]
  }

  backend_http_settings {
    name                                = "api-settings"
    port                                = 443
    protocol                            = "Https"
    cookie_based_affinity               = "Disabled"
    pick_host_name_from_backend_address = true
    request_timeout                     = 30
    probe_name                          = "api-probe"
  }

  probe {
    name                                      = "api-probe"
    protocol                                  = "Https"
    path                                      = "/health"
    interval                                  = 30
    timeout                                   = 30
    unhealthy_threshold                       = 3
    pick_host_name_from_backend_http_settings = true
    match { status_code = ["200-399"] }
  }

  request_routing_rule {
    name                       = "https-rule"
    priority                   = 100
    rule_type                  = "Basic"
    http_listener_name         = "https-listener"
    backend_address_pool_name  = "api-backend"
    backend_http_settings_name = "api-settings"
  }
}

resource "azurerm_web_application_firewall_policy" "main" {
  name                = "${var.app_gateway_name}-waf"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  policy_settings {
    enabled                     = true
    mode                        = "Prevention"
    request_body_check          = true
    max_request_body_size_in_kb = 128
    file_upload_limit_in_mb     = 100
  }

  managed_rules {
    managed_rule_set {
      type    = "OWASP"
      version = "3.2"
    }
    managed_rule_set {
      type    = "Microsoft_BotManagerRuleSet"
      version = "1.0"
    }
  }

  custom_rules {
    name      = "RateLimit"
    priority  = 1
    rule_type = "RateLimitRule"
    action    = "Block"

    rate_limit_duration = "OneMin"
    rate_limit_threshold = 100

    match_conditions {
      match_variables { variable_name = "RemoteAddr" }
      operator           = "IPMatch"
      negation_condition = true
      match_values       = ["10.0.0.0/8"]
    }
  }
}
```

### Step 9: Configure diagnostics

```bicep
resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${appGatewayName}-diagnostics'
  scope: appGateway
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      { category: 'ApplicationGatewayAccessLog', enabled: true }
      { category: 'ApplicationGatewayPerformanceLog', enabled: true }
      { category: 'ApplicationGatewayFirewallLog', enabled: true }
    ]
    metrics: [
      { category: 'AllMetrics', enabled: true }
    ]
  }
}
```

### Best practices:
- Always use v2 SKU (Standard_v2 or WAF_v2); v1 is legacy
- Deploy across availability zones for high availability
- Use autoscaling (minCapacity 1-2 for cost, maxCapacity based on peak)
- Use Key Vault for SSL certificate management (auto-renewal)
- Configure custom health probes (do not rely on default probes)
- Use rewrite rules to add security headers
- Enable WAF in Detection mode first, then switch to Prevention after tuning
- Configure HTTP-to-HTTPS redirect for all HTTP listeners
- Use the latest SSL policy (AppGwSslPolicy20220101S) for strong TLS
- Implement connection draining for graceful backend removals

### Anti-patterns to avoid:
- Do NOT use Application Gateway v1; always use v2
- Do NOT skip health probes; misconfigured probes cause traffic blackholes
- Do NOT use overly permissive WAF exclusions
- Do NOT enable WAF in Prevention mode without first testing in Detection mode
- Do NOT skip the SSL policy configuration; the default allows weak ciphers
- Do NOT assign public IPs without WAF when internet-facing
- Do NOT use Application Gateway when Azure Front Door is a better fit (global load balancing)
- Do NOT forget to size the Application Gateway subnet (/24 recommended, minimum /26)

### Security considerations:
- Enable WAF_v2 tier for internet-facing applications
- Use OWASP 3.2 managed rule set as baseline
- Add Bot Manager rule set for bot protection
- Implement rate limiting with custom WAF rules
- Use geo-filtering to block traffic from unwanted regions
- Enable WAF logging for security auditing and forensic analysis
- Use end-to-end SSL for sensitive applications
- Configure trusted root certificates for backend validation
- Use private Application Gateway for internal-only workloads
- Integrate with Azure DDoS Protection for volumetric attack mitigation

### Cost optimization tips:
- Use autoscaling with minCapacity of 1 to reduce idle cost
- Use Standard_v2 instead of WAF_v2 if WAF is not needed (separate WAF can be more cost-effective)
- Application Gateway is billed per instance-hour and data processed
- Fewer backend pools and rules reduce processing overhead
- Consider Azure Front Door for global workloads (built-in CDN reduces App Gateway traffic)
- Monitor and rightsize using Application Gateway metrics in Azure Monitor
- Use a single Application Gateway with multi-site listeners instead of multiple gateways
- Consider stopping Application Gateway in non-production environments during off-hours
