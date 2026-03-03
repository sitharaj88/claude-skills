---
name: azure-vm
description: Generate Azure VM configs, scale sets, and availability configurations. Use when the user wants to create, configure, or manage virtual machines on Azure.
argument-hint: "[size] [os] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *), Bash(packer *)
user-invocable: true
---

## Instructions

You are an Azure Virtual Machines expert. Generate production-ready VM configurations with proper sizing, networking, and scaling.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **VM size**: B-series (burstable), D-series (general), E-series (memory), N-series (GPU), F-series (compute), L-series (storage)
- **OS image**: Ubuntu 22.04/24.04, Windows Server 2022, RHEL 9, SLES, Debian, custom image
- **Purpose**: web server, application server, database, bastion, build agent, ML training
- **Availability**: single VM, availability set, availability zone, VM Scale Set
- **Scaling**: manual, autoscale with VMSS

### Step 2: Generate VM configuration

**Bicep template for a single VM:**
```bicep
param location string = resourceGroup().location
param vmName string
param adminUsername string
@secure()
param adminPasswordOrKey string
param vmSize string = 'Standard_D4s_v5'

resource networkInterface 'Microsoft.Network/networkInterfaces@2023-05-01' = {
  name: '${vmName}-nic'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          subnet: { id: subnetId }
          privateIPAllocationMethod: 'Dynamic'
        }
      }
    ]
    enableAcceleratedNetworking: true
    networkSecurityGroup: { id: nsg.id }
  }
}

resource vm 'Microsoft.Compute/virtualMachines@2023-09-01' = {
  name: vmName
  location: location
  zones: ['1']
  identity: { type: 'SystemAssigned' }
  properties: {
    hardwareProfile: { vmSize: vmSize }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-jammy'
        sku: '22_04-lts-gen2'
        version: 'latest'
      }
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Premium_LRS'
        }
        diskSizeGB: 64
        deleteOption: 'Delete'
      }
      dataDisks: [
        {
          lun: 0
          createOption: 'Empty'
          diskSizeGB: 256
          managedDisk: {
            storageAccountType: 'Premium_LRS'
          }
          caching: 'ReadWrite'
          deleteOption: 'Delete'
        }
      ]
    }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      linuxConfiguration: {
        disablePasswordAuthentication: true
        ssh: {
          publicKeys: [
            {
              path: '/home/${adminUsername}/.ssh/authorized_keys'
              keyData: adminPasswordOrKey
            }
          ]
        }
        patchSettings: {
          patchMode: 'AutomaticByPlatform'
          assessmentMode: 'AutomaticByPlatform'
        }
      }
    }
    networkProfile: {
      networkInterfaces: [
        { id: networkInterface.id }
      ]
    }
    securityProfile: {
      securityType: 'TrustedLaunch'
      uefiSettings: {
        secureBootEnabled: true
        vTpmEnabled: true
      }
    }
    diagnosticsProfile: {
      bootDiagnostics: { enabled: true }
    }
  }
}
```

### Step 3: Generate VM Scale Set (VMSS) configuration

**Bicep VMSS with autoscaling:**
```bicep
resource vmss 'Microsoft.Compute/virtualMachineScaleSets@2023-09-01' = {
  name: '${vmName}-vmss'
  location: location
  zones: ['1', '2', '3']
  sku: {
    name: vmSize
    tier: 'Standard'
    capacity: 2
  }
  identity: { type: 'SystemAssigned' }
  properties: {
    overprovision: true
    upgradePolicy: {
      mode: 'Rolling'
      rollingUpgradePolicy: {
        maxBatchInstancePercent: 20
        maxUnhealthyInstancePercent: 20
        maxUnhealthyUpgradedInstancePercent: 5
        pauseTimeBetweenBatches: 'PT1M'
      }
    }
    automaticRepairsPolicy: {
      enabled: true
      gracePeriod: 'PT10M'
    }
    virtualMachineProfile: {
      storageProfile: {
        imageReference: {
          publisher: 'Canonical'
          offer: '0001-com-ubuntu-server-jammy'
          sku: '22_04-lts-gen2'
          version: 'latest'
        }
        osDisk: {
          createOption: 'FromImage'
          managedDisk: { storageAccountType: 'Premium_LRS' }
          caching: 'ReadWrite'
        }
      }
      osProfile: {
        computerNamePrefix: vmName
        adminUsername: adminUsername
        linuxConfiguration: {
          disablePasswordAuthentication: true
          ssh: { publicKeys: [ { path: '/home/${adminUsername}/.ssh/authorized_keys', keyData: adminPasswordOrKey } ] }
        }
      }
      networkProfile: {
        networkInterfaceConfigurations: [
          {
            name: '${vmName}-nic'
            properties: {
              primary: true
              enableAcceleratedNetworking: true
              ipConfigurations: [
                {
                  name: 'ipconfig1'
                  properties: {
                    subnet: { id: subnetId }
                    loadBalancerBackendAddressPools: [
                      { id: loadBalancerBackendPoolId }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
      extensionProfile: {
        extensions: [
          {
            name: 'HealthExtension'
            properties: {
              publisher: 'Microsoft.ManagedServices'
              type: 'ApplicationHealthLinux'
              typeHandlerVersion: '1.0'
              autoUpgradeMinorVersion: true
              settings: {
                protocol: 'http'
                port: 80
                requestPath: '/health'
              }
            }
          }
        ]
      }
    }
    scaleInPolicy: {
      rules: ['OldestVM']
      forceDeletion: false
    }
  }
}

resource autoscale 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name: '${vmName}-autoscale'
  location: location
  properties: {
    targetResourceUri: vmss.id
    enabled: true
    profiles: [
      {
        name: 'default'
        capacity: {
          minimum: '2'
          maximum: '10'
          default: '2'
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'Percentage CPU'
              metricResourceUri: vmss.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 70
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            metricTrigger: {
              metricName: 'Percentage CPU'
              metricResourceUri: vmss.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: 30
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
        ]
      }
    ]
  }
}
```

### Step 4: Generate cloud-init / custom script extension

**cloud-init for Linux:**
```yaml
#cloud-config
package_update: true
package_upgrade: true

packages:
  - nginx
  - docker.io
  - fail2ban
  - unattended-upgrades

write_files:
  - path: /etc/nginx/sites-available/default
    content: |
      server {
          listen 80;
          location /health { return 200 'ok'; }
          location / { proxy_pass http://localhost:8080; }
      }

runcmd:
  - systemctl enable nginx && systemctl start nginx
  - systemctl enable docker && systemctl start docker
  - usermod -aG docker azureuser
  - systemctl enable fail2ban && systemctl start fail2ban

final_message: "Cloud-init completed after $UPTIME seconds"
```

**Custom Script Extension (Bicep):**
```bicep
resource customScript 'Microsoft.Compute/virtualMachines/extensions@2023-09-01' = {
  parent: vm
  name: 'customScript'
  location: location
  properties: {
    publisher: 'Microsoft.Azure.Extensions'
    type: 'CustomScript'
    typeHandlerVersion: '2.1'
    autoUpgradeMinorVersion: true
    settings: {
      fileUris: [
        'https://raw.githubusercontent.com/myorg/scripts/main/setup.sh'
      ]
    }
    protectedSettings: {
      commandToExecute: 'bash setup.sh'
    }
  }
}
```

### Step 5: Generate Spot VM configuration

```bicep
resource spotVm 'Microsoft.Compute/virtualMachines@2023-09-01' = {
  name: '${vmName}-spot'
  location: location
  properties: {
    priority: 'Spot'
    evictionPolicy: 'Deallocate'
    billingProfile: {
      maxPrice: -1  // Pay up to on-demand price
    }
    hardwareProfile: { vmSize: 'Standard_D4s_v5' }
    // ... remaining config
  }
}
```

### Step 6: Generate Azure Image Builder configuration

```bicep
resource imageTemplate 'Microsoft.VirtualMachineImages/imageTemplates@2023-07-01' = {
  name: '${vmName}-image-template'
  location: location
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${identityId}': {} } }
  properties: {
    source: {
      type: 'PlatformImage'
      publisher: 'Canonical'
      offer: '0001-com-ubuntu-server-jammy'
      sku: '22_04-lts-gen2'
      version: 'latest'
    }
    customize: [
      {
        type: 'Shell'
        name: 'InstallPackages'
        inline: [
          'sudo apt-get update'
          'sudo apt-get install -y nginx docker.io'
          'sudo systemctl enable nginx docker'
        ]
      }
    ]
    distribute: [
      {
        type: 'SharedImage'
        galleryImageId: galleryImageVersionId
        replicationRegions: ['eastus', 'westus2']
        runOutputName: 'customImage'
      }
    ]
  }
}
```

### Step 7: Generate Azure Bastion for secure access

```bicep
resource bastionHost 'Microsoft.Network/bastionHosts@2023-05-01' = {
  name: '${vmName}-bastion'
  location: location
  sku: { name: 'Standard' }
  properties: {
    enableTunneling: true
    enableFileCopy: true
    ipConfigurations: [
      {
        name: 'bastionIpConfig'
        properties: {
          subnet: { id: bastionSubnetId }
          publicIPAddress: { id: bastionPublicIp.id }
        }
      }
    ]
  }
}
```

### Step 8: Configure backup and monitoring

**Azure Backup:**
```bicep
resource backupPolicy 'Microsoft.RecoveryServices/vaults/backupPolicies@2023-06-01' = {
  parent: recoveryVault
  name: 'daily-backup'
  properties: {
    backupManagementType: 'AzureIaasVM'
    schedulePolicy: {
      schedulePolicyType: 'SimpleSchedulePolicy'
      scheduleRunFrequency: 'Daily'
      scheduleRunTimes: ['2023-01-01T02:00:00Z']
    }
    retentionPolicy: {
      retentionPolicyType: 'LongTermRetentionPolicy'
      dailySchedule: { retentionDuration: { count: 30, durationType: 'Days' } }
      weeklySchedule: { retentionDuration: { count: 12, durationType: 'Weeks' } }
    }
  }
}
```

**NSG rules:**
```bicep
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: '${vmName}-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}
```

### Step 9: Terraform alternative

```hcl
resource "azurerm_linux_virtual_machine" "main" {
  name                  = var.vm_name
  resource_group_name   = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  size                  = "Standard_D4s_v5"
  admin_username        = "azureuser"
  zone                  = "1"
  network_interface_ids = [azurerm_network_interface.main.id]

  admin_ssh_key {
    username   = "azureuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 64
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  identity {
    type = "SystemAssigned"
  }

  boot_diagnostics {}

  custom_data = base64encode(file("cloud-init.yaml"))

  tags = var.tags
}

resource "azurerm_managed_disk" "data" {
  name                 = "${var.vm_name}-data"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  storage_account_type = "Premium_LRS"
  create_option        = "Empty"
  disk_size_gb         = 256
}

resource "azurerm_virtual_machine_data_disk_attachment" "data" {
  managed_disk_id    = azurerm_managed_disk.data.id
  virtual_machine_id = azurerm_linux_virtual_machine.main.id
  lun                = 0
  caching            = "ReadWrite"
}
```

### Best practices:
- Use Trusted Launch (Secure Boot + vTPM) for all new VMs
- Enable accelerated networking for supported VM sizes (most D/E/F series)
- Use managed disks exclusively (never unmanaged/classic)
- Deploy across availability zones for production workloads
- Use proximity placement groups for low-latency clusters
- Prefer SSH keys over passwords; use Azure Bastion instead of public IPs
- Enable Azure Monitor Agent for metrics and logs
- Use Update Management Center for OS patching
- Apply NSG rules with least-privilege access
- Tag all resources for cost tracking and governance

### Anti-patterns to avoid:
- Do NOT assign public IPs directly to VMs; use Azure Bastion, Load Balancer, or Application Gateway
- Do NOT use unmanaged disks or Standard HDD for production workloads
- Do NOT skip availability zones for production deployments
- Do NOT use B-series VMs for sustained high-CPU workloads (credit-based bursting)
- Do NOT leave default NSG rules (DenyAllInbound is not the default)
- Do NOT use IMDSv1; require IMDSv2 equivalent security posture
- Do NOT hardcode VM credentials; use Key Vault or SSH keys

### Security considerations:
- Enable Trusted Launch with Secure Boot and vTPM
- Use Azure Bastion (Standard SKU) for remote access
- Enforce NSG rules at both subnet and NIC level
- Enable Microsoft Defender for Cloud for threat detection
- Use managed identity for Azure resource access from VMs
- Encrypt OS and data disks with platform or customer-managed keys
- Configure Azure Policy to enforce security baselines
- Enable just-in-time (JIT) VM access for management ports
- Disable password authentication; use SSH keys only

### Cost optimization tips:
- Use Spot VMs for fault-tolerant workloads (up to 90% savings)
- Right-size VMs using Azure Advisor recommendations
- Use Reserved Instances for steady-state workloads (1-year or 3-year)
- Use Azure Savings Plans for flexible compute commitments
- Shut down dev/test VMs with auto-shutdown schedules
- Use B-series VMs for low-utilization workloads (bastion, jump boxes)
- Enable autoscaling in VMSS to match demand
- Use Ephemeral OS Disks for stateless VMSS instances (no disk cost)
- Monitor with Azure Cost Management and set budgets
