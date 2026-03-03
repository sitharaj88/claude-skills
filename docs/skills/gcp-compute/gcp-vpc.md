# GCP VPC Network

Generate VPC networks with subnets, firewall rules, Cloud NAT, Cloud Router, VPN tunnels, and Private Service Connect configurations.

## Usage

```bash
/gcp-vpc <description of your network architecture>
```

## What It Does

1. Designs a VPC network layout with custom subnets across regions and secondary ranges for GKE
2. Generates firewall rules with priority-based ingress and egress filtering using tags and service accounts
3. Configures Cloud NAT with Cloud Router for private subnet internet access
4. Creates VPN tunnels or Cloud Interconnect configs for hybrid connectivity
5. Sets up Private Service Connect and Private Google Access for secure service communication
6. Produces Shared VPC configurations for multi-project networking

## Examples

```bash
/gcp-vpc Create a VPC with public and private subnets across us-central1 and us-east1 with Cloud NAT

/gcp-vpc Set up a Shared VPC with host project and two service projects for production isolation

/gcp-vpc Design a VPC with HA VPN to an on-premises network and Private Google Access for GCP APIs
```

## What It Covers

- **VPC design** with custom mode networks, subnets, and secondary IP ranges
- **Firewall rules** with priority ordering, target tags, and service account filters
- **Cloud NAT** with Cloud Router for outbound internet access from private subnets
- **Hybrid connectivity** with Cloud VPN, Cloud Interconnect, and Cloud Router BGP
- **Private access** with Private Google Access, Private Service Connect, and VPC peering
- **Shared VPC** for centralized network management across projects

<div class="badge-row">
  <span class="badge">GCP</span>
  <span class="badge">Networking</span>
  <span class="badge">VPC</span>
</div>

## Allowed Tools

- `Read` - Read existing network configurations and firewall rules
- `Write` - Create VPC templates, firewall configs, and Terraform modules
- `Edit` - Modify existing networking resources
- `Bash` - Run gcloud CLI commands for network inspection and testing
- `Glob` - Search for networking-related infrastructure files
- `Grep` - Find CIDR, subnet, and firewall references
