---
name: azure-dns
description: Generate Azure DNS zones, records, alias records, and Traffic Manager configurations. Use when the user wants to manage DNS, domain routing, or traffic distribution on Azure.
argument-hint: "[domain] [A|AAAA|CNAME|MX|TXT|SRV|alias] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure DNS expert. Generate production-ready DNS configurations including public and private zones, record sets, alias records, and Traffic Manager profiles.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Domain**: domain name to manage
- **Zone type**: public DNS zone, private DNS zone
- **Record types**: A, AAAA, CNAME, MX, TXT, SRV, CAA, alias
- **Routing**: simple, priority, weighted, performance, geographic, multivalue
- **Resources**: what Azure resources to point records to (App Service, Front Door, Traffic Manager, public IP, CDN)

### Step 2: Generate public DNS zone

**Bicep template:**
```bicep
param domainName string
param location string = 'global'

resource dnsZone 'Microsoft.Network/dnsZones@2023-07-01-preview' = {
  name: domainName
  location: location
  properties: {
    zoneType: 'Public'
  }
}

output nameServers array = dnsZone.properties.nameServers
output zoneId string = dnsZone.id
```

**Terraform:**
```hcl
resource "azurerm_dns_zone" "main" {
  name                = var.domain_name
  resource_group_name = var.resource_group_name

  tags = var.tags
}

output "name_servers" {
  value = azurerm_dns_zone.main.name_servers
}
```

**Azure CLI:**
```bash
# Create public DNS zone
az network dns zone create \
  --resource-group myResourceGroup \
  --name contoso.com

# Show name servers (update at your registrar)
az network dns zone show \
  --resource-group myResourceGroup \
  --name contoso.com \
  --query nameServers
```

### Step 3: Generate private DNS zone

**Bicep template:**
```bicep
param privateDnsZoneName string = 'contoso.internal'

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: privateDnsZoneName
  location: 'global'
}

resource vnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: privateDnsZone
  name: '${vnet.name}-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: true  // Auto-register VM DNS records
  }
}
```

**Terraform:**
```hcl
resource "azurerm_private_dns_zone" "main" {
  name                = "contoso.internal"
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "main" {
  name                  = "${var.vnet_name}-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.main.name
  virtual_network_id    = azurerm_virtual_network.main.id
  registration_enabled  = true

  tags = var.tags
}
```

### Step 4: Generate DNS record sets

**Bicep template with all record types:**
```bicep
// A record - IPv4 address
resource aRecord 'Microsoft.Network/dnsZones/A@2023-07-01-preview' = {
  parent: dnsZone
  name: 'www'
  properties: {
    TTL: 300
    ARecords: [
      { ipv4Address: '20.50.100.1' }
    ]
  }
}

// AAAA record - IPv6 address
resource aaaaRecord 'Microsoft.Network/dnsZones/AAAA@2023-07-01-preview' = {
  parent: dnsZone
  name: 'www'
  properties: {
    TTL: 300
    AAAARecords: [
      { ipv6Address: '2001:db8::1' }
    ]
  }
}

// CNAME record - canonical name
resource cnameRecord 'Microsoft.Network/dnsZones/CNAME@2023-07-01-preview' = {
  parent: dnsZone
  name: 'blog'
  properties: {
    TTL: 3600
    CNAMERecord: {
      cname: 'contoso.azurewebsites.net'
    }
  }
}

// MX record - mail exchange
resource mxRecord 'Microsoft.Network/dnsZones/MX@2023-07-01-preview' = {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 3600
    MXRecords: [
      { preference: 10, exchange: 'mail1.contoso.com.' }
      { preference: 20, exchange: 'mail2.contoso.com.' }
    ]
  }
}

// TXT record - SPF, DKIM, DMARC, verification
resource txtRecord 'Microsoft.Network/dnsZones/TXT@2023-07-01-preview' = {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 3600
    TXTRecords: [
      { value: ['v=spf1 include:spf.protection.outlook.com -all'] }
    ]
  }
}

resource dmarcRecord 'Microsoft.Network/dnsZones/TXT@2023-07-01-preview' = {
  parent: dnsZone
  name: '_dmarc'
  properties: {
    TTL: 3600
    TXTRecords: [
      { value: ['v=DMARC1; p=reject; rua=mailto:dmarc@contoso.com; ruf=mailto:dmarc@contoso.com; fo=1'] }
    ]
  }
}

// SRV record - service locator
resource srvRecord 'Microsoft.Network/dnsZones/SRV@2023-07-01-preview' = {
  parent: dnsZone
  name: '_sip._tcp'
  properties: {
    TTL: 3600
    SRVRecords: [
      { priority: 10, weight: 60, port: 5060, target: 'sip.contoso.com.' }
      { priority: 10, weight: 40, port: 5060, target: 'sip2.contoso.com.' }
    ]
  }
}

// CAA record - certificate authority authorization
resource caaRecord 'Microsoft.Network/dnsZones/CAA@2023-07-01-preview' = {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 3600
    caaRecords: [
      { flags: 0, tag: 'issue', value: 'letsencrypt.org' }
      { flags: 0, tag: 'issue', value: 'digicert.com' }
      { flags: 0, tag: 'issuewild', value: 'digicert.com' }
      { flags: 0, tag: 'iodef', value: 'mailto:security@contoso.com' }
    ]
  }
}
```

**Terraform record examples:**
```hcl
resource "azurerm_dns_a_record" "www" {
  name                = "www"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = ["20.50.100.1"]
}

resource "azurerm_dns_cname_record" "blog" {
  name                = "blog"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 3600
  record              = "contoso.azurewebsites.net"
}

resource "azurerm_dns_mx_record" "main" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 3600

  record {
    preference = 10
    exchange   = "mail1.contoso.com."
  }

  record {
    preference = 20
    exchange   = "mail2.contoso.com."
  }
}

resource "azurerm_dns_txt_record" "spf" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 3600

  record {
    value = "v=spf1 include:spf.protection.outlook.com -all"
  }
}

resource "azurerm_dns_caa_record" "main" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 3600

  record {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }

  record {
    flags = 0
    tag   = "issue"
    value = "digicert.com"
  }
}
```

### Step 5: Generate alias records

Alias records point directly to Azure resources (no charge for alias queries at zone apex):

**Bicep alias records:**
```bicep
// Alias to Azure Front Door
resource frontDoorAlias 'Microsoft.Network/dnsZones/A@2023-07-01-preview' = {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 60
    targetResource: {
      id: frontDoor.id
    }
  }
}

// Alias to Traffic Manager
resource trafficManagerAlias 'Microsoft.Network/dnsZones/A@2023-07-01-preview' = {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 60
    targetResource: {
      id: trafficManagerProfile.id
    }
  }
}

// Alias to public IP (supports zone apex)
resource publicIpAlias 'Microsoft.Network/dnsZones/A@2023-07-01-preview' = {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 60
    targetResource: {
      id: publicIp.id
    }
  }
}

// Alias to CDN endpoint
resource cdnAlias 'Microsoft.Network/dnsZones/CNAME@2023-07-01-preview' = {
  parent: dnsZone
  name: 'cdn'
  properties: {
    TTL: 60
    targetResource: {
      id: cdnEndpoint.id
    }
  }
}
```

**Terraform alias records:**
```hcl
resource "azurerm_dns_a_record" "apex_alias" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 60
  target_resource_id  = azurerm_public_ip.main.id
}

resource "azurerm_dns_a_record" "traffic_manager_alias" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 60
  target_resource_id  = azurerm_traffic_manager_profile.main.id
}
```

### Step 6: Generate Azure Traffic Manager

**Priority routing (primary/failover):**
```bicep
resource trafficManager 'Microsoft.Network/trafficManagerProfiles@2022-04-01' = {
  name: 'contoso-tm'
  location: 'global'
  properties: {
    profileStatus: 'Enabled'
    trafficRoutingMethod: 'Priority'
    dnsConfig: {
      relativeName: 'contoso-tm'
      ttl: 60
    }
    monitorConfig: {
      protocol: 'HTTPS'
      port: 443
      path: '/health'
      intervalInSeconds: 10
      timeoutInSeconds: 5
      toleratedNumberOfFailures: 3
      expectedStatusCodeRanges: [
        { min: 200, max: 200 }
      ]
    }
    endpoints: [
      {
        name: 'primary'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: primaryAppService.id
          endpointStatus: 'Enabled'
          priority: 1
        }
      }
      {
        name: 'secondary'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: secondaryAppService.id
          endpointStatus: 'Enabled'
          priority: 2
        }
      }
    ]
  }
}
```

**Weighted routing (A/B testing, gradual migration):**
```bicep
resource trafficManagerWeighted 'Microsoft.Network/trafficManagerProfiles@2022-04-01' = {
  name: 'contoso-weighted-tm'
  location: 'global'
  properties: {
    trafficRoutingMethod: 'Weighted'
    dnsConfig: {
      relativeName: 'contoso-weighted'
      ttl: 30
    }
    monitorConfig: {
      protocol: 'HTTPS'
      port: 443
      path: '/health'
    }
    endpoints: [
      {
        name: 'version-1'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: appV1.id
          weight: 90
        }
      }
      {
        name: 'version-2'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: appV2.id
          weight: 10
        }
      }
    ]
  }
}
```

**Performance routing (lowest latency):**
```bicep
resource trafficManagerPerformance 'Microsoft.Network/trafficManagerProfiles@2022-04-01' = {
  name: 'contoso-perf-tm'
  location: 'global'
  properties: {
    trafficRoutingMethod: 'Performance'
    dnsConfig: {
      relativeName: 'contoso-perf'
      ttl: 60
    }
    monitorConfig: {
      protocol: 'HTTPS'
      port: 443
      path: '/health'
    }
    endpoints: [
      {
        name: 'eastus'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: appEastUS.id
          endpointLocation: 'East US'
        }
      }
      {
        name: 'westeurope'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: appWestEurope.id
          endpointLocation: 'West Europe'
        }
      }
      {
        name: 'southeastasia'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: appSoutheastAsia.id
          endpointLocation: 'Southeast Asia'
        }
      }
    ]
  }
}
```

**Geographic routing:**
```bicep
resource trafficManagerGeo 'Microsoft.Network/trafficManagerProfiles@2022-04-01' = {
  name: 'contoso-geo-tm'
  location: 'global'
  properties: {
    trafficRoutingMethod: 'Geographic'
    dnsConfig: {
      relativeName: 'contoso-geo'
      ttl: 60
    }
    monitorConfig: {
      protocol: 'HTTPS'
      port: 443
      path: '/health'
    }
    endpoints: [
      {
        name: 'us-endpoint'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: appUS.id
          geoMapping: ['US', 'CA', 'MX']
        }
      }
      {
        name: 'eu-endpoint'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: appEU.id
          geoMapping: ['GEO-EU']
        }
      }
      {
        name: 'default'
        type: 'Microsoft.Network/trafficManagerProfiles/azureEndpoints'
        properties: {
          targetResourceId: appDefault.id
          geoMapping: ['WORLD']
        }
      }
    ]
  }
}
```

**Terraform Traffic Manager:**
```hcl
resource "azurerm_traffic_manager_profile" "main" {
  name                   = "contoso-tm"
  resource_group_name    = var.resource_group_name
  traffic_routing_method = "Priority"

  dns_config {
    relative_name = "contoso-tm"
    ttl           = 60
  }

  monitor_config {
    protocol                     = "HTTPS"
    port                         = 443
    path                         = "/health"
    interval_in_seconds          = 10
    timeout_in_seconds           = 5
    tolerated_number_of_failures = 3
    expected_status_code_ranges  = ["200-200"]
  }

  tags = var.tags
}

resource "azurerm_traffic_manager_azure_endpoint" "primary" {
  name               = "primary"
  profile_id         = azurerm_traffic_manager_profile.main.id
  target_resource_id = azurerm_linux_web_app.primary.id
  priority           = 1
}

resource "azurerm_traffic_manager_azure_endpoint" "secondary" {
  name               = "secondary"
  profile_id         = azurerm_traffic_manager_profile.main.id
  target_resource_id = azurerm_linux_web_app.secondary.id
  priority           = 2
}
```

### Step 7: Generate domain delegation

```bash
# After creating the zone, get name servers
az network dns zone show \
  --resource-group myResourceGroup \
  --name contoso.com \
  --query "nameServers" \
  --output tsv

# Delegate a subdomain to another DNS zone
az network dns record-set ns create \
  --resource-group myResourceGroup \
  --zone-name contoso.com \
  --name staging

az network dns record-set ns add-record \
  --resource-group myResourceGroup \
  --zone-name contoso.com \
  --record-set-name staging \
  --nsdname ns1-01.azure-dns.com.
```

### Step 8: Generate private DNS for Azure services

```bicep
// Private DNS zones for Azure PaaS private endpoints
var privateDnsZones = [
  'privatelink.blob.${environment().suffixes.storage}'
  'privatelink.database.windows.net'
  'privatelink.vaultcore.azure.net'
  'privatelink.azurewebsites.net'
  'privatelink.azurecr.io'
  'privatelink.cognitiveservices.azure.com'
]

resource privateDnsZonesResource 'Microsoft.Network/privateDnsZones@2024-06-01' = [
  for zone in privateDnsZones: {
    name: zone
    location: 'global'
  }
]

resource privateDnsZoneLinks 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = [
  for (zone, i) in privateDnsZones: {
    parent: privateDnsZonesResource[i]
    name: '${vnet.name}-link'
    location: 'global'
    properties: {
      virtualNetwork: {
        id: vnet.id
      }
      registrationEnabled: false
    }
  }
]
```

### Best practices:
- Use alias records for Azure resources at zone apex (free queries, automatic IP updates)
- Set appropriate TTL values (low for failover records: 60s, higher for stable records: 3600s)
- Use CAA records to restrict which certificate authorities can issue certificates
- Configure SPF, DKIM, and DMARC records for email deliverability and security
- Use private DNS zones for internal service resolution within VNets
- Enable auto-registration for VM DNS records in private DNS zones
- Use Traffic Manager for global traffic distribution and failover
- Prefer performance routing for latency-sensitive multi-region applications
- Set up health probes with appropriate intervals and failure thresholds
- Use subdomain delegation for team-level DNS management

### Anti-patterns to avoid:
- Do NOT use CNAME records at the zone apex (use alias records instead)
- Do NOT set TTL too low on stable records (increases query volume and cost)
- Do NOT skip health probes on Traffic Manager endpoints (defeats the purpose of failover)
- Do NOT use external DNS providers for Azure-internal resolution (use private DNS zones)
- Do NOT forget to update NS records at your registrar after creating an Azure DNS zone
- Do NOT create overly broad SPF records (limit to authorized senders)
- Do NOT ignore DNSSEC for public-facing domains
- Do NOT use wildcard records without understanding the security implications

### Security considerations:
- Enable DNSSEC to protect against DNS spoofing and cache poisoning
- Use Azure RBAC to control who can manage DNS zones and records
- Lock DNS zones with resource locks to prevent accidental deletion
- Configure CAA records to limit certificate issuance to trusted CAs
- Use private DNS zones for internal services (not publicly resolvable)
- Monitor DNS query logs for anomalous patterns
- Implement DMARC with a reject policy for email domain protection
- Use Traffic Manager with HTTPS health probes (not HTTP)

### Cost optimization tips:
- **DNS zones**: ~$0.50/month per hosted zone
- **DNS queries**: ~$0.40 per million queries (first billion)
- Alias record queries to Azure resources are free (no DNS query charge)
- Use appropriate TTL to reduce query volume (higher TTL = fewer queries = lower cost)
- Traffic Manager pricing: ~$0.75/million queries + per health check
- Consolidate subdomains in a single zone where possible
- Use private DNS zones only for VNets that need them (linked VNets incur charges)
- Monitor query volumes with Azure Monitor to identify optimization opportunities
