# DigitalOcean Droplets

Generate Droplet configs with load balancers, firewalls, and autoscaling. Use when you need to provision DigitalOcean Droplets or configure load balancing and scaling infrastructure.

## Usage

```bash
/do-droplets [size] [image]
```

## What It Does

1. Generates Droplet configurations via doctl CLI or Terraform with size, image, region, and VPC settings
2. Creates cloud-init user data scripts for repeatable, secure server bootstrapping
3. Configures load balancers with SSL termination, health checks, and sticky sessions
4. Sets up cloud firewalls with tag-based rules for automatic protection of new Droplets
5. Provisions block storage volumes for persistent data that survives Droplet destruction
6. Adds monitoring alerts for CPU, memory, disk, and bandwidth metrics
7. Manages reserved IPs and snapshot automation for backup and recovery

## Example Output

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
cp -r skills/do-droplets ~/.claude/skills/
```

<div class="badge-row">
  <span class="badge">DigitalOcean</span>
  <span class="badge">Compute</span>
  <span class="badge">Infrastructure</span>
</div>

## Allowed Tools

- `Read` - Read existing Droplet configurations and cloud-init scripts
- `Write` - Create Droplet configs, load balancer specs, and firewall rules
- `Edit` - Modify existing Droplet settings and scaling parameters
- `Bash` - Run doctl, Terraform, and curl commands for Droplet management
- `Glob` - Search for infrastructure configuration files
- `Grep` - Find Droplet references and resource dependencies
