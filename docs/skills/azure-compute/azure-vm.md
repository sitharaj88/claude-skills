# Azure Virtual Machines

Generate VM configurations, availability sets, Virtual Machine Scale Sets, cloud-init scripts, and managed disk setups.

## Usage

```bash
/azure-vm <description of your Virtual Machine setup>
```

## What It Does

1. Generates VM configurations with size selection, OS images, and authentication settings
2. Creates Virtual Machine Scale Sets with autoscaling rules and upgrade policies
3. Configures availability sets and availability zones for high-availability deployments
4. Sets up cloud-init and custom script extensions for automated provisioning
5. Produces Bicep or Terraform templates with managed disks, NICs, and public IPs
6. Adds monitoring with Azure Monitor Agent, boot diagnostics, and VM insights

## Examples

```bash
/azure-vm Create a Linux VM Scale Set with autoscaling from 2 to 10 instances based on CPU and custom health probes

/azure-vm Set up a Windows Server 2022 VM with premium SSD, accelerated networking, and Azure AD join

/azure-vm Build a multi-tier deployment with web and app tier VMs in availability zones with load balancing
```

## What It Covers

- **VM configuration** with size families, OS images, and ephemeral disks
- **Scale Sets** with autoscale rules, rolling upgrades, and fault domain distribution
- **Availability** with availability sets, availability zones, and proximity placement groups
- **Provisioning** with cloud-init, custom script extensions, and Azure Desired State Configuration
- **Networking** with NICs, NSGs, accelerated networking, and public IP addresses
- **Storage** with managed disks, Ultra Disks, disk encryption, and backup policies

<div class="badge-row">
  <span class="badge">Azure</span>
  <span class="badge">Linux</span>
  <span class="badge">Windows</span>
</div>

## Allowed Tools

- `Read` - Read existing VM templates and provisioning scripts
- `Write` - Create VM configurations, scale set templates, and cloud-init files
- `Edit` - Modify existing VM settings and autoscale rules
- `Bash` - Run Azure CLI commands for VM management and diagnostics
- `Glob` - Search for VM-related configuration files
- `Grep` - Find VM references and resource dependencies
