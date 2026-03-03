# Azure DNS

Generate Azure DNS zones, record sets, private DNS zones, and traffic routing configurations for domain management.

## Usage

```bash
/azure-dns <description of your DNS setup>
```

## What It Does

1. Generates Azure DNS public zones with A, AAAA, CNAME, MX, TXT, and SRV record sets
2. Creates private DNS zones with virtual network links and auto-registration
3. Configures Azure Traffic Manager profiles with priority, weighted, and geographic routing
4. Sets up DNS-based traffic routing with health probes and endpoint monitoring
5. Implements DNSSEC for public zone signing and key management
6. Integrates Azure Front Door and CDN custom domain DNS verification

## Examples

```bash
/azure-dns Create a public DNS zone with A records for web servers, MX records for email, and TXT records for SPF and DKIM

/azure-dns Set up private DNS zones for Azure SQL, Storage, and Key Vault private endpoints with VNet links

/azure-dns Configure Traffic Manager with geographic routing, health checks, and failover between East US and West Europe
```

## What It Covers

- **Public zones** - DNS zone creation, delegation, name server configuration, and domain verification
- **Record sets** - A, AAAA, CNAME, MX, NS, PTR, SOA, SRV, and TXT record management
- **Private DNS zones** - Private zones for Azure services with virtual network links
- **Auto-registration** - Automatic VM DNS registration in private zones
- **Traffic Manager** - Priority, weighted, performance, geographic, and multi-value routing
- **Health probes** - Endpoint monitoring with custom paths, intervals, and failover thresholds
- **Custom domains** - Front Door, App Service, and CDN custom domain DNS validation
- **Alias records** - Alias record sets pointing to Azure resources like Traffic Manager and Front Door
- **DNSSEC** - Zone signing, key rotation, and DS record delegation
- **Diagnostics** - DNS query logging, metrics, and zone transfer auditing

<div class="badge-row">
  <span class="badge">DNS</span>
  <span class="badge">Routing</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing DNS zone files and record configurations
- `Write` - Create DNS zone definitions, record sets, and routing configs
- `Edit` - Modify existing DNS configurations and record sets
- `Bash` - Run az network dns, az network traffic-manager, and az network front-door CLI commands
- `Glob` - Search for DNS configuration and ARM template files
- `Grep` - Find domain references, record values, and endpoint configurations
