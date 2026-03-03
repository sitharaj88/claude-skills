---
name: do-networking
description: Generate VPC configs with DNS, CDN, and network security. Use when the user wants to design or configure DigitalOcean networking infrastructure including VPCs, DNS, firewalls, and CDN.
argument-hint: "[component]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(doctl *), Bash(terraform *), Bash(dig *), Bash(curl *)
user-invocable: true
---

## Instructions

You are a DigitalOcean networking expert. Generate production-ready VPC, DNS, CDN, and firewall configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Component**: vpc, dns, cdn, firewall, load-balancer, reserved-ip
- **Architecture**: single region, multi-region, hybrid
- **Services**: Droplets, Kubernetes, databases, App Platform
- **Security**: public-facing, internal-only, restricted access
- **DNS provider**: DigitalOcean DNS, external (Cloudflare, Route 53)

### Step 2: VPC configuration

**doctl CLI:**
```bash
# Create a VPC
doctl vpcs create \
  --name production-vpc \
  --region nyc3 \
  --ip-range 10.10.10.0/24 \
  --description "Production VPC for web infrastructure"

# List VPCs
doctl vpcs list

# Get VPC details
doctl vpcs get <vpc-id>

# Update VPC
doctl vpcs update <vpc-id> --name "updated-vpc-name"

# Delete VPC (must be empty)
doctl vpcs delete <vpc-id>

# List members (resources in VPC)
doctl vpcs members list <vpc-id>
```

**Terraform:**
```hcl
# Primary VPC
resource "digitalocean_vpc" "production" {
  name        = "production-vpc"
  region      = "nyc3"
  ip_range    = "10.10.10.0/24"
  description = "Production VPC for web infrastructure"
}

# Staging VPC (separate network)
resource "digitalocean_vpc" "staging" {
  name        = "staging-vpc"
  region      = "nyc3"
  ip_range    = "10.20.20.0/24"
  description = "Staging VPC for testing"
}

# VPC peering (connect two VPCs)
resource "digitalocean_vpc_peering" "prod_staging" {
  name = "prod-staging-peering"
  vpc_ids = [
    digitalocean_vpc.production.id,
    digitalocean_vpc.staging.id,
  ]
}
```

**VPC CIDR planning:**
```
Production:  10.10.10.0/24  (254 usable IPs)
Staging:     10.20.20.0/24  (254 usable IPs)
Development: 10.30.30.0/24  (254 usable IPs)

For larger networks:
Production:  10.10.0.0/16   (65,534 usable IPs)
Staging:     10.20.0.0/16   (65,534 usable IPs)
```

**Resources that support VPC:**
- Droplets (vpc_uuid parameter)
- Managed Databases (private_network_uuid parameter)
- Kubernetes clusters (vpc_uuid parameter)
- Load Balancers (vpc_uuid parameter)

### Step 3: DNS management

**doctl CLI:**
```bash
# Add a domain
doctl compute domain create example.com

# List domains
doctl compute domain list

# Create DNS records
doctl compute domain records create example.com \
  --record-type A \
  --record-name @ \
  --record-data 203.0.113.10 \
  --record-ttl 300

doctl compute domain records create example.com \
  --record-type AAAA \
  --record-name @ \
  --record-data 2001:db8::1 \
  --record-ttl 300

doctl compute domain records create example.com \
  --record-type CNAME \
  --record-name www \
  --record-data example.com. \
  --record-ttl 3600

doctl compute domain records create example.com \
  --record-type MX \
  --record-name @ \
  --record-data mail.example.com. \
  --record-priority 10 \
  --record-ttl 3600

doctl compute domain records create example.com \
  --record-type TXT \
  --record-name @ \
  --record-data "v=spf1 include:_spf.google.com ~all" \
  --record-ttl 3600

doctl compute domain records create example.com \
  --record-type SRV \
  --record-name _sip._tcp \
  --record-data sip.example.com. \
  --record-port 5060 \
  --record-priority 10 \
  --record-weight 100 \
  --record-ttl 3600

doctl compute domain records create example.com \
  --record-type CAA \
  --record-name @ \
  --record-data "0 issue letsencrypt.org" \
  --record-ttl 3600

doctl compute domain records create example.com \
  --record-type NS \
  --record-name sub \
  --record-data ns1.delegated.com. \
  --record-ttl 86400

# List all records
doctl compute domain records list example.com

# Update a record
doctl compute domain records update example.com \
  --record-id <record-id> \
  --record-data 203.0.113.20

# Delete a record
doctl compute domain records delete example.com <record-id>
```

**Terraform:**
```hcl
resource "digitalocean_domain" "main" {
  name = "example.com"
}

# A record (Droplet or Load Balancer IP)
resource "digitalocean_record" "apex" {
  domain = digitalocean_domain.main.id
  type   = "A"
  name   = "@"
  value  = digitalocean_loadbalancer.web.ip
  ttl    = 300
}

# AAAA record (IPv6)
resource "digitalocean_record" "apex_v6" {
  domain = digitalocean_domain.main.id
  type   = "AAAA"
  name   = "@"
  value  = digitalocean_droplet.web.ipv6_address
  ttl    = 300
}

# CNAME for www
resource "digitalocean_record" "www" {
  domain = digitalocean_domain.main.id
  type   = "CNAME"
  name   = "www"
  value  = "@"
  ttl    = 3600
}

# CNAME for App Platform
resource "digitalocean_record" "app" {
  domain = digitalocean_domain.main.id
  type   = "CNAME"
  name   = "app"
  value  = "<app-id>.ondigitalocean.app."
  ttl    = 3600
}

# MX records for email
resource "digitalocean_record" "mx_primary" {
  domain   = digitalocean_domain.main.id
  type     = "MX"
  name     = "@"
  value    = "aspmx.l.google.com."
  priority = 1
  ttl      = 3600
}

resource "digitalocean_record" "mx_secondary" {
  domain   = digitalocean_domain.main.id
  type     = "MX"
  name     = "@"
  value    = "alt1.aspmx.l.google.com."
  priority = 5
  ttl      = 3600
}

# TXT records (SPF, DKIM, DMARC)
resource "digitalocean_record" "spf" {
  domain = digitalocean_domain.main.id
  type   = "TXT"
  name   = "@"
  value  = "v=spf1 include:_spf.google.com ~all"
  ttl    = 3600
}

resource "digitalocean_record" "dmarc" {
  domain = digitalocean_domain.main.id
  type   = "TXT"
  name   = "_dmarc"
  value  = "v=DMARC1; p=reject; rua=mailto:dmarc@example.com"
  ttl    = 3600
}

# CAA record (restrict certificate issuance)
resource "digitalocean_record" "caa" {
  domain = digitalocean_domain.main.id
  type   = "CAA"
  name   = "@"
  value  = "letsencrypt.org."
  flags  = 0
  tag    = "issue"
  ttl    = 3600
}

# SRV record
resource "digitalocean_record" "srv" {
  domain   = digitalocean_domain.main.id
  type     = "SRV"
  name     = "_sip._tcp"
  value    = "sip.example.com."
  priority = 10
  weight   = 100
  port     = 5060
  ttl      = 3600
}
```

### Step 4: Cloud Firewall configuration

**doctl CLI:**
```bash
# Create a firewall
doctl compute firewall create \
  --name web-firewall \
  --tag-names web \
  --inbound-rules "protocol:tcp,ports:80,sources:load_balancer_uids:<lb-id> protocol:tcp,ports:443,sources:load_balancer_uids:<lb-id> protocol:tcp,ports:22,sources:addresses:10.10.10.0/24 protocol:icmp,sources:addresses:0.0.0.0/0,addresses:::/0" \
  --outbound-rules "protocol:tcp,ports:all,destinations:addresses:0.0.0.0/0,addresses:::/0 protocol:udp,ports:all,destinations:addresses:0.0.0.0/0,addresses:::/0 protocol:icmp,destinations:addresses:0.0.0.0/0,addresses:::/0"

# List firewalls
doctl compute firewall list

# Add rules to existing firewall
doctl compute firewall add-rules <firewall-id> \
  --inbound-rules "protocol:tcp,ports:3306,sources:tags:app"

# Remove rules
doctl compute firewall remove-rules <firewall-id> \
  --inbound-rules "protocol:tcp,ports:3306,sources:tags:app"

# Add Droplets by tag
doctl compute firewall add-tags <firewall-id> --tag-names database
```

**Terraform - comprehensive firewall setup:**
```hcl
# Web tier firewall - accepts traffic from load balancer only
resource "digitalocean_firewall" "web" {
  name = "web-firewall"
  tags = ["web"]

  # HTTP from load balancer
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_load_balancer_uids = [digitalocean_loadbalancer.web.id]
  }

  # HTTPS from load balancer
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_load_balancer_uids = [digitalocean_loadbalancer.web.id]
  }

  # SSH from bastion only
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_tags      = ["bastion"]
  }

  # ICMP (ping)
  inbound_rule {
    protocol         = "icmp"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # All outbound
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# Database tier firewall - accepts traffic from app tier only
resource "digitalocean_firewall" "database" {
  name = "database-firewall"
  tags = ["database"]

  # PostgreSQL from app tier
  inbound_rule {
    protocol    = "tcp"
    port_range  = "5432"
    source_tags = ["app"]
  }

  # Redis from app tier
  inbound_rule {
    protocol    = "tcp"
    port_range  = "6379"
    source_tags = ["app"]
  }

  # SSH from bastion
  inbound_rule {
    protocol    = "tcp"
    port_range  = "22"
    source_tags = ["bastion"]
  }

  # Outbound: only to package repos and DNS
  outbound_rule {
    protocol              = "tcp"
    port_range            = "80"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "443"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "53"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# Bastion firewall - SSH from trusted IPs only
resource "digitalocean_firewall" "bastion" {
  name = "bastion-firewall"
  tags = ["bastion"]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["203.0.113.0/24"]  # Office/VPN CIDR
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "22"
    destination_tags      = ["web", "database"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "443"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "53"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
```

### Step 5: CDN configuration

```bash
# Create CDN endpoint for Spaces
doctl compute cdn create \
  --origin my-assets.nyc3.digitaloceanspaces.com \
  --ttl 3600 \
  --domain cdn.example.com \
  --certificate-id <cert-id>

# List CDN endpoints
doctl compute cdn list

# Flush CDN cache
doctl compute cdn flush <cdn-id> --files "css/*" "js/*" "images/*"

# Flush entire cache
doctl compute cdn flush <cdn-id> --files "*"

# Update CDN TTL
doctl compute cdn update <cdn-id> --ttl 86400

# Delete CDN endpoint
doctl compute cdn delete <cdn-id>
```

**Terraform:**
```hcl
resource "digitalocean_spaces_bucket" "assets" {
  name   = "my-app-assets"
  region = "nyc3"
  acl    = "public-read"
}

resource "digitalocean_certificate" "cdn" {
  name    = "cdn-cert"
  type    = "lets_encrypt"
  domains = ["cdn.example.com"]
}

resource "digitalocean_cdn" "assets" {
  origin           = digitalocean_spaces_bucket.assets.bucket_domain_name
  ttl              = 3600
  custom_domain    = "cdn.example.com"
  certificate_name = digitalocean_certificate.cdn.name
}
```

CDN cache invalidation strategies:
- Use content-hashed filenames (e.g., `app.a1b2c3.js`) with long TTLs
- Use short TTLs for HTML files, long TTLs for static assets
- Flush specific paths after deployments: `doctl compute cdn flush <id> --files "index.html"`
- Use versioned paths: `/v2/api/docs/` instead of flushing

### Step 6: Reserved IPs

```bash
# Create a reserved IP
doctl compute reserved-ip create --region nyc3

# Assign to a Droplet
doctl compute reserved-ip-action assign <ip-address> <droplet-id>

# Unassign
doctl compute reserved-ip-action unassign <ip-address>

# List reserved IPs
doctl compute reserved-ip list

# Delete reserved IP
doctl compute reserved-ip delete <ip-address>
```

**Terraform:**
```hcl
resource "digitalocean_reserved_ip" "web" {
  region = "nyc3"
}

resource "digitalocean_reserved_ip_assignment" "web" {
  ip_address = digitalocean_reserved_ip.web.ip_address
  droplet_id = digitalocean_droplet.web.id
}

output "public_ip" {
  value = digitalocean_reserved_ip.web.ip_address
}
```

### Step 7: Load balancer networking

```hcl
resource "digitalocean_loadbalancer" "web" {
  name   = "web-lb"
  region = "nyc3"
  size   = "lb-small"

  vpc_uuid = digitalocean_vpc.production.id

  # HTTP to HTTPS redirect
  forwarding_rule {
    entry_port     = 80
    entry_protocol = "http"
    target_port     = 80
    target_protocol = "http"
  }

  # HTTPS with SSL termination
  forwarding_rule {
    entry_port     = 443
    entry_protocol = "https"
    target_port     = 80
    target_protocol = "http"
    certificate_name = digitalocean_certificate.web.name
  }

  # TCP passthrough (for WebSocket, gRPC)
  forwarding_rule {
    entry_port     = 8443
    entry_protocol = "tcp"
    target_port     = 8443
    target_protocol = "tcp"
  }

  healthcheck {
    port     = 80
    protocol = "http"
    path     = "/health"
    check_interval_seconds  = 10
    response_timeout_seconds = 5
    unhealthy_threshold      = 3
    healthy_threshold        = 5
  }

  sticky_sessions {
    type               = "cookies"
    cookie_name        = "DO-LB"
    cookie_ttl_seconds = 300
  }

  redirect_http_to_https = true
  enable_proxy_protocol  = false
  enable_backend_keepalive = true

  droplet_tag = "web"

  # Firewall (restrict traffic sources)
  firewall {
    allow = ["cidr:0.0.0.0/0"]
    deny  = []
  }
}

resource "digitalocean_certificate" "web" {
  name    = "web-cert"
  type    = "lets_encrypt"
  domains = ["example.com", "www.example.com"]
}
```

**Load balancer sizes:**

| Size | Connections/s | Requests/s | $/mo |
|------|--------------|------------|------|
| lb-small | 10,000 | 10,000 | $12 |
| lb-medium | 25,000 | 25,000 | $24 |
| lb-large | 100,000 | 100,000 | $48 |

### Step 8: Complete network architecture example

```hcl
# Full production network setup

# VPC
resource "digitalocean_vpc" "production" {
  name     = "production"
  region   = "nyc3"
  ip_range = "10.10.10.0/24"
}

# Domain and DNS
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

resource "digitalocean_record" "www" {
  domain = digitalocean_domain.main.id
  type   = "CNAME"
  name   = "www"
  value  = "@"
  ttl    = 3600
}

# SSL Certificate
resource "digitalocean_certificate" "web" {
  name    = "web-cert"
  type    = "lets_encrypt"
  domains = ["example.com", "www.example.com"]
}

# Load Balancer
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

# Web Droplets
resource "digitalocean_droplet" "web" {
  count    = 3
  name     = "web-${count.index + 1}"
  size     = "s-2vcpu-4gb"
  image    = "ubuntu-24-04-x64"
  region   = "nyc3"
  vpc_uuid = digitalocean_vpc.production.id
  tags     = ["web", "production"]
}

# Cloud Firewall
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

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# Managed Database (in same VPC)
resource "digitalocean_database_cluster" "db" {
  name                 = "app-db"
  engine               = "pg"
  version              = "16"
  size                 = "db-s-2vcpu-4gb"
  region               = "nyc3"
  node_count           = 2
  private_network_uuid = digitalocean_vpc.production.id
}

resource "digitalocean_database_firewall" "db" {
  cluster_id = digitalocean_database_cluster.db.id

  rule {
    type  = "tag"
    value = "web"
  }
}
```

### Step 9: Network monitoring

```bash
# Enable Droplet monitoring agent (included in cloud-init)
# Metrics: bandwidth in/out, CPU, memory, disk

# Bandwidth monitoring via API
curl -s -H "Authorization: Bearer $DO_TOKEN" \
  "https://api.digitalocean.com/v2/monitoring/metrics/droplet/bandwidth" \
  --data-urlencode "host_id=<droplet-id>" \
  --data-urlencode "interface=public" \
  --data-urlencode "direction=inbound" \
  --data-urlencode "start=$(date -d '-1 hour' +%s)" \
  --data-urlencode "end=$(date +%s)"

# Load balancer metrics (via dashboard or API)
# Metrics: requests/s, connections, response codes, latency

# DNS query stats (not available via API; use external monitoring)
```

### Step 10: Network architecture patterns

**Single-region web application:**
```
Internet
    |
[DNS: example.com -> LB IP]
    |
[Load Balancer] (lb-small, $12/mo)
    |
[VPC: 10.10.10.0/24]
    |--- [Web-1] [Web-2] [Web-3]  (Droplets with "web" tag)
    |
    |--- [Managed DB Primary] [DB Standby]  (private network)
    |
    |--- [Redis]  (private network)
```

**Multi-region with CDN:**
```
Internet
    |
[CDN: cdn.example.com]  (Spaces CDN, global edge)
    |
[DNS: api.example.com -> LB IP]
    |
[Load Balancer NYC3]
    |
[VPC NYC3: 10.10.10.0/24]
    |--- [App Servers]
    |--- [Primary DB]
    |
[VPC Peering]
    |
[VPC SFO3: 10.20.20.0/24]
    |--- [Read Replica]
    |--- [Backup Workers]
```

### Best practices

- Always create resources inside a VPC for private networking isolation
- Use VPC peering to connect production and staging without exposing to the internet
- Plan CIDR ranges to avoid overlaps when peering VPCs
- Use tag-based firewall rules so new Droplets are automatically protected
- Configure DNS with short TTLs (300s) for records that may change (load balancer IPs)
- Use long TTLs (3600s+) for stable records (MX, TXT, CNAME)
- Set up CAA records to restrict which CAs can issue certificates for your domain
- Use Let's Encrypt certificates managed by DigitalOcean (auto-renewal)
- Enable HTTPS redirect on load balancers
- Use private networking for all database connections
- Use load balancer health checks to route traffic only to healthy backends
- Separate firewall rules by tier (web, app, database, bastion)

### Anti-patterns to avoid

- Do not create Droplets outside a VPC; always specify the VPC UUID
- Do not open SSH (port 22) to 0.0.0.0/0; restrict to bastion or VPN CIDR
- Do not use reserved IPs as a load balancer replacement; they have no health checks
- Do not skip firewall rules; all Droplets should be behind a Cloud Firewall
- Do not use the default VPC for production; create a dedicated VPC with planned CIDR
- Do not hardcode IP addresses in DNS; use CNAME records where possible
- Do not forget to set up both IPv4 and IPv6 DNS records
- Do not expose database ports to the public internet; use trusted sources

### Cost optimization tips

- VPCs are free; always use them for network isolation
- DNS hosting is free for unlimited domains and records on DigitalOcean
- Reserved IPs are free when assigned to a Droplet ($5/mo when unassigned)
- Use the smallest load balancer size (lb-small at $12/mo) and upgrade only when needed
- CDN is included with Spaces subscription (no additional cost)
- Let's Encrypt certificates are free and auto-renewed
- Use tag-based firewall rules (free) instead of third-party firewall appliances
- Combine multiple services behind a single load balancer using path-based routing
- Use internal/private DNS resolution within VPCs instead of public DNS lookups
- Monitor bandwidth usage; intra-VPC traffic is free, outbound internet is metered
