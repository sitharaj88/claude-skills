# AWS EKS

Generate EKS cluster configurations, managed node groups, Helm charts, and Kubernetes manifests for production workloads.

## Usage

```bash
/aws-eks <description of your Kubernetes deployment>
```

## What It Does

1. Generates EKS cluster configuration with networking and logging settings
2. Creates managed node groups or Karpenter provisioner configs for auto-scaling
3. Produces Kubernetes manifests (Deployments, Services, Ingress, ConfigMaps)
4. Sets up Helm charts with values files for reusable deployments
5. Configures IRSA (IAM Roles for Service Accounts) for pod-level permissions
6. Adds cluster add-ons (CoreDNS, kube-proxy, VPC CNI, EBS CSI)

## Examples

```bash
/aws-eks Create a production cluster with Karpenter and 3 AZ node groups

/aws-eks Deploy a microservice with HPA, PDB, and Ingress using ALB controller

/aws-eks Set up a Helm chart for a stateful app with EBS persistent volumes
```

## Allowed Tools

- `Read` - Read existing manifests and Helm charts
- `Write` - Create Kubernetes manifests, Helm charts, and cluster configs
- `Edit` - Modify existing K8s and EKS configurations
- `Bash` - Run kubectl, helm, and eksctl commands
- `Glob` - Search for manifest and chart files
- `Grep` - Find resource references across manifests
