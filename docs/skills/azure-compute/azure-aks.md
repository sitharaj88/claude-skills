# Azure Kubernetes Service (AKS)

Generate AKS cluster configurations, node pools, Helm charts, Kubernetes manifests, and Azure-native integrations for container orchestration.

## Usage

```bash
/azure-aks <description of your AKS cluster or workload>
```

## What It Does

1. Generates AKS cluster configurations with networking, identity, and add-on settings
2. Creates node pool definitions with autoscaling, taints, labels, and VM size selection
3. Configures Kubernetes manifests for deployments, services, ingress, and RBAC
4. Sets up Helm charts with values files for repeatable application packaging
5. Produces Bicep or Terraform templates with Azure CNI, Key Vault CSI, and monitoring add-ons
6. Adds workload identity, pod-managed identity, and Azure RBAC for Kubernetes authorization

## Examples

```bash
/azure-aks Create a production cluster with Azure CNI Overlay, three node pools, and workload identity for Key Vault access

/azure-aks Set up a Helm chart for a microservices app with NGINX ingress, cert-manager, and horizontal pod autoscaler

/azure-aks Build a GPU-enabled node pool with spot instances for ML inference workloads and KEDA scaling
```

## What It Covers

- **Cluster configuration** with API server access, SKU tiers, and maintenance windows
- **Node pools** with autoscaling, spot instances, taints, labels, and upgrade policies
- **Networking** with Azure CNI, Kubenet, network policies, and private clusters
- **Security** with workload identity, Azure RBAC, pod security standards, and Key Vault CSI
- **Observability** with Container Insights, Prometheus, Grafana, and diagnostic settings
- **Workloads** with Deployments, StatefulSets, DaemonSets, Helm charts, and Kustomize overlays

<div class="badge-row">
  <span class="badge">Azure</span>
  <span class="badge">Kubernetes</span>
  <span class="badge">Managed</span>
</div>

## Allowed Tools

- `Read` - Read existing cluster configs, manifests, and Helm charts
- `Write` - Create Kubernetes manifests, Helm charts, and deployment templates
- `Edit` - Modify existing cluster settings and workload configurations
- `Bash` - Run az aks, kubectl, and helm commands for cluster management
- `Glob` - Search for Kubernetes manifests and Helm chart files
- `Grep` - Find resource references and configuration values
