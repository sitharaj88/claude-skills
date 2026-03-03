# GCP Cloud DNS

Generate Cloud DNS zones, records, routing policies, DNSSEC configurations, and DNS response policies for domain management on Google Cloud.

## Usage

```bash
/gcp-cloud-dns <description of your DNS configuration>
```

## What It Does

1. Generates public, private, forwarding, and peering managed zone configurations
2. Creates DNS record sets for A, AAAA, CNAME, MX, TXT, SRV, and CAA record types
3. Configures routing policies for weighted round-robin, geolocation, and failover
4. Sets up DNSSEC with key-signing and zone-signing key specifications
5. Implements response policies for DNS firewall and domain blocking
6. Configures split-horizon DNS for different resolution inside and outside VPCs

## Examples

```bash
/gcp-cloud-dns Set up a public DNS zone with DNSSEC, SPF, DKIM, and DMARC records

/gcp-cloud-dns Configure geolocation-based routing for a multi-region API endpoint

/gcp-cloud-dns Create a private DNS zone with forwarding to on-premises DNS servers
```

## What It Covers

- **Managed zones** - Public, private, forwarding, and peering zone configurations
- **Record types** - A, AAAA, CNAME, MX, TXT (SPF/DKIM/DMARC), SRV, and CAA records
- **Routing policies** - Weighted round-robin, geolocation, and primary/backup failover
- **DNSSEC** - Zone signing with configurable key specs and DS record export
- **Response policies** - DNS firewall rules for blocking, redirecting, and filtering domains
- **Split-horizon DNS** - Separate public and private resolution for the same domain
- **Load balancer integration** - DNS records pointing to Global HTTP(S) Load Balancers with SSL
- **GKE integration** - ExternalDNS for automatic DNS record management from Kubernetes
- **Cross-project DNS** - Peering zones for shared services across GCP projects
- **Domain registration** - Domain registration and transfer via gcloud commands

<div class="badge-row">
  <span class="badge">DNS</span>
  <span class="badge">Routing</span>
  <span class="badge">GCP</span>
</div>

## Allowed Tools

- `Read` - Read existing DNS configurations and zone definitions
- `Write` - Create DNS zone and record set configurations
- `Edit` - Modify existing Cloud DNS configurations
- `Bash` - Run gcloud dns and terraform commands for zone and record management
- `Glob` - Search for DNS-related Terraform and configuration files
- `Grep` - Find domain references and record set definitions
