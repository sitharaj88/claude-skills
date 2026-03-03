# GCP Compute Engine

Generate Compute Engine VM instances, instance templates, managed instance groups, startup scripts, and machine type configurations.

## Usage

```bash
/gcp-compute-engine <description of your VM or instance group>
```

## What It Does

1. Selects appropriate machine type and image based on workload requirements
2. Generates instance templates with boot disks, network interfaces, and metadata
3. Creates managed instance groups with autoscaling policies and health checks
4. Produces startup scripts for provisioning and application bootstrapping
5. Configures service accounts, IAM roles, and OS Login settings
6. Adds persistent disks, local SSDs, and snapshot schedules

## Examples

```bash
/gcp-compute-engine Create an instance template for a web server with autoscaling from 2 to 10 instances

/gcp-compute-engine Set up a GPU-enabled VM with NVIDIA T4 for ML inference workloads

/gcp-compute-engine Build a managed instance group with rolling update policy and regional distribution
```

## What It Covers

- **Machine types** including general-purpose, compute-optimized, memory-optimized, and GPU instances
- **Instance templates** with custom images, metadata, and labels
- **Managed instance groups** with autoscaling, autohealing, and update policies
- **Startup and shutdown scripts** for automated provisioning
- **Disk management** with persistent disks, local SSDs, and snapshots
- **Networking** with multiple NICs, static IPs, and firewall tags

<div class="badge-row">
  <span class="badge">GCP</span>
  <span class="badge">Compute</span>
  <span class="badge">VMs</span>
</div>

## Allowed Tools

- `Read` - Read existing instance and template configurations
- `Write` - Create instance templates, startup scripts, and Terraform configs
- `Edit` - Modify existing Compute Engine resources
- `Bash` - Run gcloud CLI commands for instance management
- `Glob` - Search for infrastructure-related files
- `Grep` - Find machine type and configuration references
