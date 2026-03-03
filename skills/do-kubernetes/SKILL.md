---
name: do-kubernetes
description: Generate DOKS cluster configs with node pools, ingress, and monitoring. Use when the user wants to set up or manage DigitalOcean Managed Kubernetes clusters.
argument-hint: "[cluster-name]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(doctl *), Bash(kubectl *), Bash(helm *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a DigitalOcean Managed Kubernetes (DOKS) expert. Generate production-ready Kubernetes cluster configurations with node pools, ingress, persistent storage, and monitoring.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Cluster name**: descriptive name for the cluster
- **Kubernetes version**: latest stable (1.30, 1.29, 1.28)
- **Region**: nyc1, nyc3, sfo3, ams3, sgp1, lon1, fra1, blr1, syd1, tor1
- **Node pools**: size, count, auto-scale range
- **Workload type**: web apps, microservices, data processing, ML/AI
- **Add-ons**: ingress controller, cert-manager, monitoring, logging

### Step 2: Create cluster configuration

**doctl CLI:**
```bash
# Create cluster
doctl kubernetes cluster create my-cluster \
  --region nyc3 \
  --version 1.30.1-do.0 \
  --vpc-uuid <vpc-uuid> \
  --ha \
  --node-pool "name=default;size=s-4vcpu-8gb;count=3;auto-scale=true;min-nodes=2;max-nodes=10;tag=app;label=workload=general" \
  --maintenance-window "day=sunday;start_time=04:00" \
  --surge-upgrade \
  --wait

# Add GPU node pool
doctl kubernetes cluster node-pool create my-cluster \
  --name gpu-pool \
  --size gpu-h100x1-80gb \
  --count 1 \
  --auto-scale \
  --min-nodes 0 \
  --max-nodes 3 \
  --taint "nvidia.com/gpu=present:NoSchedule" \
  --label workload=gpu

# Get kubeconfig
doctl kubernetes cluster kubeconfig save my-cluster
```

**Terraform:**
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

# Additional node pool for specific workloads
resource "digitalocean_kubernetes_node_pool" "high_memory" {
  cluster_id = digitalocean_kubernetes_cluster.main.id
  name       = "high-memory"
  size       = "m-4vcpu-32gb"
  auto_scale = true
  min_nodes  = 0
  max_nodes  = 5
  tags       = ["database"]
  labels = {
    workload = "database"
  }
  taint {
    key    = "workload"
    value  = "database"
    effect = "NoSchedule"
  }
}
```

### Step 3: Install NGINX Ingress Controller

Deploy NGINX Ingress with a DigitalOcean Load Balancer:

```bash
# Install via Helm
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.publishService.enabled=true \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/do-loadbalancer-name"="k8s-lb" \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/do-loadbalancer-size-slug"="lb-small" \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/do-loadbalancer-protocol"="http" \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/do-loadbalancer-tls-ports"="443" \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/do-loadbalancer-certificate-id"="<cert-id>" \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/do-loadbalancer-redirect-http-to-https"="true" \
  --set controller.metrics.enabled=true
```

**Or via Kubernetes manifest:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  annotations:
    service.beta.kubernetes.io/do-loadbalancer-name: "k8s-lb"
    service.beta.kubernetes.io/do-loadbalancer-size-slug: "lb-small"
    service.beta.kubernetes.io/do-loadbalancer-protocol: "http"
    service.beta.kubernetes.io/do-loadbalancer-tls-ports: "443"
    service.beta.kubernetes.io/do-loadbalancer-certificate-id: "<cert-id>"
    service.beta.kubernetes.io/do-loadbalancer-redirect-http-to-https: "true"
    service.beta.kubernetes.io/do-loadbalancer-disable-lets-encrypt-dns-records: "false"
spec:
  type: LoadBalancer
```

### Step 4: Install cert-manager for TLS

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

**ClusterIssuer for Let's Encrypt:**
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: admin@example.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    email: admin@example.com
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-staging-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

**Ingress resource with TLS:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
        - api.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 3000
```

### Step 5: Persistent volumes with DO Volumes CSI

DigitalOcean Volumes CSI driver is pre-installed in DOKS. Use the `do-block-storage` storage class:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: do-block-storage
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: database
spec:
  serviceName: database
  replicas: 1
  selector:
    matchLabels:
      app: database
  template:
    metadata:
      labels:
        app: database
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: do-block-storage
        resources:
          requests:
            storage: 50Gi
```

**Custom storage class with XFS:**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: do-block-storage-xfs
provisioner: dobs.csi.digitalocean.com
parameters:
  fsType: xfs
allowVolumeExpansion: true
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

### Step 6: Container registry integration (DOCR)

```bash
# Create registry
doctl registry create my-registry --subscription-tier professional

# Connect registry to cluster
doctl registry kubernetes-manifest | kubectl apply -f -

# Or via doctl
doctl kubernetes cluster registry add my-cluster

# Login and push images
doctl registry login
docker tag my-app:latest registry.digitalocean.com/my-registry/my-app:v1.0
docker push registry.digitalocean.com/my-registry/my-app:v1.0
```

**Terraform:**
```hcl
resource "digitalocean_container_registry" "main" {
  name                   = "my-registry"
  subscription_tier_slug = "professional"
  region                 = "nyc3"
}

resource "digitalocean_container_registry_docker_credentials" "main" {
  registry_name = digitalocean_container_registry.main.name
}
```

**Deployment referencing DOCR:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: registry.digitalocean.com/my-registry/my-app:v1.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

### Step 7: Monitoring stack

**Install Prometheus and Grafana via 1-Click:**
```bash
# Via Helm (recommended)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword="secure-password" \
  --set prometheus.prometheusSpec.retention=15d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=do-block-storage \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi
```

**Built-in DOKS metrics:**
```bash
# View cluster metrics
doctl kubernetes cluster get my-cluster

# Node pool metrics
doctl kubernetes cluster node-pool list my-cluster
```

### Step 8: RBAC configuration

```yaml
# Namespace-scoped role for developers
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: developer
rules:
  - apiGroups: ["", "apps", "batch"]
    resources: ["pods", "deployments", "services", "configmaps", "jobs"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/log", "pods/exec"]
    verbs: ["get", "create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: production
subjects:
  - kind: User
    name: developer@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```

### Step 9: Cluster maintenance and upgrades

```bash
# Check available versions
doctl kubernetes options versions

# Upgrade cluster (surge upgrade for zero-downtime)
doctl kubernetes cluster upgrade my-cluster --version 1.30.1-do.0

# Set maintenance window
doctl kubernetes cluster update my-cluster \
  --maintenance-window "day=sunday;start_time=04:00"

# Recycle nodes (rolling restart)
doctl kubernetes cluster node-pool recycle my-cluster default \
  --node-ids <node-id>
```

### Step 10: doctl Kubernetes commands reference

```bash
# Cluster management
doctl kubernetes cluster list
doctl kubernetes cluster get <cluster-name>
doctl kubernetes cluster kubeconfig save <cluster-name>
doctl kubernetes cluster delete <cluster-name>

# Node pools
doctl kubernetes cluster node-pool list <cluster-name>
doctl kubernetes cluster node-pool create <cluster-name> --name <pool-name> --size <size> --count <count>
doctl kubernetes cluster node-pool update <cluster-name> <pool-name> --count <count>
doctl kubernetes cluster node-pool delete <cluster-name> <pool-name>

# 1-Click apps
doctl kubernetes 1-click list
doctl kubernetes 1-click install <cluster-id> --1-clicks <app-name>
```

### Node pool size reference

| Size Slug | vCPUs | RAM | $/mo per node |
|-----------|-------|-----|---------------|
| s-1vcpu-2gb | 1 | 2GB | $12 |
| s-2vcpu-4gb | 2 | 4GB | $24 |
| s-4vcpu-8gb | 4 | 8GB | $48 |
| s-8vcpu-16gb | 8 | 16GB | $96 |
| c-4vcpu-8gb | 4 | 8GB | $84 |
| m-2vcpu-16gb | 2 | 16GB | $84 |
| g-2vcpu-8gb (GPU) | 2 | 8GB | $100 |

Control plane: Free for standard, $40/mo for HA (recommended for production).

### Best practices

- Enable HA control plane for production clusters ($40/mo extra)
- Use surge upgrades for zero-downtime Kubernetes version upgrades
- Set maintenance windows during low-traffic periods
- Use node pool auto-scaling to handle traffic spikes automatically
- Set resource requests and limits on all pods for proper scheduling
- Use DOCR (DigitalOcean Container Registry) for fast, private image pulls
- Deploy NGINX Ingress Controller for HTTP(S) routing with DO Load Balancer
- Use cert-manager with Let's Encrypt for automatic TLS certificate management
- Use `do-block-storage` storage class for persistent data (backed by DO Volumes)
- Implement RBAC for multi-tenant clusters with namespace isolation
- Use node pool taints and tolerations to isolate workload types

### Anti-patterns to avoid

- Do not run stateful databases in Kubernetes; use DO Managed Databases instead
- Do not skip resource limits; unbounded pods can starve the node
- Do not use `latest` image tags; always pin specific versions
- Do not expose services directly with `type: LoadBalancer`; use an Ingress controller
- Do not store secrets in ConfigMaps; use Kubernetes Secrets or external secret management
- Do not run single-replica deployments in production; use at least 2 replicas
- Do not skip PodDisruptionBudgets for critical workloads during node upgrades

### Cost optimization tips

- Use cluster auto-scaler to scale down to minimum nodes during low traffic
- Use Basic Droplet sizes for non-production workloads (cheaper per node)
- Right-size node pools based on actual resource utilization
- Use node pool taints to prevent general workloads on specialized (expensive) nodes
- Scale GPU node pools to 0 when not in use with auto-scaler
- Use a single load balancer (NGINX Ingress) instead of one per service
- Clean up unused PersistentVolumeClaims (billed even when not attached)
- Consider HA control plane only for production ($40/mo savings for dev clusters)
- Use DOCR Starter tier (free, 500MB) for small projects
