---
name: azure-aks
description: Generate AKS cluster configs, node pools, and Kubernetes manifests. Use when the user wants to set up or configure Kubernetes on Azure AKS.
argument-hint: "[cluster-name] [node-count] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *), Bash(kubectl *), Bash(helm *), Bash(kubelogin *)
user-invocable: true
---

## Instructions

You are an Azure Kubernetes Service (AKS) expert. Generate production-ready AKS cluster configurations and Kubernetes manifests.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Cluster purpose**: development, staging, production
- **Workload type**: stateless services, stateful apps, batch processing, ML/AI
- **Node strategy**: system node pool + user node pools, spot instances, GPU nodes
- **Networking**: Azure CNI Overlay (recommended), Azure CNI, kubenet
- **Access**: public, private, or hybrid API server access

### Step 2: Generate AKS cluster configuration

**Bicep template:**
```bicep
param location string = resourceGroup().location
param clusterName string
param nodeCount int = 3
param vmSize string = 'Standard_D4s_v5'

resource aks 'Microsoft.ContainerService/managedClusters@2024-01-01' = {
  name: clusterName
  location: location
  identity: { type: 'SystemAssigned' }
  sku: {
    name: 'Base'
    tier: 'Standard'  // Use 'Standard' for production (SLA), 'Free' for dev
  }
  properties: {
    kubernetesVersion: '1.29'
    dnsPrefix: clusterName
    enableRBAC: true
    aadProfile: {
      managed: true
      enableAzureRBAC: true
      adminGroupObjectIDs: ['<aad-admin-group-id>']
    }
    agentPoolProfiles: [
      {
        name: 'system'
        count: 3
        vmSize: 'Standard_D2s_v5'
        osType: 'Linux'
        osSKU: 'AzureLinux'
        mode: 'System'
        availabilityZones: ['1', '2', '3']
        enableAutoScaling: true
        minCount: 2
        maxCount: 5
        maxPods: 110
        vnetSubnetID: aksSubnet.id
        nodeTaints: ['CriticalAddonsOnly=true:NoSchedule']
        upgradeSettings: { maxSurge: '33%' }
      }
    ]
    networkProfile: {
      networkPlugin: 'azure'
      networkPluginMode: 'overlay'
      networkPolicy: 'cilium'
      networkDataplane: 'cilium'
      serviceCidr: '10.0.0.0/16'
      dnsServiceIP: '10.0.0.10'
      loadBalancerSku: 'standard'
      outboundType: 'loadBalancer'
    }
    autoUpgradeProfile: {
      upgradeChannel: 'stable'
      nodeOSUpgradeChannel: 'NodeImage'
    }
    securityProfile: {
      defender: {
        securityMonitoring: { enabled: true }
        logAnalyticsWorkspaceResourceId: logAnalytics.id
      }
      imageCleaner: {
        enabled: true
        intervalHours: 48
      }
      workloadIdentity: { enabled: true }
    }
    oidcIssuerProfile: { enabled: true }
    addonProfiles: {
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalytics.id
        }
      }
      azureKeyvaultSecretsProvider: {
        enabled: true
        config: {
          enableSecretRotation: 'true'
          rotationPollInterval: '2m'
        }
      }
      azurepolicy: { enabled: true }
    }
    apiServerAccessProfile: {
      enablePrivateCluster: false  // true for production
      authorizedIPRanges: ['203.0.113.0/24']  // restrict API access
    }
    storageProfile: {
      diskCSIDriver: { enabled: true }
      fileCSIDriver: { enabled: true }
      blobCSIDriver: { enabled: true }
      snapshotController: { enabled: true }
    }
  }
}
```

### Step 3: Generate user node pools

**General-purpose node pool:**
```bicep
resource userNodePool 'Microsoft.ContainerService/managedClusters/agentPools@2024-01-01' = {
  parent: aks
  name: 'workload'
  properties: {
    vmSize: vmSize
    count: nodeCount
    osType: 'Linux'
    osSKU: 'AzureLinux'
    mode: 'User'
    availabilityZones: ['1', '2', '3']
    enableAutoScaling: true
    minCount: 2
    maxCount: 20
    maxPods: 110
    vnetSubnetID: aksSubnet.id
    nodeLabels: {
      'workload-type': 'general'
    }
    upgradeSettings: { maxSurge: '33%' }
  }
}
```

**Spot node pool for cost savings:**
```bicep
resource spotNodePool 'Microsoft.ContainerService/managedClusters/agentPools@2024-01-01' = {
  parent: aks
  name: 'spot'
  properties: {
    vmSize: 'Standard_D4s_v5'
    count: 0
    osType: 'Linux'
    osSKU: 'AzureLinux'
    mode: 'User'
    availabilityZones: ['1', '2', '3']
    enableAutoScaling: true
    minCount: 0
    maxCount: 10
    scaleSetPriority: 'Spot'
    scaleSetEvictionPolicy: 'Delete'
    spotMaxPrice: json('-1')
    nodeTaints: ['kubernetes.azure.com/scalesetpriority=spot:NoSchedule']
    nodeLabels: {
      'kubernetes.azure.com/scalesetpriority': 'spot'
    }
  }
}
```

**GPU node pool:**
```bicep
resource gpuNodePool 'Microsoft.ContainerService/managedClusters/agentPools@2024-01-01' = {
  parent: aks
  name: 'gpu'
  properties: {
    vmSize: 'Standard_NC6s_v3'
    count: 0
    osType: 'Linux'
    mode: 'User'
    enableAutoScaling: true
    minCount: 0
    maxCount: 4
    nodeTaints: ['sku=gpu:NoSchedule']
    nodeLabels: { 'hardware': 'gpu' }
  }
}
```

### Step 4: Configure Workload Identity

**Create federated identity for a Kubernetes service account:**
```bicep
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${clusterName}-workload-id'
  location: location
}

resource federatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: managedIdentity
  name: 'kubernetes-federated'
  properties: {
    issuer: aks.properties.oidcIssuerProfile.issuerURL
    subject: 'system:serviceaccount:my-namespace:my-service-account'
    audiences: ['api://AzureADTokenExchange']
  }
}
```

**Kubernetes ServiceAccount manifest:**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: my-namespace
  annotations:
    azure.workload.identity/client-id: "<managed-identity-client-id>"
  labels:
    azure.workload.identity/use: "true"
```

### Step 5: Generate Kubernetes manifests

**Deployment with best practices:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-namespace
  labels:
    app: my-app
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        version: v1
        azure.workload.identity/use: "true"
    spec:
      serviceAccountName: my-service-account
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: my-app
      containers:
        - name: my-app
          image: myacr.azurecr.io/my-app:v1.0.0
          ports:
            - containerPort: 8080
              protocol: TCP
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          startupProbe:
            httpGet:
              path: /health/startup
              port: 8080
            failureThreshold: 30
            periodSeconds: 5
          env:
            - name: AZURE_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: client-id
          volumeMounts:
            - name: secrets-store
              mountPath: "/mnt/secrets-store"
              readOnly: true
      volumes:
        - name: secrets-store
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: azure-kv-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: my-namespace
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app
  namespace: my-namespace
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app
  namespace: my-namespace
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: my-app
```

### Step 6: Configure Key Vault CSI driver

**SecretProviderClass:**
```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-kv-secrets
  namespace: my-namespace
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    clientID: "<managed-identity-client-id>"
    keyvaultName: "my-keyvault"
    objects: |
      array:
        - |
          objectName: db-connection-string
          objectType: secret
        - |
          objectName: api-key
          objectType: secret
    tenantId: "<tenant-id>"
  secretObjects:
    - secretName: app-secrets
      type: Opaque
      data:
        - objectName: db-connection-string
          key: database-url
        - objectName: api-key
          key: api-key
```

### Step 7: Configure Ingress

**Application Gateway Ingress Controller (AGIC):**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: my-namespace
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
    appgw.ingress.kubernetes.io/backend-protocol: "http"
    appgw.ingress.kubernetes.io/health-probe-path: "/health"
    appgw.ingress.kubernetes.io/waf-policy-for-path: "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Network/applicationGatewayWebApplicationFirewallPolicies/my-waf"
spec:
  tls:
    - hosts:
        - api.myapp.com
      secretName: tls-secret
  rules:
    - host: api.myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

**NGINX Ingress Controller (managed):**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: my-namespace
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit-rps: "100"
spec:
  ingressClassName: webapprouting.kubernetes.azure.com
  tls:
    - hosts:
        - api.myapp.com
      secretName: tls-secret
  rules:
    - host: api.myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

### Step 8: Configure GitOps with Flux

```bicep
resource fluxConfig 'Microsoft.KubernetesConfiguration/fluxConfigurations@2023-05-01' = {
  name: 'cluster-config'
  scope: aks
  properties: {
    scope: 'cluster'
    namespace: 'flux-system'
    sourceKind: 'GitRepository'
    gitRepository: {
      url: 'https://github.com/myorg/k8s-manifests'
      repositoryRef: { branch: 'main' }
      syncIntervalInSeconds: 120
    }
    kustomizations: {
      infrastructure: {
        path: './infrastructure'
        prune: true
        syncIntervalInSeconds: 120
      }
      apps: {
        path: './apps/production'
        prune: true
        dependsOn: ['infrastructure']
        syncIntervalInSeconds: 120
      }
    }
  }
}
```

### Step 9: Terraform alternative

```hcl
resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = var.cluster_name
  kubernetes_version  = "1.29"
  sku_tier            = "Standard"

  default_node_pool {
    name                = "system"
    vm_size             = "Standard_D2s_v5"
    node_count          = 3
    zones               = [1, 2, 3]
    os_sku              = "AzureLinux"
    enable_auto_scaling = true
    min_count           = 2
    max_count           = 5
    max_pods            = 110
    vnet_subnet_id      = azurerm_subnet.aks.id
    only_critical_addons_enabled = true
    upgrade_settings { max_surge = "33%" }
  }

  identity { type = "SystemAssigned" }

  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay"
    network_policy      = "cilium"
    network_dataplane   = "cilium"
    service_cidr        = "10.0.0.0/16"
    dns_service_ip      = "10.0.0.10"
    load_balancer_sku   = "standard"
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    admin_group_object_ids = [var.admin_group_id]
  }

  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  auto_scaler_profile {
    scale_down_delay_after_add = "5m"
    scale_down_unneeded        = "5m"
    max_graceful_termination_sec = 600
  }

  maintenance_window_auto_upgrade {
    frequency = "Weekly"
    day_of_week = "Sunday"
    start_time  = "02:00"
    duration    = 4
  }
}

resource "azurerm_kubernetes_cluster_node_pool" "workload" {
  name                  = "workload"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.vm_size
  node_count            = var.node_count
  zones                 = [1, 2, 3]
  os_sku                = "AzureLinux"
  enable_auto_scaling   = true
  min_count             = 2
  max_count             = 20
  max_pods              = 110
  vnet_subnet_id        = azurerm_subnet.aks.id

  node_labels = { "workload-type" = "general" }
}
```

### Best practices:
- Use Azure CNI Overlay with Cilium for modern networking (best performance and policy)
- Use AzureLinux (Mariner) OS for nodes (smaller attack surface, faster boot)
- Enable Workload Identity instead of pod-managed identity (deprecated)
- Use system node pool with taints for critical add-ons only
- Deploy across 3 availability zones for production
- Enable auto-upgrade with maintenance windows
- Use KEDA for event-driven autoscaling beyond CPU/memory metrics
- Implement GitOps with Flux for declarative cluster management
- Use Azure Key Vault CSI driver for secrets (not Kubernetes secrets directly)
- Configure PodDisruptionBudgets for all production workloads

### Anti-patterns to avoid:
- Do NOT use kubenet for production (limited features, no network policies without Calico)
- Do NOT run application workloads on system node pools
- Do NOT skip resource requests/limits on pods
- Do NOT use pod-managed identity (deprecated); use Workload Identity
- Do NOT expose the API server publicly without IP restrictions in production
- Do NOT skip PodDisruptionBudgets for production deployments
- Do NOT use latest tags for container images; pin to specific versions
- Do NOT ignore node OS upgrades; enable automatic node image upgrades

### Security considerations:
- Enable Azure RBAC for Kubernetes (Azure AD integration)
- Use private clusters for production (API server not internet-accessible)
- Enable Microsoft Defender for Containers for threat detection
- Use Azure Policy for AKS to enforce security baselines
- Enable image cleaner to remove stale images
- Use network policies (Cilium) to restrict pod-to-pod traffic
- Scan container images with Microsoft Defender or Trivy
- Use Workload Identity for Azure resource access from pods
- Enable audit logging on the API server
- Restrict egress traffic with Azure Firewall or NSG rules

### Cost optimization tips:
- Use spot node pools for fault-tolerant workloads (up to 90% savings)
- Enable cluster autoscaler with appropriate min/max counts
- Use the Free tier for dev/test clusters (no SLA)
- Right-size node pools based on actual utilization (Azure Advisor)
- Use Reserved Instances for steady-state node pools
- Schedule scale-down for non-production clusters (KEDA cron scaler)
- Use Ephemeral OS Disks for stateless node pools (faster, cheaper)
- Consider AKS Automatic for managed node autoscaling (Karpenter-based)
- Monitor costs with Azure Cost Management and set namespace-level budgets
