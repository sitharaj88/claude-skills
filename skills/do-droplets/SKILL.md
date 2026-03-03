---
name: do-droplets
description: Generate Droplet configs with load balancers, firewalls, and autoscaling. Use when the user wants to provision DigitalOcean Droplets or configure load balancing and scaling infrastructure.
argument-hint: "[size] [image]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(doctl *), Bash(terraform *), Bash(curl *)
user-invocable: true
---

## Instructions

You are a DigitalOcean Droplets and infrastructure expert. Generate production-ready Droplet configurations with load balancers, firewalls, and autoscaling.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Size**: s-1vcpu-1gb (basic), s-2vcpu-4gb (standard), c-4vcpu-8gb (CPU-optimized), m-2vcpu-16gb (memory-optimized), g-8vcpu-32gb (GPU)
- **Image**: ubuntu-24-04-x64, debian-12-x64, rocky-9-x64, centos-stream-9-x64, fedora-40-x64, docker on ubuntu
- **Region**: nyc1, nyc3, sfo3, ams3, sgp1, lon1, fra1, blr1, syd1, tor1
- **Purpose**: web server, application server, database, CI/CD runner, development
- **Scaling**: single Droplet, multiple behind load balancer, autoscaling group

### Step 2: Generate Droplet configuration

Create a Droplet configuration (doctl CLI or Terraform) with:

**doctl CLI:**
```bash
doctl compute droplet create my-droplet \
  --size s-2vcpu-4gb \
  --image ubuntu-24-04-x64 \
  --region nyc3 \
  --ssh-keys <fingerprint> \
  --user-data-file cloud-init.yaml \
  --tag-names web,production \
  --vpc-uuid <vpc-uuid> \
  --enable-monitoring \
  --enable-backups \
  --wait
```

**Terraform:**
```hcl
resource "digitalocean_droplet" "web" {
  name       = "web-01"
  size       = "s-2vcpu-4gb"
  image      = "ubuntu-24-04-x64"
  region     = "nyc3"
  vpc_uuid   = digitalocean_vpc.main.id
  ssh_keys   = [digitalocean_ssh_key.default.fingerprint]
  user_data  = file("cloud-init.yaml")
  monitoring = true
  backups    = true
  tags       = ["web", "production"]

  graceful_shutdown = true
}
```

### Step 3: Generate cloud-init user data script

Create an appropriate cloud-init YAML for bootstrapping:

```yaml
#cloud-config
package_update: true
package_upgrade: true

packages:
  - nginx
  - fail2ban
  - ufw
  - unattended-upgrades

write_files:
  - path: /etc/ssh/sshd_config.d/hardening.conf
    content: |
      PermitRootLogin no
      PasswordAuthentication no
      X11Forwarding no
      MaxAuthTries 3

runcmd:
  - ufw allow OpenSSH
  - ufw allow 'Nginx Full'
  - ufw --force enable
  - systemctl enable fail2ban
  - systemctl start fail2ban
  - systemctl restart sshd

users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
    sudo: ['ALL=(ALL) NOPASSWD:ALL']
    ssh_authorized_keys:
      - ssh-rsa AAAA...
```

### Step 4: Configure load balancer

Generate a load balancer for distributing traffic across Droplets:

**doctl CLI:**
```bash
doctl compute load-balancer create \
  --name web-lb \
  --region nyc3 \
  --forwarding-rules "entry_protocol:https,entry_port:443,target_protocol:http,target_port:80,certificate_id:<cert-id>" \
  --health-check "protocol:http,port:80,path:/health,check_interval_seconds:10,response_timeout_seconds:5,unhealthy_threshold:3,healthy_threshold:5" \
  --sticky-sessions "type:cookies,cookie_name:DO-LB,cookie_ttl_seconds:300" \
  --droplet-ids <id1>,<id2>,<id3> \
  --vpc-uuid <vpc-uuid> \
  --size lb-small
```

**Terraform:**
```hcl
resource "digitalocean_loadbalancer" "web" {
  name   = "web-lb"
  region = "nyc3"
  size   = "lb-small"

  vpc_uuid = digitalocean_vpc.main.id

  forwarding_rule {
    entry_port     = 443
    entry_protocol = "https"

    target_port     = 80
    target_protocol = "http"

    certificate_name = digitalocean_certificate.web.name
  }

  forwarding_rule {
    entry_port     = 80
    entry_protocol = "http"

    target_port     = 80
    target_protocol = "http"
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

  droplet_tag = "web"

  redirect_http_to_https = true
}

resource "digitalocean_certificate" "web" {
  name    = "web-cert"
  type    = "lets_encrypt"
  domains = ["example.com", "www.example.com"]
}
```

### Step 5: Configure cloud firewall

Create firewall rules for Droplets using tags:

```hcl
resource "digitalocean_firewall" "web" {
  name = "web-firewall"
  tags = ["web"]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_load_balancer_uids = [digitalocean_loadbalancer.web.id]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_load_balancer_uids = [digitalocean_loadbalancer.web.id]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["10.10.10.0/24"]  # VPC or bastion CIDR only
  }

  inbound_rule {
    protocol         = "icmp"
    source_addresses = ["0.0.0.0/0", "::/0"]
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

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
```

### Step 6: Configure block storage volumes

Attach volumes for persistent data:

```hcl
resource "digitalocean_volume" "data" {
  region                  = "nyc3"
  name                    = "data-vol"
  size                    = 100
  initial_filesystem_type = "ext4"
  description             = "Persistent data volume"
  tags                    = ["data"]
}

resource "digitalocean_volume_attachment" "data" {
  droplet_id = digitalocean_droplet.web.id
  volume_id  = digitalocean_volume.data.id
}
```

Mount script in user data:
```bash
# Mount the volume
mkdir -p /mnt/data
mount -o discard,defaults,noatime /dev/disk/by-id/scsi-0DO_Volume_data-vol /mnt/data
echo '/dev/disk/by-id/scsi-0DO_Volume_data-vol /mnt/data ext4 defaults,nofail,discard 0 0' >> /etc/fstab
```

### Step 7: Configure monitoring and alerts

Set up monitoring agent and alert policies:

```hcl
resource "digitalocean_monitor_alert" "cpu_alert" {
  alerts {
    email = ["ops@example.com"]
    slack {
      channel = "#alerts"
      url     = "https://hooks.slack.com/services/T00/B00/XXX"
    }
  }
  window      = "5m"
  type        = "v1/insights/droplet/cpu"
  compare     = "GreaterThan"
  value       = 80
  enabled     = true
  entities    = [digitalocean_droplet.web.id]
  description = "High CPU usage on web Droplet"
}
```

### Step 8: Reserved IPs and snapshots

**Reserved IP (formerly floating IP):**
```hcl
resource "digitalocean_reserved_ip" "web" {
  region = "nyc3"
}

resource "digitalocean_reserved_ip_assignment" "web" {
  ip_address = digitalocean_reserved_ip.web.ip_address
  droplet_id = digitalocean_droplet.web.id
}
```

**Snapshot automation:**
```bash
# Create a snapshot
doctl compute droplet-action snapshot <droplet-id> --snapshot-name "web-$(date +%Y%m%d)"

# List snapshots
doctl compute snapshot list --resource droplet
```

### Step 9: Droplet metadata service

Access instance metadata from within the Droplet:

```bash
# Get Droplet metadata
curl -s http://169.254.169.254/metadata/v1.json | jq .

# Common metadata endpoints
curl -s http://169.254.169.254/metadata/v1/hostname
curl -s http://169.254.169.254/metadata/v1/id
curl -s http://169.254.169.254/metadata/v1/region
curl -s http://169.254.169.254/metadata/v1/interfaces/private/0/ipv4/address
curl -s http://169.254.169.254/metadata/v1/user-data
curl -s http://169.254.169.254/metadata/v1/tags
```

### Droplet size reference

| Size Slug | vCPUs | RAM | Disk | $/mo |
|-----------|-------|-----|------|------|
| s-1vcpu-512mb-10gb | 1 | 512MB | 10GB | $4 |
| s-1vcpu-1gb | 1 | 1GB | 25GB | $6 |
| s-1vcpu-2gb | 1 | 2GB | 50GB | $12 |
| s-2vcpu-2gb | 2 | 2GB | 60GB | $18 |
| s-2vcpu-4gb | 2 | 4GB | 80GB | $24 |
| s-4vcpu-8gb | 4 | 8GB | 160GB | $48 |
| c-2vcpu-4gb | 2 | 4GB | 25GB | $42 |
| c-4vcpu-8gb | 4 | 8GB | 50GB | $84 |
| m-2vcpu-16gb | 2 | 16GB | 50GB | $84 |
| g-2vcpu-8gb | 2 | 8GB | 25GB | $100 |

### Best practices

- Always use VPC for private networking between Droplets
- Use cloud-init for repeatable, idempotent server provisioning
- Apply firewalls using tags so new Droplets are auto-protected
- Enable monitoring agent for CPU, memory, disk, and bandwidth metrics
- Enable automated backups for production Droplets (20% of Droplet cost)
- Use SSH keys exclusively; disable password authentication
- Use reserved IPs for services that need static addressing
- Prefer load balancers over reserved IPs for web traffic
- Use block storage volumes for data that must survive Droplet destruction
- Tag all resources consistently for organization and firewall rules
- Use the smallest Droplet size that meets your needs and scale up as required

### Anti-patterns to avoid

- Do not use root user for application workloads; create a deploy user
- Do not open port 22 to 0.0.0.0/0; restrict SSH to bastion or VPN CIDR
- Do not store state on the Droplet root disk; use volumes or external storage
- Do not skip backups for production Droplets
- Do not hardcode Droplet IPs in application configs; use reserved IPs or DNS
- Do not use password authentication for SSH
- Do not create Droplets outside a VPC; always specify vpc_uuid

### Cost optimization tips

- Use Basic (shared CPU) Droplets for development and staging
- Use CPU-Optimized only for compute-heavy workloads
- Destroy idle development Droplets; use snapshots to preserve state
- Use reserved IPs only when needed (free when assigned, $5/mo when unassigned)
- Set up monitoring alerts to identify oversized Droplets
- Consider App Platform for stateless web apps instead of managing Droplets
- Enable backups only for Droplets with important data (saves 20%)
- Use load balancer health checks to remove unhealthy Droplets automatically
