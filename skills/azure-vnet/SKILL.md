---
name: azure-vnet
description: Generate VNet configs with subnets, NSGs, peering, and connectivity. Use when the user wants to design or set up Azure networking infrastructure.
argument-hint: "[cidr] [region] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Virtual Network and networking expert. Generate production-ready network architectures.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Address space**: e.g., 10.0.0.0/16 (ensure no overlap with peered VNets or on-premises)
- **Region**: Azure region for deployment
- **Architecture**: single VNet, hub-spoke, mesh
- **Connectivity**: internet-facing, VPN, ExpressRoute, VNet peering
- **Workloads**: VMs, AKS, Container Apps, App Services, databases

### Step 2: Generate VNet and subnets

Design the network layout:

**Standard multi-tier architecture:**
```
VNet: 10.0.0.0/16
├── GatewaySubnet (for VPN/ExpressRoute)
│   └── 10.0.0.0/27
├── AzureFirewallSubnet
│   └── 10.0.1.0/26
├── AzureBastionSubnet
│   └── 10.0.2.0/26
├── App subnets (for VMs, App Services, Container Apps)
│   ├── 10.0.10.0/24 (web tier)
│   ├── 10.0.11.0/24 (app tier)
│   └── 10.0.12.0/24 (AKS)
├── Data subnets (for databases, caches)
│   ├── 10.0.20.0/24 (SQL/Cosmos)
│   └── 10.0.21.0/24 (Redis/Storage)
└── Private Endpoint subnet
    └── 10.0.30.0/24
```

**Bicep template:**
```bicep
param location string = resourceGroup().location
param vnetName string
param addressPrefix string = '10.0.0.0/16'

resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [addressPrefix]
    }
    dhcpOptions: {
      dnsServers: []  // Use Azure-provided DNS or specify custom
    }
    subnets: [
      {
        name: 'GatewaySubnet'
        properties: {
          addressPrefix: '10.0.0.0/27'
        }
      }
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: '10.0.1.0/26'
        }
      }
      {
        name: 'AzureBastionSubnet'
        properties: {
          addressPrefix: '10.0.2.0/26'
          networkSecurityGroup: { id: bastionNsg.id }
        }
      }
      {
        name: 'web-subnet'
        properties: {
          addressPrefix: '10.0.10.0/24'
          networkSecurityGroup: { id: webNsg.id }
          serviceEndpoints: [
            { service: 'Microsoft.Sql' }
            { service: 'Microsoft.Storage' }
            { service: 'Microsoft.KeyVault' }
          ]
          natGateway: { id: natGateway.id }
        }
      }
      {
        name: 'app-subnet'
        properties: {
          addressPrefix: '10.0.11.0/24'
          networkSecurityGroup: { id: appNsg.id }
          delegations: [
            {
              name: 'appServiceDelegation'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
          natGateway: { id: natGateway.id }
        }
      }
      {
        name: 'aks-subnet'
        properties: {
          addressPrefix: '10.0.12.0/22'  // Larger for AKS pods
          networkSecurityGroup: { id: aksNsg.id }
          natGateway: { id: natGateway.id }
        }
      }
      {
        name: 'data-subnet'
        properties: {
          addressPrefix: '10.0.20.0/24'
          networkSecurityGroup: { id: dataNsg.id }
          serviceEndpoints: [
            { service: 'Microsoft.Sql' }
            { service: 'Microsoft.Storage' }
          ]
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'private-endpoints'
        properties: {
          addressPrefix: '10.0.30.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}
```

### Step 3: Generate Network Security Groups (NSGs)

**Web tier NSG:**
```bicep
resource webNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: '${vnetName}-web-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
        }
      }
      {
        name: 'AllowHTTP'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '80'
        }
      }
      {
        name: 'AllowAzureLoadBalancer'
        properties: {
          priority: 200
          direction: 'Inbound'
          access: 'Allow'
          protocol: '*'
          sourceAddressPrefix: 'AzureLoadBalancer'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}
```

**App tier NSG:**
```bicep
resource appNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: '${vnetName}-app-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowFromWebSubnet'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.10.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '8080'
        }
      }
      {
        name: 'AllowFromAppGateway'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'GatewayManager'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '65200-65535'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}
```

**Data tier NSG:**
```bicep
resource dataNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: '${vnetName}-data-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowSqlFromAppSubnet'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.11.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '1433'
        }
      }
      {
        name: 'AllowRedisFromAppSubnet'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.11.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '6380'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}
```

### Step 4: Generate Private Endpoints and Private Link

**Private Endpoint for Azure SQL:**
```bicep
resource sqlPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'sql-private-endpoint'
  location: location
  properties: {
    subnet: { id: privateEndpointSubnet.id }
    privateLinkServiceConnections: [
      {
        name: 'sql-connection'
        properties: {
          privateLinkServiceId: sqlServer.id
          groupIds: ['sqlServer']
        }
      }
    ]
  }
}

resource sqlDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.database.windows.net'
  location: 'global'
}

resource sqlDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: sqlDnsZone
  name: '${vnetName}-link'
  location: 'global'
  properties: {
    virtualNetwork: { id: vnet.id }
    registrationEnabled: false
  }
}

resource sqlDnsRecord 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  parent: sqlPrivateEndpoint
  name: 'sqlDnsGroup'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config'
        properties: {
          privateDnsZoneId: sqlDnsZone.id
        }
      }
    ]
  }
}
```

**Common Private DNS Zone names:**
```
Azure SQL:        privatelink.database.windows.net
Cosmos DB:        privatelink.documents.azure.com
Storage Blob:     privatelink.blob.core.windows.net
Storage File:     privatelink.file.core.windows.net
Key Vault:        privatelink.vaultcore.azure.net
ACR:              privatelink.azurecr.io
Event Hub:        privatelink.servicebus.windows.net
Service Bus:      privatelink.servicebus.windows.net
Redis:            privatelink.redis.cache.windows.net
```

### Step 5: Generate VNet peering

**Same-region peering:**
```bicep
resource hubToSpokePeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2023-05-01' = {
  parent: hubVnet
  name: 'hub-to-spoke'
  properties: {
    remoteVirtualNetwork: { id: spokeVnet.id }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: true  // Hub shares its gateway
    useRemoteGateways: false
  }
}

resource spokeToHubPeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2023-05-01' = {
  parent: spokeVnet
  name: 'spoke-to-hub'
  properties: {
    remoteVirtualNetwork: { id: hubVnet.id }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: false
    useRemoteGateways: true  // Spoke uses hub's gateway
  }
}
```

### Step 6: Generate NAT Gateway

```bicep
resource natGatewayPip 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: '${vnetName}-nat-pip'
  location: location
  sku: { name: 'Standard' }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
  zones: ['1', '2', '3']
}

resource natGateway 'Microsoft.Network/natGateways@2023-05-01' = {
  name: '${vnetName}-nat'
  location: location
  sku: { name: 'Standard' }
  properties: {
    idleTimeoutInMinutes: 10
    publicIpAddresses: [
      { id: natGatewayPip.id }
    ]
  }
  zones: ['1', '2', '3']
}
```

### Step 7: Generate Azure Firewall

```bicep
resource firewallPip 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: '${vnetName}-fw-pip'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}

resource firewall 'Microsoft.Network/azureFirewalls@2023-05-01' = {
  name: '${vnetName}-firewall'
  location: location
  properties: {
    sku: {
      name: 'AZFW_VNet'
      tier: 'Premium'
    }
    ipConfigurations: [
      {
        name: 'fw-ipconfig'
        properties: {
          subnet: { id: firewallSubnet.id }
          publicIPAddress: { id: firewallPip.id }
        }
      }
    ]
    firewallPolicy: { id: firewallPolicy.id }
  }
}

resource firewallPolicy 'Microsoft.Network/firewallPolicies@2023-05-01' = {
  name: '${vnetName}-fw-policy'
  location: location
  properties: {
    sku: { tier: 'Premium' }
    threatIntelMode: 'Deny'
    intrusionDetection: {
      mode: 'Deny'
      configuration: {
        bypassTrafficSettings: []
      }
    }
    dnsSettings: {
      enableProxy: true
    }
  }
}

resource networkRuleCollection 'Microsoft.Network/firewallPolicies/ruleCollectionGroups@2023-05-01' = {
  parent: firewallPolicy
  name: 'DefaultNetworkRuleCollectionGroup'
  properties: {
    priority: 200
    ruleCollections: [
      {
        ruleCollectionType: 'FirewallPolicyFilterRuleCollection'
        name: 'AllowAzureServices'
        priority: 100
        action: { type: 'Allow' }
        rules: [
          {
            ruleType: 'NetworkRule'
            name: 'AllowDNS'
            ipProtocols: ['UDP']
            sourceAddresses: ['10.0.0.0/16']
            destinationAddresses: ['*']
            destinationPorts: ['53']
          }
          {
            ruleType: 'NetworkRule'
            name: 'AllowNTP'
            ipProtocols: ['UDP']
            sourceAddresses: ['10.0.0.0/16']
            destinationAddresses: ['*']
            destinationPorts: ['123']
          }
        ]
      }
    ]
  }
}
```

### Step 8: Generate Route Tables (UDRs)

**Route table to force traffic through Azure Firewall:**
```bicep
resource routeTable 'Microsoft.Network/routeTables@2023-05-01' = {
  name: '${vnetName}-app-rt'
  location: location
  properties: {
    disableBgpRoutePropagation: false
    routes: [
      {
        name: 'default-to-firewall'
        properties: {
          addressPrefix: '0.0.0.0/0'
          nextHopType: 'VirtualAppliance'
          nextHopIpAddress: firewall.properties.ipConfigurations[0].properties.privateIPAddress
        }
      }
    ]
  }
}
```

### Step 9: Generate Hub-Spoke topology

```
Hub VNet (10.0.0.0/16)
├── GatewaySubnet (VPN/ExpressRoute)
├── AzureFirewallSubnet
├── AzureBastionSubnet
└── Shared services (DNS, AD, monitoring)

Spoke 1 - Production (10.1.0.0/16)
├── web-subnet
├── app-subnet
├── data-subnet
└── private-endpoints

Spoke 2 - Development (10.2.0.0/16)
├── dev-subnet
└── test-subnet
```

### Step 10: Terraform alternative

```hcl
resource "azurerm_virtual_network" "main" {
  name                = var.vnet_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = [var.address_prefix]
}

resource "azurerm_subnet" "web" {
  name                 = "web-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.10.0/24"]
  service_endpoints    = ["Microsoft.Sql", "Microsoft.Storage", "Microsoft.KeyVault"]
}

resource "azurerm_subnet" "app" {
  name                 = "app-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.11.0/24"]

  delegation {
    name = "app-service"
    service_delegation {
      name = "Microsoft.Web/serverFarms"
    }
  }
}

resource "azurerm_subnet" "data" {
  name                              = "data-subnet"
  resource_group_name               = azurerm_resource_group.main.name
  virtual_network_name              = azurerm_virtual_network.main.name
  address_prefixes                  = ["10.0.20.0/24"]
  private_endpoint_network_policies = "Disabled"
}

resource "azurerm_network_security_group" "web" {
  name                = "${var.vnet_name}-web-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "Internet"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "443"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_address_prefix      = "*"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "web" {
  subnet_id                 = azurerm_subnet.web.id
  network_security_group_id = azurerm_network_security_group.web.id
}

resource "azurerm_nat_gateway" "main" {
  name                    = "${var.vnet_name}-nat"
  location                = azurerm_resource_group.main.location
  resource_group_name     = azurerm_resource_group.main.name
  sku_name                = "Standard"
  idle_timeout_in_minutes = 10
  zones                   = ["1"]
}

resource "azurerm_nat_gateway_public_ip_association" "main" {
  nat_gateway_id       = azurerm_nat_gateway.main.id
  public_ip_address_id = azurerm_public_ip.nat.id
}
```

### Step 11: Enable diagnostics and monitoring

```bicep
resource flowLog 'Microsoft.Network/networkWatchers/flowLogs@2023-05-01' = {
  name: 'NetworkWatcher_${location}/${vnetName}-flow-log'
  location: location
  properties: {
    targetResourceId: webNsg.id
    storageId: storageAccount.id
    enabled: true
    retentionPolicy: {
      days: 90
      enabled: true
    }
    format: {
      type: 'JSON'
      version: 2
    }
    flowAnalyticsConfiguration: {
      networkWatcherFlowAnalyticsConfiguration: {
        enabled: true
        workspaceResourceId: logAnalytics.id
        trafficAnalyticsInterval: 10
      }
    }
  }
}
```

### Best practices:
- Use /16 for VNet address space to allow growth
- Use /24 for standard subnets, /22 for AKS subnets (pods need many IPs)
- Plan CIDR ranges to avoid overlap with peered VNets and on-premises networks
- Deploy NAT Gateway for predictable outbound IPs
- Use Private Endpoints instead of Service Endpoints for PaaS services (stronger isolation)
- Enable NSG Flow Logs with Traffic Analytics for visibility
- Use Azure Firewall or third-party NVA for centralized egress filtering in hub-spoke
- Always associate NSGs with subnets (defense in depth)
- Use Application Security Groups to simplify NSG rules
- Tag subnets for AKS and load balancer auto-discovery

### Anti-patterns to avoid:
- Do NOT use /8 or excessively large address spaces without a plan
- Do NOT leave default NSG rules unmodified; explicitly deny all and allow only what is needed
- Do NOT use public IPs on VMs when NAT Gateway or Load Balancer suffices
- Do NOT skip Private DNS Zones when using Private Endpoints (resolution will fail)
- Do NOT peer VNets with overlapping address spaces
- Do NOT use Service Endpoints when Private Endpoints are available (weaker isolation)
- Do NOT forget subnet delegations for services that require them (App Service, Container Apps)

### Security considerations:
- Implement NSGs on every subnet with explicit deny-all rules
- Use Private Endpoints for all PaaS services to eliminate public internet exposure
- Enable DDoS Protection Standard for internet-facing workloads
- Use Azure Firewall Premium for TLS inspection and IDPS
- Enable NSG Flow Logs and Traffic Analytics for threat detection
- Use Network Watcher for diagnostics and troubleshooting
- Implement route tables to force traffic through firewall for inspection
- Use Azure DNS Private Zones for consistent name resolution of private endpoints
- Segment networks by workload and security tier (zero-trust approach)

### Cost optimization tips:
- Use NAT Gateway instead of multiple public IPs on VMs (simpler, more cost-effective)
- Use Azure Firewall Basic SKU for small/dev environments (lower cost)
- Use Service Endpoints where Private Endpoints are overkill (free vs. per-hour charge)
- Deploy Azure Bastion on-demand or use Developer SKU for dev environments
- Use VNet peering instead of VPN Gateways for Azure-to-Azure connectivity (cheaper, faster)
- Enable DDoS Protection Standard at subscription level (covers all VNets in subscription)
- Monitor bandwidth costs with Azure Cost Management; consider ExpressRoute for high-volume traffic
- Use Azure Firewall Manager for centralized policy management across multiple firewalls
