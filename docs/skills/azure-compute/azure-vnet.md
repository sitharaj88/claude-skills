# Azure Virtual Network

Generate VNet configurations with subnets, network security groups, VNet peering, Private Endpoints, service endpoints, and hybrid connectivity.

## Usage

```bash
/azure-vnet <description of your virtual network setup>
```

## What It Does

1. Generates VNet configurations with address spaces, subnets, and DNS settings
2. Creates network security groups with inbound/outbound rules and application security groups
3. Configures VNet peering for cross-VNet communication and hub-spoke topologies
4. Sets up Private Endpoints and Private DNS Zones for secure service access
5. Produces Bicep or Terraform templates with NAT Gateway, route tables, and UDRs
6. Adds hybrid connectivity with VPN Gateway, ExpressRoute, and Azure Bastion

## Examples

```bash
/azure-vnet Create a hub-spoke network topology with three spoke VNets, VPN Gateway, and Azure Firewall in the hub

/azure-vnet Set up a VNet with Private Endpoints for Storage, SQL Database, and Key Vault with custom Private DNS Zones

/azure-vnet Build a subnet layout with NSGs, service endpoints, NAT Gateway for outbound, and Azure Bastion for management
```

## What It Covers

- **VNet configuration** with address spaces, subnets, delegation, and DNS settings
- **Security** with NSGs, ASGs, service tags, and flow log analysis
- **Peering** with VNet peering, global peering, and hub-spoke architectures
- **Private connectivity** with Private Endpoints, Private Link Services, and Private DNS Zones
- **Routing** with route tables, user-defined routes, and NAT Gateway for outbound
- **Hybrid networking** with VPN Gateway, ExpressRoute, and Azure Bastion

<div class="badge-row">
  <span class="badge">Azure</span>
  <span class="badge">Networking</span>
  <span class="badge">Security</span>
</div>

## Allowed Tools

- `Read` - Read existing network templates and NSG configurations
- `Write` - Create VNet configs, NSG rules, and deployment templates
- `Edit` - Modify existing network settings and routing rules
- `Bash` - Run Azure CLI commands for network management and diagnostics
- `Glob` - Search for network-related configuration files
- `Grep` - Find network references and address space configurations
