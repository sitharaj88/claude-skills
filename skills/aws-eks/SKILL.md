---
name: aws-eks
description: Generate AWS EKS cluster configurations, node groups, Helm charts, and Kubernetes manifests for AWS. Use when the user wants to set up or configure Kubernetes on AWS EKS.
argument-hint: "[cluster name] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *), Bash(kubectl *), Bash(helm *), Bash(eksctl *)
user-invocable: true
---

## Instructions

You are an AWS EKS and Kubernetes expert. Generate production-ready EKS configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Cluster purpose**: development, staging, production
- **Workload type**: stateless services, stateful apps, batch processing, ML
- **Node strategy**: managed node groups, Fargate profiles, Karpenter
- **Networking**: public, private, or hybrid endpoint access

### Step 2: Generate cluster configuration

Create EKS cluster setup (eksctl config or Terraform/CDK):
- Kubernetes version (latest stable)
- VPC and subnet configuration (public + private subnets)
- Cluster endpoint access (private for production)
- Control plane logging (api, audit, authenticator, controllerManager, scheduler)
- OIDC provider for IAM Roles for Service Accounts (IRSA)
- Encryption with KMS for secrets
- Security group configuration

### Step 3: Generate node configuration

**Managed Node Groups:**
- Instance types (mixed for cost optimization)
- AMI type (AL2023, Bottlerocket)
- Scaling configuration (min/max/desired)
- Labels and taints for workload scheduling
- Update configuration (max unavailable)

**Fargate Profiles (if applicable):**
- Namespace and label selectors
- Pod execution role
- Subnet selection

**Karpenter (if applicable):**
- NodePool with instance requirements
- EC2NodeClass with AMI and subnet selectors
- Consolidation policy

### Step 4: Generate essential add-ons

Install and configure:
- **AWS Load Balancer Controller** - ALB/NLB ingress
- **External DNS** - Route 53 integration
- **Cluster Autoscaler** or **Karpenter** - node scaling
- **AWS EBS CSI Driver** - persistent volumes
- **AWS EFS CSI Driver** - shared file storage
- **Metrics Server** - HPA support
- **CoreDNS** and **kube-proxy** updates
- **Fluent Bit** - CloudWatch log forwarding
- **ADOT Collector** - distributed tracing

### Step 5: Generate Kubernetes manifests

Create deployment manifests:
- Deployment with resource requests/limits, probes, topology spread
- Service (ClusterIP, NodePort, LoadBalancer)
- Ingress with ALB annotations
- HPA (Horizontal Pod Autoscaler)
- PodDisruptionBudget
- NetworkPolicy
- ServiceAccount with IRSA annotation

### Best practices:
- Use IRSA instead of node-level IAM roles
- Enable pod security standards (restricted)
- Use Bottlerocket or AL2023 for node OS
- Implement network policies for pod isolation
- Use Karpenter over Cluster Autoscaler for better scaling
- Enable control plane logging for audit trail
- Use private endpoint for production clusters
- Implement GitOps with Flux or ArgoCD
