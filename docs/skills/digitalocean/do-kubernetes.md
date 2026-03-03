# DigitalOcean Kubernetes (DOKS)

Generate DOKS cluster configs with node pools, ingress, and monitoring. Use when you need to set up or manage DigitalOcean Managed Kubernetes clusters.

## Usage

```bash
/do-kubernetes [cluster-name]
```

## What It Does

1. Generates Kubernetes cluster configurations via doctl CLI or Terraform with HA control plane, node pools, and VPC settings
2. Creates node pools with auto-scaling, taints, tolerations, and workload-specific labels
3. Installs NGINX Ingress Controller with DigitalOcean Load Balancer annotations
4. Sets up cert-manager with Let's Encrypt ClusterIssuers for automatic TLS certificates
5. Configures persistent volumes using the built-in DO Volumes CSI driver
6. Integrates DigitalOcean Container Registry (DOCR) for private image pulls
7. Deploys monitoring stacks with Prometheus and Grafana via Helm
8. Manages RBAC policies for multi-tenant namespace isolation

## Example Output

```hcl
resource "digitalocean_kubernetes_cluster" "main" {
  name    = "my-cluster"
  region  = "nyc3"
  version = "1.30.1-do.0"
  vpc_uuid = digitalocean_vpc.main.id

  ha = true

  maintenance_policy {
    day        = "sunday"
    start_time = "04:00"
  }

  surge_upgrade = true
  auto_upgrade  = true

  node_pool {
    name       = "default"
    size       = "s-4vcpu-8gb"
    node_count = 3
    auto_scale = true
    min_nodes  = 2
    max_nodes  = 10
    tags       = ["app"]
    labels = {
      workload = "general"
    }
  }
}

resource "digitalocean_kubernetes_node_pool" "high_memory" {
  cluster_id = digitalocean_kubernetes_cluster.main.id
  name       = "high-memory"
  size       = "m-4vcpu-32gb"
  auto_scale = true
  min_nodes  = 0
  max_nodes  = 5
  taint {
    key    = "workload"
    value  = "database"
    effect = "NoSchedule"
  }
}
```

## Installation

```bash
cp -r skills/do-kubernetes ~/.claude/skills/
```

<div class="badge-row">
  <span class="badge">DigitalOcean</span>
  <span class="badge">Kubernetes</span>
  <span class="badge">Managed</span>
</div>

## Allowed Tools

- `Read` - Read existing cluster configs, Helm values, and Kubernetes manifests
- `Write` - Create cluster configurations, node pool specs, and YAML manifests
- `Edit` - Modify existing cluster settings, scaling rules, and RBAC policies
- `Bash` - Run doctl, kubectl, helm, and Terraform commands for cluster management
- `Glob` - Search for Kubernetes configuration and manifest files
- `Grep` - Find resource references and configuration patterns
