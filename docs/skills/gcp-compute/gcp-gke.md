# GCP GKE

Generate GKE cluster configurations, node pools, Helm charts, Kubernetes manifests, and workload deployment pipelines.

## Usage

```bash
/gcp-gke <description of your GKE cluster or workload>
```

## What It Does

1. Designs GKE cluster architecture with Standard or Autopilot mode selection
2. Generates node pool configurations with machine types, autoscaling, and taints/tolerations
3. Creates Kubernetes manifests for deployments, services, ingress, and config maps
4. Produces Helm charts with values files for environment-specific configurations
5. Configures Workload Identity for secure GCP service access from pods
6. Sets up cluster networking with VPC-native mode, network policies, and GKE Ingress

## Examples

```bash
/gcp-gke Create an Autopilot cluster with a Node.js microservice deployment and horizontal pod autoscaler

/gcp-gke Set up a Standard cluster with GPU node pools for ML training workloads and Kueue scheduling

/gcp-gke Build a multi-service Helm chart with ingress, service mesh, and workload identity bindings
```

## What It Covers

- **Cluster modes** including Standard and Autopilot with regional and zonal options
- **Node pools** with custom machine types, spot VMs, autoscaling, and surge upgrades
- **Workload Identity** for IAM-to-Kubernetes service account mapping
- **Networking** with VPC-native clusters, network policies, and Gateway API
- **Security** with Binary Authorization, Shielded Nodes, and private clusters
- **Observability** with GKE Monitoring, Logging, and Managed Prometheus

<div class="badge-row">
  <span class="badge">GCP</span>
  <span class="badge">Kubernetes</span>
  <span class="badge">GKE</span>
</div>

## Allowed Tools

- `Read` - Read existing cluster configs and Kubernetes manifests
- `Write` - Create cluster templates, Helm charts, and deployment manifests
- `Edit` - Modify existing GKE and Kubernetes configurations
- `Bash` - Run gcloud, kubectl, and helm commands for cluster operations
- `Glob` - Search for Kubernetes manifests and Helm files
- `Grep` - Find resource references and configuration values
