---
name: gcp-gke
description: Generate GKE cluster configs, node pools, and Kubernetes manifests with Workload Identity and security best practices. Use when the user wants to create or manage GKE clusters.
argument-hint: "[cluster-name] [mode] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(kubectl *), Bash(terraform *), Bash(helm *)
user-invocable: true
---

## Instructions

You are a Google Kubernetes Engine expert. Generate production-ready GKE clusters, node pools, and Kubernetes manifests.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Cluster name**: Name for the GKE cluster
- **Mode**: Autopilot (recommended) or Standard
- **Region/Zone**: Regional (HA) or zonal (dev/test)
- **Workloads**: Web services, batch processing, ML/GPU, stateful applications
- **Scale**: Expected node count and scaling requirements

### Step 2: Choose cluster mode

**Autopilot (recommended for most workloads):**
- Google manages nodes, scaling, and security
- Pay per pod resource request (no idle node cost)
- Built-in security hardening and best practices
- Automatic node provisioning and scaling
- Less operational overhead

**Standard (when you need full control):**
- You manage node pools and configurations
- GPU/TPU workloads with specific accelerator requirements
- Custom node images or kernel parameters
- DaemonSets and privileged containers
- Specific machine types or sole-tenant nodes

### Step 3: Generate cluster configuration

**Autopilot cluster (gcloud):**
```bash
gcloud container clusters create-auto my-cluster \
  --region=us-central1 \
  --release-channel=regular \
  --network=my-vpc \
  --subnetwork=my-subnet \
  --cluster-secondary-range-name=pods \
  --services-secondary-range-name=services \
  --enable-private-nodes \
  --master-ipv4-cidr=172.16.0.0/28 \
  --enable-master-authorized-networks \
  --master-authorized-networks=10.0.0.0/8 \
  --enable-master-global-access
```

**Standard cluster with node pools (gcloud):**
```bash
# Create cluster with default node pool disabled
gcloud container clusters create my-cluster \
  --region=us-central1 \
  --release-channel=regular \
  --network=my-vpc \
  --subnetwork=my-subnet \
  --cluster-secondary-range-name=pods \
  --services-secondary-range-name=services \
  --enable-ip-alias \
  --enable-private-nodes \
  --master-ipv4-cidr=172.16.0.0/28 \
  --enable-master-authorized-networks \
  --master-authorized-networks=10.0.0.0/8 \
  --enable-master-global-access \
  --enable-network-policy \
  --enable-dataplane-v2 \
  --workload-pool=$PROJECT_ID.svc.id.goog \
  --enable-shielded-nodes \
  --enable-image-streaming \
  --logging=SYSTEM,WORKLOAD \
  --monitoring=SYSTEM,POD,DEPLOYMENT \
  --num-nodes=0 \
  --no-enable-basic-auth \
  --metadata=disable-legacy-endpoints=true

# Create application node pool
gcloud container node-pools create app-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --machine-type=e2-standard-4 \
  --num-nodes=2 \
  --min-nodes=2 \
  --max-nodes=10 \
  --enable-autoscaling \
  --disk-type=pd-ssd \
  --disk-size=100GB \
  --image-type=COS_CONTAINERD \
  --enable-autorepair \
  --enable-autoupgrade \
  --max-surge-upgrade=1 \
  --max-unavailable-upgrade=0 \
  --workload-metadata=GKE_METADATA \
  --node-labels=workload=app \
  --node-taints="" \
  --tags=gke-node \
  --service-account=gke-node-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --scopes=cloud-platform

# Create spot node pool for batch workloads
gcloud container node-pools create batch-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --machine-type=e2-standard-8 \
  --num-nodes=0 \
  --min-nodes=0 \
  --max-nodes=20 \
  --enable-autoscaling \
  --spot \
  --image-type=COS_CONTAINERD \
  --enable-autorepair \
  --enable-autoupgrade \
  --node-labels=workload=batch \
  --node-taints=workload=batch:NoSchedule \
  --service-account=gke-node-sa@$PROJECT_ID.iam.gserviceaccount.com

# Create GPU node pool
gcloud container node-pools create gpu-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --machine-type=g2-standard-4 \
  --accelerator=type=nvidia-l4,count=1 \
  --num-nodes=0 \
  --min-nodes=0 \
  --max-nodes=5 \
  --enable-autoscaling \
  --image-type=COS_CONTAINERD \
  --node-labels=workload=gpu \
  --node-taints=nvidia.com/gpu=present:NoSchedule \
  --service-account=gke-node-sa@$PROJECT_ID.iam.gserviceaccount.com
```

### Step 4: Workload Identity

**Configure Workload Identity (required for secure GCP access):**
```bash
# Create GCP service account
gcloud iam service-accounts create my-app-sa \
  --display-name="My App Service Account"

# Grant GCP roles to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:my-app-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Bind Kubernetes SA to GCP SA
gcloud iam service-accounts add-iam-policy-binding \
  my-app-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:$PROJECT_ID.svc.id.goog[my-namespace/my-ksa]"
```

**Kubernetes ServiceAccount annotation:**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-ksa
  namespace: my-namespace
  annotations:
    iam.gke.io/gcp-service-account: my-app-sa@PROJECT_ID.iam.gserviceaccount.com
```

### Step 5: Kubernetes manifests

**Production Deployment:**
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
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: my-app
        version: v1
    spec:
      serviceAccountName: my-ksa
      terminationGracePeriodSeconds: 30
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      nodeSelector:
        workload: app
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: my-app
      containers:
        - name: my-app
          image: us-central1-docker.pkg.dev/project/repo/my-app:v1.0.0
          ports:
            - containerPort: 8080
              protocol: TCP
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
              ephemeral-storage: 256Mi
            limits:
              cpu: "1"
              memory: 512Mi
              ephemeral-storage: 512Mi
          env:
            - name: NODE_ENV
              value: production
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-password
          envFrom:
            - configMapRef:
                name: app-config
          startupProbe:
            httpGet:
              path: /healthz
              port: 8080
            failureThreshold: 30
            periodSeconds: 2
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
            failureThreshold: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
```

**Horizontal Pod Autoscaler:**
```yaml
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
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Pods
          value: 4
          periodSeconds: 60
```

**Vertical Pod Autoscaler:**
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
  namespace: my-namespace
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
      - containerName: my-app
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: "4"
          memory: 4Gi
```

### Step 6: GKE Ingress and Gateway API

**GKE Ingress with managed certificate:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  namespace: my-namespace
  annotations:
    kubernetes.io/ingress.global-static-ip-name: my-static-ip
    networking.gke.io/managed-certificates: my-cert
    kubernetes.io/ingress.class: gce
    networking.gke.io/v1beta1.FrontendConfig: my-frontend-config
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80
---
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: my-cert
  namespace: my-namespace
spec:
  domains:
    - api.example.com
---
apiVersion: networking.gke.io/v1beta1
kind: FrontendConfig
metadata:
  name: my-frontend-config
  namespace: my-namespace
spec:
  redirectToHttps:
    enabled: true
    responseCodeName: MOVED_PERMANENTLY_DEFAULT
  sslPolicy: my-ssl-policy
```

**Gateway API (recommended for new clusters):**
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: external-gateway
  namespace: my-namespace
  annotations:
    networking.gke.io/certmap: my-cert-map
spec:
  gatewayClassName: gke-l7-global-external-managed
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
  addresses:
    - type: NamedAddress
      value: my-static-ip
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: my-route
  namespace: my-namespace
spec:
  parentRefs:
    - name: external-gateway
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api/v1
      backendRefs:
        - name: api-v1-service
          port: 80
    - matches:
        - path:
            type: PathPrefix
            value: /api/v2
      backendRefs:
        - name: api-v2-service
          port: 80
```

### Step 7: Network policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
  namespace: my-namespace
spec:
  podSelector:
    matchLabels:
      app: my-app
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ingress-gateway
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: my-database
      ports:
        - protocol: TCP
          port: 5432
    - to:  # Allow DNS
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

### Step 8: Terraform configuration

```hcl
resource "google_container_cluster" "primary" {
  name     = "my-cluster"
  location = "us-central1"

  # Autopilot mode
  enable_autopilot = true

  # Or Standard mode with initial node config
  # remove_default_node_pool = true
  # initial_node_count       = 1

  release_channel {
    channel = "REGULAR"
  }

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
    master_global_access_config {
      enabled = true
    }
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "10.0.0.0/8"
      display_name = "Internal network"
    }
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "DEPLOYMENT", "POD"]
    managed_prometheus {
      enabled = true
    }
  }

  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  dns_config {
    cluster_dns       = "CLOUD_DNS"
    cluster_dns_scope = "CLUSTER_SCOPE"
  }

  datapath_provider = "ADVANCED_DATAPATH"

  deletion_protection = true
}

# Standard mode node pool
resource "google_container_node_pool" "app" {
  count      = var.autopilot ? 0 : 1
  name       = "app-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.primary.name
  node_count = 2

  autoscaling {
    min_node_count = 2
    max_node_count = 10
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    machine_type    = "e2-standard-4"
    disk_type       = "pd-ssd"
    disk_size_gb    = 100
    image_type      = "COS_CONTAINERD"
    service_account = google_service_account.gke_node.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      workload = "app"
    }

    tags = ["gke-node"]
  }
}
```

### Step 9: Backup for GKE

```bash
# Enable Backup for GKE
gcloud container clusters update my-cluster \
  --region=us-central1 \
  --update-addons=BackupRestore=ENABLED

# Create backup plan
gcloud beta container backup-restore backup-plans create my-backup-plan \
  --project=$PROJECT_ID \
  --location=us-central1 \
  --cluster=projects/$PROJECT_ID/locations/us-central1/clusters/my-cluster \
  --all-namespaces \
  --include-volume-data \
  --cron-schedule="0 2 * * *" \
  --backup-retain-days=30
```

### Best practices to follow:
- **Use Autopilot** unless you need specific Standard mode features
- **Enable Workload Identity** for secure GCP API access (never use node SA)
- **Use private clusters** with authorized networks
- **Enable Dataplane V2** (Cilium-based) for native network policies
- **Set resource requests and limits** on all containers
- **Use topology spread constraints** for zone-aware scheduling
- **Enable Binary Authorization** for supply chain security
- **Use Gateway API** over Ingress for new deployments
- **Configure PodDisruptionBudgets** for high-availability workloads
- **Use release channels** (Regular for production, Rapid for non-production)
- **Enable managed Prometheus** for monitoring

### Anti-patterns to avoid:
- Using the default node service account with broad permissions
- Running workloads in the `default` namespace
- Not setting resource requests/limits (causes scheduling issues)
- Using `latest` image tag (breaks reproducibility)
- Skipping network policies (all pods can communicate by default)
- Using hostNetwork or privileged containers without need
- Not configuring PodDisruptionBudgets for production workloads
- Manually scaling node pools instead of using autoscaling

### Cost optimization:
- **Autopilot**: Pay only for pod resource requests, no idle node cost
- **Spot node pools**: Up to 91% discount for fault-tolerant batch workloads
- **Cluster autoscaler**: Scale node pools to zero when idle
- **Right-size pods**: Use VPA recommendations to optimize resource requests
- **Committed use discounts**: 1-year or 3-year for stable workloads
- **Multi-tenant clusters**: Share clusters across teams with namespaces and quotas
- **GKE cost allocation**: Enable to track costs per namespace/label
