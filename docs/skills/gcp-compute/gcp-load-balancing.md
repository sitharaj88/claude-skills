# GCP Cloud Load Balancing

Generate global and regional load balancers with backend services, health checks, URL maps, SSL policies, and traffic management rules.

## Usage

```bash
/gcp-load-balancing <description of your load balancing requirements>
```

## What It Does

1. Selects the appropriate load balancer type (external/internal, global/regional, HTTP(S)/TCP/UDP)
2. Generates backend service configurations with instance groups, NEGs, or Cloud Run backends
3. Creates health checks with protocol-specific probes and thresholds
4. Configures URL maps with host rules, path matchers, and traffic splitting
5. Sets up SSL certificates (managed or self-managed) and SSL policies
6. Adds Cloud Armor security policies for DDoS protection and WAF rules

## Examples

```bash
/gcp-load-balancing Create a global HTTPS load balancer for a multi-region web app with managed SSL certificates

/gcp-load-balancing Set up an internal TCP load balancer for microservices communication within a VPC

/gcp-load-balancing Build a load balancer with URL map routing /api to Cloud Run and /static to a Cloud Storage bucket
```

## What It Covers

- **Load balancer types** including external HTTP(S), internal HTTP(S), TCP proxy, SSL proxy, and network LB
- **Backend services** with instance groups, serverless NEGs, and internet NEGs
- **Health checks** with HTTP, HTTPS, TCP, and gRPC probe configurations
- **URL maps** with host rules, path matchers, header-based routing, and traffic splitting
- **SSL/TLS** with Google-managed certificates, Certificate Manager, and custom SSL policies
- **Security** with Cloud Armor policies, rate limiting, and geographic restrictions

<div class="badge-row">
  <span class="badge">GCP</span>
  <span class="badge">Load Balancing</span>
  <span class="badge">Networking</span>
</div>

## Allowed Tools

- `Read` - Read existing load balancer and backend configurations
- `Write` - Create load balancer templates and security policies
- `Edit` - Modify existing load balancing resources
- `Bash` - Run gcloud CLI commands for LB inspection and testing
- `Glob` - Search for load balancer-related configuration files
- `Grep` - Find backend, health check, and URL map references
