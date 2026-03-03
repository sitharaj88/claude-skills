# DigitalOcean Networking

Generate VPC configs with DNS, CDN, and network security. Use when you need to design or configure DigitalOcean networking infrastructure including VPCs, DNS, firewalls, and CDN.

## Usage

```bash
/do-networking [component]
```

## What It Does

1. Generates VPC configurations with CIDR planning, VPC peering, and multi-environment isolation
2. Creates comprehensive DNS records including A, AAAA, CNAME, MX, TXT (SPF/DKIM/DMARC), CAA, and SRV
3. Configures cloud firewalls with tag-based rules for tiered network security (web, app, database, bastion)
4. Sets up CDN endpoints for Spaces with custom domains, cache TTLs, and cache invalidation
5. Provisions load balancers with SSL termination, health checks, sticky sessions, and HTTP-to-HTTPS redirect
6. Manages reserved IPs for static addressing and failover scenarios
7. Produces complete network architecture patterns for single-region and multi-region deployments
8. Integrates DNS, certificates, and load balancers with Droplets, Kubernetes, and App Platform

## Example Output

```hcl
resource "digitalocean_vpc" "production" {
  name     = "production"
  region   = "nyc3"
  ip_range = "10.10.10.0/24"
}

resource "digitalocean_domain" "main" {
  name = "example.com"
}

resource "digitalocean_record" "apex" {
  domain = digitalocean_domain.main.id
  type   = "A"
  name   = "@"
  value  = digitalocean_loadbalancer.web.ip
  ttl    = 300
}

resource "digitalocean_firewall" "web" {
  name = "web-fw"
  tags = ["web"]

  inbound_rule {
    protocol                  = "tcp"
    port_range                = "80"
    source_load_balancer_uids = [digitalocean_loadbalancer.web.id]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["10.10.10.0/24"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

resource "digitalocean_loadbalancer" "web" {
  name     = "web-lb"
  region   = "nyc3"
  size     = "lb-small"
  vpc_uuid = digitalocean_vpc.production.id

  forwarding_rule {
    entry_port       = 443
    entry_protocol   = "https"
    target_port      = 80
    target_protocol  = "http"
    certificate_name = digitalocean_certificate.web.name
  }

  healthcheck {
    port     = 80
    protocol = "http"
    path     = "/health"
  }

  redirect_http_to_https = true
  droplet_tag            = "web"
}
```

## Installation

```bash
cp -r skills/do-networking ~/.claude/skills/
```

<div class="badge-row">
  <span class="badge">DigitalOcean</span>
  <span class="badge">VPC</span>
  <span class="badge">DNS</span>
  <span class="badge">Firewall</span>
</div>

## Allowed Tools

- `Read` - Read existing network configurations and DNS zone files
- `Write` - Create VPC configs, firewall rules, DNS records, and load balancer specs
- `Edit` - Modify existing network settings, CIDR ranges, and security rules
- `Bash` - Run doctl, Terraform, dig, and curl commands for network management
- `Glob` - Search for networking configuration files
- `Grep` - Find VPC references, DNS records, and firewall rule dependencies
